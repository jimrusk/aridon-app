import { NextRequest, NextResponse } from 'next/server';
import { ensureTenantFromCheckout, syncSubscription } from '../../../../lib/customerProvisioning';
import { storeWrite } from '../../../../lib/storefront';
import {
  stripeObjectId,
  stripeRequest,
  verifyStripeWebhook,
  type StripeCheckoutSession,
  type StripeSubscription,
} from '../../../../lib/stripeBilling';

export const runtime = 'nodejs';

type StoreCheckoutSession = StripeCheckoutSession & {
  payment_intent?: unknown;
  amount_total?: number | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
};

async function reconcileStoreCheckout(session: StoreCheckoutSession) {
  if (session.metadata?.channel !== 'aridon-market' || session.payment_status !== 'paid') return;
  const orderId = String(session.metadata?.commerce_order_id || '');
  if (!orderId || !session.id) return;
  await storeWrite('mark_paid', {
    orderId,
    checkoutSessionId: session.id,
    paymentIntentId: stripeObjectId(session.payment_intent) || '',
    customerEmail: session.customer_details?.email || session.customer_email || '',
    customerName: session.customer_details?.name || '',
    amountTotal: Number(session.amount_total || 0) / 100,
    source: 'stripe_webhook',
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyStripeWebhook(rawBody, request.headers.get('stripe-signature'))) {
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: { object?: unknown };
    };
    const object = event.data?.object as Record<string, unknown> | undefined;

    if (event.type === 'checkout.session.completed' && object) {
      const session = object as unknown as StoreCheckoutSession;
      if (session.metadata?.channel === 'aridon-market') {
        await reconcileStoreCheckout(session);
      } else {
        let subscription: StripeSubscription | null = null;
        const subscriptionId = stripeObjectId(session.subscription);
        if (subscriptionId) {
          subscription = await stripeRequest<StripeSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
        }
        await ensureTenantFromCheckout(session, subscription);
      }
    }

    if (event.type === 'checkout.session.async_payment_succeeded' && object) {
      await reconcileStoreCheckout(object as unknown as StoreCheckoutSession);
    }

    if (
      object &&
      ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'customer.subscription.paused', 'customer.subscription.resumed'].includes(event.type || '')
    ) {
      await syncSubscription(object as unknown as StripeSubscription);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
