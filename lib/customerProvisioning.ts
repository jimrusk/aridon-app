import { getServerClient } from './supabase';
import {
  stripeObjectId,
  type StripeCheckoutSession,
  type StripeSubscription,
} from './stripeBilling';
import { normalizeOpportunityPlan } from './opportunityIntelligence';

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return base || 'business';
}

async function uniqueSlug(base: string) {
  const db = getServerClient();
  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const { data, error } = await db
      .from('customer_tenants')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString().slice(-6)}`;
}

function subscriptionStatusToTenantStatus(status?: string) {
  if (status === 'active' || status === 'trialing' || status === 'beta') return 'active';
  if (status === 'past_due') return 'billing_attention';
  if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') return 'billing_inactive';
  return 'onboarding';
}

export async function ensureTenantFromCheckout(
  session: StripeCheckoutSession,
  subscription?: StripeSubscription | null,
) {
  const db = getServerClient();
  const subscriptionId = stripeObjectId(subscription || session.subscription);
  const customerId = stripeObjectId(session.customer || subscription?.customer);
  const metadata = session.metadata || subscription?.metadata || {};
  const existingTenantId = clean(metadata.existing_tenant_id, 80);
  const businessName = clean(metadata.business_name, 180) || 'Customer Business';
  const ownerName = clean(metadata.owner_name, 120);
  const industry = clean(metadata.industry, 160);
  const plan = ['launch', 'growth', 'command'].includes(clean(metadata.plan, 30).toLowerCase())
    ? clean(metadata.plan, 30).toLowerCase()
    : 'launch';
  const opportunityPlan = normalizeOpportunityPlan(metadata.opportunity_plan);
  const email = clean(session.customer_details?.email || session.customer_email || metadata.email, 254);
  const subscriptionStatus = subscription?.status || 'active';
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  if (existingTenantId) {
    const { data: betaTenant, error: betaTenantError } = await db
      .from('customer_tenants')
      .select('id,slug,business_name,contact_email')
      .eq('id', existingTenantId)
      .maybeSingle();
    if (betaTenantError) throw betaTenantError;
    if (!betaTenant) throw new Error('The existing beta workspace could not be found.');

    const updatePayload: Record<string, unknown> = {
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId || null,
      billing_email: email || betaTenant.contact_email,
      plan,
      subscription_status: subscriptionStatus,
      status: subscriptionStatusToTenantStatus(subscriptionStatus),
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    };
    if (opportunityPlan) updatePayload.opportunity_plan = opportunityPlan;

    const { data, error } = await db
      .from('customer_tenants')
      .update(updatePayload)
      .eq('id', betaTenant.id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  if (subscriptionId) {
    const { data: existing, error: existingError } = await db
      .from('customer_tenants')
      .select('id,slug,business_name,contact_email')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      const updatePayload: Record<string, unknown> = {
        stripe_customer_id: customerId || null,
        billing_email: email || existing.contact_email,
        plan,
        subscription_status: subscriptionStatus,
        status: subscriptionStatusToTenantStatus(subscriptionStatus),
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      };
      if (opportunityPlan) updatePayload.opportunity_plan = opportunityPlan;

      const { data, error } = await db
        .from('customer_tenants')
        .update(updatePayload)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
  }

  const slug = await uniqueSlug(slugify(businessName));
  const payload = {
    slug,
    business_name: businessName,
    owner_name: ownerName || null,
    contact_email: email || clean(metadata.email, 254) || 'billing-contact-required@example.invalid',
    billing_email: email || null,
    industry: industry || null,
    plan,
    opportunity_plan: opportunityPlan,
    status: subscriptionStatusToTenantStatus(subscriptionStatus),
    subscription_status: subscriptionStatus,
    stripe_customer_id: customerId || null,
    stripe_subscription_id: subscriptionId || null,
    current_period_end: periodEnd,
  };

  const { data, error } = await db.from('customer_tenants').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function syncSubscription(subscription: StripeSubscription) {
  const db = getServerClient();
  const customerId = stripeObjectId(subscription.customer);
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  const payload = {
    stripe_customer_id: customerId || null,
    subscription_status: subscription.status || 'unknown',
    status: subscriptionStatusToTenantStatus(subscription.status),
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('customer_tenants')
    .update(payload)
    .eq('stripe_subscription_id', subscription.id)
    .select('id,slug');
  if (error) throw error;
  return data || [];
}

async function findAuthUserByEmail(email: string) {
  const db = getServerClient();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 1000) return null;
  }
  return null;
}

async function ensureOwnerAccount(
  email: string,
  password: string,
  tenant: { id: string; slug: string; business_name: string },
) {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid customer email is required.');
  if (password.length < 12) throw new Error('Use a password with at least 12 characters.');

  const db = getServerClient();
  let user = await findAuthUserByEmail(email);
  const existingAccount = Boolean(user);

  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        business_name: tenant.business_name,
        tenant_slug: tenant.slug,
        role: 'owner',
      },
    });
    if (error || !data.user) throw error || new Error('Customer account could not be created.');
    user = data.user;
  }

  const { error: membershipError } = await db.from('customer_memberships').upsert(
    { tenant_id: tenant.id, user_id: user.id, role: 'owner' },
    { onConflict: 'tenant_id,user_id' },
  );
  if (membershipError) throw membershipError;

  return { user, existingAccount };
}

export async function activateTenantAccount(session: StripeCheckoutSession, password: string, subscription: StripeSubscription) {
  const email = clean(session.customer_details?.email || session.customer_email || session.metadata?.email, 254).toLowerCase();
  const tenant = await ensureTenantFromCheckout(session, subscription);
  const account = await ensureOwnerAccount(email, password, tenant);
  const db = getServerClient();

  const { error: activationError } = await db
    .from('customer_tenants')
    .update({ activated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', tenant.id);
  if (activationError) throw activationError;

  return { tenant, user: account.user, existingAccount: account.existingAccount, email };
}

export async function activateBetaTenant(input: {
  businessName: string;
  ownerName: string;
  email: string;
  industry: string;
  password: string;
  feedbackContact?: string;
}) {
  const db = getServerClient();
  const businessName = clean(input.businessName, 180);
  const ownerName = clean(input.ownerName, 120);
  const industry = clean(input.industry, 160);
  const email = clean(input.email, 254).toLowerCase();
  if (!businessName || !ownerName || !industry || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Business name, owner, industry and a valid email are required.');
  }

  const slug = await uniqueSlug(slugify(businessName));
  const { data: tenant, error: tenantError } = await db
    .from('customer_tenants')
    .insert({
      slug,
      business_name: businessName,
      owner_name: ownerName,
      contact_email: email,
      billing_email: email,
      industry,
      plan: 'beta',
      status: 'active',
      subscription_status: 'beta',
      beta_feedback_contact: clean(input.feedbackContact, 254) || null,
      activated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (tenantError) throw tenantError;

  try {
    const account = await ensureOwnerAccount(email, input.password, tenant);
    return { tenant, user: account.user, existingAccount: account.existingAccount, email };
  } catch (error) {
    await db.from('customer_tenants').delete().eq('id', tenant.id);
    throw error;
  }
}
