import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const db = getServerClient();
    const [leadResult, scoreResult, structureResult, diligenceResult, loiResult, timelineResult, taskResult] = await Promise.all([
      db.from('acquisition_leads').select('*').eq('id', id).single(),
      db.from('acquisition_scores').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('acquisition_structures').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(10),
      db.from('acquisition_diligence_items').select('*').eq('lead_id', id).order('bucket').order('created_at'),
      db.from('acquisition_lois').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(10),
      db.from('acquisition_timeline').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(100),
      db.from('acquisition_tasks').select('*').eq('lead_id', id).order('status').order('due_at', { ascending: true, nullsFirst: false }),
    ]);
    if (leadResult.error) throw leadResult.error;
    for (const result of [scoreResult, structureResult, diligenceResult, loiResult, timelineResult, taskResult]) {
      if (result.error) throw result.error;
    }
    return NextResponse.json({
      lead: leadResult.data,
      score: scoreResult.data ?? null,
      structures: structureResult.data ?? [],
      diligence: diligenceResult.data ?? [],
      lois: loiResult.data ?? [],
      timeline: timelineResult.data ?? [],
      tasks: taskResult.data ?? [],
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition workspace GET error', error);
    return NextResponse.json({ error: 'Unable to load the acquisition workspace.' }, { status: 404, headers: NO_STORE });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { error } = await db.from('acquisition_leads').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition workspace DELETE error', error);
    return NextResponse.json({ error: 'Unable to remove the acquisition lead.' }, { status: 500, headers: NO_STORE });
  }
}
