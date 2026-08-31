import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../lib/customerAuth';
import { cleanFinanceText } from '../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function buildTaxSummary(db: any, tenantId: string, year: number) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const [transactionResult, invoiceResult, accountResult, reconciliationResult] = await Promise.all([
    db.from('customer_finance_transactions').select('*').eq('tenant_id', tenantId).gte('posted_at', start).lte('posted_at', end).order('posted_at'),
    db.from('customer_finance_invoices').select('*').eq('tenant_id', tenantId).gte('issue_date', start).lte('issue_date', end).order('issue_date'),
    db.from('customer_finance_accounts').select('*').eq('tenant_id', tenantId).order('name'),
    db.from('customer_finance_reconciliation_runs').select('*').eq('tenant_id', tenantId).gte('period_start', start).lte('period_end', end).order('created_at', { ascending: false }).limit(1),
  ]);
  for (const result of [transactionResult, invoiceResult, accountResult, reconciliationResult]) if (result.error) throw result.error;

  const transactions = transactionResult.data || [];
  const income = transactions.filter((row: any) => row.direction === 'inflow').reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const expenses = transactions.filter((row: any) => row.direction === 'outflow').reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const byTaxCategory: Record<string, { inflow: number; outflow: number; count: number }> = {};
  for (const row of transactions) {
    const key = row.tax_category || row.category || 'Uncategorized';
    const current = byTaxCategory[key] || { inflow: 0, outflow: 0, count: 0 };
    if (row.direction === 'inflow') current.inflow += Number(row.amount || 0);
    else current.outflow += Number(row.amount || 0);
    current.count += 1;
    byTaxCategory[key] = current;
  }

  const openInvoices = (invoiceResult.data || []).filter((invoice: any) => !['paid', 'void', 'deleted'].includes(String(invoice.status || '').toLowerCase()));
  return {
    year,
    income,
    expenses,
    netBeforeAdjustments: income - expenses,
    transactionCount: transactions.length,
    uncategorizedCount: transactions.filter((row: any) => !row.category && !row.tax_category).length,
    unreconciledCount: transactions.filter((row: any) => !row.reconciled).length,
    openReceivables: openInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.balance || 0), 0),
    accountCount: (accountResult.data || []).length,
    byTaxCategory,
    latestReconciliation: reconciliationResult.data?.[0] || null,
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const tenantId = membership.tenant.id;
    const action = cleanFinanceText(body?.action, 30) || 'create';

    if (action === 'approve') {
      const handoffId = cleanFinanceText(body?.handoffId, 80);
      if (!handoffId || body?.confirm !== true) return NextResponse.json({ error: 'Owner confirmation is required before approving a tax handoff.' }, { status: 400, headers: NO_STORE });
      const { data, error } = await auth.db.from('customer_finance_tax_handoffs').update({
        status: 'approved',
        owner_approved: true,
        approved_by: auth.user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('tenant_id', tenantId).eq('id', handoffId).select('*').single();
      if (error) throw error;
      return NextResponse.json({ ok: true, handoff: data }, { headers: NO_STORE });
    }

    const year = Math.min(2100, Math.max(2000, Number(body?.taxYear) || new Date().getUTCFullYear()));
    const summary = await buildTaxSummary(auth.db, tenantId, year);
    const { data, error } = await auth.db.from('customer_finance_tax_handoffs').insert({
      tenant_id: tenantId,
      tax_year: year,
      status: 'draft',
      preparer_name: cleanFinanceText(body?.preparerName, 160) || null,
      preparer_email: cleanFinanceText(body?.preparerEmail, 180) || null,
      summary,
      owner_approved: false,
      created_by: auth.user.id,
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, handoff: data, summary }, { headers: NO_STORE });
  } catch (error) {
    console.error('Finance handoff error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to prepare tax handoff.' }, { status: 500, headers: NO_STORE });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const slug = cleanFinanceText(request.nextUrl.searchParams.get('slug'), 80);
    const handoffId = cleanFinanceText(request.nextUrl.searchParams.get('handoffId'), 80);
    const format = cleanFinanceText(request.nextUrl.searchParams.get('format'), 20).toLowerCase() || 'json';
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const tenantId = membership.tenant.id;

    let query = auth.db.from('customer_finance_tax_handoffs').select('*').eq('tenant_id', tenantId);
    if (handoffId) query = query.eq('id', handoffId);
    const { data: handoffs, error: handoffError } = await query.order('created_at', { ascending: false }).limit(handoffId ? 1 : 20);
    if (handoffError) throw handoffError;
    if (!handoffId) return NextResponse.json({ handoffs: handoffs || [] }, { headers: NO_STORE });
    const handoff = handoffs?.[0];
    if (!handoff) return NextResponse.json({ error: 'Tax handoff not found.' }, { status: 404, headers: NO_STORE });

    const year = Number(handoff.tax_year);
    const { data: transactions, error: transactionError } = await auth.db.from('customer_finance_transactions').select('*').eq('tenant_id', tenantId).gte('posted_at', `${year}-01-01`).lte('posted_at', `${year}-12-31`).order('posted_at');
    if (transactionError) throw transactionError;

    if (format === 'csv') {
      const headers = ['date', 'direction', 'amount', 'description', 'merchant', 'category', 'tax_category', 'reference', 'source', 'reconciled'];
      const lines = [headers.join(',')];
      for (const row of transactions || []) lines.push([
        row.posted_at, row.direction, row.amount, row.description, row.merchant, row.category, row.tax_category, row.reference, row.source, row.reconciled,
      ].map(csvCell).join(','));
      return new NextResponse(lines.join('\n'), {
        headers: {
          ...NO_STORE,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="aridon-finance-${year}-ledger.csv"`,
        },
      });
    }

    return NextResponse.json({
      handoff,
      tenant: membership.tenant,
      ledger: transactions || [],
      notice: 'Aridon prepares records and workpapers. Tax filing, signing, legal tax positions and professional representation remain with the owner and appropriately credentialed tax professional.',
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Finance handoff export error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to export tax handoff.' }, { status: 500, headers: NO_STORE });
  }
}
