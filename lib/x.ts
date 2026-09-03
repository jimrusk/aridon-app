import { createHash, randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { appUrl } from './gmail';

export const X_STATE_COOKIE = 'aridon_x_state';
export const X_VERIFIER_COOKIE = 'aridon_x_verifier';
export const X_RETURN_COOKIE = 'aridon_x_return';

const X_AUTH_URL = process.env.X_AUTH_URL?.trim() || 'https://twitter.com/i/oauth2/authorize';
const X_TOKEN_URL = process.env.X_TOKEN_URL?.trim() || 'https://api.x.com/2/oauth2/token';
export const X_API_BASE = process.env.X_API_BASE_URL?.trim() || 'https://api.x.com/2';

function clientId() {
  const value = process.env.X_CLIENT_ID?.trim();
  if (!value) throw new Error('Missing X_CLIENT_ID.');
  return value;
}

export function xConfiguration() {
  const missing = ['X_CLIENT_ID'].filter((name) => !process.env[name]?.trim());
  return { configured: missing.length === 0, missing };
}

export function xRedirectUri(request: NextRequest) {
  return `${appUrl(request)}/api/x/callback`;
}

export function newPkcePair() {
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function newOAuthState() {
  return randomBytes(24).toString('base64url');
}

export function buildXAuthorizationUrl(request: NextRequest, state: string, challenge: string) {
  const url = new URL(X_AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId());
  url.searchParams.set('redirect_uri', xRedirectUri(request));
  url.searchParams.set('scope', 'tweet.read users.read follows.read offline.access');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

type XTokenResponse = {
  token_type?: string;
  expires_in?: number;
  access_token?: string;
  scope?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

async function tokenRequest(params: URLSearchParams): Promise<XTokenResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
  const secret = process.env.X_CLIENT_SECRET?.trim();
  if (secret) headers.Authorization = `Basic ${Buffer.from(`${clientId()}:${secret}`).toString('base64')}`;
  else params.set('client_id', clientId());

  const response = await fetch(X_TOKEN_URL, { method: 'POST', headers, body: params, cache: 'no-store' });
  const data = (await response.json()) as XTokenResponse;
  if (!response.ok || data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'X OAuth token request failed.');
  }
  return data;
}

export async function exchangeXAuthorizationCode(request: NextRequest, code: string, verifier: string) {
  const data = await tokenRequest(new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: xRedirectUri(request),
    code_verifier: verifier,
  }));
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token || '',
    expiresIn: data.expires_in || 0,
    scope: data.scope || '',
  };
}

export async function refreshXAccessToken(refreshToken: string) {
  const data = await tokenRequest(new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }));
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in || 0,
    scope: data.scope || '',
  };
}

export async function xJson<T>(path: string, accessToken: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${X_API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const data = (await response.json()) as T & { errors?: Array<{ detail?: string; message?: string }>; title?: string; detail?: string };
  if (!response.ok) {
    throw new Error(data.detail || data.title || data.errors?.[0]?.detail || data.errors?.[0]?.message || 'X API request failed.');
  }
  return data;
}
