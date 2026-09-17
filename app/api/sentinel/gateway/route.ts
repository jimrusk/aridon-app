import { NextRequest, NextResponse } from 'next/server';
import { inspectAgentAction, SentinelToolRequest } from '@/lib/sentinelAIGateway';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SentinelToolRequest;
    if (!body?.agentId || !body?.tool) {
      return NextResponse.json({ error: 'agentId and tool are required.' }, { status: 400, headers: NO_STORE });
    }
    const inspection = inspectAgentAction(body);
    return NextResponse.json({
      sentinel: 'AI_GATEWAY',
      enforcement: inspection.decision === 'block' ? 'DENIED' : inspection.decision === 'review' ? 'HELD_FOR_REVIEW' : 'AUTHORIZED',
      ...inspection,
    }, { status: inspection.decision === 'block' ? 403 : inspection.decision === 'review' ? 202 : 200, headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'Sentinel gateway could not inspect this action.' }, { status: 400, headers: NO_STORE });
  }
}
