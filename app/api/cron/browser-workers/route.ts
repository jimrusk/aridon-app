import { NextRequest, NextResponse } from 'next/server';
import { runDueBrowserWorker } from '../../../../lib/browserWorkerScheduler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get('authorization') || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runDueBrowserWorker();
    return NextResponse.json({ ok: true, result, ranAt: new Date().toISOString() });
  } catch (error) {
    console.error('Browser worker cron error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Browser worker scheduler failed.' }, { status: 500 });
  }
}
