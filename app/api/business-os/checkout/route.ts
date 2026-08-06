import { NextRequest, NextResponse } from 'next/server';
import { appBaseUrl, priceIdForPlan, stripeRequest, type StripeCheckoutSession } from '../../../../lib/stripeBilling';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const ownerName = text(body?.ownerName, 120);
    const businessName = text(body?.businessName, 180);
    const email = text(body?.email, 254).toLowerCase();
    const industry = text(body?.industry, 160);
    const planRaw = text(body?.plan, 30).toLowerCase();
    const plan = ['launch', 'growth', 'command'].includes(planRaw) ? planRaw : 'launch';
    const leadId = text(body?.leadId, 80);

    if (!ownerName || !businessName || !industry || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Name, business, industry and a valid email are required.' }, { status: 400, headers: NO_STORE });
    }

    const baseUrl = appBaseUrl(request);
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('customer_email', email);
    params.set('line_items[0][price]', priceIdForPlan(plan));
    params.set('line_items[0][quantity]', '1');
    params.set('allow_promotion_codes', 'true');
    params.set('billing_address_collection', 'auto');
    params.set('success_url', `${baseUrl}/business-os/activate?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${baseUrl}/business-os/checkout?plan=${encodeURIComponent(plan)}&cancelled=1`);
    params.set('metadata[business_name]', businessName);
    params.set('metadata[owner_name]', ownerName);
    params.set('metadata[email]', email);
    params.set('metadata[industry]', industry);
    params.set('metadata[plan]', plan);
    params.set('subscription_data[metadata][business_name]', businessName);
    params.set('subscription_data[metadata][owner_name]', ownerName);
    params.set('subscription_data[metadata][email]', email);
    params.set('subscription_data[metadata][industry]', industry);
    params.set('subscription_data[metadata][plan]', plan);
    if (leadId) params.set('client_reference_id', leadId);

    const session = await stripeRequest<StripeCheckoutSession>('/checkout/sessions', { method: 'POST', params });
    if (!session.url) throw new Error('Stripe did not return a Checkout URL.');

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Business OS checkout error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Secure checkout could not be started.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
