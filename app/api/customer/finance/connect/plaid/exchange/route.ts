import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../../../lib/customerAuth';
import { cleanFinanceText, plaidBaseUrl, providerConfigured, saveFinanceSecret } from '../../../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const publicToken = cleanFinanceText(body?.publicToken, 600);
    const institutionName = cleanFinanceText(body?.institutionName, 180) || null;
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!providerConfigured('plaid')) return NextResponse.json({ error: 'Plaid production credentials are not configured.' }, { status: 503, headers: NO_STORE });
    if (!publicToken) return NextResponse.json({ error: 'Plaid did not return a public token.' }, { status: 400, headers: NO_STORE });

    const response = await fetch(`${plaidBaseUrl()}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: process.env.PLAID_CLIENT_ID, secret: process.env.PLAID_SECRET, public_token: publicToken }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.access_token || !data?.item_id) throw new Error(data?.error_message || 'Plaid token exchange failed.');

    await saveFinanceSecret(membership.tenant.id, 'plaid', { accessToken: data.access_token, itemId: data.item_id });
    const { error } = await auth.db.from('customer_finance_connections').upsert({
      tenant_id: membership.tenant.id,
      provider: 'plaid',
      label: 'Bank & Card Feeds',
      status: 'connected',
      external_account_id: data.item_id,
      company_name: institutionName,
      capabilities: ['accounts', 'balances', 'transactions', 'incremental sync'],
      metadata: { cursor: null, institutionName },
      last_error: null,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,provider' });
    if (error) throw error;

    return NextResponse.json({ ok: true, provider: 'plaid', institutionName }, { headers: NO_STORE });
  } catch (error) {
    console.error('Plaid exchange error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Bank connection failed.' }, { status: 500, headers: NO_STORE });
  }
}
