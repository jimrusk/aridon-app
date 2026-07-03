import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';

export async function GET() {
  const db = getServerClient();
  const { data, error } = await db.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const db = getServerClient();
  const body = await req.json();
  const { data, error } = await db.from('tasks').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
