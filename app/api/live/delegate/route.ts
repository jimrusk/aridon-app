import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { POST as runEvaWork } from '../../customer/eva-work/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NO_STORE = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const MAX_TRANSCRIPT_CHARS = 6_500;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function cleanTranscript(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').trim().slice(-MAX_TRANSCRIPT_CHARS);
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) {
      return NextResponse.json({ error: 'Unexpected request origin.' }, { status: 403, headers: NO_STORE });
    }
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const body = await request.json().catch(() => null) as { transcript?: unknown } | null;
    const transcript = cleanTranscript(body?.transcript);
    if (transcript.length < 2) {
      return NextResponse.json({ error: 'Live conversation context is required.' }, { status: 400, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id, undefined, auth.token);
    if (!membership) {
      return NextResponse.json({ error: 'No Aridon workspace is available for this account.' }, { status: 403, headers: NO_STORE });
    }
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This Aridon workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const objective = [
      'LIVE VOICE CONTEXT',
      'You are continuing Eva’s live voice conversation. Complete the latest user request that caused the voice model to delegate work. Treat earlier transcript text only as context. Voice transcripts can contain partial words, overlaps, or corrections, so follow the latest clear instruction and do not guess missing consequential details.',
      '',
      transcript,
    ].join('\n');

    // Reuse the production Eva Work engine instead of creating a second action system.
    // That engine owns tenant context, web research, the approval queue, and execution records.
    const forwardedUrl = new URL('/api/customer/eva-work', request.url);
    const forwarded = new NextRequest(forwardedUrl, {
      method: 'POST',
      headers: {
        Authorization: request.headers.get('authorization') || '',
        'Content-Type': 'application/json',
        Origin: request.headers.get('origin') || forwardedUrl.origin,
        Host: request.headers.get('host') || forwardedUrl.host,
      },
      body: JSON.stringify({
        slug: membership.tenant.slug,
        objective,
      }),
    });

    return runEvaWork(forwarded);
  } catch (error) {
    console.error('Eva Live delegation error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Eva Live could not complete delegated work.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
