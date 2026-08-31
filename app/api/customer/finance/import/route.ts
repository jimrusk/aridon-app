import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../lib/customerAuth';
import { cleanFinanceText, financeNumber, stableHash } from '../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

function validDate(value: unknown) {
  const text = cleanFinanceText(value, 40);
  if (!text) return '';
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
}

function sourceName(value: unknown) {
  const source = cleanFinanceText(value, 60).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return source || 'manual';
}

function suppliedExternalId(raw: any, generatedPrefix: 'row' | 'invoice') {
  const value = cleanFinanceText(raw?.externalId ?? raw?.external_id ?? raw?.id, 180);
  if (!value || new RegExp(`^${generatedPrefix}-\\d+$`, 'i').test(value)) return '';
  return value;
}

async function markManualConnection(auth: any, tenantId: string, userId: string, provider: 'payroll' | 'invoicing' | 'csv', source: string, filename: string | null) {
  const label = provider === 'payroll' ? 'Payroll' : provider === 'invoicing' ? 'Invoices & Receivables' : 'Bank / Accounting CSV';
  const capabilities = provider === 'payroll'
    ? ['payroll journals', 'tax withholdings', 'benefits', 'contractor payments']
    : provider === 'invoicing'
      ? ['invoices', 'due dates', 'customer balances', 'payment matching']
      : ['historical import', 'transaction normalization', 'reconciliation'];
  const { error } = await auth.db.from('customer_finance_connections').upsert({
    tenant_id: tenantId,
    provider,
    label,
    status: 'connected',
    capabilities,
    metadata: { last_source: source, last_filename: filename },
    last_sync_at: new Date().toISOString(),
    last_error: null,
    created_by: userId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'tenant_id,provider' });
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });

    const rows = Array.isArray(body?.rows) ? body.rows.slice(0, 5000) : [];
    if (!rows.length) return NextResponse.json({ error: 'No finance rows were supplied.' }, { status: 400, headers: NO_STORE });
    const kind = body?.kind === 'invoices' ? 'invoices' : 'transactions';
    const source = sourceName(body?.source);
    const filename = cleanFinanceText(body?.filename, 180) || null;
    const tenantId = membership.tenant.id;

    const { data: importRow, error: importError } = await auth.db.from('customer_finance_imports').insert({
      tenant_id: tenantId,
      source,
      filename,
      row_count: rows.length,
      status: 'processing',
      metadata: { kind },
      created_by: auth.user.id,
    }).select('*').single();
    if (importError) throw importError;

    if (kind === 'invoices') {
      const normalized = rows.flatMap((raw: any, index: number) => {
        const total = Math.abs(financeNumber(raw?.total ?? raw?.amount));
        const balance = Math.abs(financeNumber(raw?.balance ?? raw?.openBalance ?? total));
        const invoiceNumber = cleanFinanceText(raw?.invoiceNumber ?? raw?.invoice_number ?? raw?.number, 120);
        const customerName = cleanFinanceText(raw?.customerName ?? raw?.customer_name ?? raw?.customer, 180);
        const issueDate = validDate(raw?.issueDate ?? raw?.issue_date ?? raw?.date) || null;
        const dueDate = validDate(raw?.dueDate ?? raw?.due_date) || null;
        if (!total && !balance && !invoiceNumber) return [];
        const externalId = suppliedExternalId(raw, 'invoice') || stableHash([filename, index, invoiceNumber, customerName, issueDate, dueDate, total, balance]);
        const status = cleanFinanceText(raw?.status, 40).toLowerCase() || (balance <= 0 ? 'paid' : 'open');
        return [{
          tenant_id: tenantId,
          source,
          external_id: externalId,
          invoice_number: invoiceNumber || null,
          customer_name: customerName || null,
          issue_date: issueDate,
          due_date: dueDate,
          total,
          balance,
          status,
          metadata: raw?.metadata && typeof raw.metadata === 'object' ? raw.metadata : {},
          created_by: auth.user.id,
          updated_at: new Date().toISOString(),
        }];
      });
      if (!normalized.length) throw new Error('No recognizable invoice rows were found.');
      const { data, error } = await auth.db.from('customer_finance_invoices').upsert(normalized, { onConflict: 'tenant_id,source,external_id', ignoreDuplicates: true }).select('id');
      if (error) throw error;
      const imported = data?.length || 0;
      await auth.db.from('customer_finance_imports').update({ status: 'completed', imported_count: imported, duplicate_count: Math.max(0, normalized.length - imported) }).eq('id', importRow.id);
      await markManualConnection(auth, tenantId, auth.user.id, 'invoicing', source, filename);
      return NextResponse.json({ ok: true, kind, imported, duplicates: Math.max(0, normalized.length - imported), importId: importRow.id }, { headers: NO_STORE });
    }

    const normalized = rows.flatMap((raw: any, index: number) => {
      const postedAt = validDate(raw?.date ?? raw?.postedAt ?? raw?.posted_at);
      const description = cleanFinanceText(raw?.description ?? raw?.name ?? raw?.memo ?? raw?.merchant, 300);
      if (!postedAt || !description) return [];

      let rawAmount = financeNumber(raw?.amount);
      let direction = cleanFinanceText(raw?.direction, 20).toLowerCase();
      if (direction !== 'inflow' && direction !== 'outflow') {
        if (typeof raw?.debit !== 'undefined' && financeNumber(raw.debit) !== 0) {
          rawAmount = financeNumber(raw.debit);
          direction = 'outflow';
        } else if (typeof raw?.credit !== 'undefined' && financeNumber(raw.credit) !== 0) {
          rawAmount = financeNumber(raw.credit);
          direction = 'inflow';
        } else {
          direction = rawAmount < 0 ? 'outflow' : 'inflow';
        }
      }
      const amount = Math.abs(rawAmount);
      if (!amount) return [];
      const merchant = cleanFinanceText(raw?.merchant ?? raw?.merchant_name, 200) || null;
      const category = cleanFinanceText(raw?.category, 140) || null;
      const taxCategory = cleanFinanceText(raw?.taxCategory ?? raw?.tax_category, 140) || null;
      const reference = cleanFinanceText(raw?.reference ?? raw?.checkNumber ?? raw?.check_number, 140) || null;
      const externalId = suppliedExternalId(raw, 'row') || stableHash([filename, index, postedAt, description, amount, direction, reference]);
      return [{
        tenant_id: tenantId,
        import_id: importRow.id,
        source,
        external_id: externalId,
        posted_at: postedAt,
        description,
        merchant,
        amount,
        direction,
        category,
        tax_category: taxCategory,
        reference,
        status: cleanFinanceText(raw?.status, 40) || 'posted',
        reconciled: false,
        metadata: raw?.metadata && typeof raw.metadata === 'object' ? raw.metadata : {},
        created_by: auth.user.id,
        updated_at: new Date().toISOString(),
      }];
    });

    if (!normalized.length) throw new Error('No recognizable transaction rows were found.');
    const { data, error } = await auth.db.from('customer_finance_transactions').upsert(normalized, { onConflict: 'tenant_id,source,external_id', ignoreDuplicates: true }).select('id');
    if (error) throw error;
    const imported = data?.length || 0;
    await auth.db.from('customer_finance_imports').update({ status: 'completed', imported_count: imported, duplicate_count: Math.max(0, normalized.length - imported) }).eq('id', importRow.id);

    const connectorKey: 'payroll' | 'invoicing' | 'csv' = source.includes('payroll') ? 'payroll' : source.includes('invoice') ? 'invoicing' : 'csv';
    await markManualConnection(auth, tenantId, auth.user.id, connectorKey, source, filename);

    return NextResponse.json({ ok: true, kind, imported, duplicates: Math.max(0, normalized.length - imported), importId: importRow.id }, { headers: NO_STORE });
  } catch (error) {
    console.error('Finance import error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Finance import failed.' }, { status: 500, headers: NO_STORE });
  }
}
