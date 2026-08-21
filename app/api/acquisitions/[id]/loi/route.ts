import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerClient } from '../../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function money(value: unknown) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fallbackLoi(lead: any, structure: any) {
  const terms = {
    purchasePrice: structure?.purchase_price || lead.asking_price || 0,
    downPayment: structure?.down_payment || 0,
    sellerNote: structure?.seller_note || 0,
    earnout: structure?.earnout || 0,
    transactionForm: 'Asset purchase, subject to legal and tax review',
    diligenceWindow: '30 days after mutual execution of the LOI',
    exclusivity: '30 days, conditioned on timely seller cooperation and document access',
    transition: 'Reasonable post-close training and transition support to be defined in definitive documents',
    workingCapital: 'Normal working capital required to operate the business at closing, to be verified in diligence',
    contingencies: 'Satisfactory diligence, financing if used, legal review, definitive agreements, and required third-party consents',
    nonBinding: 'Non-binding except any provisions expressly stated as binding by counsel-approved language',
  };
  const lines = [
    `LETTER OF INTENT — DRAFT FOR REVIEW`,
    `Target: ${lead.business_name}`,
    '',
    `This draft outlines a possible acquisition structure for discussion only. It is not a binding offer and must be reviewed by qualified legal, tax, and financial advisors before release.`,
    '',
    `Proposed Purchase Price: ${money(terms.purchasePrice)}`,
    `Cash at Closing: ${money(terms.downPayment)}`,
    `Seller Financing: ${money(terms.sellerNote)}`,
    `Performance / Earnout Consideration: ${money(terms.earnout)}`,
    `Transaction Form: ${terms.transactionForm}`,
    `Diligence: ${terms.diligenceWindow}`,
    `Exclusivity: ${terms.exclusivity}`,
    `Working Capital: ${terms.workingCapital}`,
    `Transition: ${terms.transition}`,
    `Conditions: ${terms.contingencies}`,
    '',
    `This document is an internal negotiation draft until owner approval and counsel review are complete.`,
  ];
  return { subject: `Draft LOI — ${lead.business_name}`, generated_text: lines.join('\n'), terms };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_lois').select('*').eq('lead_id', params.id).order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ lois: data ?? [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition LOI GET error', error);
    return NextResponse.json({ error: 'Unable to load LOI drafts.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = request.headers.get('content-type')?.includes('application/json') ? await request.json() : {};
    const db = getServerClient();
    const { data: lead, error } = await db.from('acquisition_leads').select('*').eq('id', params.id).single();
    if (error || !lead) throw error || new Error('Lead not found');

    let structure: any = null;
    if (typeof body?.structureId === 'string' && body.structureId) {
      const result = await db.from('acquisition_structures').select('*').eq('id', body.structureId).eq('lead_id', params.id).maybeSingle();
      if (result.error) throw result.error;
      structure = result.data;
    }
    if (!structure) {
      const result = await db.from('acquisition_structures').select('*').eq('lead_id', params.id).order('seller_attractiveness_score', { ascending: false }).limit(1).maybeSingle();
      if (result.error) throw result.error;
      structure = result.data;
    }

    let draft = fallbackLoi(lead, structure);
    if (process.env.OPENAI_API_KEY) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.25,
        max_tokens: 1900,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Draft a concise, non-binding small-business acquisition LOI for internal review. Do not present legal advice. Do not claim terms are final or enforceable. Preserve explicit contingencies for diligence, financing if applicable, legal review, definitive agreements, and third-party consents. Return JSON with subject:string, generated_text:string, terms:object. Mark the draft prominently as DRAFT FOR REVIEW and state that counsel review is required before release.',
          },
          { role: 'user', content: JSON.stringify({ lead, structure, ownerNotes: typeof body?.notes === 'string' ? body.notes.slice(0, 4000) : '' }) },
        ],
      });
      try {
        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        if (parsed?.subject && parsed?.generated_text && parsed?.terms) draft = parsed;
      } catch {
        console.error('LOI JSON parse failed; using fallback');
      }
    }

    const { data: saved, error: saveError } = await db.from('acquisition_lois').insert({
      lead_id: params.id,
      structure_id: structure?.id ?? null,
      status: 'draft',
      subject: String(draft.subject).slice(0, 300),
      generated_text: String(draft.generated_text).slice(0, 30000),
      terms: draft.terms,
    }).select('*').single();
    if (saveError) throw saveError;

    await db.from('acquisition_leads').update({ stage: 'loi_drafted', updated_at: new Date().toISOString() }).eq('id', params.id).not('stage', 'in', '(closed,lost)');
    await db.from('acquisition_approvals').upsert({ lead_id: params.id, approval_type: 'loi_release', status: 'ready_for_review', notes: 'LOI draft created. Legal review and owner approval required before release.', updated_at: new Date().toISOString() }, { onConflict: 'lead_id,approval_type' });
    await db.from('acquisition_timeline').insert({ lead_id: params.id, event_type: 'loi_drafted', event_title: 'LOI draft generated', event_detail: 'Draft created for owner and counsel review. No external send occurred.', created_by: 'Aridon 3' });
    return NextResponse.json({ loi: saved }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition LOI POST error', error);
    return NextResponse.json({ error: 'Unable to generate the LOI draft.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const loiId = typeof body?.loiId === 'string' ? body.loiId : '';
    const status = ['draft', 'ready_for_review', 'approved', 'sent', 'superseded'].includes(body?.status) ? body.status : '';
    if (!loiId || !status) return NextResponse.json({ error: 'LOI ID and valid status are required.' }, { status: 400, headers: NO_STORE });
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_lois').update({ status, approved_by: typeof body?.approvedBy === 'string' ? body.approvedBy.slice(0, 160) : '', updated_at: new Date().toISOString() }).eq('id', loiId).eq('lead_id', params.id).select('*').single();
    if (error) throw error;
    if (status === 'sent') await db.from('acquisition_leads').update({ stage: 'loi_sent', updated_at: new Date().toISOString() }).eq('id', params.id);
    return NextResponse.json({ loi: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition LOI PATCH error', error);
    return NextResponse.json({ error: 'Unable to update the LOI status.' }, { status: 500, headers: NO_STORE });
  }
}
