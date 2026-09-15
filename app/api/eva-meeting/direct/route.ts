import { NextRequest } from 'next/server';
import { authenticatedCustomer } from '../../../../lib/customerAuth';
import { createEvaMeetingBridgeToken } from '../../../../lib/evaMeetingBridge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

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

function cleanMeetingUrl(value: unknown) {
  if (typeof value !== 'string' || value.length > 2_000) return '';
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return '';
    const host = url.hostname.toLowerCase();
    const supported =
      host === 'meet.google.com' ||
      host === 'teams.microsoft.com' ||
      host === 'teams.live.com' ||
      host === 'zoom.us' ||
      host.endsWith('.zoom.us') ||
      host === 'webex.com' ||
      host.endsWith('.webex.com');
    return supported ? url.toString() : '';
  } catch {
    return '';
  }
}

function recallBaseUrl() {
  const allowed = new Set(['us-east-1', 'us-west-2', 'eu-central-1', 'ap-northeast-1']);
  const requested = (process.env.RECALL_REGION || 'us-east-1').trim();
  const region = allowed.has(requested) ? requested : 'us-east-1';
  return `https://${region}.recall.ai`;
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Unexpected request origin.' }, { status: 403, headers: NO_STORE });
    }

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return Response.json({ error: 'Please send a valid JSON request.' }, { status: 415, headers: NO_STORE });
    }

    const auth = await authenticatedCustomer(request);
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    }

    const body = await request.json().catch(() => null) as {
      meetingUrl?: unknown;
      title?: unknown;
      goal?: unknown;
      joinAt?: unknown;
    } | null;

    const meetingUrl = cleanMeetingUrl(body?.meetingUrl);
    if (!meetingUrl) {
      return Response.json(
        { error: 'Paste a valid Zoom, Google Meet, Microsoft Teams, or Webex meeting link.' },
        { status: 400, headers: NO_STORE },
      );
    }

    const recallApiKey = process.env.RECALL_API_KEY?.trim();
    if (!recallApiKey) {
      return Response.json(
        {
          error: 'Eva Direct Meeting Mode is built but the meeting-bot bridge is not connected yet.',
          code: 'RECALL_NOT_CONFIGURED',
        },
        { status: 503, headers: NO_STORE },
      );
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return Response.json(
        { error: 'Eva Live voice is not configured yet.', code: 'OPENAI_NOT_CONFIGURED' },
        { status: 503, headers: NO_STORE },
      );
    }

    const token = createEvaMeetingBridgeToken({
      userId: auth.user.id,
      title: body?.title,
      goal: body?.goal,
    });

    const appOrigin = request.nextUrl.origin;
    const bridgeUrl = `${appOrigin}/eva-meeting-bridge?token=${encodeURIComponent(token)}`;

    const payload: Record<string, unknown> = {
      meeting_url: meetingUrl,
      bot_name: 'Eva | Aridon AI',
      output_media: {
        camera: {
          kind: 'webpage',
          config: { url: bridgeUrl },
        },
      },
      variant: {
        zoom: 'web_4_core',
        google_meet: 'web_4_core',
        microsoft_teams: 'web_4_core',
        webex: 'web_4_core',
      },
    };

    if (typeof body?.joinAt === 'string' && body.joinAt.trim()) {
      const when = new Date(body.joinAt);
      if (!Number.isNaN(when.getTime()) && when.getTime() > Date.now() + 60_000) {
        payload.join_at = when.toISOString();
      }
    }

    const recallResponse = await fetch(`${recallBaseUrl()}/api/v1/bot/`, {
      method: 'POST',
      headers: {
        Authorization: recallApiKey,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const raw = await recallResponse.text();
    let result: Record<string, any> = {};
    try { result = JSON.parse(raw); } catch {}

    if (!recallResponse.ok) {
      console.error('Eva Recall bot create failed', recallResponse.status, raw.slice(0, 800));
      return Response.json(
        {
          error: result?.detail || result?.error || 'Eva could not join that meeting yet.',
          code: 'RECALL_CREATE_FAILED',
        },
        { status: recallResponse.status || 502, headers: NO_STORE },
      );
    }

    return Response.json(
      {
        ok: true,
        botId: result?.id || null,
        status: result?.status || 'joining',
        meetingUrl,
        botName: 'Eva | Aridon AI',
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    console.error('Eva direct meeting route error', error);
    return Response.json(
      { error: 'Eva Direct Meeting Mode is temporarily unavailable.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
