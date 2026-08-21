import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import {
  ACQUISITION_STAGES,
  buildDealStructures,
  sanitizeLead,
  scoreAcquisition,
  type AcquisitionStage,
} from '../../../../lib/acquisitionPipeline';
import { scoreAgainstThesis } from '../../../../lib/acquisitionThesis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function activeThesis(db: ReturnType<typeof getServerClient>) {
  const { data, error } = await db.from('acquisition_theses').select('id,name,criteria').eq('active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function latestScores(db: ReturnType<typeof getServerClient>, leadIds: string[]) {
  if (!leadIds.length) return new Map<string, any>();
  const { data, error } = await db.from('acquisition_scores').select('*').in('lead_id', leadIds).order('created_at', { ascending: false });
  if (error) throw error;
  const map = new Map<string, any>();
  for (const score of data ?? []) if (!map.has(score.lead_id)) map.set(score.lead_id, score);
  return map;
}

export async function GET(request: NextRequest) {
  try {
    const db = getServerClient();
    const stage = text(request.nextUrl.searchParams.get('stage'), 40);
    let query = db.from('acquisition_leads').select('*').order('updated_at', { ascending: false }).limit(500);
    if (ACQUISITION_STAGES.includes(stage as AcquisitionStage)) query = query.eq('stage', stage);
    const [{ data: leads, error }, thesis] = await Promise.all([query, activeThesis(db)]);
    if (error) throw error;
    const scoreMap = await latestScores(db, (leads ?? []).map((lead: any) => lead.id));
    const enriched = (leads ?? []).map((lead: any) => ({ ...lead, score: scoreMap.get(lead.id) ?? null }));
    const now = Date.now();
    const metrics = {
      total: enriched.length,
      hot: enriched.filter((lead: any) => lead.score?.recommendation === 'hot').length,
      negotiating: enriched.filter((lead: any) => lead.stage === 'negotiating').length,
      loiPending: enriched.filter((lead: any) => ['loi_drafted', 'loi_sent'].includes(lead.stage)).length,
      diligence: enriched.filter((lead: any) => lead.stage === 'diligence').length,
      closeReady: enriched.filter((lead: any) => lead.stage === 'final_approval').length,
      followUpsDue: enriched.filter((lead: any) => lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() <= now && !['closed', 'lost'].includes(lead.stage)).length,
    };
    return NextResponse.json({ leads: enriched, metrics, thesis }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition pipeline GET error', error);
    return NextResponse.json({ error: 'Unable to load the acquisition pipeline.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    const lead = sanitizeLead(body ?? {});
    if (!lead.business_name) return NextResponse.json({ error: 'Business name is required.' }, { status: 400, headers: NO_STORE });
    if (lead.seller_email && !/^\S+@\S+\.\S+$/.test(lead.seller_email)) return NextResponse.json({ error: 'Seller email is not valid.' }, { status: 400, headers: NO_STORE });

    const db = getServerClient();
    const thesis = await activeThesis(db);
    const thesisResult = scoreAgainstThesis(lead, thesis?.criteria ?? {});
    const score = scoreAcquisition(lead);
    const structures = buildDealStructures(lead);
    const { data: created, error } = await db.from('acquisition_leads').insert({ ...lead, thesis_fit_score: thesisResult.score, updated_at: new Date().toISOString() }).select('*').single();
    if (error) throw error;

    const { error: scoreError } = await db.from('acquisition_scores').insert({ lead_id: created.id, ...score });
    if (scoreError) throw scoreError;
    if (structures.length) {
      const { error: structuresError } = await db.from('acquisition_structures').insert(structures.map((structure) => ({ lead_id: created.id, ...structure })));
      if (structuresError) throw structuresError;
    }
    await db.from('acquisition_timeline').insert({
      lead_id: created.id,
      event_type: 'lead_created',
      event_title: 'Lead captured and thesis-screened',
      event_detail: `${created.business_name} entered the Aridon 3 pipeline at ${score.overall_score}/100 with ${thesisResult.score}/100 thesis fit.${thesisResult.notes.length ? ` ${thesisResult.notes.join(' ')}` : ''}`,
      created_by: 'Aridon 3',
    });

    return NextResponse.json({ lead: created, score, structures, thesis: { id: thesis?.id ?? null, name: thesis?.name ?? null, fit: thesisResult } }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition pipeline POST error', error);
    return NextResponse.json({ error: 'Unable to create the acquisition lead. Confirm the acquisition database migration is installed.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    const id = text(body?.id, 80);
    if (!id) return NextResponse.json({ error: 'Lead ID is required.' }, { status: 400, headers: NO_STORE });

    const allowed = new Set([
      'business_name','website','source_url','source_type','industry','city','state','seller_name','seller_email','seller_phone',
      'asking_price','estimated_revenue','estimated_ebitda','cash_available','lender_capacity','listing_age_days','owner_urgency',
      'seller_finance_willingness','competition_level','buyer_alternatives','seller_alternatives','reason_for_sale','seller_priorities',
      'notes','next_follow_up_at','last_contact_at',
    ]);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    let materialChange = false;
    for (const [key, value] of Object.entries(body ?? {})) if (allowed.has(key)) { patch[key] = value; materialChange = true; }
    const requestedStage = text(body?.stage, 40);
    if (ACQUISITION_STAGES.includes(requestedStage as AcquisitionStage)) patch.stage = requestedStage;

    const db = getServerClient();
    const { data: before } = await db.from('acquisition_leads').select('stage,business_name').eq('id', id).single();
    const { data, error } = await db.from('acquisition_leads').update(patch).eq('id', id).select('*').single();
    if (error) throw error;

    if (materialChange) {
      const sanitized = sanitizeLead(data as Record<string, unknown>);
      const thesis = await activeThesis(db);
      const thesisResult = scoreAgainstThesis(sanitized, thesis?.criteria ?? {});
      const score = scoreAcquisition(sanitized);
      await Promise.all([
        db.from('acquisition_leads').update({ thesis_fit_score: thesisResult.score }).eq('id', id),
        db.from('acquisition_scores').insert({ lead_id: id, ...score }),
      ]);
    }

    if (requestedStage && before?.stage !== requestedStage) {
      await db.from('acquisition_timeline').insert({ lead_id: id, event_type: 'stage_changed', event_title: 'Pipeline stage changed', event_detail: `${before?.stage || 'unknown'} → ${requestedStage}`, created_by: 'Owner' });
    }
    if (text(body?.timeline_note, 2000)) {
      await db.from('acquisition_timeline').insert({ lead_id: id, event_type: 'note', event_title: 'Deal note added', event_detail: text(body.timeline_note, 2000), created_by: 'Owner' });
    }
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition pipeline PATCH error', error);
    return NextResponse.json({ error: 'Unable to update the acquisition lead.' }, { status: 500, headers: NO_STORE });
  }
}
