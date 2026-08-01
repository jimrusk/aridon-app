import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Each executive's distinct OpenAI voice
const ttsVoices: Record<string, string> = {
  heather: 'nova',
  ethos:   'onyx',
  atlas:   'echo',
  eva:     'shimmer',
  scout:   'alloy',
  ledger:  'fable',
  oracle:  'nova',
};

export async function POST(req: NextRequest) {
  try {
    const { text, executive } = await req.json();
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const voice = (ttsVoices[executive?.toLowerCase()] || 'nova') as 'nova' | 'onyx' | 'echo' | 'shimmer' | 'alloy' | 'fable';

    const mp3 = await client.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      speed: 1.0,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
