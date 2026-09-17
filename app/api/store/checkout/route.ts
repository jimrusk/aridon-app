import { NextRequest, NextResponse } from 'next/server';
import { storeWrite } from '../../../../lib/storefront';

export const runtime = 'nodejs';
export const maxDuration = 30;
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export async function POST(request: NextRequest) {
  let orderId = '';
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'JSON required.' }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    const productId = clean(body?.productId, 80);
    if (!productId) return NextResponse.json({ error: 'A product is required.' }, { status: 400, headers: NO_STORE });

    const order = await storeWrite('create_order', { productId });
    orderId = String(order.orderId || '');
    const tenantId = String(order.tenantId || '');
    const verifiedProductId = String(order.productId || '');
    const slug = String(order.slug || '');
    const title = String(order.title || 'Aridon Market product').slice(0, 250);
    const description = String(order.description || '').slice(0, 450);
    const salePrice = Number(order.salePrice || 0);
    const freightCost = Math.max(0, Number(order.freightCost || 0));
    if (!orderId || !tenantId || !verifiedProductId || !Number.isFinite(salePrice) || salePrice <= 0) throw new Error('Verified checkout details are incomplete.');

    const secret = requiredEnv('STRIPE_SECRET_KEY');
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin).replace(/\/$/, '');
    const form = new URLSearchParams();
    form.set('mode', 'payment');
    form.set('success_url', `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`);
    form.set('cancel_url', `${baseUrl}/shop/product/${encodeURIComponent(slug)}`);
    form.set('shipping_address_collection[allowed_countries][0]', 'US');
    form.set('phone_number_collection[enabled]', 'true');
    form.set('line_items[0][quantity]', '1');
    form.set('line_items[0][price_data][currency]', 'usd');
    form.set('line_items[0][price_data][unit_amount]', String(Math.round(salePrice * 100)));
    form.set('line_items[0][price_data][product_data][name]', title);
    if (description) form.set('line_items[0][price_data][product_data][description]', description);
    if (freightCost > 0) {
      form.set('line_items[1][quantity]', '1');
      form.set('line_items[1][price_data][currency]', 'usd');
      form.set('line_items[1][price_data][unit_amount]', String(Math.round(freightCost * 100)));
      form.set('line_items[1][price_data][product_data][name]', 'Freight / delivery reserve');
      form.set('line_items[1][price_data][product_data][description]', 'Freight reserve shown by Aridon Market for this product.');
    }
    if (process.env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase() === 'true') form.set('automatic_tax[enabled]', 'true');
    form.set('metadata[commerce_order_id]', orderId);
    form.set('metadata[commerce_product_id]', verifiedProductId);
    form.set('metadata[tenant_id]', tenantId);
    form.set('metadata[channel]', 'aridon-market');

    const stripe = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `aridon-market-${orderId}`,
      },
      body: form,
      cache: 'no-store',
    });
    const session = await stripe.json() as { id?: string; url?: string; error?: { message?: string } };
    if (!stripe.ok || !session.id || !session.url) throw new Error(session.error?.message || `Stripe checkout returned ${stripe.status}.`);

    await storeWrite('attach_checkout', {
      orderId,
      checkoutSessionId: session.id,
      visitorId: clean(body?.visitorId, 120),
      sessionId: clean(body?.sessionId, 120),
      url: clean(body?.sourceUrl, 1200),
    });

    return NextResponse.json({ ok: true, url: session.url }, { headers: NO_STORE });
  } catch (error) {
    console.error('store checkout failed', error);
    if (orderId) {
      try { await storeWrite('checkout_error', { orderId }); } catch { /* preserve original error */ }
    }
    const message = error instanceof Error ? error.message : '';
    if (/Product unavailable for checkout|Verified checkout details/.test(message)) {
      return NextResponse.json({ error: 'This product is not available for direct checkout. Please request a verified quote.' }, { status: 409, headers: NO_STORE });
    }
    return NextResponse.json({ error: /STRIPE_SECRET_KEY/.test(message) ? 'Secure checkout is being connected. Please request a quote for now.' : 'Checkout could not be opened. Please request a quote and we will help you.' }, { status: 503, headers: NO_STORE });
  }
}
