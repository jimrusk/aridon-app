import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import OpenAI from 'openai';

// POST /api/briefings/generate
// Fetches current operational state, generates Heather's daily narrative via OpenAI,
// saves to executive_briefings, returns the saved briefing.

export async function POST(req: NextRequest) {
  const db  = getServerClient();
  const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const today = new Date().toISOString().split('T')[0];

  // ── Gather current operational state ────────────────────────────
  const [
    { data: leads },
    { data: projects },
    { data: tasks },
    { data: alerts },
    { data: opps },
    { data: grants },
  ] = await Promise.all([
    db.from('leads').select('name,company,status,priority,division,assigned_executive,due_date').order('created_at', { ascending: false }).limit(20),
    db.from('projects').select('name,status,description,executive,priority,division,due_date').order('created_at', { ascending: false }).limit(20),
    db.from('tasks').select('title,status,priority,assigned_to,assigned_executive,division,due_date').eq('status', 'open').order('created_at', { ascending: false }).limit(30),
    db.from('alerts').select('title,severity,description,division,assigned_executive').eq('status', 'open').order('created_at', { ascending: false }).limit(10),
    db.from('opportunities').select('title,status,value,priority,division,assigned_executive,due_date').order('created_at', { ascending: false }).limit(10),
    db.from('grants').select('title,funder,status,amount,division,due_date').order('due_date', { ascending: true }).limit(10),
  ]);

  const openTasks   = (tasks || []).filter((t: any) => t.status === 'open');
  const highTasks   = openTasks.filter((t: any) => t.priority === 'high');
  const activeProj  = (projects || []).filter((p: any) => p.status === 'active');
  const redAlerts   = (alerts || []).filter((a: any) => a.severity === 'red');
  const amberAlerts = (alerts || []).filter((a: any) => a.severity === 'amber');

  const context = `
TODAY: ${today}

OPEN TASKS (${openTasks.length} total, ${highTasks.length} high priority):
${highTasks.slice(0, 10).map((t: any) => `- [${t.division || 'untagged'}] ${t.title} → ${t.assigned_executive || t.assigned_to || 'unassigned'}${t.due_date ? ` (due ${t.due_date})` : ''}`).join('\n') || '(none)'}

ACTIVE PROJECTS (${activeProj.length}):
${activeProj.slice(0, 8).map((p: any) => `- [${p.division || 'untagged'}] ${p.name} → ${p.executive || p.assigned_executive || 'unassigned'}${p.due_date ? ` (due ${p.due_date})` : ''}`).join('\n') || '(none)'}

OPEN LEADS (${(leads || []).length}):
${(leads || []).slice(0, 8).map((l: any) => `- ${l.name}${l.company ? ` @ ${l.company}` : ''} [${l.status}]${l.division ? ` · ${l.division}` : ''}`).join('\n') || '(none)'}

OPEN ALERTS:
${redAlerts.map((a: any) => `🔴 RED: ${a.title}${a.description ? ' — ' + a.description : ''}`).join('\n') || '(no red alerts)'}
${amberAlerts.map((a: any) => `🟡 AMBER: ${a.title}`).join('\n') || '(no amber alerts)'}

OPPORTUNITIES IN PIPELINE (${(opps || []).length}):
${(opps || []).slice(0, 5).map((o: any) => `- ${o.title} [${o.status}]${o.value ? ` $${o.value.toLocaleString()}` : ''}${o.division ? ` · ${o.division}` : ''}`).join('\n') || '(none)'}

UPCOMING GRANT DEADLINES:
${(grants || []).slice(0, 5).map((g: any) => `- ${g.title}${g.funder ? ` (${g.funder})` : ''} [${g.status}]${g.due_date ? ` due ${g.due_date}` : ''}`).join('\n') || '(none)'}
`.trim();

  // ── Ask OpenAI to generate Heather's narrative ───────────────────
  const systemPrompt = `You are Heather, Chief Operating Officer for Iron Grid Electric & Water — a mission-critical infrastructure company deploying AWG-1000 atmospheric water generators, microgrids, and water systems across tribal lands, data centers, and rural communities in the Southwest. Aridon has three divisions: Aridon (water tech), Iron Grid Electric & Water (field ops), and SW Water Security Alliance (government/policy).

Write a concise, direct executive briefing for Jim Rusk (Founder/CEO). You are his front door — you see everything and brief him every morning.

RULES:
- NO markdown formatting. No asterisks, pound signs, bullet dashes, or bold. Plain sentences only.
- Open with a direct summary of where things stand today (1-2 sentences).
- Identify the 2-3 most critical things Jim must focus on today.
- Flag any red or amber issues that need his attention.
- Close with one recommendation or decision Jim should make.
- Keep the entire briefing under 250 words. Sharp and actionable.
- Speak as Heather: warm but direct, action-oriented, no fluff.`;

  let narrative = '';
  try {
    const completion = await oai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Here is the current operational state for ${today}:\n\n${context}\n\nWrite my daily briefing.` },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });
    narrative = completion.choices[0]?.message?.content || '';
  } catch (e: any) {
    narrative = `Briefing generation failed: ${e?.message}. Check your OPENAI_API_KEY and try again.`;
  }

  // ── Build the top priorities array (top 5 open high-priority tasks) ─
  const topPriorities = highTasks.slice(0, 5).map((t: any) => ({
    title:              t.title,
    assigned_executive: t.assigned_executive || t.assigned_to || 'Unassigned',
    division:           t.division || '',
    due_date:           t.due_date || '',
    status:             t.status,
    next_action:        t.next_action || '',
  }));

  // ── Build the critical alerts array ─────────────────────────────────
  const criticalAlerts = (alerts || []).map((a: any) => ({
    title:     a.title,
    severity:  a.severity,
    division:  a.division || '',
    executive: a.assigned_executive || '',
  }));

  // ── Build snapshot ───────────────────────────────────────────────────
  const snapshot = {
    leads_count:     (leads  || []).length,
    projects_count:  (projects || []).length,
    open_tasks:      openTasks.length,
    high_tasks:      highTasks.length,
    red_alerts:      redAlerts.length,
    amber_alerts:    amberAlerts.length,
    opps_count:      (opps || []).length,
    grants_count:    (grants || []).length,
  };

  // ── Save to executive_briefings ──────────────────────────────────────
  const { data: saved, error } = await db
    .from('executive_briefings')
    .insert({
      briefing_date:   today,
      narrative,
      top_priorities:  topPriorities,
      critical_alerts: criticalAlerts,
      recommendations: '',
      jim_notes:       '',
      is_complete:     false,
      snapshot,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(saved);
}
