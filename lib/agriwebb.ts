import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { getServerClient } from './supabase';

export const AGRIWEBB_STAGING_AUTH = 'https://auth.staging.agriwebb.com';
export const AGRIWEBB_STAGING_API = 'https://api.staging.agriwebb.com';
export const AGRIWEBB_STAGING_CLIENT_ID = '101c6176-5deb-4ddd-b9da-a3b3d799f707';
export const AGRIWEBB_STAGING_PUBLIC_ORIGIN = 'https://aridon-v02.vercel.app';

export const AGRIWEBB_READ_SCOPES = [
  'read:farms',
  'read:records',
  'read:sessions',
  'read:fields',
  'read:pasture-growth-rates',
  'read:rainfalls',
  'read:map-features',
  'read:level-readings',
  'read:management-groups',
  'read:enterprise',
  'read:animals',
  'read:animal-reports',
  'read:paddock-reports',
  'read:inventory-reports',
].join(' ');

export type AgriWebbTokenPayload = {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  expires_at: number;
  allowedFarmIds?: string[];
  organization?: string | null;
};

let cachedStagingSecret = '';

export function agriWebbClientId() {
  return process.env.AGRIWEBB_CLIENT_ID || AGRIWEBB_STAGING_CLIENT_ID;
}

async function agriWebbClientSecret() {
  if (process.env.AGRIWEBB_CLIENT_SECRET?.trim()) return process.env.AGRIWEBB_CLIENT_SECRET.trim();
  if (cachedStagingSecret) return cachedStagingSecret;

  const db = getServerClient();
  const { data, error } = await db
    .from('agriwebb_integration_credentials')
    .select('client_secret')
    .eq('environment', 'staging')
    .single();
  if (error || !data?.client_secret) {
    throw new Error('AgriWebb staging client secret is not available in the server secret store.');
  }
  cachedStagingSecret = String(data.client_secret);
  return cachedStagingSecret;
}

export function agriWebbRedirectUri() {
  if (process.env.AGRIWEBB_REDIRECT_URI?.trim()) return process.env.AGRIWEBB_REDIRECT_URI.trim();
  if (process.env.VERCEL) return `${AGRIWEBB_STAGING_PUBLIC_ORIGIN}/api/integrations/agriwebb/oauth/callback`;
  return 'http://localhost:3000/api/integrations/agriwebb/oauth/callback';
}

export async function requireAgriWebbConfig() {
  const clientId = agriWebbClientId();
  const clientSecret = await agriWebbClientSecret();
  return { clientId, clientSecret, redirectUri: agriWebbRedirectUri() };
}

export function newOauthState() {
  return randomBytes(24).toString('base64url');
}

function tokenKey() {
  const serverSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serverSecret) throw new Error('Server credential is unavailable for AgriWebb token protection.');
  return createHash('sha256').update(`agriwebb-token-cookie:${serverSecret}`).digest();
}

export function sealTokenPayload(payload: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', tokenKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function openTokenPayload<T = any>(value: string): T {
  const raw = Buffer.from(value, 'base64url');
  if (raw.length < 29) throw new Error('Invalid AgriWebb token payload.');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', tokenKey(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8')) as T;
}

export async function refreshAgriWebbToken(payload: AgriWebbTokenPayload) {
  if (!payload.refresh_token) throw new Error('AgriWebb refresh token is unavailable; reconnect the staging integration.');
  const { clientId, clientSecret } = await requireAgriWebbConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: payload.refresh_token,
    client_id: clientId,
  });
  const response = await fetch(`${AGRIWEBB_STAGING_AUTH}/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  });
  const token = await response.json().catch(() => ({}));
  if (!response.ok || !token?.access_token) throw new Error('AgriWebb staging token refresh failed.');
  return {
    ...payload,
    access_token: token.access_token,
    refresh_token: token.refresh_token || payload.refresh_token,
    token_type: token.token_type || payload.token_type || 'Bearer',
    expires_at: Date.now() + Number(token.expires_in || 3600) * 1000,
  } satisfies AgriWebbTokenPayload;
}

export async function agriWebbGraphQL<T = any>(accessToken: string, query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(`${AGRIWEBB_STAGING_API}/v2`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`AgriWebb GraphQL request failed with HTTP ${response.status}.`);
  if (Array.isArray(result?.errors) && result.errors.length) {
    const message = result.errors.map((item: any) => item?.message).filter(Boolean).join('; ');
    throw new Error(`AgriWebb GraphQL error: ${message || 'unknown error'}`);
  }
  return result?.data as T;
}
