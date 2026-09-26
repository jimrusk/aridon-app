// Shared server-side helpers for the SafeWalk API routes.
// All database access goes through the Supabase service-role client
// (bypasses RLS; never expose this client to the browser).

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from './supabase';
import { sendSms } from './safewalk-sms';

export type Guardian = { name: string; phone: string };

export type TripRow = {
  id: string;
  user_name: string;
  guardians: Guardian[];
  guardian_token: string;
  trip_secret: string;
  status: string;
  check_in_at: string;
  last_lat: number | null;
  last_lng: number | null;
  last_loc_at: string | null;
  sos_at: string | null;
  escalated_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function errJson(e: unknown) {
  if (e instanceof ApiError) return json({ error: e.message }, e.status);
  console.error('[safewalk]', e);
  return json({ error: 'internal error' }, 500);
}

/** Service-role Supabase client. Throws ApiError(503) when not configured. */
export function getDb(): SupabaseClient {
  try {
    return getServerClient();
  } catch {
    throw new ApiError(503, 'database not configured');
  }
}

/** URL-safe random hex token. */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString('hex');
}

/** Timing-safe string comparison (returns false on length mismatch). */
export function secretsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a ?? '');
  const bb = Buffer.from(b ?? '');
  if (ba.length !== bb.length || ba.length === 0) return false;
  return timingSafeEqual(ba, bb);
}

/** Absolute guardian share URL for this deployment. */
export function shareUrlFor(request: Request, guardianToken: string): string {
  return `${new URL(request.url).origin}/safewalk/g/${guardianToken}`;
}

export async function logEvent(
  db: SupabaseClient,
  tripId: string,
  type: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await db
    .from('safewalk_events')
    .insert({ trip_id: tripId, type, detail });
  if (error) console.error('[safewalk] event log failed', error.message);
}

/** Text every guardian; returns how many sends succeeded. Never throws. */
export async function notifyGuardians(
  trip: Pick<TripRow, 'guardians'>,
  message: string,
): Promise<{ sent: number; total: number }> {
  const guardians = Array.isArray(trip.guardians) ? trip.guardians : [];
  let sent = 0;
  for (const g of guardians) {
    if (!g?.phone) continue;
    const r = await sendSms(g.phone, message);
    if (r.sent) sent += 1;
  }
  return { sent, total: guardians.length };
}

/** Load a trip row and verify its tripSecret. 404 / 403 on failure. */
export async function getTripWithSecret(
  db: SupabaseClient,
  id: string,
  secret: unknown,
): Promise<TripRow> {
  const { data, error } = await db.from('safewalk_trips').select('*').eq('id', id).maybeSingle();
  if (error) throw new ApiError(503, 'database error');
  if (!data) throw new ApiError(404, 'trip not found');
  const trip = data as TripRow;
  if (!secretsEqual(String(secret ?? ''), trip.trip_secret)) {
    throw new ApiError(403, 'invalid trip secret');
  }
  return trip;
}

export function validLat(lat: unknown): lat is number {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function validLng(lng: unknown): lng is number {
  return typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}
