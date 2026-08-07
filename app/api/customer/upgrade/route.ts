import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';
import { appBaseUrl, priceIdForPlan, stripeRequest, type StripeCheckoutSession } from '../../../../lib/stripeBilling';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    }

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id);
    if (!membership) {
      return NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE });
    }

    const body = await request.json();
    const planRaw = text(body?.plan, 30).toLowerCase();
    if (!['launch', 'growth', 'command'].includes(planRaw)) {
      return NextResponse.json({ error: 'Choose a valid paid plan.' }, { status: 400, headers: NO_STORE });
    }

    const tenant = membership.tenant;
    const baseUrl = appBaseUrl(request);
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('line_items[0][price]', priceIdForPlan(planRaw));
    params.set('line_items[0][quantity]', '1');
    params.set('allow_promotion_codes', 'true');
    params.set('billing_address_collection', 'auto');
    params.set('success_url', `${baseUrl}/customer/upgrade/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${baseUrl}/customer/upgrade?cancelled=1`);
    params.set('client_reference_id', tenant.id);

    if (tenant.stripe_customer_id) {
      params.set('customer', tenant.stripe_customer_id);
    } else if (auth.user.email) {
      params.set('customer_email', auth.user.email);
    }

    const metadata: Record<string, string> = {
      existing_tenant_id: tenant.id,
      business_name: tenant.business_name,
      owner_name: tenant.owner_name || '',
      email: auth.user.email || '',
      industry: tenant.industry || '',
      plan: planRaw,
      source: 'beta_upgrade',
    };

    for (const [key, value] of Object.entries(metadata)) {
      params.set(`metadata[${key}]`, value);
      params.set(`subscription_data[metadata][${key}]`, value);
    }

    const session = await stripeRequest<StripeCheckoutSession>('/checkout/sessions', { method: 'POST', params });
    if (!session.url) throw new Error('Stripe did not return a Checkout URL.');

    await auth.db.from('customer_usage_events').insert({
      tenant_id: tenant.id,
      user_id: auth.user.id,
      event_name: 'paid_upgrade_checkout_started',
      event_data: { plan: planRaw },
    });

    return NextResponse.json({ checkoutUrl: session.url }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Customer upgrade checkout error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Paid checkout could not be started.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
