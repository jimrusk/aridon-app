import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { verifyEvaMeetingBridgeToken } from '../../../../lib/evaMeetingBridge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const MAX_SDP_BYTES = 65_536;

function normalizeSdp(value: unknown) {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/\r?\n/g, '\r\n');
  return normalized.endsWith('\r\n') ? normalized : `${normalized}\r\n`;
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return Response.json({ error: 'Please send a valid JSON request.' }, { status: 415, headers: NO_STORE });
    }

    const authorization = request.headers.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    const claims = token ? verifyEvaMeetingBridgeToken(token) : null;
    if (!claims) {
      return Response.json({ error: 'Eva meeting bridge authorization expired.' }, { status: 401, headers: NO_STORE });
    }

    const body = await request.json().catch(() => null) as { sdp?: unknown } | null;
    const sdp = normalizeSdp(body?.sdp);
    if (
      !sdp ||
      !sdp.startsWith('v=0\r\n') ||
      !sdp.includes('\r\nm=audio ') ||
      Buffer.byteLength(sdp, 'utf8') > MAX_SDP_BYTES
    ) {
      return Response.json({ error: 'A valid SDP offer is required.' }, { status: 400, headers: NO_STORE });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return Response.json({ error: 'Eva Live voice is not configured.' }, { status: 503, headers: NO_STORE });
    }

    const session = {
      model: 'gpt-live-1',
      instructions:
        `You are Eva, Aridon's AI Command Advisor and Chief of Staff, participating live in a business meeting. ` +
        `Meeting title: ${claims.title}. Meeting objective: ${claims.goal}. ` +
        `You are an AI participant, never pretend to be human, and identify yourself as Eva from Aridon the first time you speak. ` +
        `Your default posture in a meeting is attentive silence. Do not interrupt normal human conversation. ` +
        `Speak when someone clearly addresses Eva by name, asks the AI or Aridon a question directed to you, or Jim explicitly asks you to explain, summarize, calculate, research, challenge, or answer. ` +
        `When you speak, be warm, natural, decisive, and concise. Answer the question first, then add only what materially helps the meeting. ` +
        `If you are unsure whether a remark was directed to you, stay silent rather than jumping in. ` +
        `Never invent test results, prices, approvals, customers, partnerships, commitments, emails sent, meetings scheduled, or other external actions. ` +
        `If current facts or deeper reasoning are needed, delegate immediately to the backend and then speak the result naturally. ` +
        `When Jim asks for a meeting recap, give decisions, commitments actually made, open questions, owners, and the next three actions.`,
      delegation: {
        type: 'responses',
        responses: {
          model: process.env.OPENAI_EVA_BACKEND_MODEL?.trim() || 'gpt-5.6-terra',
          instructions:
            `You are the reasoning and research backend for Eva inside a live Aridon business meeting. ` +
            `Return concise, decision-ready facts and recommendations Eva can speak aloud. ` +
            `Use web search whenever current information is needed. Distinguish verified facts from inference. ` +
            `Do not claim any external action happened unless a tool result explicitly confirms it. ` +
            `The meeting is titled "${claims.title}" and its objective is "${claims.goal}".`,
          tools: [{ type: 'web_search' }],
          tool_choice: 'auto',
        },
      },
    };

    const safetyIdentifier = createHash('sha256')
      .update(`aridon-eva-meeting:${claims.sub}:${claims.jti}`)
      .digest('hex');

    const openAIResponse = await fetch('https://api.openai.com/v1/live/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': safetyIdentifier,
      },
      body: JSON.stringify({ session, transport: { type: 'webrtc', sdp } }),
      cache: 'no-store',
    });

    const responseText = await openAIResponse.text();
    if (!openAIResponse.ok) {
      console.error('Eva meeting GPT-Live session creation failed', openAIResponse.status, responseText.slice(0, 600));
      return Response.json(
        { error: 'Eva could not start her live meeting voice.' },
        { status: openAIResponse.status || 502, headers: NO_STORE },
      );
    }

    return new Response(responseText, {
      status: 201,
      headers: { ...NO_STORE, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Eva meeting bridge session error', error);
    return Response.json(
      { error: 'Eva meeting voice is temporarily unavailable.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
