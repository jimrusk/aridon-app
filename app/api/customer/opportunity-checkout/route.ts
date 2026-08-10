import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { appBaseUrl, stripeObjectId, stripeRequest, type StripeCheckoutSession, type StripeSubscription } from '../../../../lib/stripeBilling';
import { ensureTenantFromCheckout } from '../../../../lib/customerProvisioning';
import { normalizeOpportunityPlan, opportunityPlans } from '../../../../lib/opportunityIntelligence';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function gate(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id);
  if (!membership) return { response: NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE }) };
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) };
  return { auth, membership };
}

export async function POST(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const action = text(body?.action, 30) || 'start';

    if (action === 'confirm') {
      const sessionId = text(body?.sessionId, 200);
      if (!sessionId) return NextResponse.json({ error: 'Checkout session is required.' }, { status: 400, headers: NO_STORE });

      const session = await stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`);
      if (session.mode !== 'subscription' || session.status !== 'complete') {
        return NextResponse.json({ error: 'The subscription checkout is not complete.' }, { status: 402, headers: NO_STORE });
      }
      if (session.metadata?.existing_tenant_id !== membership.tenant.id) {
        return NextResponse.json({ error: 'This checkout does not belong to the signed-in workspace.' }, { status: 403, headers: NO_STORE });
      }

      let subscription: StripeSubscription | null = null;
      if (session.subscription && typeof session.subscription === 'object') {
        subscription = session.subscription as StripeSubscription;
      } else {
        const subscriptionId = stripeObjectId(session.subscription);
        if (subscriptionId) subscription = await stripeRequest<StripeSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
      }
      if (!subscription || !['active', 'trialing', 'past_due'].includes(subscription.status || '')) {
        return NextResponse.json({ error: 'The subscription is not active yet.' }, { status: 402, headers: NO_STORE });
      }

      const tenant = await ensureTenantFromCheckout(session, subscription);
      return NextResponse.json({ confirmed: true, opportunityPlan: tenant.opportunity_plan || null }, { headers: NO_STORE });
    }

    const opportunityPlan = normalizeOpportunityPlan(body?.plan);
    if (!opportunityPlan) return NextResponse.json({ error: 'Choose Scout, Pursuit or Command.' }, { status: 400, headers: NO_STORE });

    const { data: tenant, error: tenantError } = await auth.db
      .from('customer_tenants')
      .select('id,business_name,owner_name,industry,contact_email,billing_email,plan')
      .eq('id', membership.tenant.id)
      .single();
    if (tenantError) throw tenantError;

    const email = text(auth.user.email || tenant.billing_email || tenant.contact_email, 254).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Add a valid account email before upgrading.' }, { status: 400, headers: NO_STORE });
    }

    const basePlan = ['launch', 'growth', 'command'].includes(String(tenant.plan || '').toLowerCase())
      ? String(tenant.plan).toLowerCase()
      : 'launch';
    const baseUrl = appBaseUrl(request);
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('customer_email', email);
    params.set('line_items[0][price]', opportunityPlans[opportunityPlan].priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('allow_promotion_codes', 'true');
    params.set('billing_address_collection', 'auto');
    params.set('success_url', `${baseUrl}/customer/opportunities?upgraded=1&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${baseUrl}/customer/opportunities?upgrade_cancelled=1`);

    const metadata = {
      existing_tenant_id: tenant.id,
      business_name: text(tenant.business_name, 180) || 'Customer Business',
      owner_name: text(tenant.owner_name, 120),
      email,
      industry: text(tenant.industry, 160),
      plan: basePlan,
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
    console.error('Opportunity Intelligence customer checkout error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Opportunity Intelligence checkout could not be started.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
