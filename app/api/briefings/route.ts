import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';

// GET  /api/briefings         — list briefings (latest first, limit 30)
// GET  /api/briefings?latest=1 — return only the latest briefing
// POST /api/briefings          — save a new briefing
// PATCH /api/briefings         — update a briefing (jim_notes, is_complete)

export async function GET(req: NextRequest) {
  const db = getServerClient();
  const { searchParams } = new URL(req.url);
  const latest = searchParams.get('latest') === '1';

  if (latest) {
    const { data, error } = await db
      .from('executive_briefings')
      .select('*')
      .order('briefing_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await db
    .from('executive_briefings')
    .select('*')
    .order('briefing_date', { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const db = getServerClient();
  const body = await req.json();
  const { data, error } = await db.from('executive_briefings').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const db = getServerClient();
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const update = { ...fields, updated_at: new Date().toISOString() };
  const { data, error } = await db.from('executive_briefings').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
