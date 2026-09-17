import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { recordStoreEvent } from '../../../../lib/storefront';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function safeEqual(a: string, b: string) {
  try {
    const left = Buffer.from(a, 'hex');
    const right = Buffer.from(b, 'hex');
    return left.length === right.length && timingSafeEqual(left, right);
  } catch { return false; }
}

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) || '';
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  const timestampNumber = Number(timestamp);
  if (!timestamp || !Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest('hex');
  return signatures.some((signature) => safeEqual(expected, signature));
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503, headers: NO_STORE });
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';
    if (!verifyStripeSignature(payload, signature, secret)) return NextResponse.json({ error: 'Invalid signature.' }, { status: 400, headers: NO_STORE });
    const event = JSON.parse(payload) as { type?: string; data?: { object?: any } };
    if (!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type || '')) return NextResponse.json({ received: true }, { headers: NO_STORE });
    const session = event.data?.object;
    if (!session?.id || session.payment_status !== 'paid') return NextResponse.json({ received: true }, { headers: NO_STORE });
    const orderId = String(session.metadata?.commerce_order_id || '');
    const tenantId = String(session.metadata?.tenant_id || '');
    const productId = String(session.metadata?.commerce_product_id || '');
    if (!orderId || !tenantId) return NextResponse.json({ received: true }, { headers: NO_STORE });

    const db = getServerClient();
    const existing = await db.from('commerce_orders').select('payment_status').eq('id', orderId).eq('tenant_id', tenantId).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) return NextResponse.json({ received: true }, { headers: NO_STORE });
    const firstConfirmation = existing.data.payment_status !== 'paid';
    const update = await db.from('commerce_orders').update({
      status: 'Paid',
      payment_status: 'paid',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      customer_email: session.customer_details?.email || session.customer_email || null,
      customer_name: session.customer_details?.name || null,
      ordered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', orderId).eq('tenant_id', tenantId);
    if (update.error) throw update.error;
    if (firstConfirmation) await recordStoreEvent({ tenantId, eventName: 'purchase', productId: productId || null, sessionId: session.id, data: { orderId, amountTotal: Number(session.amount_total || 0) / 100, source: 'stripe_webhook' } });
    return NextResponse.json({ received: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('store stripe webhook failed', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500, headers: NO_STORE });
  }
}
