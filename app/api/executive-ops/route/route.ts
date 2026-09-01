import { NextRequest, NextResponse } from 'next/server';
import { auditExecutiveAction, connectedExecutiveActor, recommendExecutive } from '../../../../lib/executiveOps';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = {
      subject: text(body?.subject, 1000),
      body: text(body?.body, 50000),
      from: text(body?.from, 1000),
      filename: text(body?.filename, 1000),
    };
    const route = recommendExecutive(input);
    const actor = connectedExecutiveActor(request);
    await auditExecutiveAction({ actorEmail: actor.email, executive: route.executive, action: 'executive_routed', channel: text(body?.channel, 100) || 'internal', target: input.subject || input.filename || input.from, metadata: { reason: route.reason } });
    return NextResponse.json(route, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to route this item.' }, { status: 500, headers: NO_STORE });
  }
}
