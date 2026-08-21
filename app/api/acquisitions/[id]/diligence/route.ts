import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../lib/supabase';
import { DILIGENCE_SEED } from '../../../../../lib/acquisitionPipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_diligence_items').select('*').eq('lead_id', params.id).order('bucket').order('created_at');
    if (error) throw error;
    return NextResponse.json({ items: data ?? [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Diligence GET error', error);
    return NextResponse.json({ error: 'Unable to load diligence.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { count, error: countError } = await db.from('acquisition_diligence_items').select('*', { count: 'exact', head: true }).eq('lead_id', params.id);
    if (countError) throw countError;
    if ((count ?? 0) === 0) {
      const { error } = await db.from('acquisition_diligence_items').insert(DILIGENCE_SEED.map(([bucket, item_name]) => ({ lead_id: params.id, bucket, item_name })));
      if (error) throw error;
      await db.from('acquisition_timeline').insert({ lead_id: params.id, event_type: 'diligence_initialized', event_title: 'Diligence room opened', event_detail: `${DILIGENCE_SEED.length} diligence requests created.`, created_by: 'Aridon 3' });
    }
    await db.from('acquisition_leads').update({ stage: 'diligence', updated_at: new Date().toISOString() }).eq('id', params.id).in('stage', ['loi_sent', 'loi_drafted', 'negotiating', 'qualified', 'contact_strategy_ready']);
    const { data, error } = await db.from('acquisition_diligence_items').select('*').eq('lead_id', params.id).order('bucket').order('created_at');
    if (error) throw error;
    return NextResponse.json({ items: data ?? [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Diligence POST error', error);
    return NextResponse.json({ error: 'Unable to initialize diligence.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const itemId = typeof body?.itemId === 'string' ? body.itemId : '';
    if (!itemId) return NextResponse.json({ error: 'Diligence item ID is required.' }, { status: 400, headers: NO_STORE });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (['requested','received','reviewing','cleared','issue_found','not_applicable'].includes(body?.status)) patch.status = body.status;
    if (['normal','watch','high','critical'].includes(body?.severity)) patch.severity = body.severity;
    if (typeof body?.notes === 'string') patch.notes = body.notes.trim().slice(0, 8000);
    if (typeof body?.owner === 'string') patch.owner = body.owner.trim().slice(0, 160);
    if (typeof body?.due_date === 'string') patch.due_date = body.due_date || null;

    const db = getServerClient();
    const { data, error } = await db.from('acquisition_diligence_items').update(patch).eq('id', itemId).eq('lead_id', params.id).select('*').single();
    if (error) throw error;
    if (data.status === 'issue_found' || ['high','critical'].includes(data.severity)) {
      await db.from('acquisition_timeline').insert({ lead_id: params.id, event_type: 'diligence_issue', event_title: `Diligence issue: ${data.item_name}`, event_detail: `${data.severity} · ${data.notes || 'Review required.'}`, created_by: 'Aridon 3' });
    }
    return NextResponse.json({ item: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Diligence PATCH error', error);
    return NextResponse.json({ error: 'Unable to update diligence.' }, { status: 500, headers: NO_STORE });
  }
}
