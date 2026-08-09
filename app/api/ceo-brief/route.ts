import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { companySeed } from '../../../lib/executives';

const NO_STORE = { 'Cache-Control': 'no-store' };

function safeJson(value: unknown, limit = 12000) {
  try {
    return JSON.stringify(value ?? null).slice(0, limit);
  } catch {
    return 'null';
  }
}

function fallback(body: any) {
  const leads = Array.isArray(body?.leads) ? body.leads : [];
  const projects = Array.isArray(body?.projects) ? body.projects : [];
  const tasks = Array.isArray(body?.tasks) ? body.tasks : [];
  const openTasks = tasks.filter((task: any) => !['done', 'complete', 'completed', 'closed'].includes(String(task?.status || '').toLowerCase()));
  return {
    headline: 'Your CEO brief is ready.',
    summary: `There are ${leads.length} CRM leads, ${projects.length} projects, and ${openTasks.length} open tasks in the current command-center snapshot.`,
    priorities: openTasks.slice(0, 3).map((task: any) => task.title || 'Review open task').filter(Boolean).concat(['Review the highest-value open opportunity']).slice(0, 3),
    revenue: leads.length ? 'Review the warmest leads and make the next follow-up explicit.' : 'No CRM leads are visible in this snapshot. Add or research the next buyer set.',
    operations: openTasks.length ? `${openTasks.length} open tasks need sequencing and ownership.` : 'No open tasks are visible. Confirm the next operating milestone.',
    risks: ['Do not let important follow-up live only in memory.', 'Keep external sends and commitments behind approval gates.'],
    opportunities: ['Use the Boardroom on the most consequential decision today.', 'Turn one priority into a finished-project objective in the Execution Engine.'],
    nextActions: ['Choose the one outcome that matters most today', 'Assign its next action and deadline', 'Close or reschedule stale work'],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ...fallback(body), demo: true }, { headers: NO_STORE });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.25,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `You are Eva, Aridon's AI Command Advisor and Chief of Staff. Produce a concise CEO morning brief from a company's current CRM, projects, tasks, and knowledge snapshot. Use the named executive-team perspective internally, but give the owner one unified briefing. ${companySeed}\n\nReturn JSON only with keys: headline, summary, priorities (array of exactly 3), revenue, operations, risks (array), opportunities (array), nextActions (array of exactly 3). Never invent facts, customer activity, financial results, deadlines, or external events that are not in the supplied snapshot. Call out missing data instead of guessing.`,
        },
        {
          role: 'user',
          content: `CRM LEADS\n${safeJson(body?.leads)}\n\nPROJECTS\n${safeJson(body?.projects)}\n\nTASKS\n${safeJson(body?.tasks)}\n\nCOMPANY BRAIN ITEMS\n${safeJson(body?.knowledge)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    try {
      return NextResponse.json(JSON.parse(raw), { headers: NO_STORE });
    } catch {
      return NextResponse.json(fallback(body), { headers: NO_STORE });
    }
  } catch (error) {
    console.error('CEO brief route error', error);
    return NextResponse.json({ error: 'The CEO brief could not be generated.' }, { status: 500, headers: NO_STORE });
  }
}
