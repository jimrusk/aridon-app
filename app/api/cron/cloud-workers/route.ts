import { NextRequest, NextResponse } from 'next/server';
import { runDueCloudWorkers } from '../../../../lib/cloudWorker';

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
    const outcomes = await runDueCloudWorkers(2);
    return NextResponse.json({ ok: true, processed: outcomes.length, outcomes, ranAt: new Date().toISOString() });
  } catch (error) {
    console.error('Cloud worker cron error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cloud worker scheduler failed.' }, { status: 500 });
  }
}
