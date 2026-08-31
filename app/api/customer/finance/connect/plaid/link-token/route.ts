import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../../../lib/customerAuth';
import { cleanFinanceText, plaidBaseUrl, providerConfigured } from '../../../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!providerConfigured('plaid')) return NextResponse.json({ error: 'Bank feeds are built but Plaid credentials still need to be added to Aridon production.' }, { status: 503, headers: NO_STORE });

    const response = await fetch(`${plaidBaseUrl()}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        client_name: 'Aridon Finance OS',
        language: 'en',
        country_codes: ['US'],
        products: ['transactions'],
        user: { client_user_id: `${membership.tenant.id}:${auth.user.id}` },
      }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.link_token) throw new Error(data?.error_message || 'Plaid could not create a bank connection session.');
    return NextResponse.json({ linkToken: data.link_token, expiration: data.expiration }, { headers: NO_STORE });
  } catch (error) {
    console.error('Plaid Link token error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start bank connection.' }, { status: 500, headers: NO_STORE });
  }
}
