import { NextResponse } from 'next/server';
import { priceIdForPlan, stripeRequest, type StripePrice } from '../../../../lib/stripeBilling';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

const plans = ['launch', 'growth', 'command'] as const;

export async function GET() {
  try {
    const result = await Promise.all(
      plans.map(async (plan) => {
        const price = await stripeRequest<StripePrice>(`/prices/${encodeURIComponent(priceIdForPlan(plan))}`);
        return {
          plan,
          priceId: price.id,
          active: price.active !== false,
          currency: price.currency || 'usd',
          unitAmount: price.unit_amount ?? null,
          interval: price.recurring?.interval || 'month',
          intervalCount: price.recurring?.interval_count || 1,
        };
      }),
    );
    return NextResponse.json({ configured: true, plans: result }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        plans: [],
        error: error instanceof Error ? error.message : 'Billing is not configured yet.',
      },
      { status: 503, headers: NO_STORE },
    );
  }
}
