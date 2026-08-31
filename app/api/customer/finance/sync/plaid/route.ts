import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../../lib/customerAuth';
import { cleanFinanceText, plaidBaseUrl, providerConfigured, readFinanceSecret } from '../../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

type PlaidSecret = { accessToken: string; itemId: string };

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!providerConfigured('plaid')) return NextResponse.json({ error: 'Plaid credentials are not configured.' }, { status: 503, headers: NO_STORE });

    const tenantId = membership.tenant.id;
    const secret = await readFinanceSecret<PlaidSecret>(tenantId, 'plaid');
    if (!secret?.accessToken) return NextResponse.json({ error: 'Connect a bank account before syncing.' }, { status: 400, headers: NO_STORE });

    const { data: connection, error: connectionError } = await auth.db.from('customer_finance_connections').select('*').eq('tenant_id', tenantId).eq('provider', 'plaid').maybeSingle();
    if (connectionError) throw connectionError;
    const savedCursor = typeof connection?.metadata?.cursor === 'string' ? connection.metadata.cursor : null;
    let cursor = savedCursor;
    let added: any[] = [];
    let modified: any[] = [];
    let removed: any[] = [];
    let accounts = new Map<string, any>();
    let hasMore = true;
    let pages = 0;
    let restarts = 0;

    while (hasMore && pages < 20) {
      const response = await fetch(`${plaidBaseUrl()}/transactions/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.PLAID_CLIENT_ID,
          secret: process.env.PLAID_SECRET,
          access_token: secret.accessToken,
          cursor: cursor || undefined,
          count: 500,
          options: { include_personal_finance_category: true },
        }),
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data?.error_code === 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION' && restarts < 2) {
          cursor = savedCursor;
          added = [];
          modified = [];
          removed = [];
          accounts = new Map<string, any>();
          hasMore = true;
          pages = 0;
          restarts += 1;
          continue;
        }
        throw new Error(data?.error_message || 'Plaid transaction sync failed.');
      }
      for (const account of data.accounts || []) accounts.set(account.account_id, account);
      added.push(...(data.added || []));
      modified.push(...(data.modified || []));
      removed.push(...(data.removed || []));
      cursor = data.next_cursor || cursor;
      hasMore = Boolean(data.has_more);
      pages += 1;
    }
    if (hasMore) throw new Error('Bank sync returned more pages than the safe per-run limit. Run sync again to continue.');

    const accountRows = Array.from(accounts.values()).map((account) => ({
      tenant_id: tenantId,
      source: 'plaid',
      external_id: account.account_id,
      name: account.name || account.official_name || 'Bank account',
      account_type: account.type || null,
      account_subtype: account.subtype || null,
      mask: account.mask || null,
      current_balance: account.balances?.current ?? null,
      available_balance: account.balances?.available ?? null,
      currency_code: account.balances?.iso_currency_code || 'USD',
      metadata: { official_name: account.official_name || null },
      updated_at: new Date().toISOString(),
    }));
    if (accountRows.length) {
      const { error } = await auth.db.from('customer_finance_accounts').upsert(accountRows, { onConflict: 'tenant_id,source,external_id' });
      if (error) throw error;
    }

    const { data: savedAccounts, error: savedAccountError } = await auth.db.from('customer_finance_accounts').select('id,external_id').eq('tenant_id', tenantId).eq('source', 'plaid');
    if (savedAccountError) throw savedAccountError;
    const accountIds = new Map((savedAccounts || []).map((account) => [account.external_id, account.id]));

    const normalize = (transaction: any) => {
      const amountValue = Number(transaction.amount || 0);
      const direction = amountValue > 0 ? 'outflow' : 'inflow';
      const amount = Math.abs(amountValue);
      return {
        tenant_id: tenantId,
        account_id: accountIds.get(transaction.account_id) || null,
        source: 'plaid',
        external_id: transaction.transaction_id,
        posted_at: transaction.date || transaction.authorized_date || new Date().toISOString().slice(0, 10),
        description: transaction.name || transaction.merchant_name || 'Bank transaction',
        merchant: transaction.merchant_name || null,
        amount,
        direction,
        category: transaction.personal_finance_category?.primary || transaction.category?.[0] || null,
        tax_category: null,
        reference: transaction.payment_meta?.reference_number || transaction.check_number || null,
        status: transaction.pending ? 'pending' : 'posted',
        reconciled: false,
        metadata: {
          plaid_category_detail: transaction.personal_finance_category?.detailed || null,
          pending_transaction_id: transaction.pending_transaction_id || null,
          authorized_date: transaction.authorized_date || null,
          website: transaction.website || null,
        },
        created_by: auth.user.id,
        updated_at: new Date().toISOString(),
      };
    };

    const transactionRows = [...added, ...modified].filter((transaction) => transaction?.transaction_id).map(normalize);
    if (transactionRows.length) {
      const { error } = await auth.db.from('customer_finance_transactions').upsert(transactionRows, { onConflict: 'tenant_id,source,external_id' });
      if (error) throw error;
    }
    const removedIds = removed.map((item) => item.transaction_id).filter(Boolean);
    if (removedIds.length) {
      const { error } = await auth.db.from('customer_finance_transactions').delete().eq('tenant_id', tenantId).eq('source', 'plaid').in('external_id', removedIds);
      if (error) throw error;
    }

    const metadata = { ...(connection?.metadata || {}), cursor, lastPageCount: pages, lastRestartCount: restarts };
    const { error: updateError } = await auth.db.from('customer_finance_connections').upsert({
      tenant_id: tenantId,
      provider: 'plaid',
      label: 'Bank & Card Feeds',
      status: 'connected',
      external_account_id: secret.itemId,
      company_name: connection?.company_name || null,
      capabilities: ['accounts', 'balances', 'transactions', 'incremental sync'],
      metadata,
      last_sync_at: new Date().toISOString(),
      last_error: null,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,provider' });
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, added: added.length, modified: modified.length, removed: removedIds.length, accounts: accountRows.length, pages, restarts }, { headers: NO_STORE });
  } catch (error) {
    console.error('Plaid sync error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Bank sync failed.' }, { status: 500, headers: NO_STORE });
  }
}
