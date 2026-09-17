import OpenAI from 'openai';

export const runtime = 'nodejs';

const SCRIPT = [
  'Most businesses are buried in disconnected systems that do not work together.',
  'Aridon OS brings executive orchestration, CRM, outreach, customer support, scheduling, research, and operations into one intelligent environment.',
  'And it is built for the real world, including agriculture, utilities, water, manufacturing, infrastructure, and field operations.',
  'Stop juggling tools. Start operating smarter. Aridon OS. Let’s connect.',
].join(' ');

export async function GET(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'Studio voice is not configured.' }, { status: 503 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const speech = await client.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'shimmer',
      input: SCRIPT,
      instructions: 'Speak as Eva, Aridon’s warm, confident, natural female business narrator. Sound conversational, intelligent, human, and reassuring, never robotic or like a computer voice. Use relaxed pacing, natural emphasis, brief pauses between ideas, and a polished but personal founder-brand tone. Avoid an announcer cadence.',
      response_format: 'opus',
      speed: 0.98,
    });

    const audio = Buffer.from(await speech.arrayBuffer());
    const url = new URL(req.url);

    if (url.searchParams.get('raw') === '1') {
      return new Response(audio, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'audio/ogg',
          'Content-Length': String(audio.byteLength),
          'Content-Disposition': 'inline; filename="eva-aridon-os-social.ogg"',
        },
      });
    }

    return Response.json({
      mime: 'audio/ogg',
      audio_base64: audio.toString('base64'),
    }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Eva social narration error', error);
    return Response.json({ error: 'Narration temporarily unavailable.' }, { status: 500 });
  }
}
