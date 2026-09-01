import { NextRequest, NextResponse } from 'next/server';
import { auditExecutiveAction, connectedExecutiveActor, externalActionsEnabled, setExternalActionsEnabled } from '../../../../lib/executiveOps';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  const actor = connectedExecutiveActor(request);
  if (!actor.connected) return NextResponse.json({ connected: false, externalActionsEnabled: false, error: 'Connect Google Workspace first.' }, { status: 401, headers: NO_STORE });
  const enabled = await externalActionsEnabled(request);
  return NextResponse.json({ connected: true, actorEmail: actor.email, externalActionsEnabled: enabled }, { headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  try {
    const actor = connectedExecutiveActor(request);
    if (!actor.connected) return NextResponse.json({ error: 'Connect Google Workspace first.' }, { status: 401, headers: NO_STORE });
    const body = await request.json();
    if (typeof body?.externalActionsEnabled !== 'boolean') return NextResponse.json({ error: 'externalActionsEnabled must be true or false.' }, { status: 400, headers: NO_STORE });
    const control = await setExternalActionsEnabled(actor.email, body.externalActionsEnabled, 'owner_control_center');
    await auditExecutiveAction({ actorEmail: actor.email, action: body.externalActionsEnabled ? 'external_actions_enabled' : 'emergency_stop_enabled', channel: 'control', approved: true });
    return NextResponse.json({ connected: true, control }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update Executive Operations controls.' }, { status: 500, headers: NO_STORE });
  }
}
