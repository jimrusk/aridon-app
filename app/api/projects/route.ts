import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';
import { STARTER_PROJECTS, type StarterProject } from '../../../lib/starterProjects';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const RESTORED_HEADERS = {
  ...NO_STORE_HEADERS,
  'X-Aridon-Data-Mode': 'restored',
};
const STARTER_HEADERS = {
  ...NO_STORE_HEADERS,
  'X-Aridon-Data-Mode': 'starter',
};
const PROJECT_STATUSES = new Set(['active', 'planning', 'paused', 'complete', 'closed']);
const EXECUTIVES = new Set(['Heather', 'Ethos', 'Atlas', 'Eva', 'Scout', 'Ledger', 'Oracle']);

type ProjectRecord = {
  id: string;
  name: string;
  status: 'active' | 'planning' | 'paused' | 'complete' | 'closed';
  description: string;
  executive: 'Heather' | 'Ethos' | 'Atlas' | 'Eva' | 'Scout' | 'Ledger' | 'Oracle';
  created_at: string;
};

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function projectKey(project: Pick<StarterProject, 'name'>) {
  return project.name.trim().toLowerCase();
}

function restoredPayload(project: StarterProject) {
  return {
    name: project.name,
    status: project.status,
    description: project.description,
    executive: project.executive,
  };
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

    const existing = (data ?? []) as ProjectRecord[];
    const existingKeys = new Set(existing.map(projectKey));
    const missing = STARTER_PROJECTS.filter(
      (project) => !existingKeys.has(projectKey(project)),
    );

    if (missing.length === 0) {
      return NextResponse.json(existing, { headers: NO_STORE_HEADERS });
    }

    const { data: inserted, error: insertError } = await db
      .from('projects')
      .insert(missing.map(restoredPayload))
      .select('id,name,status,description,executive,created_at');

    if (!insertError && inserted) {
      return NextResponse.json([...(inserted as ProjectRecord[]), ...existing], {
        headers: RESTORED_HEADERS,
      });
    }

    console.error(
      'Aridon projects automatic restore could not persist; serving hybrid data',
      insertError,
    );

    return NextResponse.json([...existing, ...missing], {
      headers: RESTORED_HEADERS,
    });
  } catch (error) {
    console.error('Aridon projects GET error; serving restored portfolio', error);
    return NextResponse.json(STARTER_PROJECTS, { headers: STARTER_HEADERS });
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
