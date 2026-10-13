import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SYSTEM = `You are Eva Plant ID, a careful plant identification assistant for Aridon.
Analyze the supplied plant photo and return JSON only with these keys:
commonName, scientificName, confidence, description, benefits, growingNotes, cautions, nextPhotoTip.
benefits must be an array of short factual strings covering ecological, garden, agricultural, culinary, traditional, or other practical benefits only when supported.
growingNotes must be an array of short strings.
cautions must be an array of short strings. Clearly flag toxicity, lookalikes, invasiveness, thorns, allergens, livestock/pet risks, and uncertainty when relevant.
confidence must be one of high, medium, low.
Never claim a plant is safe to eat or medicinally safe from an image alone. If identification is uncertain, say so and explain what extra photo detail would help.`;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Plant identification is not configured.' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const image = typeof body?.image === 'string' ? body.image : '';
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Please provide a plant photo.' }, { status: 400 });
    }
    if (image.length > 12_000_000) {
      return NextResponse.json({ error: 'That photo is too large. Please use a smaller image.' }, { status: 413 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_PLANT_MODEL || 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.15,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify this plant. Give the most likely identification, useful benefits, growing notes, and safety cautions.' },
            { type: 'image_url', image_url: { url: image, detail: 'high' } },
          ],
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(text);
    return NextResponse.json({ result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('plant-identify error', error);
    return NextResponse.json({ error: 'Eva could not identify that plant. Try a clear photo of the leaves, stem, flowers, or fruit.' }, { status: 500 });
  }
}
