import { NextRequest, NextResponse } from 'next/server';
import { smsRpc } from '../../../../lib/smsRpc';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = typeof body?.code === 'string' ? body.code.trim().slice(0, 32) : '';
    if (!code) {
      return NextResponse.json({ error: 'Pairing code is required.' }, { status: 400, headers: NO_STORE });
    }

    const result = await smsRpc<{ ok?: boolean; error?: string; owner_token?: string }>('sms_pair_browser', { p_code: code });
    if (!result?.ok || !result.owner_token) {
      return NextResponse.json({ error: result?.error || 'Browser pairing failed.' }, { status: 400, headers: NO_STORE });
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
    console.error('SMS browser pairing error', error);
    return NextResponse.json({ error: 'Unable to pair this browser.' }, { status: 500, headers: NO_STORE });
  }
}
