import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { routeModel } from '../../../../lib/modelRouter';

export const runtime = 'nodejs';
export const maxDuration = 60;

function configured() {
  return Boolean(process.env.SLACK_SIGNING_SECRET?.trim() && process.env.SLACK_BOT_TOKEN?.trim());
}

function validSlackSignature(rawBody: string, request: NextRequest) {
  const secret = process.env.SLACK_SIGNING_SECRET?.trim() || '';
  const timestamp = request.headers.get('x-slack-request-timestamp') || '';
  const signature = request.headers.get('x-slack-signature') || '';
  if (!secret || !timestamp || !signature) return false;

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;
  const expected = `v0=${createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex')}`;
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function postSlack(channel: string, text: string, threadTs?: string) {
  const token = process.env.SLACK_BOT_TOKEN?.trim() || '';
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ channel, text: text.slice(0, 39000), ...(threadTs ? { thread_ts: threadTs } : {}) }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok || !data?.ok) throw new Error(data?.error || `Slack returned ${response.status}.`);
}

export async function GET() {
  return NextResponse.json({ channel: 'slack', configured: configured(), mode: 'optional interface adapter' }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (!configured()) return NextResponse.json({ error: 'Slack is not configured.' }, { status: 503 });
  const rawBody = await request.text();
  if (!validSlackSignature(rawBody, request)) return NextResponse.json({ error: 'Invalid Slack signature.' }, { status: 401 });

  const payload = JSON.parse(rawBody || '{}');
  if (payload?.type === 'url_verification') return NextResponse.json({ challenge: payload.challenge });
  if (payload?.type !== 'event_callback') return NextResponse.json({ ok: true });

  const event = payload?.event || {};
  if (event?.type !== 'message' || event?.bot_id || event?.subtype || typeof event?.text !== 'string' || !event?.channel) {
    return NextResponse.json({ ok: true });
  }

  try {
    const result = await routeModel(
      [{ role: 'user', content: event.text }],
      'You are Aridon responding through Slack. Give a concise, useful answer. Preserve human approval for consequential actions and never claim an action was executed unless a connected tool actually executed it.',
    );
    await postSlack(event.channel, result.text, event.thread_ts || event.ts);
    return NextResponse.json({ ok: true, routedBy: result.routing.provider });
  } catch (error) {
    console.error('Aridon Slack channel error', error);
    return NextResponse.json({ error: 'Aridon could not answer this Slack event.' }, { status: 500 });
  }
}
