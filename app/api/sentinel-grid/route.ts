import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentinel, SentinelInput } from '@/lib/sentinel-grid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SentinelInput>;

    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 });
    }

    if (body.prompt.length > 20000) {
      return NextResponse.json({ error: 'Prompt exceeds the 20,000 character prototype limit.' }, { status: 413 });
    }

    const assessment = analyzeSentinel({
      prompt: body.prompt,
      history: Array.isArray(body.history) ? body.history.map(String).slice(-12) : [],
      requestedActions: Array.isArray(body.requestedActions) ? body.requestedActions.map(String).slice(0, 20) : [],
      providerSignals: Array.isArray(body.providerSignals) ? body.providerSignals : [],
      authorizationContext: typeof body.authorizationContext === 'string' ? body.authorizationContext : '',
    });

    return NextResponse.json({
      assessment,
      protocolVersion: 'sentinel-grid/0.1',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sentinel Grid assessment failed', error);
    return NextResponse.json({ error: 'Sentinel Grid assessment failed.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Aridon Sentinel Grid',
    protocolVersion: 'sentinel-grid/0.1',
    status: 'online',
    principles: [
      'Detect intent and behavioral trajectories, not keywords alone.',
      'Require a second gate before consequential tool actions.',
      'Keep raw prompts with the originating provider whenever possible.',
      'Support authorized defensive research and appeals.',
      'Accept independent risk signals from multiple AI providers.',
    ],
  });
}
