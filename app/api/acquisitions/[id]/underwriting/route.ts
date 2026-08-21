import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../lib/supabase';
import { build100DayPlan, underwriteAcquisition, type EvidenceItem, type UnderwritingInputs } from '../../../../../lib/acquisitionUnderwriting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function cleanObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const [leadResult, underwritingResult, evidenceResult, takeoverResult] = await Promise.all([
      db.from('acquisition_leads').select('*').eq('id', params.id).single(),
      db.from('acquisition_underwriting').select('*').eq('lead_id', params.id).maybeSingle(),
      db.from('acquisition_evidence').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }),
      db.from('acquisition_takeover_tasks').select('*').eq('lead_id', params.id).order('due_day'),
    ]);
    if (leadResult.error) throw leadResult.error;
    if (underwritingResult.error) throw underwritingResult.error;
    if (evidenceResult.error) throw evidenceResult.error;
    if (takeoverResult.error) throw takeoverResult.error;
    return NextResponse.json({
      lead: leadResult.data,
      underwriting: underwritingResult.data ?? null,
      evidence: evidenceResult.data ?? [],
      takeover: takeoverResult.data ?? [],
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition underwriting GET error', error);
    return NextResponse.json({ error: 'Unable to load acquisition underwriting.' }, { status: 404, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json();
    const inputs = cleanObject(body?.inputs) as UnderwritingInputs;
    const db = getServerClient();
    const [leadResult, evidenceResult] = await Promise.all([
      db.from('acquisition_leads').select('id,business_name,estimated_ebitda').eq('id', params.id).single(),
      db.from('acquisition_evidence').select('confidence,verified,source_type').eq('lead_id', params.id),
    ]);
    if (leadResult.error) throw leadResult.error;
    if (evidenceResult.error) throw evidenceResult.error;
    const evidence = (evidenceResult.data ?? []) as EvidenceItem[];
    const results = underwriteAcquisition(inputs, Number(leadResult.data.estimated_ebitda) || 0, evidence);

    const { data: underwriting, error } = await db.from('acquisition_underwriting').upsert({
      lead_id: params.id,
      inputs,
      results,
      decision: results.decision,
      kill_triggers: results.kill_triggers,
      advisor_flags: results.advisor_flags,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'lead_id' }).select('*').single();
    if (error) throw error;

    if (body?.generate_takeover_plan === true) {
      const plan = build100DayPlan(results);
      await db.from('acquisition_takeover_tasks').delete().eq('lead_id', params.id);
      const { error: planError } = await db.from('acquisition_takeover_tasks').insert(plan.map((task) => ({ lead_id: params.id, ...task })));
      if (planError) throw planError;
    }

    await db.from('acquisition_timeline').insert({
      lead_id: params.id,
      event_type: 'underwriting',
      event_title: 'Underwriting refreshed',
      event_detail: `${leadResult.data.business_name}: ${results.underwriting_score}/100 underwriting, ${results.survivability_score}/100 survivability, decision ${results.decision}.`,
      created_by: 'Aridon 3',
    });

    return NextResponse.json({ underwriting, results }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition underwriting POST error', error);
    return NextResponse.json({ error: 'Unable to run acquisition underwriting.' }, { status: 500, headers: NO_STORE });
  }
}
