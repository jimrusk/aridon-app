import type { NextRequest } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getUserScopedClient } from './supabase';
import { subscriptionAllowsAccess, type CustomerTenantSummary } from './customerAuth';

export type IntelligenceAccess = {
  ok: true;
  db: SupabaseClient;
  user: User;
  membership: { tenant: CustomerTenantSummary; role: string };
} | {
  ok: false;
  status: number;
  error: string;
};

export async function authenticatedIntelligenceAccess(request: NextRequest): Promise<IntelligenceAccess> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Customer login required.' };
  }

  const token = authorization.slice(7).trim();
  if (!token) return { ok: false, status: 401, error: 'Customer login required.' };

  const db = getUserScopedClient(token);
  const { data: userResult, error: userError } = await db.auth.getUser(token);
  if (userError || !userResult.user) {
    return { ok: false, status: 401, error: 'Your customer session has expired.' };
  }

  const { data: memberships, error: membershipError } = await db
    .from('customer_memberships')
    .select('tenant_id,role')
    .eq('user_id', userResult.user.id);

  if (membershipError) throw membershipError;
  if (!memberships?.length) {
    return { ok: false, status: 404, error: 'No customer workspace is attached to this account.' };
  }

  const tenantIds = memberships.map((membership) => membership.tenant_id);
  const { data: tenants, error: tenantError } = await db
    .from('customer_tenants')
    .select('id,slug,business_name,owner_name,industry,tagline,primary_color,accent_color,plan,status,subscription_status,stripe_customer_id')
    .in('id', tenantIds)
    .limit(1);

  if (tenantError) throw tenantError;
  if (!tenants?.length) {
    return { ok: false, status: 404, error: 'No customer workspace is attached to this account.' };
  }

  const tenant = tenants[0] as CustomerTenantSummary;
  if (!subscriptionAllowsAccess(tenant.subscription_status)) {
    return { ok: false, status: 402, error: 'This workspace is not active.' };
  }

  const membership = memberships.find((item) => item.tenant_id === tenant.id);
  return {
    ok: true,
    db,
    user: userResult.user,
    membership: { tenant, role: membership?.role || 'member' },
  };
}
