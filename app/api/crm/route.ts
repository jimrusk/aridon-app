import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';
import { STARTER_LEADS } from '../../../lib/starterLeads';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const STARTER_HEADERS = {
  ...NO_STORE_HEADERS,
  'X-Aridon-Data-Mode': 'starter',
};
const LEAD_STATUSES = new Set(['new', 'qualified', 'active', 'closed']);

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function GET() {
  try {
    const db = getServerClient();
    const { data, error } = await db
      .from('leads')
      .select('id,name,company,status,notes,email,created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    // A brand-new database should still show Jim a useful Aridon pipeline.
    if (!data || data.length === 0) {
      return NextResponse.json(STARTER_LEADS, { headers: STARTER_HEADERS });
    }

    return NextResponse.json(data, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon CRM GET error; serving starter pipeline', error);

    // Keep the command center useful when Supabase is missing or temporarily
    // unavailable. These records are public starter contacts, not private data.
    return NextResponse.json(STARTER_LEADS, { headers: STARTER_HEADERS });
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
    const name = text(body?.name, 120);
    const email = text(body?.email, 254);
    const status = LEAD_STATUSES.has(body?.status) ? body.status : 'new';

    if (!name) {
      return NextResponse.json(
        { error: 'Lead name is required.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const payload = {
      name,
      company: text(body?.company, 160),
      email,
      notes: text(body?.notes, 4_000),
      status,
    };

    const db = getServerClient();
    const { data, error } = await db.from('leads').insert(payload).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon CRM POST error', error);
    return NextResponse.json(
      {
        error:
          'Unable to save the lead. Confirm the Supabase environment variables and leads table are configured.',
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
