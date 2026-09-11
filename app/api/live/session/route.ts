import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { authenticatedCustomer } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const MAX_SDP_BYTES = 65_536;
const LIVE_SESSION_LIMIT = 4;
const LIVE_SESSION_WINDOW_MS = 60_000;

const recentSessions = new Map<string, number[]>();

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

function rateLimited(userId: string) {
  const now = Date.now();
  const cutoff = now - LIVE_SESSION_WINDOW_MS;
  const current = (recentSessions.get(userId) || []).filter((timestamp) => timestamp > cutoff);
  if (current.length >= LIVE_SESSION_LIMIT) {
    recentSessions.set(userId, current);
    return true;
  }
  current.push(now);
  recentSessions.set(userId, current);
  return false;
}

function cleanFirstName(value: unknown) {
  if (typeof value !== 'string') return '';
  const first = value.trim().split(/\s+/)[0] || '';
  return first.replace(/[^\p{L}\p{M}'-]/gu, '').slice(0, 40);
}

function normalizeSdp(value: unknown) {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/\r?\n/g, '\r\n');
  return normalized.endsWith('\r\n') ? normalized : `${normalized}\r\n`;
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Unexpected request origin.' }, { status: 403, headers: NO_STORE_HEADERS });
    }

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return Response.json({ error: 'Please send a valid JSON request.' }, { status: 415, headers: NO_STORE_HEADERS });
    }

    const auth = await authenticatedCustomer(request);
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status, headers: NO_STORE_HEADERS });
    }

    if (rateLimited(auth.user.id)) {
      return Response.json(
        { error: 'Too many new Live sessions. Wait a moment and try again.' },
        { status: 429, headers: NO_STORE_HEADERS },
      );
    }

    const body = await request.json().catch(() => null) as { sdp?: unknown } | null;
    const sdp = normalizeSdp(body?.sdp);
    if (
      !sdp ||
      !sdp.startsWith('v=0\r\n') ||
      !sdp.includes('\r\nm=audio ') ||
      Buffer.byteLength(sdp, 'utf8') > MAX_SDP_BYTES
    ) {
      return Response.json({ error: 'A valid SDP offer is required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return Response.json({ error: 'Eva Live is not configured yet.' }, { status: 503, headers: NO_STORE_HEADERS });
    }

    const metadata = auth.user.user_metadata || {};
    const firstName = cleanFirstName(metadata.full_name || metadata.name || metadata.first_name);
    const greetingInstruction = firstName
      ? ` The signed-in user's first name is ${firstName}. Greet ${firstName} by name once at the beginning of the conversation.`
      : ' Give the signed-in user one brief, warm greeting when the conversation begins.';

    const session = {
      model: 'gpt-live-1',
      instructions:
        `You are Eva, Aridon's AI Command Advisor and Chief of Staff. Speak warmly, naturally, and concisely. ` +
        `Keep the conversation flowing and allow interruptions. When a request needs current facts, detailed reasoning, or web research, delegate it to the backend. ` +
        `Never claim that an email, call, purchase, calendar change, CRM update, deployment, or other external action happened unless the backend explicitly confirms it. ` +
        `If an unavailable action is requested, say what you can do now and what still needs to be connected.${greetingInstruction}`,
      delegation: {
        type: 'responses',
        responses: {
          model: process.env.OPENAI_EVA_BACKEND_MODEL?.trim() || 'gpt-5.6-terra',
          instructions:
            `You are the reasoning and research backend for Eva inside Aridon, an AI Executive Operating System. ` +
            `Support concise spoken answers about business operations, strategy, technology, agriculture, water, energy, infrastructure, and general questions. ` +
            `Use web search whenever current information is needed. Clearly distinguish verified facts from inference. ` +
            `Do not claim an external Aridon action was executed unless a tool result explicitly confirms it. Return results in a form Eva can speak naturally.`,
          tools: [{ type: 'web_search' }],
          tool_choice: 'auto',
        },
      },
    };

    const safetyIdentifier = createHash('sha256').update(`aridon-live:${auth.user.id}`).digest('hex');
    const openAIResponse = await fetch('https://api.openai.com/v1/live/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': safetyIdentifier,
      },
      body: JSON.stringify({
        session,
        transport: { type: 'webrtc', sdp },
      }),
      cache: 'no-store',
    });

    const responseText = await openAIResponse.text();
    if (!openAIResponse.ok) {
      console.error('Eva GPT-Live session creation failed', openAIResponse.status, responseText.slice(0, 600));
      return Response.json(
        { error: 'Eva Live could not start. Please try again.' },
        { status: openAIResponse.status || 502, headers: NO_STORE_HEADERS },
      );
    }

    return new Response(responseText, {
      status: 201,
      headers: {
        ...NO_STORE_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Eva GPT-Live route error', error);
    return Response.json(
      { error: 'Eva Live is temporarily unavailable.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
