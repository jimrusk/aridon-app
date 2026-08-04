import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const PROJECT_STATUSES = new Set(['active', 'planning', 'paused', 'complete', 'closed']);
const EXECUTIVES = new Set(['Heather', 'Ethos', 'Atlas', 'Eva', 'Scout', 'Ledger', 'Oracle']);

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function GET() {
  try {
    const db = getServerClient();
    const { data, error } = await db
      .from('projects')
      .select('id,name,status,description,executive,created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return NextResponse.json(data ?? [], { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon projects GET error', error);
    return NextResponse.json(
      { error: 'Unable to load projects.' },
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
    const name = text(body?.name, 160);

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const payload = {
      name,
      description: text(body?.description, 8_000),
      executive: EXECUTIVES.has(body?.executive) ? body.executive : 'Heather',
      status: PROJECT_STATUSES.has(body?.status) ? body.status : 'active',
    };

    const db = getServerClient();
    const { data, error } = await db.from('projects').insert(payload).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon projects POST error', error);
    return NextResponse.json(
      { error: 'Unable to create the project.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
