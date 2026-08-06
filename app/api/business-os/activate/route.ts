import { NextRequest, NextResponse } from 'next/server';
import { activateTenantAccount } from '../../../../lib/customerProvisioning';
import {
  stripeObjectId,
  stripeRequest,
  type StripeCheckoutSession,
  type StripeSubscription,
} from '../../../../lib/stripeBilling';

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
    const sessionId = text(body?.sessionId, 200);
    const password = text(body?.password, 500);
    if (!sessionId || password.length < 12) {
      return NextResponse.json({ error: 'A valid checkout session and a password with at least 12 characters are required.' }, { status: 400, headers: NO_STORE });
    }

    const session = await stripeRequest<StripeCheckoutSession>(
      `/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,
    );
    if (session.mode !== 'subscription' || session.status !== 'complete') {
      return NextResponse.json({ error: 'This subscription checkout is not complete.' }, { status: 402, headers: NO_STORE });
    }

    let subscription: StripeSubscription | null = null;
    if (session.subscription && typeof session.subscription === 'object') {
      subscription = session.subscription as StripeSubscription;
    } else {
      const subscriptionId = stripeObjectId(session.subscription);
      if (subscriptionId) {
        subscription = await stripeRequest<StripeSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
      }
    }

    if (!subscription || !['active', 'trialing', 'past_due'].includes(subscription.status || '')) {
      return NextResponse.json({ error: 'The subscription is not active yet. Complete payment first.' }, { status: 402, headers: NO_STORE });
    }

    const activated = await activateTenantAccount(session, password, subscription);
    return NextResponse.json(
      {
        activated: true,
        existingAccount: activated.existingAccount,
        email: activated.email,
        tenant: {
          slug: activated.tenant.slug,
          businessName: activated.tenant.business_name,
          plan: activated.tenant.plan,
        },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('Business OS activation error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The customer workspace could not be activated.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
