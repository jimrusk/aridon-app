import { NextRequest, NextResponse } from 'next/server';
import { ensureTenantFromCheckout, syncSubscription } from '../../../../lib/customerProvisioning';
import {
  stripeObjectId,
  stripeRequest,
  verifyStripeWebhook,
  type StripeCheckoutSession,
  type StripeSubscription,
} from '../../../../lib/stripeBilling';

export const runtime = 'nodejs';

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
      const session = object as unknown as StripeCheckoutSession;
      let subscription: StripeSubscription | null = null;
      const subscriptionId = stripeObjectId(session.subscription);
      if (subscriptionId) {
        subscription = await stripeRequest<StripeSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
      }
      await ensureTenantFromCheckout(session, subscription);
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
