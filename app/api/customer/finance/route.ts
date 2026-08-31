import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';
import { financeProviderCatalog, providerConfigured } from '../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max = 100) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const tenantId = membership.tenant.id;

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthStartText = monthStart.toISOString().slice(0, 10);

    const [connectionResult, accountResult, transactionResult, monthResult, invoiceResult, reconciliationResult, handoffResult] = await Promise.all([
      auth.db.from('customer_finance_connections').select('*').eq('tenant_id', tenantId).order('provider'),
      auth.db.from('customer_finance_accounts').select('*').eq('tenant_id', tenantId).order('name').limit(100),
      auth.db.from('customer_finance_transactions').select('*').eq('tenant_id', tenantId).order('posted_at', { ascending: false }).limit(80),
      auth.db.from('customer_finance_transactions').select('amount,direction,reconciled,category,tax_category').eq('tenant_id', tenantId).gte('posted_at', monthStartText).limit(5000),
      auth.db.from('customer_finance_invoices').select('*').eq('tenant_id', tenantId).order('due_date', { ascending: true, nullsFirst: false }).limit(100),
      auth.db.from('customer_finance_reconciliation_runs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(6),
      auth.db.from('customer_finance_tax_handoffs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(8),
    ]);

    for (const result of [connectionResult, accountResult, transactionResult, monthResult, invoiceResult, reconciliationResult, handoffResult]) {
      if (result.error) throw result.error;
    }

    const saved = new Map((connectionResult.data || []).map((item) => [item.provider, item]));
    const connections = financeProviderCatalog.map((provider) => {
      const current = saved.get(provider.key);
      const configured = providerConfigured(provider.key);
      const fallbackStatus = provider.connectionMode === 'manual' ? 'manual_ready' : configured ? 'available' : 'needs_setup';
      return {
        provider: provider.key,
        label: provider.label,
        category: provider.category,
        capabilities: provider.capabilities,
        connectionMode: provider.connectionMode,
        configured,
        status: current?.status || fallbackStatus,
        company_name: current?.company_name || null,
        external_account_id: current?.external_account_id || null,
        last_sync_at: current?.last_sync_at || null,
        last_error: current?.last_error || null,
        metadata: current?.metadata || {},
      };
    });

    const monthRows = monthResult.data || [];
    const inflow = monthRows.filter((row) => row.direction === 'inflow').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const outflow = monthRows.filter((row) => row.direction === 'outflow').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const unreconciled = monthRows.filter((row) => !row.reconciled).length;
    const uncategorized = monthRows.filter((row) => !row.category).length;

    const invoices = invoiceResult.data || [];
    const openInvoices = invoices.filter((invoice) => !['paid', 'void', 'deleted'].includes(String(invoice.status || '').toLowerCase()));
    const openReceivables = openInvoices.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0);
    const overdueCount = openInvoices.filter((invoice) => invoice.due_date && new Date(`${invoice.due_date}T23:59:59Z`).getTime() < Date.now()).length;

    const accounts = accountResult.data || [];
    const cashBalance = accounts
      .filter((account) => ['depository', 'cash', 'bank'].includes(String(account.account_type || '').toLowerCase()) || /checking|savings|cash/i.test(account.name || ''))
      .reduce((sum, account) => sum + Number(account.current_balance || 0), 0);

    return NextResponse.json({
      tenant: membership.tenant,
      connections,
      accounts,
      transactions: transactionResult.data || [],
      invoices,
      reconciliations: reconciliationResult.data || [],
      handoffs: handoffResult.data || [],
      summary: {
        monthStart: monthStartText,
        inflow,
        outflow,
        netCashMovement: inflow - outflow,
        unreconciled,
        uncategorized,
        openReceivables,
        overdueInvoices: overdueCount,
        connectedSources: connections.filter((item) => item.status === 'connected').length,
        cashBalance,
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Finance workspace load error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load Finance OS.' }, { status: 500, headers: NO_STORE });
  }
}
