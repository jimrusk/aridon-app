import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';

export async function GET(req: NextRequest) {
  const db = getServerClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'open';
  const limit  = parseInt(searchParams.get('limit') || '20');

  let q = db.from('alerts').select('*');
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const db = getServerClient();
  const body = await req.json();
  const { data, error } = await db.from('alerts').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const db = getServerClient();
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const update = { ...fields, updated_at: new Date().toISOString() };
  const { data, error } = await db.from('alerts').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
