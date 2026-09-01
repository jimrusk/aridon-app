import 'server-only';
import type { NextRequest, NextResponse } from 'next/server';
import { appUrl, cookieOptions, decryptToken, encryptToken, safeReturnPath } from './gmail';

export const QB_REFRESH_COOKIE = 'aridon_qb_refresh';
export const QB_REALM_COOKIE = 'aridon_qb_realm';
export const QB_STATE_COOKIE = 'aridon_qb_state';
export const QB_RETURN_COOKIE = 'aridon_qb_return';

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function quickBooksConfiguration() {
  const missing = ['QUICKBOOKS_CLIENT_ID', 'QUICKBOOKS_CLIENT_SECRET', 'GMAIL_TOKEN_ENCRYPTION_KEY'].filter((name) => !process.env[name]?.trim());
  return { configured: missing.length === 0, missing, environment: process.env.QUICKBOOKS_ENV?.trim() === 'sandbox' ? 'sandbox' : 'production' };
}

export function quickBooksRedirectUri(request: NextRequest) {
  return `${appUrl(request)}/api/accounting/quickbooks/callback`;
}

export function quickBooksAuthorizationUrl(request: NextRequest, state: string) {
  const url = new URL('https://appcenter.intuit.com/connect/oauth2');
  url.searchParams.set('client_id', required('QUICKBOOKS_CLIENT_ID'));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
  url.searchParams.set('redirect_uri', quickBooksRedirectUri(request));
  url.searchParams.set('state', state);
  return url.toString();
}

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; x_refresh_token_expires_in?: number; error?: string; error_description?: string };
async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const credentials = Buffer.from(`${required('QUICKBOOKS_CLIENT_ID')}:${required('QUICKBOOKS_CLIENT_SECRET')}`, 'utf8').toString('base64');
  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const data = await response.json() as TokenResponse;
  if (!response.ok || data.error) throw new Error(data.error_description || data.error || 'QuickBooks token request failed.');
  return data;
}

export async function exchangeQuickBooksCode(request: NextRequest, code: string) {
  const data = await tokenRequest(new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: quickBooksRedirectUri(request) }));
  if (!data.access_token || !data.refresh_token) throw new Error('QuickBooks did not return the required tokens.');
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function refreshQuickBooksAccessToken(refreshToken: string) {
  const data = await tokenRequest(new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }));
  if (!data.access_token || !data.refresh_token) throw new Error('QuickBooks did not refresh the connection.');
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function quickBooksConnection(request: NextRequest) {
  const encrypted = request.cookies.get(QB_REFRESH_COOKIE)?.value;
  const realmId = request.cookies.get(QB_REALM_COOKIE)?.value || '';
  if (!encrypted || !realmId) throw new Error('Connect QuickBooks first.');
  const tokens = await refreshQuickBooksAccessToken(decryptToken(encrypted));
  return { ...tokens, realmId };
}

export function quickBooksApiBase() {
  return quickBooksConfiguration().environment === 'sandbox' ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com';
}

export async function quickBooksJson<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${quickBooksApiBase()}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await response.json() as T & { Fault?: { Error?: Array<{ Message?: string; Detail?: string }> } };
  if (!response.ok) throw new Error(data.Fault?.Error?.[0]?.Detail || data.Fault?.Error?.[0]?.Message || `QuickBooks request failed (${response.status}).`);
  return data;
}

export function setQuickBooksCookies(response: NextResponse, refreshToken: string, realmId: string) {
  response.cookies.set(QB_REFRESH_COOKIE, encryptToken(refreshToken), cookieOptions(60 * 60 * 24 * 90));
  response.cookies.set(QB_REALM_COOKIE, realmId, cookieOptions(60 * 60 * 24 * 90));
  response.cookies.set(QB_STATE_COOKIE, '', cookieOptions(0));
  response.cookies.set(QB_RETURN_COOKIE, '', cookieOptions(0));
}

export { safeReturnPath };
