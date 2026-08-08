import { NextRequest, NextResponse } from 'next/server';
import { smsOwnerTokenFromCookie, smsRpc } from '../../../../lib/smsRpc';

const NO_STORE = { 'Cache-Control': 'no-store' };
const HANDLERS = new Set(['Heather', 'Nova', 'Scout', 'Atlas', 'Oracle', 'Ethos', 'Ledger', 'Eva', 'Jim']);
const CONSENT = new Set(['unknown', 'inbound', 'opted_in', 'opted_out']);

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
    const contactId = clean(body?.contactId, 80);
    const assignedExecutive = clean(body?.assignedExecutive, 40);
    const consentStatus = clean(body?.consentStatus, 30);

    if (!contactId || !HANDLERS.has(assignedExecutive) || !CONSENT.has(consentStatus)) {
      return NextResponse.json({ error: 'Invalid SMS contact update.' }, { status: 400, headers: NO_STORE });
    }

    const result = await smsRpc<{ ok?: boolean; error?: string }>('sms_owner_update_contact', {
      p_owner_token: ownerToken,
      p_contact_id: contactId,
      p_display_name: clean(body?.displayName, 160),
      p_assigned_executive: assignedExecutive,
      p_consent_status: consentStatus,
      p_auto_reply: assignedExecutive === 'Jim' ? false : Boolean(body?.autoReply),
    });

    if (!result?.ok) {
      return NextResponse.json({ error: result?.error || 'Unable to update contact.' }, { status: 400, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('SMS contact update error', error);
    return NextResponse.json({ error: 'Unable to update SMS contact.' }, { status: 500, headers: NO_STORE });
  }
}
