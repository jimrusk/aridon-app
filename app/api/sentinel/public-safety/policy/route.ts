import { NextRequest, NextResponse } from 'next/server';
import {
  evaluatePublicSafetyAction,
  type PolicyRequest,
} from '../../../../../lib/sentinel/public-safety-policy';

export const runtime = 'nodejs';

const assetClasses = new Set(['standard', 'protected', 'mission-critical']);
const actions = new Set([
  'collect_evidence',
  'revoke_sessions',
  'block_destination',
  'isolate_endpoint',
  'disable_account',
  'stop_service',
  'disconnect_network',
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<PolicyRequest>;

    if (!body.assetClass || !assetClasses.has(body.assetClass)) {
      return NextResponse.json({ error: 'Invalid assetClass' }, { status: 400 });
    }

    if (!body.action || !actions.has(body.action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const confidence = Number(body.confidence);
    if (!Number.isFinite(confidence)) {
      return NextResponse.json({ error: 'confidence must be a number from 0 to 1' }, { status: 400 });
    }

    const decision = evaluatePublicSafetyAction({
      assetClass: body.assetClass,
      action: body.action,
      confidence,
      approvals: Number(body.approvals ?? 0),
      breakGlass: Boolean(body.breakGlass),
      privilegedAuth: Boolean(body.privilegedAuth),
      reason: typeof body.reason === 'string' ? body.reason : undefined,
    } as PolicyRequest);

    return NextResponse.json({ decision });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
