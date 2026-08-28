import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

export const AGRIWEBB_STAGING_AUTH = 'https://auth.staging.agriwebb.com';
export const AGRIWEBB_STAGING_API = 'https://api.staging.agriwebb.com';
export const AGRIWEBB_STAGING_CLIENT_ID = '101c6176-5deb-4ddd-b9da-a3b3d799f707';

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

export function agriWebbClientId() {
  return process.env.AGRIWEBB_CLIENT_ID || AGRIWEBB_STAGING_CLIENT_ID;
}

export function agriWebbClientSecret() {
  return process.env.AGRIWEBB_CLIENT_SECRET || '';
}

export function agriWebbRedirectUri() {
  if (process.env.AGRIWEBB_REDIRECT_URI) return process.env.AGRIWEBB_REDIRECT_URI;
  const branchUrl = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  if (branchUrl) return `https://${branchUrl}/api/integrations/agriwebb/oauth/callback`;
  return 'http://localhost:3000/api/integrations/agriwebb/oauth/callback';
}

export function requireAgriWebbConfig() {
  const clientId = agriWebbClientId();
  const clientSecret = agriWebbClientSecret();
  if (!clientSecret) throw new Error('AGRIWEBB_CLIENT_SECRET is not configured for AgriWebb staging.');
  return { clientId, clientSecret, redirectUri: agriWebbRedirectUri() };
}

export function newOauthState() {
  return randomBytes(24).toString('base64url');
}

function tokenKey() {
  const secret = agriWebbClientSecret();
  if (!secret) throw new Error('AgriWebb staging credentials are not configured.');
  return createHash('sha256').update(secret).digest();
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
  const { clientId, clientSecret } = requireAgriWebbConfig();
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
