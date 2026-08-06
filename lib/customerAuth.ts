import type { NextRequest } from 'next/server';
import { getServerClient } from './supabase';

export type CustomerTenantSummary = {
  id: string;
  slug: string;
  business_name: string;
  owner_name: string | null;
  industry: string | null;
  tagline: string | null;
  primary_color: string | null;
  accent_color: string | null;
  plan: string | null;
  status: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
};

export async function authenticatedCustomer(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return { ok: false as const, status: 401, error: 'Customer login required.' };
  }

  const token = authorization.slice(7).trim();
  if (!token) return { ok: false as const, status: 401, error: 'Customer login required.' };

  const db = getServerClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false as const, status: 401, error: 'Your customer session has expired.' };
  }

  return { ok: true as const, db, user: data.user };
}

export async function customerTenantForUser(userId: string, slug?: string) {
  const db = getServerClient();
  const membershipQuery = db
    .from('customer_memberships')
    .select('tenant_id,role')
    .eq('user_id', userId);

  const { data: memberships, error: membershipError } = await membershipQuery;
  if (membershipError) throw membershipError;
  if (!memberships?.length) return null;

  const tenantIds = memberships.map((membership) => membership.tenant_id);
  let tenantQuery = db
    .from('customer_tenants')
    .select('id,slug,business_name,owner_name,industry,tagline,primary_color,accent_color,plan,status,subscription_status,stripe_customer_id')
    .in('id', tenantIds);

  if (slug) tenantQuery = tenantQuery.eq('slug', slug);
  const { data: tenants, error: tenantError } = await tenantQuery.limit(1);
  if (tenantError) throw tenantError;
  if (!tenants?.length) return null;

  const tenant = tenants[0] as CustomerTenantSummary;
  const membership = memberships.find((item) => item.tenant_id === tenant.id);
  return { tenant, role: membership?.role || 'member' };
}

export function subscriptionAllowsAccess(status: string | null | undefined) {
  return ['active', 'trialing', 'past_due'].includes(status || '');
}
