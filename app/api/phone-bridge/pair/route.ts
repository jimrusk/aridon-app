import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { phoneBridgeHash, phoneBridgeToken, safeHashEqual, type PhoneBridgeRecord } from '../../../../lib/googleVoiceBridge';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json();
    const bridgeId = clean(body?.bridgeId, 80);
    const code = clean(body?.pairingCode ?? body?.code, 20);
    if (!bridgeId || !code) return NextResponse.json({ error: 'Bridge id and pairing code are required.' }, { status: 400, headers: NO_STORE });

    const db = getServerClient();
    const found = await db.from('customer_phone_bridges').select('*').eq('id', bridgeId).maybeSingle();
    if (found.error) throw found.error;
    const bridge = found.data as PhoneBridgeRecord | null;
    if (!bridge || bridge.status === 'revoked') return NextResponse.json({ error: 'Pairing request not found.' }, { status: 404, headers: NO_STORE });
    if (!bridge.pairing_code_hash || !bridge.pairing_expires_at || Date.parse(bridge.pairing_expires_at) < Date.now()) {
      return NextResponse.json({ error: 'This pairing code expired. Create a fresh one in Aridon.' }, { status: 410, headers: NO_STORE });
    }

    const suppliedHash = phoneBridgeHash(code);
    if (!safeHashEqual(suppliedHash, bridge.pairing_code_hash)) {
      return NextResponse.json({ error: 'Pairing code did not match.' }, { status: 401, headers: NO_STORE });
    }

    const token = phoneBridgeToken();
    const now = new Date().toISOString();
    const existingMetadata = bridge.metadata && typeof bridge.metadata === 'object' ? bridge.metadata : {};
    const metadata = {
      ...existingMetadata,
      deviceName: clean(body?.deviceName, 120) || 'Eva Phone Bridge',
      platform: clean(body?.platform, 80) || 'unknown',
      googleVoiceNumber: clean(body?.googleVoiceNumber, 40),
      version: clean(body?.version, 40) || '1.0.0',
    };

    const updated = await db.from('customer_phone_bridges').update({
      status: 'online',
      auth_token_hash: phoneBridgeHash(token),
      pairing_code_hash: null,
      pairing_expires_at: null,
      last_seen_at: now,
      metadata,
      updated_at: now,
    }).eq('id', bridge.id).select('id,tenant_id,name,status,last_seen_at,metadata').single();
    if (updated.error) throw updated.error;

    return NextResponse.json({
      ok: true,
      bridge: updated.data,
      bridgeId: updated.data.id,
      token,
      pollSeconds: 3,
      message: 'Eva Phone Bridge paired. Store this token locally; Aridon stores only its hash.',
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Phone Bridge pairing failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not pair Eva Phone Bridge.' }, { status: 500, headers: NO_STORE });
  }
}
