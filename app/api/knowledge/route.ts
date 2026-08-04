import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function GET() {
  try {
    const db = getServerClient();
    const { data, error } = await db
      .from('knowledge_vault')
      .select('id,title,content,category,created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return NextResponse.json(data ?? [], { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon knowledge GET error', error);
    return NextResponse.json(
      { error: 'Unable to load the knowledge vault.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json.' },
        { status: 415, headers: NO_STORE_HEADERS },
      );
    }

    const body = await req.json();
    const title = text(body?.title, 200);
    const content = text(body?.content, 50_000);

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const payload = {
      title,
      category: text(body?.category, 100),
      content,
    };

    const db = getServerClient();
    const { data, error } = await db
      .from('knowledge_vault')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon knowledge POST error', error);
    return NextResponse.json(
      { error: 'Unable to add the knowledge item.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
