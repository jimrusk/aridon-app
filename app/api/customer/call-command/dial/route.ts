import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';
import { twilioConfigured } from '../../../../../lib/outboundCalling';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 200) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function esc(value: string) { return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = clean(body?.slug, 80);
    const targetId = clean(body?.targetId, 80);
    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    if (!targetId) return NextResponse.json({ error: 'Target id is required.' }, { status: 400, headers: NO_STORE });

    const db = auth.db;
    const target = await db.from('customer_call_targets').select('*').eq('tenant_id', membership.tenant.id).eq('id', targetId).single();
    if (target.error) throw target.error;
    if (target.data.do_not_call || target.data.compliance_status !== 'allowed_human_b2b') {
      return NextResponse.json({ error: 'Ethos has not approved this target for human-assisted B2B calling.' }, { status: 409, headers: NO_STORE });
    }
    if (!twilioConfigured()) return NextResponse.json({ error: 'Twilio credentials are not configured.' }, { status: 503, headers: NO_STORE });

    const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
    const from = process.env.TWILIO_FROM_NUMBER!.trim();
    const humanBridge = process.env.TWILIO_HUMAN_BRIDGE_NUMBER?.trim();
    if (!humanBridge) return NextResponse.json({ error: 'TWILIO_HUMAN_BRIDGE_NUMBER is required for human-assisted calling.' }, { status: 503, headers: NO_STORE });

    const twiml = `<Response><Say voice="alice">Aridon Call Command. Connecting you to ${esc(target.data.company_name)}.</Say><Dial callerId="${esc(from)}"><Number>${esc(target.data.phone)}</Number></Dial></Response>`;
    const params = new URLSearchParams({ To: humanBridge, From: from, Twiml: twiml, StatusCallbackEvent: 'initiated ringing answered completed', StatusCallbackMethod: 'POST' });
    const callbackBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (callbackBase) params.set('StatusCallback', `${callbackBase.replace(/\/$/,'')}/api/customer/call-command/twilio-status?tenant=${encodeURIComponent(membership.tenant.id)}&target=${encodeURIComponent(targetId)}`);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Calls.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      cache: 'no-store',
    });
    const call = await response.json() as { sid?: string; status?: string; message?: string };
    if (!response.ok || !call.sid) throw new Error(call.message || `Twilio returned ${response.status}.`);

    await db.from('customer_call_targets').update({ call_status: 'dialing', last_call_at: new Date().toISOString() }).eq('tenant_id', membership.tenant.id).eq('id', targetId);
    const event = await db.from('customer_call_events').insert({ tenant_id: membership.tenant.id, campaign_id: target.data.campaign_id, target_id: targetId, provider: 'twilio', provider_call_sid: call.sid, mode: 'human_assisted', status: call.status || 'initiated', started_at: new Date().toISOString() }).select().single();
    if (event.error) console.error('Call event insert error', event.error);

    return NextResponse.json({ ok: true, callSid: call.sid, status: call.status || 'initiated', message: 'Aridon is calling the human bridge first, then connecting the approved prospect.' }, { headers: NO_STORE });
  } catch (error) {
    console.error('Call dial error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start the call.' }, { status: 500, headers: NO_STORE });
  }
}
