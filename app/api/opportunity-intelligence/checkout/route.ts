import { NextRequest, NextResponse } from 'next/server';
import { appBaseUrl, stripeRequest, type StripeCheckoutSession } from '../../../../lib/stripeBilling';
import { normalizeOpportunityPlan, opportunityPlans } from '../../../../lib/opportunityIntelligence';

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
    const opportunityPlan = normalizeOpportunityPlan(body?.plan);

    if (!ownerName || !businessName || !industry || !/^\S+@\S+\.\S+$/.test(email) || !opportunityPlan) {
      return NextResponse.json(
        { error: 'Name, business, industry, email and a valid Opportunity Intelligence plan are required.' },
        { status: 400, headers: NO_STORE },
      );
    }

    const baseUrl = appBaseUrl(request);
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('customer_email', email);
    params.set('line_items[0][price]', opportunityPlans[opportunityPlan].priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('allow_promotion_codes', 'true');
    params.set('billing_address_collection', 'auto');
    params.set('success_url', `${baseUrl}/business-os/activate?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${baseUrl}/opportunity-intelligence?plan=${encodeURIComponent(opportunityPlan)}&cancelled=1`);

    const metadata = {
      business_name: businessName,
      owner_name: ownerName,
      email,
      industry,
      plan: 'launch',
      product_family: 'opportunity_intelligence',
      opportunity_plan: opportunityPlan,
    };

    for (const [key, value] of Object.entries(metadata)) {
      params.set(`metadata[${key}]`, value);
      params.set(`subscription_data[metadata][${key}]`, value);
    }

    const session = await stripeRequest<StripeCheckoutSession>('/checkout/sessions', { method: 'POST', params });
    if (!session.url) throw new Error('Stripe did not return a Checkout URL.');

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Opportunity Intelligence checkout error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Secure checkout could not be started.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
