import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../../lib/customerAuth';
import { cleanFinanceText, providerConfigured, readFinanceSecret, saveFinanceSecret } from '../../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

type QboSecret = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt?: number;
  realmId: string;
};

function baseUrl() {
  return String(process.env.INTUIT_ENV || process.env.QUICKBOOKS_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';
}

async function refreshIfNeeded(secret: QboSecret) {
  if (Number(secret.expiresAt || 0) > Date.now() + 120000) return secret;
  const basic = Buffer.from(`${process.env.INTUIT_CLIENT_ID}:${process.env.INTUIT_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: secret.refreshToken }).toString(),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.access_token || !data?.refresh_token) throw new Error(data?.error_description || 'QuickBooks authorization needs to be renewed.');
  return {
    ...secret,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
    refreshExpiresAt: Date.now() + Number(data.x_refresh_token_expires_in || 8726400) * 1000,
  };
}

async function qboQuery(secret: QboSecret, entity: string) {
  const rows: any[] = [];
  let start = 1;
  for (let page = 0; page < 10; page += 1) {
    const query = `select * from ${entity} startposition ${start} maxresults 1000`;
    const response = await fetch(`${baseUrl()}/v3/company/${encodeURIComponent(secret.realmId)}/query?query=${encodeURIComponent(query)}&minorversion=75`, {
      headers: { Authorization: `Bearer ${secret.accessToken}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.Fault?.Error?.[0]?.Message || `QuickBooks ${entity} sync failed.`);
    const batch = data?.QueryResponse?.[entity] || [];
    rows.push(...batch);
    if (batch.length < 1000) break;
    start += batch.length;
  }
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!providerConfigured('quickbooks')) return NextResponse.json({ error: 'QuickBooks credentials are not configured.' }, { status: 503, headers: NO_STORE });

    const tenantId = membership.tenant.id;
    const stored = await readFinanceSecret<QboSecret>(tenantId, 'quickbooks');
    if (!stored?.accessToken || !stored?.refreshToken || !stored?.realmId) return NextResponse.json({ error: 'Connect QuickBooks before syncing.' }, { status: 400, headers: NO_STORE });
    const secret = await refreshIfNeeded(stored);
    if (secret.accessToken !== stored.accessToken) await saveFinanceSecret(tenantId, 'quickbooks', secret);

    const [accounts, purchases, deposits, payments, salesReceipts, invoices, companyInfos] = await Promise.all([
      qboQuery(secret, 'Account'),
      qboQuery(secret, 'Purchase'),
      qboQuery(secret, 'Deposit'),
      qboQuery(secret, 'Payment'),
      qboQuery(secret, 'SalesReceipt'),
      qboQuery(secret, 'Invoice'),
      qboQuery(secret, 'CompanyInfo'),
    ]);

    const accountRows = accounts.map((account) => ({
      tenant_id: tenantId,
      source: 'quickbooks',
      external_id: String(account.Id),
      name: account.Name || account.FullyQualifiedName || `QuickBooks account ${account.Id}`,
      account_type: account.AccountType || null,
      account_subtype: account.AccountSubType || null,
      mask: null,
      current_balance: account.CurrentBalance ?? null,
      available_balance: null,
      currency_code: account.CurrencyRef?.value || 'USD',
      metadata: { classification: account.Classification || null, active: account.Active ?? true },
      updated_at: new Date().toISOString(),
    }));
    if (accountRows.length) {
      const { error } = await auth.db.from('customer_finance_accounts').upsert(accountRows, { onConflict: 'tenant_id,source,external_id' });
      if (error) throw error;
    }
    const { data: savedAccounts, error: accountError } = await auth.db.from('customer_finance_accounts').select('id,external_id').eq('tenant_id', tenantId).eq('source', 'quickbooks');
    if (accountError) throw accountError;
    const accountIds = new Map((savedAccounts || []).map((row) => [String(row.external_id), row.id]));

    const txRows: any[] = [];
    const addTx = (kind: string, item: any, direction: 'inflow' | 'outflow', accountRef?: any, description?: string, merchant?: string | null, reference?: string | null) => {
      const amount = Math.abs(Number(item.TotalAmt ?? item.total ?? 0));
      if (!item.Id || !amount) return;
      txRows.push({
        tenant_id: tenantId,
        account_id: accountRef?.value ? accountIds.get(String(accountRef.value)) || null : null,
        source: 'quickbooks',
        external_id: `${kind}:${item.Id}`,
        posted_at: item.TxnDate || new Date().toISOString().slice(0, 10),
        description: description || `${kind} ${item.Id}`,
        merchant: merchant || null,
        amount,
        direction,
        category: null,
        tax_category: null,
        reference: reference || item.DocNumber || item.PaymentRefNum || null,
        status: 'posted',
        reconciled: false,
        metadata: { quickbooks_type: kind, sync_token: item.SyncToken || null },
        created_by: auth.user.id,
        updated_at: new Date().toISOString(),
      });
    };

    purchases.forEach((item) => addTx('Purchase', item, 'outflow', item.AccountRef || item.CreditCardAccountRef, item.PrivateNote || `Purchase${item.PaymentType ? ` · ${item.PaymentType}` : ''}`, item.EntityRef?.name || null));
    deposits.forEach((item) => addTx('Deposit', item, 'inflow', item.DepositToAccountRef, item.PrivateNote || 'Deposit', null));
    payments.forEach((item) => addTx('Payment', item, 'inflow', item.DepositToAccountRef, `Customer payment${item.CustomerRef?.name ? ` · ${item.CustomerRef.name}` : ''}`, item.CustomerRef?.name || null));
    salesReceipts.forEach((item) => addTx('SalesReceipt', item, 'inflow', item.DepositToAccountRef, `Sales receipt${item.CustomerRef?.name ? ` · ${item.CustomerRef.name}` : ''}`, item.CustomerRef?.name || null));

    if (txRows.length) {
      const { error } = await auth.db.from('customer_finance_transactions').upsert(txRows, { onConflict: 'tenant_id,source,external_id' });
      if (error) throw error;
    }

    const invoiceRows = invoices.filter((invoice) => invoice?.Id).map((invoice) => ({
      tenant_id: tenantId,
      source: 'quickbooks',
      external_id: String(invoice.Id),
      invoice_number: invoice.DocNumber || null,
      customer_name: invoice.CustomerRef?.name || null,
      issue_date: invoice.TxnDate || null,
      due_date: invoice.DueDate || null,
      total: Math.abs(Number(invoice.TotalAmt || 0)),
      balance: Math.abs(Number(invoice.Balance || 0)),
      status: Number(invoice.Balance || 0) <= 0 ? 'paid' : 'open',
      metadata: { quickbooks_sync_token: invoice.SyncToken || null, email_status: invoice.EmailStatus || null },
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }));
    if (invoiceRows.length) {
      const { error } = await auth.db.from('customer_finance_invoices').upsert(invoiceRows, { onConflict: 'tenant_id,source,external_id' });
      if (error) throw error;
    }

    const companyName = companyInfos?.[0]?.CompanyName || null;
    const { error: connectionError } = await auth.db.from('customer_finance_connections').upsert({
      tenant_id: tenantId,
      provider: 'quickbooks',
      label: 'QuickBooks Online',
      status: 'connected',
      external_account_id: secret.realmId,
      company_name: companyName,
      capabilities: ['chart of accounts', 'purchases', 'deposits', 'invoices', 'payments'],
      metadata: { realmId: secret.realmId, lastCounts: { accounts: accounts.length, purchases: purchases.length, deposits: deposits.length, payments: payments.length, salesReceipts: salesReceipts.length, invoices: invoices.length } },
      last_sync_at: new Date().toISOString(),
      last_error: null,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,provider' });
    if (connectionError) throw connectionError;

    return NextResponse.json({ ok: true, accounts: accounts.length, transactions: txRows.length, invoices: invoiceRows.length, companyName }, { headers: NO_STORE });
  } catch (error) {
    console.error('QuickBooks sync error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'QuickBooks sync failed.' }, { status: 500, headers: NO_STORE });
  }
}
