import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

const STRIPE_API = 'https://api.stripe.com/v1';

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function stripeConfiguration() {
  const missing = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_LAUNCH',
    'STRIPE_PRICE_GROWTH',
    'STRIPE_PRICE_COMMAND',
  ].filter((name) => !process.env[name]?.trim());
  return { configured: missing.length === 0, missing };
}

export function appBaseUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin).replace(/\/$/, '');
}

export function priceIdForPlan(plan: string) {
  const normalized = ['launch', 'growth', 'command'].includes(plan) ? plan : 'launch';
  const key = `STRIPE_PRICE_${normalized.toUpperCase()}`;
  return required(key);
}

export async function stripeRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; params?: URLSearchParams } = {},
): Promise<T> {
  const method = options.method || 'GET';
  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${required('STRIPE_SECRET_KEY')}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: method === 'POST' ? options.params?.toString() : undefined,
    cache: 'no-store',
  });

  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message || `Stripe request failed with ${response.status}.`);
  }
  return data;
}

export function stripeObjectId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id;
  }
  return '';
}

export function verifyStripeWebhook(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) return false;
  const secret = required('STRIPE_WEBHOOK_SECRET');
  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) || '';
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  return signatures.some((signature) => {
    const candidate = Buffer.from(signature, 'utf8');
    return candidate.length === expectedBuffer.length && timingSafeEqual(candidate, expectedBuffer);
  });
}

export type StripeCheckoutSession = {
  id: string;
  status?: string;
  mode?: string;
  payment_status?: string;
  customer?: unknown;
  subscription?: unknown;
  customer_email?: string | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  metadata?: Record<string, string> | null;
  url?: string | null;
};

export type StripeSubscription = {
  id: string;
  customer?: unknown;
  status?: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string> | null;
};

export type StripePrice = {
  id: string;
  active?: boolean;
  currency?: string;
  unit_amount?: number | null;
  recurring?: { interval?: string; interval_count?: number } | null;
  product?: unknown;
};
