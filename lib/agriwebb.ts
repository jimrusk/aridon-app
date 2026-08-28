import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

export const AGRIWEBB_STAGING_AUTH = 'https://auth.staging.agriwebb.com';
export const AGRIWEBB_STAGING_API = 'https://api.staging.agriwebb.com';

export const AGRIWEBB_READ_SCOPES = [
  'read:farms',
  'read:records',
  'read:fields',
  'read:pasture-growth-rates',
  'read:rainfalls',
  'read:level-readings',
  'read:management-groups',
  'read:enterprise',
  'read:animals',
  'read:animal-reports',
  'read:paddock-reports',
  'read:inventory-reports',
].join(' ');

export function agriWebbClientId() {
  return process.env.AGRIWEBB_CLIENT_ID || '';
}

export function agriWebbClientSecret() {
  return process.env.AGRIWEBB_CLIENT_SECRET || '';
}

export function agriWebbRedirectUri() {
  return process.env.AGRIWEBB_REDIRECT_URI || 'http://localhost:3000/api/integrations/agriwebb/oauth/callback';
}

export function requireAgriWebbConfig() {
  const clientId = agriWebbClientId();
  const clientSecret = agriWebbClientSecret();
  if (!clientId || !clientSecret) throw new Error('AgriWebb staging credentials are not configured.');
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
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', tokenKey(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8')) as T;
}
