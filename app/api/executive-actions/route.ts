import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';

// GET  /api/executive-actions         — latest 15 actions (activity feed)
// GET  /api/executive-actions?recent=1 — derives activity from leads/projects/tasks
//       (for when the executive_actions table is empty / hasn't been seeded)
// POST /api/executive-actions          — log an action

export async function GET(req: NextRequest) {
  const db = getServerClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '15');

  // First try the executive_actions log table
  const { data: actions, error } = await db
    .from('executive_actions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!error && actions && actions.length > 0) {
    return NextResponse.json(actions);
  }

  // Fallback: derive recent activity from leads, projects, and tasks
  const [
    { data: leads },
    { data: projects },
    { data: tasks },
  ] = await Promise.all([
    db.from('leads').select('id,name,company,status,created_at,assigned_executive').order('created_at', { ascending: false }).limit(5),
    db.from('projects').select('id,name,status,executive,created_at,assigned_executive').order('created_at', { ascending: false }).limit(5),
    db.from('tasks').select('id,title,status,priority,assigned_to,created_at,assigned_executive').order('created_at', { ascending: false }).limit(5),
  ]);

  const derived = [
    ...(leads    || []).map((l: any) => ({
      id:          l.id,
      action_type: 'created',
      title:       `Lead added: ${l.name}${l.company ? ' @ ' + l.company : ''}`,
      description: `Status: ${l.status}`,
      executive:   l.assigned_executive || 'Scout',
      division:    l.division || '',
      record_type: 'lead',
      created_at:  l.created_at,
    })),
    ...(projects || []).map((p: any) => ({
      id:          p.id,
      action_type: 'created',
      title:       `Project created: ${p.name}`,
      description: `Status: ${p.status}`,
      executive:   p.assigned_executive || p.executive || 'Heather',
      division:    p.division || '',
      record_type: 'project',
      created_at:  p.created_at,
    })),
    ...(tasks    || []).map((t: any) => ({
      id:          t.id,
      action_type: t.status === 'done' ? 'completed' : 'created',
      title:       `Task: ${t.title}`,
      description: `Priority: ${t.priority} · Status: ${t.status}`,
      executive:   t.assigned_executive || t.assigned_to || 'Heather',
      division:    t.division || '',
      record_type: 'task',
      created_at:  t.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  return NextResponse.json(derived);
}

export async function POST(req: NextRequest) {
  const db = getServerClient();
  const body = await req.json();
  const { data, error } = await db.from('executive_actions').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
