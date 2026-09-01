import 'server-only';
import type { NextRequest, NextResponse } from 'next/server';
import { appUrl, cookieOptions, decryptToken, encryptToken, safeReturnPath } from './gmail';

export const MS_REFRESH_COOKIE = 'aridon_ms_refresh';
export const MS_EMAIL_COOKIE = 'aridon_ms_email';
export const MS_STATE_COOKIE = 'aridon_ms_state';
export const MS_RETURN_COOKIE = 'aridon_ms_return';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const SCOPES = ['openid', 'profile', 'email', 'offline_access', 'User.Read', 'Mail.Read', 'Mail.Send', 'Calendars.ReadWrite', 'Contacts.Read'];

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function tenant() {
  return process.env.MICROSOFT_TENANT_ID?.trim() || 'common';
}

export function microsoftConfiguration() {
  const missing = ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET', 'GMAIL_TOKEN_ENCRYPTION_KEY'].filter((name) => !process.env[name]?.trim());
  return { configured: missing.length === 0, missing };
}

export function microsoftRedirectUri(request: NextRequest) {
  return `${appUrl(request)}/api/microsoft365/callback`;
}

export function microsoftAuthorizationUrl(request: NextRequest, state: string) {
  const url = new URL(`https://login.microsoftonline.com/${encodeURIComponent(tenant())}/oauth2/v2.0/authorize`);
  url.searchParams.set('client_id', required('MICROSOFT_CLIENT_ID'));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', microsoftRedirectUri(request));
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', SCOPES.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

type TokenResponse = { access_token?: string; refresh_token?: string; error?: string; error_description?: string };
async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenant())}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store',
  });
  const data = await response.json() as TokenResponse;
  if (!response.ok || data.error) throw new Error(data.error_description || data.error || 'Microsoft token request failed.');
  return data;
}

export async function exchangeMicrosoftCode(request: NextRequest, code: string) {
  const data = await tokenRequest(new URLSearchParams({
    client_id: required('MICROSOFT_CLIENT_ID'),
    client_secret: required('MICROSOFT_CLIENT_SECRET'),
    code,
    redirect_uri: microsoftRedirectUri(request),
    grant_type: 'authorization_code',
    scope: SCOPES.join(' '),
  }));
  if (!data.access_token || !data.refresh_token) throw new Error('Microsoft did not return the required tokens.');
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function refreshMicrosoftAccessToken(refreshToken: string) {
  const data = await tokenRequest(new URLSearchParams({
    client_id: required('MICROSOFT_CLIENT_ID'),
    client_secret: required('MICROSOFT_CLIENT_SECRET'),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: SCOPES.join(' '),
  }));
  if (!data.access_token) throw new Error('Microsoft did not return an access token.');
  return data.access_token;
}

export async function microsoftAccessToken(request: NextRequest) {
  const encrypted = request.cookies.get(MS_REFRESH_COOKIE)?.value;
  if (!encrypted) throw new Error('Connect Microsoft 365 first.');
  return refreshMicrosoftAccessToken(decryptToken(encrypted));
}

export async function graphJson<T>(pathOrUrl: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${GRAPH}${pathOrUrl}`;
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}) },
    cache: 'no-store',
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) as T & { error?: { message?: string } } : {} as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `Microsoft Graph request failed (${response.status}).`);
  return data as T;
}

export async function microsoftProfile(accessToken: string) {
  const profile = await graphJson<{ mail?: string; userPrincipalName?: string; displayName?: string }>(`/me?$select=mail,userPrincipalName,displayName`, accessToken);
  return { email: profile.mail || profile.userPrincipalName || '', name: profile.displayName || '' };
}

export function setMicrosoftCookies(response: NextResponse, refreshToken: string, email: string) {
  response.cookies.set(MS_REFRESH_COOKIE, encryptToken(refreshToken), cookieOptions());
  response.cookies.set(MS_EMAIL_COOKIE, email, cookieOptions());
  response.cookies.set(MS_STATE_COOKIE, '', cookieOptions(0));
  response.cookies.set(MS_RETURN_COOKIE, '', cookieOptions(0));
}

export function clearMicrosoftCookies(response: NextResponse) {
  for (const name of [MS_REFRESH_COOKIE, MS_EMAIL_COOKIE, MS_STATE_COOKIE, MS_RETURN_COOKIE]) response.cookies.set(name, '', cookieOptions(0));
}

export { safeReturnPath };
