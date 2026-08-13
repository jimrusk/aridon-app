import { NextRequest, NextResponse } from 'next/server';
import { appBaseUrl, stripeRequest, type StripeCheckoutSession } from '../../../../lib/stripeBilling';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const ESSENTIALS_PRICE_ID = 'price_1U44dgD4wDvqb7Jr9Dcxi8gL';

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function createCheckout(request: NextRequest, raw: Record<string, unknown>) {
  const ownerName = text(raw.ownerName, 120);
  const businessName = text(raw.businessName, 180);
  const email = text(raw.email, 254).toLowerCase();
  const industry = text(raw.industry, 160);
  if (!ownerName || !businessName || !industry || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Name, business, industry and a valid email are required.');

  const baseUrl = appBaseUrl(request);
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('customer_email', email);
  params.set('line_items[0][price]', ESSENTIALS_PRICE_ID);
  params.set('line_items[0][quantity]', '1');
  params.set('allow_promotion_codes', 'true');
  params.set('billing_address_collection', 'auto');
  params.set('success_url', `${baseUrl}/business-os/activate?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${baseUrl}/business-os/essentials?cancelled=1`);
  for (const [key, value] of Object.entries({ business_name: businessName, owner_name: ownerName, email, industry, plan: 'launch', product_offer: 'aridon_essentials_198' })) {
    params.set(`metadata[${key}]`, value);
    params.set(`subscription_data[metadata][${key}]`, value);
  }
  const session = await stripeRequest<StripeCheckoutSession>('/checkout/sessions', { method: 'POST', params });
  if (!session.url) throw new Error('Stripe did not return a Checkout URL.');
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams;
    const session = await createCheckout(request, { ownerName: query.get('ownerName'), businessName: query.get('businessName'), email: query.get('email'), industry: query.get('industry') });
    return NextResponse.redirect(session.url!, 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Secure checkout could not be started.';
    return NextResponse.redirect(new URL(`/business-os/essentials?error=${encodeURIComponent(message)}`, request.url), 303);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    const session = await createCheckout(request, await request.json());
    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Aridon Essentials checkout error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Secure checkout could not be started.' }, { status: 500, headers: NO_STORE });
  }
}
