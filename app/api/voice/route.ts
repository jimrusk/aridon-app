import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

type TtsVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

type VoiceProfile = {
  voice: TtsVoice;
  speed: number;
};

const EXECUTIVE_VOICES: Record<string, VoiceProfile> = {
  Heather: { voice: 'nova', speed: 1.02 },
  Nova: { voice: 'shimmer', speed: 0.96 },
  Scout: { voice: 'echo', speed: 1.02 },
  Atlas: { voice: 'onyx', speed: 0.94 },
  Oracle: { voice: 'nova', speed: 1.08 },
  Ethos: { voice: 'onyx', speed: 0.84 },
  Ledger: { voice: 'echo', speed: 0.93 },
  'Sierra Bennett': { voice: 'nova', speed: 0.98 },
  'Maya Torres': { voice: 'shimmer', speed: 0.94 },
  'Claire Morgan': { voice: 'alloy', speed: 0.96 },
  Eva: { voice: 'shimmer', speed: 1.01 },
  'Contrarian Curriculum Tutor': { voice: 'shimmer', speed: 0.98 },
  'Maria Curriculum Tutor': { voice: 'nova', speed: 1.0 },
  'Future Skills Guide': { voice: 'nova', speed: 0.98 },
};

function cleanText(value: unknown) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || text.length > 4_000) return null;
  return text;
}

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return Response.json(
        { error: 'Please send a valid JSON request.' },
        { status: 415, headers: NO_STORE_HEADERS },
      );
    }

    const body = await req.json();
    const executive = typeof body?.executive === 'string' ? body.executive : '';
    const profile = EXECUTIVE_VOICES[executive];
    const text = cleanText(body?.text);

    if (!profile || !text) {
      return Response.json(
        { error: 'Invalid executive or speech text.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: 'Studio voice is not configured.' },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const speech = await client.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || 'tts-1-hd',
      voice: profile.voice,
      input: text,
      response_format: 'mp3',
      speed: profile.speed,
    });

    const audio = Buffer.from(await speech.arrayBuffer());

    return new Response(audio, {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audio.byteLength),
      },
    });
  } catch (error) {
    console.error('Aridon executive voice route error', error);
    return Response.json(
      { error: 'The executive voice service is temporarily unavailable.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
