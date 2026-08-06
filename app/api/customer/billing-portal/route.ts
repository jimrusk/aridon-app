import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';
import { appBaseUrl, stripeRequest } from '../../../../lib/stripeBilling';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

type PortalSession = { id: string; url?: string | null };

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id);
    if (!membership) {
      return NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE });
    }
    if (!membership.tenant.stripe_customer_id) {
      return NextResponse.json({ error: 'This workspace does not have a paid billing account.' }, { status: 400, headers: NO_STORE });
    }

    const params = new URLSearchParams({
      customer: membership.tenant.stripe_customer_id,
      return_url: `${appBaseUrl(request)}/customer/account`,
    });
    const portal = await stripeRequest<PortalSession>('/billing_portal/sessions', { method: 'POST', params });
    if (!portal.url) throw new Error('Stripe did not return a billing portal URL.');

    return NextResponse.json({ url: portal.url }, { headers: NO_STORE });
  } catch (error) {
    console.error('Billing portal error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to open billing management.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
