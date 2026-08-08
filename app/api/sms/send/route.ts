import { NextRequest, NextResponse } from 'next/server';
import { smsOwnerTokenFromCookie, smsRpc } from '../../../../lib/smsRpc';

const NO_STORE = { 'Cache-Control': 'no-store' };
const EXECUTIVES = new Set(['Heather', 'Nova', 'Scout', 'Atlas', 'Oracle', 'Ethos', 'Ledger', 'Eva']);

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  const ownerToken = smsOwnerTokenFromCookie(req.cookies.get('aridon_sms_owner')?.value);
  if (!ownerToken) {
    return NextResponse.json({ error: 'SMS owner session is not paired.' }, { status: 401, headers: NO_STORE });
  }

  try {
    const body = await req.json();
    const phone = clean(body?.phone, 40);
    const message = clean(body?.message, 1450);
    const executive = clean(body?.executive, 40);

    if (!/^\+[1-9][0-9]{7,14}$/.test(phone) || !message || !EXECUTIVES.has(executive)) {
      return NextResponse.json({ error: 'Phone, message, or executive is invalid.' }, { status: 400, headers: NO_STORE });
    }

    const result = await smsRpc<{ ok?: boolean; error?: string }>('sms_owner_send', {
      p_owner_token: ownerToken,
      p_phone_e164: phone,
      p_body: message,
      p_executive: executive,
      p_confirm_consent: Boolean(body?.confirmConsent),
    });

    if (!result?.ok) {
      return NextResponse.json({ error: result?.error || 'SMS was not sent.' }, { status: 400, headers: NO_STORE });
    }

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('SMS send error', error);
    return NextResponse.json({ error: 'Unable to send SMS.' }, { status: 500, headers: NO_STORE });
  }
}
