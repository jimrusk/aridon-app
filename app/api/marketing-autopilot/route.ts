import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';
import { operatorRequestAuthorized } from '../../../lib/operatorAuth';
import { runMarketingAutopilot } from '../../../lib/marketingAutopilot';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };

function unauthorized() {
  return NextResponse.json({ error: 'Aridon operator authorization required.' }, { status: 401, headers: NO_STORE });
}

export async function GET(request: NextRequest) {
  if (!operatorRequestAuthorized(request)) return unauthorized();
  try {
    const db = getServerClient();
    const [{ data: runs, error: runsError }, { data: actions, error: actionsError }] = await Promise.all([
      db.from('marketing_autopilot_runs')
        .select('id,created_at,trigger,business_name,status,health_score,snapshot,report')
        .order('created_at', { ascending: false })
        .limit(12),
      db.from('marketing_autopilot_actions')
        .select('id,run_id,created_at,channel,action_type,title,detail,risk,approval_required,status')
        .order('created_at', { ascending: false })
        .limit(40),
    ]);
    if (runsError) throw runsError;
    if (actionsError) throw actionsError;
    return NextResponse.json({ runs: runs || [], actions: actions || [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Marketing Autopilot GET failed.', error);
    return NextResponse.json({ error: 'Marketing Autopilot history could not be loaded.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  if (!operatorRequestAuthorized(request)) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const website = typeof body?.website === 'string' && body.website.trim()
      ? body.website.trim()
      : process.env.NEXT_PUBLIC_APP_URL || 'https://aridon-v02.vercel.app';
    const businessName = typeof body?.businessName === 'string' && body.businessName.trim() ? body.businessName.trim() : 'Aridon';
    const report = await runMarketingAutopilot({ businessName, website, trigger: 'manual', persist: true });
    return NextResponse.json(report, { headers: NO_STORE });
  } catch (error) {
    console.error('Marketing Autopilot POST failed.', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Marketing Autopilot run failed.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  if (!operatorRequestAuthorized(request)) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    const status = body?.status === 'approved' || body?.status === 'rejected' ? body.status : '';
    if (!id || !status) return NextResponse.json({ error: 'Action id and approved/rejected status are required.' }, { status: 400, headers: NO_STORE });

    const db = getServerClient();
    const { data: action, error } = await db.from('marketing_autopilot_actions')
      .update({ status })
      .eq('id', id)
      .eq('approval_required', true)
      .select('id,status,channel,title,approval_required')
      .single();
    if (error) throw error;
    return NextResponse.json({ action }, { headers: NO_STORE });
  } catch (error) {
    console.error('Marketing Autopilot PATCH failed.', error);
    return NextResponse.json({ error: 'Approval queue could not be updated.' }, { status: 500, headers: NO_STORE });
  }
}
