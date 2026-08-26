import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const SCRIPT = [
  'Aridon Ag brings the business of agriculture into one operating system.',
  'See where money is being made, where profit is leaking, and what needs attention next.',
  'Track buyers, crop performance, labor pressure, input costs, equipment, and water risk in one command center.',
  'Eva, the Aridon AI advisor, turns farm data into a clear action list for today and the week ahead.',
  'Greenhouse growers can track temperature, humidity, light, root-zone conditions, irrigation, scouting, labor, harvest, and revenue from seed to sale.',
  'Use the free Farm Profit Check and planting calculator to find opportunities before margin disappears.',
  'Aridon Ag works on your phone, tablet, and computer, so the command center can go to the field or greenhouse with you.',
  'Start with the ninety-day Founding Farm Program and prove the value with your own farm data. Call Jim at five zero five, three six zero, nine five two nine.',
];

export async function GET(req: NextRequest) {
  const rawPart = req.nextUrl.searchParams.get('part') || '';
  const part = Number.parseInt(rawPart, 10);
  if (!Number.isInteger(part) || part < 1 || part > SCRIPT.length) {
    return Response.json({ error: 'Invalid narration part.' }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'Studio voice is not configured.' }, { status: 503 });
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const speech = await client.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || 'tts-1-hd',
      voice: 'shimmer',
      input: SCRIPT[part - 1],
      response_format: 'mp3',
      speed: 1.01,
    });
    const audio = Buffer.from(await speech.arrayBuffer());

    if (req.nextUrl.searchParams.get('raw') === '1') {
      return new Response(audio, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(audio.byteLength),
          'Content-Disposition': `inline; filename="eva-aridon-ag-${part}.mp3"`,
        },
      });
    }

    return Response.json(
      { part, text: SCRIPT[part - 1], mime: 'audio/mpeg', audio_base64: audio.toString('base64') },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Eva Aridon Ag narration error', error);
    return Response.json({ error: 'Narration temporarily unavailable.' }, { status: 500 });
  }
}
