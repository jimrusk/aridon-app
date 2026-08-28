import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { executiveByName, publicOrigin, signPhoneToken } from '../../../../lib/executivePhone';

export const runtime = 'nodejs';
export const maxDuration = 30;

const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 100) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const slug = clean(body?.slug, 80);
    const phoneNumber = clean(body?.phoneNumber, 30).replace(/[\s().-]/g, '');
    const requestedExecutive = clean(body?.executive, 80) || 'Eva';
    if (!slug || !/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      return NextResponse.json({ error: 'Enter a valid phone number including country code, for example +15055551212.' }, { status: 400, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim();
    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'Aridon phone calling is built but the telephony account is not connected yet.' }, { status: 503, headers: NO_STORE });
    }

    const executive = executiveByName(requestedExecutive === 'Auto' ? 'Eva' : requestedExecutive);
    const token = signPhoneToken({
      tenantId: membership.tenant.id,
      userId: auth.user.id,
      slug,
      executive: executive.name,
      exp: Date.now() + 60 * 60 * 1000,
    });
    const origin = publicOrigin(request.nextUrl.origin);
    const voiceUrl = `${origin}/api/executive-call/voice?token=${encodeURIComponent(token)}`;

    const params = new URLSearchParams({ To: phoneNumber, From: fromNumber, Url: voiceUrl, Method: 'POST' });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({})) as { sid?: string; status?: string; message?: string };
    if (!response.ok || !data.sid) throw new Error(data.message || `Telephony provider returned ${response.status}.`);

    return NextResponse.json({ ok: true, callSid: data.sid, status: data.status || 'queued', executive: executive.name }, { headers: NO_STORE });
  } catch (error) {
    console.error('Executive call initiation error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The call could not be started.' }, { status: 500, headers: NO_STORE });
  }
}
