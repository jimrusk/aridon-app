import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const VALID_STATUS = new Set(['open','in_progress','done','blocked']);
const text = (value: unknown, max = 4000) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_takeover_tasks').select('*').eq('lead_id', params.id).order('due_day');
    if (error) throw error;
    return NextResponse.json(data ?? [], { headers: NO_STORE });
  } catch (error) {
    console.error('Takeover GET error', error);
    return NextResponse.json({ error: 'Unable to load takeover plan.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const taskId = text(body?.id, 80);
    const status = text(body?.status, 40);
    if (!taskId || !VALID_STATUS.has(status)) return NextResponse.json({ error: 'Valid task ID and status are required.' }, { status: 400, headers: NO_STORE });
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_takeover_tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId).eq('lead_id', params.id).select('*').single();
    if (error) throw error;
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (error) {
    console.error('Takeover PATCH error', error);
    return NextResponse.json({ error: 'Unable to update takeover task.' }, { status: 500, headers: NO_STORE });
  }
}
