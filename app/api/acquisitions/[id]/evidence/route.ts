import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

const text = (value: unknown, max = 4000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const confidence = (value: unknown) => Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_evidence').select('*').eq('lead_id', params.id).order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? [], { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition evidence GET error', error);
    return NextResponse.json({ error: 'Unable to load evidence.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json();
    const claim = text(body?.claim, 5000);
    if (!claim) return NextResponse.json({ error: 'Evidence claim is required.' }, { status: 400, headers: NO_STORE });
    const payload = {
      lead_id: params.id,
      category: text(body?.category, 120) || 'General',
      claim,
      source_type: text(body?.source_type, 100) || 'seller_claim',
      source_label: text(body?.source_label, 240),
      source_url: text(body?.source_url, 1600),
      confidence: confidence(body?.confidence ?? 50),
      verified: body?.verified === true,
      notes: text(body?.notes, 5000),
      updated_at: new Date().toISOString(),
    };
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_evidence').insert(payload).select('*').single();
    if (error) throw error;
    await db.from('acquisition_timeline').insert({ lead_id: params.id, event_type: 'evidence', event_title: 'Evidence added', event_detail: `${payload.category}: ${payload.claim.slice(0, 220)}`, created_by: 'Owner' });
    return NextResponse.json(data, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition evidence POST error', error);
    return NextResponse.json({ error: 'Unable to save evidence.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const evidenceId = text(body?.id, 80);
    if (!evidenceId) return NextResponse.json({ error: 'Evidence ID is required.' }, { status: 400, headers: NO_STORE });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ('confidence' in body) patch.confidence = confidence(body.confidence);
    if ('verified' in body) patch.verified = body.verified === true;
    for (const key of ['category','claim','source_type','source_label','source_url','notes']) if (key in body) patch[key] = text(body[key], key === 'source_url' ? 1600 : 5000);
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_evidence').update(patch).eq('id', evidenceId).eq('lead_id', params.id).select('*').single();
    if (error) throw error;
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition evidence PATCH error', error);
    return NextResponse.json({ error: 'Unable to update evidence.' }, { status: 500, headers: NO_STORE });
  }
}
