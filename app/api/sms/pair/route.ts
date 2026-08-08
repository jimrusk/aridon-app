import { NextRequest, NextResponse } from 'next/server';
import { smsRpc } from '../../../../lib/smsRpc';

const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await req.json();
    const code = clean(body?.code, 32);
    const apiKey = clean(body?.apiKey, 500);
    const deviceId = clean(body?.deviceId, 200);
    const webhookSecret = clean(body?.webhookSecret, 500);

    if (!code || !apiKey || !deviceId || !webhookSecret) {
      return NextResponse.json({ error: 'Pairing code, API key, Device ID, and webhook secret are required.' }, { status: 400, headers: NO_STORE });
    }

    const result = await smsRpc<{ ok?: boolean; error?: string; owner_token?: string }>('sms_pair_gateway', {
      p_code: code,
      p_api_key: apiKey,
      p_device_id: deviceId,
      p_webhook_secret: webhookSecret,
    });

    if (!result?.ok || !result.owner_token) {
      return NextResponse.json({ error: result?.error || 'Pairing failed.' }, { status: 400, headers: NO_STORE });
    }

    const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
    response.cookies.set('aridon_sms_owner', result.owner_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    console.error('SMS pairing error', error);
    return NextResponse.json({ error: 'Unable to pair the SMS gateway.' }, { status: 500, headers: NO_STORE });
  }
}
