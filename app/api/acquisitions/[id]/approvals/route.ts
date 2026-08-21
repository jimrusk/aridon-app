import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const TYPES = ['outreach','valuation','loi_release','financing','final_offer','close_decision'];
const STATUSES = ['draft','ready_for_review','approved','rejected','needs_revision'];

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_approvals').select('*').eq('lead_id', params.id).order('approval_type');
    if (error) throw error;
    const existing = new Map((data ?? []).map((row: any) => [row.approval_type, row]));
    const approvals = TYPES.map((approval_type) => existing.get(approval_type) ?? { approval_type, status: 'draft', notes: '', approved_by: '' });
    return NextResponse.json({ approvals }, { headers: NO_STORE });
  } catch (error) {
    console.error('Approvals GET error', error);
    return NextResponse.json({ error: 'Unable to load approval gates.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const approvalType = typeof body?.approvalType === 'string' && TYPES.includes(body.approvalType) ? body.approvalType : '';
    const status = typeof body?.status === 'string' && STATUSES.includes(body.status) ? body.status : '';
    if (!approvalType || !status) return NextResponse.json({ error: 'Valid approval type and status are required.' }, { status: 400, headers: NO_STORE });
    const db = getServerClient();
    const payload = {
      lead_id: params.id,
      approval_type: approvalType,
      status,
      notes: typeof body?.notes === 'string' ? body.notes.trim().slice(0, 4000) : '',
      approved_by: status === 'approved' && typeof body?.approvedBy === 'string' ? body.approvedBy.trim().slice(0, 160) : '',
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db.from('acquisition_approvals').upsert(payload, { onConflict: 'lead_id,approval_type' }).select('*').single();
    if (error) throw error;
    await db.from('acquisition_timeline').insert({ lead_id: params.id, event_type: 'approval', event_title: `${approvalType.replace('_',' ')}: ${status.replace('_',' ')}`, event_detail: payload.notes, created_by: payload.approved_by || 'Owner' });
    return NextResponse.json({ approval: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Approvals PATCH error', error);
    return NextResponse.json({ error: 'Unable to update approval gate.' }, { status: 500, headers: NO_STORE });
  }
}
