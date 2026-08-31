import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../../../lib/customerAuth';
import { cleanFinanceText, providerConfigured, sealOAuthState, stripeConnectRedirectUri } from '../../../../../../../lib/financeConnectors';

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
    if (!providerConfigured('stripe-connect')) return NextResponse.json({ error: 'Stripe payment syncing is built, but Stripe Connect credentials still need to be added to Aridon production.' }, { status: 503, headers: NO_STORE });

    const state = sealOAuthState({ tenantId: membership.tenant.id, slug: membership.tenant.slug, userId: auth.user.id, provider: 'stripe-connect' });
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.STRIPE_CONNECT_CLIENT_ID || '',
      scope: 'read_write',
      redirect_uri: stripeConnectRedirectUri(),
      state,
    });
    return NextResponse.json({ url: `https://connect.stripe.com/oauth/authorize?${params.toString()}` }, { headers: NO_STORE });
  } catch (error) {
    console.error('Stripe Connect start error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start Stripe connection.' }, { status: 500, headers: NO_STORE });
  }
}
