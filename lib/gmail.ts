import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const GMAIL_REFRESH_COOKIE = 'aridon_gmail_refresh';
export const GMAIL_EMAIL_COOKIE = 'aridon_gmail_email';
export const GMAIL_STATE_COOKIE = 'aridon_gmail_state';
export const GMAIL_RETURN_COOKIE = 'aridon_gmail_return';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const GMAIL_READ_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const CONTACTS_READ_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';
const DRIVE_READ_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const DOCS_READ_SCOPE = 'https://www.googleapis.com/auth/documents.readonly';
const SHEETS_READ_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const SLIDES_READ_SCOPE = 'https://www.googleapis.com/auth/presentations.readonly';
const USERINFO_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function gmailConfiguration() {
  const missing = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GMAIL_TOKEN_ENCRYPTION_KEY',
  ].filter((name) => !process.env[name]?.trim());

  return { configured: missing.length === 0, missing };
}

export function appUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return (configured || request.nextUrl.origin).replace(/\/$/, '');
}

export function gmailRedirectUri(request: NextRequest): string {
  return `${appUrl(request)}/api/gmail/callback`;
}

export function buildGoogleAuthorizationUrl(request: NextRequest, state: string): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', required('GOOGLE_CLIENT_ID'));
  url.searchParams.set('redirect_uri', gmailRedirectUri(request));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set(
    'scope',
    `openid ${USERINFO_SCOPE} ${GMAIL_SEND_SCOPE} ${GMAIL_READ_SCOPE} ${CALENDAR_EVENTS_SCOPE} ${CONTACTS_READ_SCOPE} ${DRIVE_READ_SCOPE} ${DOCS_READ_SCOPE} ${SHEETS_READ_SCOPE} ${SLIDES_READ_SCOPE}`,
  );
  url.searchParams.set('state', state);
  return url.toString();
}

function encryptionKey(): Buffer {
  return createHash('sha256').update(required('GMAIL_TOKEN_ENCRYPTION_KEY')).digest();
}

export function encryptToken(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
}

export function decryptToken(value: string): string {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Invalid token envelope.');

  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

async function tokenRequest(body: URLSearchParams): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const data = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Google token request failed.');
  }
  return data;
}

export async function exchangeAuthorizationCode(request: NextRequest, code: string) {
  const data = await tokenRequest(
    new URLSearchParams({
      code,
      client_id: required('GOOGLE_CLIENT_ID'),
      client_secret: required('GOOGLE_CLIENT_SECRET'),
      redirect_uri: gmailRedirectUri(request),
      grant_type: 'authorization_code',
    }),
  );

  if (!data.access_token || !data.refresh_token) {
    throw new Error('Google did not return the required Workspace tokens. Reconnect and approve access.');
  }

  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const data = await tokenRequest(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: required('GOOGLE_CLIENT_ID'),
      client_secret: required('GOOGLE_CLIENT_SECRET'),
      grant_type: 'refresh_token',
    }),
  );

  if (!data.access_token) throw new Error('Google did not return an access token.');
  return data.access_token;
}

// Backward-compatible name for existing Gmail routes.
export async function refreshGmailAccessToken(refreshToken: string): Promise<string> {
  return refreshGoogleAccessToken(refreshToken);
}

export async function fetchGoogleEmail(accessToken: string): Promise<string> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const data = (await response.json()) as { email?: string; error?: { message?: string } };
  if (!response.ok || !data.email) {
    throw new Error(data.error?.message || 'Unable to read the connected Google account email.');
  }
  return data.email;
}

export function cookieOptions(maxAge = 60 * 60 * 24 * 180) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function clearGmailCookies(response: NextResponse) {
  response.cookies.set(GMAIL_REFRESH_COOKIE, '', cookieOptions(0));
  response.cookies.set(GMAIL_EMAIL_COOKIE, '', cookieOptions(0));
  response.cookies.set(GMAIL_STATE_COOKIE, '', cookieOptions(0));
  response.cookies.set(GMAIL_RETURN_COOKIE, '', cookieOptions(0));
}

export function safeReturnPath(value: string | null | undefined, fallback = '/email') {
  const path = (value || '').trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback;
  return path.slice(0, 1000);
}

export function safeHeader(value: string, maxLength: number): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
}

export function base64UrlMessage(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}
