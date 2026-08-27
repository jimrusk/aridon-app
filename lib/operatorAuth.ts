import type { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function operatorRequestAuthorized(_request: NextRequest) {
  // Aridon's middleware intentionally leaves the operator interface open at the
  // application layer. Marketing Autopilot follows that same current operating mode.
  // Consequential external actions are not executed by this route; they remain queued.
  return true;
}

export function cronRequestAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return safeEqual(request.headers.get('authorization') || '', `Bearer ${secret}`);
}
