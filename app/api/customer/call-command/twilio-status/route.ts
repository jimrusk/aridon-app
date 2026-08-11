import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerClient } from '../../../../../lib/supabase';

export const runtime = 'nodejs';

function validTwilioSignature(request: NextRequest, params: URLSearchParams) {
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const signature = request.headers.get('x-twilio-signature') || '';
  if (!token || !signature) return false;
  let data = request.url;
  const pairs = [...params.entries()].sort(([a],[b]) => a.localeCompare(b));
  for (const [key,value] of pairs) data += `${key}${value}`;
  const expected = crypto.createHmac('sha1', token).update(data).digest('base64');
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a,b);
}

export async function POST(request: NextRequest) {
  try {
    const form = new URLSearchParams(await request.text());
    if (!validTwilioSignature(request, form)) return new NextResponse('Forbidden', { status: 403 });
    const tenantId = request.nextUrl.searchParams.get('tenant') || '';
    const targetId = request.nextUrl.searchParams.get('target') || '';
    const callSid = form.get('CallSid') || '';
    const status = form.get('CallStatus') || 'unknown';
    const duration = Number(form.get('CallDuration') || 0) || null;
    if (!tenantId || !targetId || !callSid) return new NextResponse('Bad request', { status: 400 });

    const db = getServerClient();
    await db.from('customer_call_events').update({ status, duration_seconds: duration, ended_at: status === 'completed' ? new Date().toISOString() : null }).eq('tenant_id', tenantId).eq('provider_call_sid', callSid);
    const mapped = status === 'completed' ? 'completed' : status === 'busy' ? 'busy' : status === 'no-answer' ? 'no_answer' : status === 'failed' ? 'failed' : status === 'answered' ? 'answered' : 'dialing';
    await db.from('customer_call_targets').update({ call_status: mapped }).eq('tenant_id', tenantId).eq('id', targetId);
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Twilio status callback error', error);
    return new NextResponse('Error', { status: 500 });
  }
}
