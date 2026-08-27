import { NextRequest, NextResponse } from 'next/server';
import { cronRequestAuthorized, operatorRequestAuthorized } from '../../../../lib/operatorAuth';
import { runMarketingAutopilot } from '../../../../lib/marketingAutopilot';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  if (!cronRequestAuthorized(request) && !operatorRequestAuthorized(request)) {
    return NextResponse.json({ error: 'Daily Marketing Autopilot authorization required.' }, { status: 401, headers: NO_STORE });
  }

  try {
    const website = process.env.MARKETING_AUTOPILOT_TARGET_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://aridon-v02.vercel.app';
    const report = await runMarketingAutopilot({ businessName: 'Aridon', website, trigger: 'daily', persist: true });
    return NextResponse.json({
      ok: true,
      runId: report.runId || null,
      healthScore: report.healthScore,
      headline: report.headline,
      approvalsWaiting: report.actions.filter((action) => action.approvalRequired).length,
      generatedAt: report.generatedAt,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Daily Marketing Autopilot failed.', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Daily Marketing Autopilot failed.' }, { status: 500, headers: NO_STORE });
  }
}
