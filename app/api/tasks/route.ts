import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const TASK_STATUSES = new Set(['open', 'in_progress', 'blocked', 'done', 'closed']);
const PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function GET() {
  try {
    const db = getServerClient();
    const { data, error } = await db
      .from('tasks')
      .select('id,title,status,priority,assigned_to,created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return NextResponse.json(data ?? [], { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon tasks GET error', error);
    return NextResponse.json(
      { error: 'Unable to load tasks.' },
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
    const title = text(body?.title, 240);

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const payload = {
      title,
      assigned_to: text(body?.assigned_to, 120),
      priority: PRIORITIES.has(body?.priority) ? body.priority : 'medium',
      status: TASK_STATUSES.has(body?.status) ? body.status : 'open',
    };

    const db = getServerClient();
    const { data, error } = await db.from('tasks').insert(payload).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon tasks POST error', error);
    return NextResponse.json(
      { error: 'Unable to create the task.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
