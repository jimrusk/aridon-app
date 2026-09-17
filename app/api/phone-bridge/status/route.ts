import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { authenticatePhoneBridgeToken, bearerToken, type PhoneJobState } from '../../../../lib/googleVoiceBridge';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const ALLOWED = new Set<PhoneJobState>(['claimed','dialing','ringing','connected','completed','failed','cancelled']);

function clean(value: unknown, max = 20000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function targetStatus(state: PhoneJobState) {
  if (state === 'connected') return 'answered';
  if (state === 'completed') return 'completed';
  if (state === 'failed') return 'failed';
  if (state === 'cancelled') return 'cancelled';
  return 'dialing';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const db = getServerClient();
    const token = bearerToken(request.headers.get('authorization'));
    const bridge = await authenticatePhoneBridgeToken(token, db);
    if (!bridge) return NextResponse.json({ error: 'Unauthorized bridge.' }, { status: 401, headers: NO_STORE });

    const body = await request.json();
    const jobId = clean(body?.jobId, 80);
    const state = clean(body?.state, 40) as PhoneJobState;
    if (!jobId || !ALLOWED.has(state)) return NextResponse.json({ error: 'Valid job id and state are required.' }, { status: 400, headers: NO_STORE });

    const existing = await db.from('customer_phone_jobs').select('*').eq('id', jobId).eq('tenant_id', bridge.tenant_id).eq('bridge_id', bridge.id).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) return NextResponse.json({ error: 'Job not found for this bridge.' }, { status: 404, headers: NO_STORE });

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      state,
      updated_at: now,
    };
    if (state === 'dialing' || state === 'ringing') patch.started_at = existing.data.started_at || now;
    if (state === 'completed' || state === 'failed' || state === 'cancelled') patch.ended_at = now;

    const error = clean(body?.error, 2000);
    const transcript = clean(body?.transcript, 50000);
    const summary = clean(body?.summary, 5000);
    if (error) patch.error = error;
    if (transcript) patch.transcript = transcript;
    if (summary) patch.summary = summary;

    const updated = await db.from('customer_phone_jobs').update(patch).eq('id', jobId).eq('tenant_id', bridge.tenant_id).select('*').single();
    if (updated.error) throw updated.error;

    await db.from('customer_phone_bridges').update({ status: 'online', last_seen_at: now, updated_at: now }).eq('id', bridge.id);

    if (existing.data.target_id) {
      const targetPatch: Record<string, unknown> = { call_status: targetStatus(state) };
      if (state === 'dialing' || state === 'ringing' || state === 'connected') targetPatch.last_call_at = now;
      await db.from('customer_call_targets').update(targetPatch).eq('tenant_id', bridge.tenant_id).eq('id', existing.data.target_id);
    }

    const eventPatch: Record<string, unknown> = { status: state };
    if (state === 'completed' || state === 'failed' || state === 'cancelled') eventPatch.ended_at = now;
    if (summary) eventPatch.summary = summary;
    await db.from('customer_call_events').update(eventPatch)
      .eq('tenant_id', bridge.tenant_id)
      .eq('provider', 'google_voice_bridge')
      .eq('provider_call_sid', jobId);

    return NextResponse.json({ ok: true, job: updated.data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Phone Bridge status failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update Phone Bridge job.' }, { status: 500, headers: NO_STORE });
  }
}
