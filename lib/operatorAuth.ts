import type { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function basicCredential(username: string | undefined, password: string | undefined) {
  if (!username || !password) return null;
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

export function operatorRequestAuthorized(request: NextRequest) {
  const provided = request.headers.get('authorization') || '';
  const credentials = [
    basicCredential(process.env.ARIDON_APP_USERNAME || process.env.ARIDON_USERNAME, process.env.ARIDON_APP_PASSWORD || process.env.ARIDON_PASSWORD),
    basicCredential(process.env.ARIDON_APP_SECONDARY_USERNAME, process.env.ARIDON_APP_SECONDARY_PASSWORD),
  ].filter(Boolean) as string[];
  return credentials.some((credential) => safeEqual(provided, credential));
}

export function cronRequestAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return safeEqual(request.headers.get('authorization') || '', `Bearer ${secret}`);
}
