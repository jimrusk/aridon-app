import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { authenticatePhoneBridgeToken, bearerToken } from '../../../../lib/googleVoiceBridge';

export const runtime = 'nodejs';
export const maxDuration = 30;
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 20000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function buildInstructions(input: {
  direction: string;
  contactName: string;
  companyName: string;
  objective: string;
}) {
  const contact = input.contactName || input.companyName || (input.direction === 'inbound' ? 'the caller' : 'the recipient');
  const outbound = input.direction !== 'inbound';
  const disclosure = outbound
    ? `You are placing an outbound call to ${contact}.`
    : 'You are answering an incoming call to Aridon.';

  return [
    'You are Eva, Aridon’s AI voice assistant.',
    disclosure,
    outbound
      ? 'Do not speak until you hear intelligible human speech from the other person. Ignore ringing, ringback, call-progress tones, music, voicemail beeps, and silence. When a person speaks, begin with the required AI disclosure and a concise greeting.'
      : 'Wait for the caller to speak, then begin with the required AI disclosure and a concise greeting.',
    'At the start of the conversation, clearly say you are Eva, an AI assistant for Aridon. Never imply that you are a human.',
    'Speak naturally, warmly, and concisely. Use short phone-friendly turns and allow the other person to interrupt.',
    `Call objective: ${input.objective}`,
    'Do not make binding legal, contractual, pricing, payment, financing, or other consequential commitments. Offer to have Jim or the appropriate Aridon team member follow up when needed.',
    'If the person asks not to be called again or asks you to stop, acknowledge it immediately, end the sales portion of the conversation, and politely end the call.',
    'If you do not know something, say so instead of inventing an answer.',
    'Do not request passwords, payment-card numbers, government IDs, medical details, or other highly sensitive data.',
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const db = getServerClient();
    const token = bearerToken(request.headers.get('authorization'));
    const bridge = await authenticatePhoneBridgeToken(token, db);
    if (!bridge) return NextResponse.json({ error: 'Unauthorized bridge.' }, { status: 401, headers: NO_STORE });

    const body = await request.json();
    const jobId = clean(body?.jobId, 80);
    if (!jobId) return NextResponse.json({ error: 'Job id is required.' }, { status: 400, headers: NO_STORE });

    const jobResult = await db
      .from('customer_phone_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('tenant_id', bridge.tenant_id)
      .eq('bridge_id', bridge.id)
      .maybeSingle();
    if (jobResult.error) throw jobResult.error;
    if (!jobResult.data) return NextResponse.json({ error: 'Job not found for this bridge.' }, { status: 404, headers: NO_STORE });

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Eva realtime voice is not configured on Aridon.' }, { status: 503, headers: NO_STORE });

    const model = process.env.EVA_PHONE_REALTIME_MODEL?.trim() || 'gpt-realtime-2.1-mini';
    const voice = process.env.EVA_PHONE_REALTIME_VOICE?.trim() || 'marin';
    const session = {
      type: 'realtime',
      model,
      output_modalities: ['audio'],
      instructions: buildInstructions({
        direction: String(jobResult.data.direction || 'outbound'),
        contactName: clean(jobResult.data.contact_name, 160),
        companyName: clean(jobResult.data.company_name, 160),
        objective: clean(jobResult.data.objective, 4000) || 'Handle the call helpfully and route anything consequential to a human.',
      }),
      audio: {
        input: {
          format: { type: 'audio/pcm', rate: 24000 },
          transcription: { model: 'gpt-4o-mini-transcribe' },
          turn_detection: { type: 'server_vad' },
        },
        output: {
          format: { type: 'audio/pcm', rate: 24000 },
          voice,
          speed: 1.0,
        },
      },
    };

    const secretResponse = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: { anchor: 'created_at', seconds: 120 },
        session,
      }),
      cache: 'no-store',
    });

    const secret = await secretResponse.json().catch(() => ({})) as {
      value?: string;
      expires_at?: number;
      session?: { model?: string; audio?: { output?: { voice?: string } } };
      error?: { message?: string };
      message?: string;
    };

    if (!secretResponse.ok || !secret.value) {
      const message = secret.error?.message || secret.message || `OpenAI returned ${secretResponse.status}.`;
      throw new Error(message);
    }

    return NextResponse.json({
      ok: true,
      value: secret.value,
      expiresAt: secret.expires_at || null,
      model: secret.session?.model || model,
      voice: secret.session?.audio?.output?.voice || voice,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Phone Bridge realtime token failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not start Eva realtime voice.' }, { status: 500, headers: NO_STORE });
  }
}
