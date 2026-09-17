import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { authenticatePhoneBridgeToken, bearerToken, type PhoneJobRecord } from '../../../../lib/googleVoiceBridge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const db = getServerClient();
    const token = bearerToken(request.headers.get('authorization'));
    const bridge = await authenticatePhoneBridgeToken(token, db);
    if (!bridge) return NextResponse.json({ error: 'Unauthorized bridge.' }, { status: 401, headers: NO_STORE });

    const now = new Date().toISOString();
    await db.from('customer_phone_bridges').update({ status: 'online', last_seen_at: now, updated_at: now }).eq('id', bridge.id);

    const queued = await db
      .from('customer_phone_jobs')
      .select('*')
      .eq('tenant_id', bridge.tenant_id)
      .eq('bridge_id', bridge.id)
      .eq('state', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (queued.error) throw queued.error;
    if (!queued.data) return NextResponse.json({ ok: true, job: null, heartbeatAt: now }, { headers: NO_STORE });

    const candidate = queued.data as PhoneJobRecord;
    const claimed = await db
      .from('customer_phone_jobs')
      .update({ state: 'claimed', claimed_at: now, updated_at: now })
      .eq('id', candidate.id)
      .eq('tenant_id', bridge.tenant_id)
      .eq('bridge_id', bridge.id)
      .eq('state', 'queued')
      .select('*')
      .maybeSingle();
    if (claimed.error) throw claimed.error;
    if (!claimed.data) return NextResponse.json({ ok: true, job: null, heartbeatAt: now }, { headers: NO_STORE });

    return NextResponse.json({
      ok: true,
      job: claimed.data,
      realtime: {
        model: process.env.EVA_PHONE_REALTIME_MODEL?.trim() || 'gpt-realtime-2.1-mini',
        voice: process.env.EVA_PHONE_REALTIME_VOICE?.trim() || 'marin',
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Phone Bridge poll failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Phone Bridge poll failed.' }, { status: 500, headers: NO_STORE });
  }
}
