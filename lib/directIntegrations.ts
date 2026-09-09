import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptCustomerSecret, encryptCustomerSecret } from './customerIntegrations';

export const DIRECT_INTEGRATION_PROVIDERS = ['github', 'vercel_hook'] as const;
export type DirectIntegrationProvider = (typeof DIRECT_INTEGRATION_PROVIDERS)[number];

export function normalizeDirectProvider(value: unknown): DirectIntegrationProvider | null {
  const provider = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return (DIRECT_INTEGRATION_PROVIDERS as readonly string[]).includes(provider)
    ? provider as DirectIntegrationProvider
    : null;
}

export async function saveDirectIntegration(input: {
  db: SupabaseClient;
  tenantId: string;
  userId: string;
  provider: DirectIntegrationProvider;
  secret: string;
  label?: string;
  metadata?: Record<string, unknown>;
  verified?: boolean;
}) {
  const now = new Date().toISOString();
  const payload = {
    tenant_id: input.tenantId,
    created_by: input.userId,
    provider: input.provider,
    label: input.label || null,
    encrypted_secret: encryptCustomerSecret(input.secret),
    status: 'connected',
    metadata: input.metadata || {},
    last_verified_at: input.verified ? now : null,
    updated_at: now,
  };
  const { data, error } = await input.db.from('customer_direct_integrations')
    .upsert(payload, { onConflict: 'tenant_id,provider' })
    .select('id,provider,label,status,metadata,last_verified_at,created_at,updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function getDirectIntegration(input: {
  db: SupabaseClient;
  tenantId: string;
  provider: DirectIntegrationProvider;
}) {
  const { data, error } = await input.db.from('customer_direct_integrations')
    .select('id,provider,label,encrypted_secret,status,metadata,last_verified_at,created_at,updated_at')
    .eq('tenant_id', input.tenantId)
    .eq('provider', input.provider)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status !== 'connected' || !data.encrypted_secret) return null;
  return {
    ...data,
    secret: decryptCustomerSecret(data.encrypted_secret),
  };
}

export async function disconnectDirectIntegration(input: {
  db: SupabaseClient;
  tenantId: string;
  provider: DirectIntegrationProvider;
}) {
  const { error } = await input.db.from('customer_direct_integrations')
    .update({ encrypted_secret: null, status: 'disconnected', updated_at: new Date().toISOString() })
    .eq('tenant_id', input.tenantId)
    .eq('provider', input.provider);
  if (error) throw error;
}

export async function verifyGitHubToken(token: string) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Aridon-Eva',
    },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.login) throw new Error(data?.message || 'GitHub rejected this token.');
  return { login: String(data.login), name: typeof data.name === 'string' ? data.name : '', avatarUrl: typeof data.avatar_url === 'string' ? data.avatar_url : '' };
}

export function validVercelDeployHook(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'api.vercel.com' && url.pathname.startsWith('/v1/integrations/deploy/');
  } catch {
    return false;
  }
}
