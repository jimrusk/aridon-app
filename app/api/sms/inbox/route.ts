import { NextRequest, NextResponse } from 'next/server';
import { smsOwnerTokenFromCookie, smsRpc } from '../../../../lib/smsRpc';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const ownerToken = smsOwnerTokenFromCookie(req.cookies.get('aridon_sms_owner')?.value);
  if (!ownerToken) {
    return NextResponse.json({ error: 'SMS owner session is not paired.' }, { status: 401, headers: NO_STORE });
  }

  try {
    const data = await smsRpc('sms_owner_snapshot', { p_owner_token: ownerToken });
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (error) {
    console.error('SMS inbox error', error);
    return NextResponse.json({ error: 'Unable to load SMS inbox.' }, { status: 401, headers: NO_STORE });
  }
}
