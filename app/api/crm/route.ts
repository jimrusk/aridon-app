import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';
import { STARTER_LEADS, type StarterLead } from '../../../lib/starterLeads';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const RESTORED_HEADERS = {
  ...NO_STORE_HEADERS,
  'X-Aridon-Data-Mode': 'restored',
};
const STARTER_HEADERS = {
  ...NO_STORE_HEADERS,
  'X-Aridon-Data-Mode': 'starter',
};
const LEAD_STATUSES = new Set(['new', 'qualified', 'active', 'closed']);

type LeadRecord = {
  id: string;
  name: string;
  company: string;
  status: 'new' | 'qualified' | 'active' | 'closed';
  notes: string;
  email: string;
  created_at: string;
};

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function leadKey(lead: Pick<StarterLead, 'name' | 'company' | 'email'>) {
  const email = lead.email.trim().toLowerCase();
  if (email) return `email:${email}`;

  return `name:${lead.name.trim().toLowerCase()}|company:${lead.company
    .trim()
    .toLowerCase()}`;
}

function restoredPayload(lead: StarterLead) {
  return {
    name: lead.name,
    company: lead.company,
    email: lead.email,
    status: lead.status,
    notes: lead.notes,
  };
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

    const existing = (data ?? []) as LeadRecord[];
    const existingKeys = new Set(existing.map(leadKey));
    const missing = STARTER_LEADS.filter((lead) => !existingKeys.has(leadKey(lead)));

    if (missing.length === 0) {
      return NextResponse.json(existing, { headers: NO_STORE_HEADERS });
    }

    const { data: inserted, error: insertError } = await db
      .from('leads')
      .insert(missing.map(restoredPayload))
      .select('id,name,company,status,notes,email,created_at');

    if (!insertError && inserted) {
      return NextResponse.json([...(inserted as LeadRecord[]), ...existing], {
        headers: RESTORED_HEADERS,
      });
    }

    console.error('Aridon CRM automatic restore could not persist; serving hybrid data', insertError);

    return NextResponse.json([...existing, ...missing], {
      headers: RESTORED_HEADERS,
    });
  } catch (error) {
    console.error('Aridon CRM GET error; serving restored pipeline', error);
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
