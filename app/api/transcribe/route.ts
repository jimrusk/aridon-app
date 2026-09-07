import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Voice transcription is not configured.' }, { status: 503 });
  }

  try {
    const incoming = await request.formData();
    const audio = incoming.get('audio');

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: 'No microphone audio was received.' }, { status: 400 });
    }

    if (audio.size > 24 * 1024 * 1024) {
      return NextResponse.json({ error: 'That voice recording is too large. Please try a shorter turn.' }, { status: 413 });
    }

    const form = new FormData();
    form.append('file', audio, audio.name || 'eva-voice.webm');
    form.append('model', 'gpt-4o-mini-transcribe');
    form.append('language', 'en');
    form.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({})) as { text?: string; error?: { message?: string } };
    if (!response.ok) {
      console.error('Transcription provider error', response.status, data?.error?.message || data);
      return NextResponse.json({ error: data?.error?.message || 'Eva could not transcribe that recording.' }, { status: 502 });
    }

    const text = data.text?.trim();
    if (!text) {
      return NextResponse.json({ error: 'I did not catch any speech in that recording.' }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Voice transcription failed', error);
    return NextResponse.json({ error: 'Eva could not process the microphone recording.' }, { status: 500 });
  }
}
