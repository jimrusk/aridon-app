import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerClient } from '../../../lib/supabase';
import {
  buildFallbackExecutionProject,
  type ExecutionAgent,
  type ExecutionDeliverable,
  type ExecutionInput,
  type ExecutionProject,
} from '../../../lib/execution';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const MAX_TEXT = 12_000;

function text(value: unknown, fallback = '', maxLength = MAX_TEXT) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) || fallback : fallback;
}

function requestedOutputs(value: unknown) {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\r?\n|,/g)
      : [];

  return values
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((item) => item.slice(0, 180));
}

function cleanInput(body: unknown): ExecutionInput | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  const objective = text(value.objective);
  if (!objective) return null;

  return {
    title: text(value.title, 'Aridon Execution Project', 180),
    projectType: text(value.projectType, 'Custom execution package', 120),
    objective,
    audience: text(value.audience, 'Project stakeholders and decision-makers', 2_000),
    constraints: text(
      value.constraints,
      'Label assumptions and require human approval before consequential actions.',
      4_000,
    ),
    requestedOutputs: requestedOutputs(value.requestedOutputs),
  };
}

function stringArray(value: unknown, fallback: string[], limit = 30) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeAgents(value: unknown, fallback: ExecutionAgent[]) {
  if (!Array.isArray(value)) return fallback;
  const agents = value
    .filter((item) => item && typeof item === 'object')
    .slice(0, 12)
    .map((item, index) => {
      const agent = item as Record<string, unknown>;
      return {
        name: text(agent.name, fallback[index]?.name || `Agent ${index + 1}`, 80),
        role: text(agent.role, fallback[index]?.role || 'Specialist Agent', 140),
        assignment: text(agent.assignment, fallback[index]?.assignment || 'Complete assigned work.', 2_000),
        status: agent.status === 'blocked' ? ('blocked' as const) : ('complete' as const),
        output: text(agent.output, fallback[index]?.output || 'Assigned work completed.', 4_000),
      };
    });
  return agents.length > 0 ? agents : fallback;
}

function normalizeDeliverables(value: unknown, fallback: ExecutionDeliverable[]) {
  if (!Array.isArray(value)) return fallback;
  const deliverables = value
    .filter((item) => item && typeof item === 'object')
    .slice(0, 24)
    .map((item, index) => {
      const deliverable = item as Record<string, unknown>;
      return {
        id: text(deliverable.id, `deliverable-${index + 1}`, 90),
        title: text(deliverable.title, fallback[index]?.title || `Deliverable ${index + 1}`, 180),
        type: text(deliverable.type, fallback[index]?.type || 'Project output', 120),
        owner: text(deliverable.owner, fallback[index]?.owner || 'Heather', 80),
        status:
          deliverable.status === 'complete'
            ? ('complete' as const)
            : ('ready_for_approval' as const),
        summary: text(
          deliverable.summary,
          fallback[index]?.summary || 'Completed and staged for review.',
          1_000,
        ),
        content: text(
          deliverable.content,
          fallback[index]?.content || 'Completed output.',
          24_000,
        ),
        qualityChecks: stringArray(
          deliverable.qualityChecks,
          fallback[index]?.qualityChecks || ['Matches the project brief'],
          12,
        ),
        approvalRequired:
          typeof deliverable.approvalRequired === 'boolean'
            ? deliverable.approvalRequired
            : true,
      };
    });
  return deliverables.length > 0 ? deliverables : fallback;
}

function stripCodeFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

async function generateWithOpenAI(input: ExecutionInput, fallback: ExecutionProject) {
  if (!process.env.OPENAI_API_KEY) return fallback;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.35,
    max_tokens: 7_000,
    messages: [
      {
        role: 'system',
        content: `You are the Aridon Execution Replacement Layer. You do not return a loose brainstorm or a task list. You complete the requested knowledge-work project as far as the supplied information allows, assemble every requested deliverable, run quality control, and hold consequential actions at an explicit human approval gate.

Return one JSON object with exactly these top-level keys: executiveSummary, definitionOfDone, agents, deliverables, finalChecks, nextAction, status.

agents must be an array of objects with: name, role, assignment, status, output. Use this operating team unless a specialist is irrelevant: Heather (orchestration), Eva (strategy), Scout (research/evidence), Atlas (technical), Ledger (financial/commercial), Nova (systems/assembly), Oracle (quality control).

deliverables must be an array of fully written objects with: id, title, type, owner, status, summary, content, qualityChecks, approvalRequired. Content must contain the actual usable deliverable, not instructions for creating it. Write each requested output in full. Do not invent verified contacts, prices, laws, engineering certifications, source citations, or research findings. Clearly label assumptions and verification needs. Mark outbound messages, spending, contracts, engineering claims, legal conclusions, and financial actions approvalRequired=true. Use status ready_for_approval when approval is needed, otherwise complete.

The project itself should be status ready_for_approval unless every deliverable can safely be released without human approval.`,
      },
      {
        role: 'user',
        content: JSON.stringify(input),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return fallback;

  const parsed = JSON.parse(stripCodeFence(raw)) as Record<string, unknown>;
  const deliverables = normalizeDeliverables(parsed.deliverables, fallback.deliverables);
  const hasApproval = deliverables.some((item) => item.approvalRequired);

  return {
    ...fallback,
    executiveSummary: text(parsed.executiveSummary, fallback.executiveSummary, 6_000),
    definitionOfDone: stringArray(parsed.definitionOfDone, fallback.definitionOfDone, 20),
    agents: normalizeAgents(parsed.agents, fallback.agents),
    deliverables,
    finalChecks: stringArray(parsed.finalChecks, fallback.finalChecks, 20),
    nextAction: text(parsed.nextAction, fallback.nextAction, 2_000),
    status:
      parsed.status === 'complete' && !hasApproval
        ? ('complete' as const)
        : ('ready_for_approval' as const),
    progress: 100,
  } satisfies ExecutionProject;
}

async function persistProject(project: ExecutionProject) {
  try {
    const db = getServerClient();
    const { data, error } = await db
      .from('execution_projects')
      .insert({
        id: project.id,
        title: project.title,
        project_type: project.projectType,
        objective: project.objective,
        status: project.status,
        progress: project.progress,
        executive_summary: project.executiveSummary,
        payload: project,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return Boolean(data?.id);
  } catch (error) {
    console.error('Execution project persistence is not configured yet', error);
    return false;
  }
}

export async function GET() {
  try {
    const db = getServerClient();
    const { data, error } = await db
      .from('execution_projects')
      .select('payload')
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) throw error;
    const projects = (data ?? [])
      .map((row) => row.payload as ExecutionProject | null)
      .filter((project): project is ExecutionProject => Boolean(project));

    return NextResponse.json(projects, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Execution project history is not configured yet', error);
    return NextResponse.json([], { headers: NO_STORE_HEADERS });
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

    const input = cleanInput(await req.json());
    if (!input) {
      return NextResponse.json(
        { error: 'A project objective is required.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const fallback = buildFallbackExecutionProject(input);
    fallback.id = randomUUID();

    let project = fallback;
    try {
      project = await generateWithOpenAI(input, fallback);
    } catch (error) {
      console.error('Live execution generation failed; returning safe fallback', error);
    }

    const saved = await persistProject(project);
    project.storageStatus = saved ? 'saved' : 'not_configured';

    return NextResponse.json(project, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon execution route error', error);
    return NextResponse.json(
      { error: 'The execution team hit a temporary error.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
