import { NextResponse } from 'next/server';
import { smsRpc } from '../../../../lib/smsRpc';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const data = await smsRpc('sms_gateway_status');
    return NextResponse.json(data ?? { configured: false }, { headers: NO_STORE });
  } catch (error) {
    console.error('SMS status error', error);
    return NextResponse.json({ configured: false, error: 'Unable to read SMS gateway status.' }, { status: 500, headers: NO_STORE });
  }
}
