import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { authenticatePhoneBridgeToken, bearerToken } from '../../../../lib/googleVoiceBridge';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
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
    const phone = clean(body?.phone, 80) || 'unknown';
    const contactName = clean(body?.contactName, 160);
    const objective = clean(body?.objective, 3000) || 'Answer as Eva, Aridon’s AI assistant. Identify what the caller needs, help when appropriate, capture a concise message and next action, and escalate consequential requests to Jim rather than making commitments.';
    const now = new Date().toISOString();

    const inserted = await db.from('customer_phone_jobs').insert({
      tenant_id: bridge.tenant_id,
      bridge_id: bridge.id,
      target_id: null,
      direction: 'inbound',
      phone,
      contact_name: contactName || null,
      company_name: 'Inbound caller',
      objective,
      state: 'connected',
      claimed_at: now,
      started_at: now,
      created_by: null,
      updated_at: now,
    }).select('*').single();
    if (inserted.error) throw inserted.error;

    await db.from('customer_phone_bridges').update({ status: 'online', last_seen_at: now, updated_at: now }).eq('id', bridge.id);

    return NextResponse.json({
      ok: true,
      job: inserted.data,
      realtime: {
        model: process.env.EVA_PHONE_REALTIME_MODEL?.trim() || 'gpt-realtime-2.1-mini',
        voice: process.env.EVA_PHONE_REALTIME_VOICE?.trim() || 'marin',
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Phone Bridge inbound start failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not start inbound Eva call.' }, { status: 500, headers: NO_STORE });
  }
}
