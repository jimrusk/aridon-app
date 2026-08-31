import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../../lib/customerAuth';
import { cleanFinanceText, providerConfigured, readFinanceSecret } from '../../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

type StripeSecret = { accessToken: string; stripeUserId: string; livemode?: boolean };

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!providerConfigured('stripe-connect')) return NextResponse.json({ error: 'Stripe Connect credentials are not configured.' }, { status: 503, headers: NO_STORE });

    const tenantId = membership.tenant.id;
    const secret = await readFinanceSecret<StripeSecret>(tenantId, 'stripe-connect');
    if (!secret?.accessToken) return NextResponse.json({ error: 'Connect Stripe before syncing.' }, { status: 400, headers: NO_STORE });

    const rows: any[] = [];
    let startingAfter = '';
    for (let page = 0; page < 10; page += 1) {
      const params = new URLSearchParams({ limit: '100' });
      if (startingAfter) params.set('starting_after', startingAfter);
      const response = await fetch(`https://api.stripe.com/v1/balance_transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${secret.accessToken}` },
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message || 'Stripe payment sync failed.');
      const batch = Array.isArray(data?.data) ? data.data : [];
      rows.push(...batch);
      if (!data?.has_more || batch.length === 0) break;
      startingAfter = batch[batch.length - 1].id;
    }

    const allowedTypes = new Set(['charge', 'payment', 'refund', 'adjustment', 'payment_refund']);
    const transactionRows: any[] = [];
    for (const item of rows) {
      if (!item?.id || !allowedTypes.has(String(item.type || ''))) continue;
      const gross = Number(item.amount || 0) / 100;
      if (!gross) continue;
      const isRefund = gross < 0 || String(item.type || '').includes('refund');
      transactionRows.push({
        tenant_id: tenantId,
        source: 'stripe',
        external_id: item.id,
        posted_at: new Date(Number(item.created || 0) * 1000).toISOString().slice(0, 10),
        description: item.description || `Stripe ${item.type || 'payment'}`,
        merchant: null,
        amount: Math.abs(gross),
        direction: isRefund ? 'outflow' : 'inflow',
        category: isRefund ? 'Refunds' : 'Sales / Payments',
        tax_category: null,
        reference: item.source || null,
        status: item.status || 'available',
        reconciled: false,
        metadata: { stripe_type: item.type || null, available_on: item.available_on || null, currency: item.currency || 'usd' },
        created_by: auth.user.id,
        updated_at: new Date().toISOString(),
      });
      const fee = Math.abs(Number(item.fee || 0) / 100);
      if (fee > 0 && !isRefund) {
        transactionRows.push({
          tenant_id: tenantId,
          source: 'stripe',
          external_id: `${item.id}:fee`,
          posted_at: new Date(Number(item.created || 0) * 1000).toISOString().slice(0, 10),
          description: `Stripe processing fee · ${item.description || item.id}`,
          merchant: 'Stripe',
          amount: fee,
          direction: 'outflow',
          category: 'Payment processing fees',
          tax_category: 'Payment processing fees',
          reference: item.id,
          status: 'posted',
          reconciled: false,
          metadata: { stripe_type: 'fee', source_balance_transaction: item.id, currency: item.currency || 'usd' },
          created_by: auth.user.id,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (transactionRows.length) {
      const { error } = await auth.db.from('customer_finance_transactions').upsert(transactionRows, { onConflict: 'tenant_id,source,external_id' });
      if (error) throw error;
    }

    const { error: connectionError } = await auth.db.from('customer_finance_connections').upsert({
      tenant_id: tenantId,
      provider: 'stripe-connect',
      label: 'Stripe Payments',
      status: 'connected',
      external_account_id: secret.stripeUserId,
      capabilities: ['charges', 'fees', 'refunds', 'payout economics'],
      metadata: { livemode: Boolean(secret.livemode), lastBalanceTransactionCount: rows.length },
      last_sync_at: new Date().toISOString(),
      last_error: null,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,provider' });
    if (connectionError) throw connectionError;

    return NextResponse.json({ ok: true, sourceRows: rows.length, ledgerRows: transactionRows.length }, { headers: NO_STORE });
  } catch (error) {
    console.error('Stripe sync error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Stripe sync failed.' }, { status: 500, headers: NO_STORE });
  }
}
