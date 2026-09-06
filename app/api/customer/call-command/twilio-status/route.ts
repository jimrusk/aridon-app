import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerClient } from '../../../../../lib/supabase';

export const runtime = 'nodejs';

function expectedSignature(key: string, request: NextRequest, params: URLSearchParams) {
  let data = request.url;
  const pairs = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [name, value] of pairs) data += `${name}${value}`;
  return crypto.createHmac('sha1', key).update(data).digest('base64');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function validProviderSignature(request: NextRequest, params: URLSearchParams) {
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioSignature = request.headers.get('x-twilio-signature') || '';
  if (twilioToken && twilioSignature && safeEqual(twilioSignature, expectedSignature(twilioToken, request, params))) return true;

  const signalWireKey = process.env.SIGNALWIRE_SIGNING_KEY?.trim();
  const signalWireSignature = request.headers.get('x-signalwire-signature') || request.headers.get('x-twilio-signature') || '';
  if (signalWireKey && signalWireSignature && safeEqual(signalWireSignature, expectedSignature(signalWireKey, request, params))) return true;

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const form = new URLSearchParams(await request.text());
    if (!validProviderSignature(request, form)) return new NextResponse('Forbidden', { status: 403 });
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
    console.error('Voice provider status callback error', error);
    return new NextResponse('Error', { status: 500 });
  }
}
