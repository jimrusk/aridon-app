import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../lib/supabase';
import { buildDealStructures, scoreAcquisition } from '../../../../../lib/acquisitionPipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { data: lead, error } = await db.from('acquisition_leads').select('*').eq('id', params.id).single();
    if (error || !lead) throw error || new Error('Lead not found');

    const score = scoreAcquisition(lead);
    const structures = buildDealStructures(lead);
    const { data: savedScore, error: scoreError } = await db.from('acquisition_scores').insert({ lead_id: params.id, ...score }).select('*').single();
    if (scoreError) throw scoreError;

    await db.from('acquisition_structures').delete().eq('lead_id', params.id);
    let savedStructures: any[] = [];
    if (structures.length) {
      const result = await db.from('acquisition_structures').insert(structures.map((structure) => ({ lead_id: params.id, ...structure }))).select('*');
      if (result.error) throw result.error;
      savedStructures = result.data ?? [];
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (lead.stage === 'lead_captured') patch.stage = 'reviewing';
    await db.from('acquisition_leads').update(patch).eq('id', params.id);
    await db.from('acquisition_timeline').insert({
      lead_id: params.id,
      event_type: 'rescored',
      event_title: 'Deal score refreshed',
      event_detail: `${score.overall_score}/100 · ${score.recommendation.replace('_', ' ')}`,
      created_by: 'Aridon 3',
    });

    return NextResponse.json({ score: savedScore, structures: savedStructures }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition score error', error);
    return NextResponse.json({ error: 'Unable to rescore this acquisition.' }, { status: 500, headers: NO_STORE });
  }
}
