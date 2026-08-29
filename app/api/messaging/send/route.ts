import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { sendSentMessage, type SentChannel } from '../../../../lib/sentMessaging';

export const runtime = 'nodejs';
export const maxDuration = 30;

const NO_STORE = { 'Cache-Control': 'no-store' };
const CHANNELS = new Set<SentChannel>(['sent', 'sms', 'whatsapp', 'rcs']);

function clean(value: unknown, max: number) {
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
    const text = clean(body?.text, 1600);
    const consentConfirmed = body?.consentConfirmed === true;
    const sandbox = body?.sandbox === true;
    const to = Array.isArray(body?.to)
      ? body.to.map((value: unknown) => clean(value, 30).replace(/[\s().-]/g, '')).filter(Boolean)
      : [];
    const channels = Array.isArray(body?.channels)
      ? body.channels.filter((value: unknown): value is SentChannel => typeof value === 'string' && CHANNELS.has(value as SentChannel))
      : undefined;

    if (!slug || !text || !to.length) {
      return NextResponse.json({ error: 'Workspace, recipient and message text are required.' }, { status: 400, headers: NO_STORE });
    }
    if (!consentConfirmed) {
      return NextResponse.json({ error: 'Confirm that these recipients have consented to receive this message.' }, { status: 400, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const result = await sendSentMessage({ to, text, channels, sandbox });
    return NextResponse.json({ ok: true, provider: 'sent.dm', result }, { status: 202, headers: NO_STORE });
  } catch (error) {
    console.error('Sent messaging error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The message could not be sent.' }, { status: 500, headers: NO_STORE });
  }
}
