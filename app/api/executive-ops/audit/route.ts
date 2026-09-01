import { NextRequest, NextResponse } from 'next/server';
import { connectedExecutiveActor, recentExecutiveAudit } from '../../../../lib/executiveOps';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const actor = connectedExecutiveActor(request);
    if (!actor.connected) return NextResponse.json({ connected: false, events: [], error: 'Connect Google Workspace first.' }, { status: 401, headers: NO_STORE });
    const requested = Number(request.nextUrl.searchParams.get('limit') || 100);
    const events = await recentExecutiveAudit(actor.email, Number.isFinite(requested) ? requested : 100);
    return NextResponse.json({ connected: true, actorEmail: actor.email, events }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ events: [], error: error instanceof Error ? error.message : 'Unable to load audit log.' }, { status: 500, headers: NO_STORE });
  }
}
