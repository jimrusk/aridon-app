import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { routeModel, type AridonMode, type AridonTask } from './modelRouter';

export type ExecutiveMemoryRow = {
  id: string;
  executive_id: string;
  memory_type: string;
  summary: string;
  confidence: number | string | null;
  source: string;
  created_at: string;
  last_reinforced_at: string;
};

export type ExecutiveReflectionRow = {
  id: string;
  executive_id: string;
  reflection: string;
  confidence: number | string | null;
  created_at: string;
};

export type ExecutiveMemoryBundle = {
  memories: ExecutiveMemoryRow[];
  reflections: ExecutiveReflectionRow[];
  context: string;
};

function cleanText(value: unknown, max = 6000) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

function confidence(value: unknown, fallback = 0.82) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0.05, Math.min(0.99, numeric));
}

export async function loadExecutiveMemory(
  db: SupabaseClient,
  tenantId: string,
  executiveId = 'Eva',
  limit = 12,
): Promise<ExecutiveMemoryBundle> {
  const safeLimit = Math.max(1, Math.min(30, Math.round(limit)));
  const [memoryResult, reflectionResult] = await Promise.all([
    db
      .from('customer_executive_memories')
      .select('id,executive_id,memory_type,summary,confidence,source,created_at,last_reinforced_at')
      .eq('tenant_id', tenantId)
      .eq('executive_id', executiveId)
      .order('last_reinforced_at', { ascending: false })
      .limit(safeLimit),
    db
      .from('customer_executive_reflections')
      .select('id,executive_id,reflection,confidence,created_at')
      .eq('tenant_id', tenantId)
      .eq('executive_id', executiveId)
      .order('created_at', { ascending: false })
      .limit(Math.min(8, safeLimit)),
  ]);

  if (memoryResult.error) throw memoryResult.error;
  if (reflectionResult.error) throw reflectionResult.error;

  const memories = (memoryResult.data || []) as ExecutiveMemoryRow[];
  const reflections = (reflectionResult.data || []) as ExecutiveReflectionRow[];

  const memoryLines = memories.map((item, index) =>
    `${index + 1}. [${item.memory_type}] ${cleanText(item.summary, 900)} (confidence ${confidence(item.confidence).toFixed(2)})`,
  );
  const reflectionLines = reflections.map((item, index) =>
    `${index + 1}. ${cleanText(item.reflection, 900)} (confidence ${confidence(item.confidence).toFixed(2)})`,
  );

  const context = [
    memoryLines.length ? `EXECUTIVE MEMORY\n${memoryLines.join('\n')}` : '',
    reflectionLines.length ? `RECENT REFLECTIONS\n${reflectionLines.join('\n')}` : '',
  ].filter(Boolean).join('\n\n');

  return { memories, reflections, context };
}

export async function rememberExecutiveOutcome(args: {
  db: SupabaseClient;
  tenantId: string;
  executiveId?: string;
  objective: string;
  outcome: string;
  reflection?: string;
  source?: string;
  memoryType?: string;
  confidence?: number;
}) {
  const executiveId = cleanText(args.executiveId || 'Eva', 80) || 'Eva';
  const objective = cleanText(args.objective, 1400);
  const outcome = cleanText(args.outcome, 2200);
  const reflection = cleanText(args.reflection, 2200);
  const source = cleanText(args.source || 'aridon-one', 120) || 'aridon-one';
  const memoryType = cleanText(args.memoryType || 'mission_outcome', 80) || 'mission_outcome';
  const score = confidence(args.confidence, 0.84);
  const now = new Date().toISOString();

  if (!objective && !outcome) return { memory: null, reflection: null };

  const summary = cleanText(
    `${objective ? `Objective: ${objective}. ` : ''}${outcome ? `Outcome: ${outcome}` : ''}`,
    3600,
  );

  const { data: memory, error: memoryError } = await args.db
    .from('customer_executive_memories')
    .insert({
      tenant_id: args.tenantId,
      executive_id: executiveId,
      memory_type: memoryType,
      summary,
      confidence: score,
      source,
      last_reinforced_at: now,
    })
    .select('id,executive_id,memory_type,summary,confidence,source,created_at,last_reinforced_at')
    .single();
  if (memoryError) throw memoryError;

  let savedReflection: ExecutiveReflectionRow | null = null;
  if (reflection) {
    const { data, error } = await args.db
      .from('customer_executive_reflections')
      .insert({
        tenant_id: args.tenantId,
        executive_id: executiveId,
        reflection,
        confidence: score,
      })
      .select('id,executive_id,reflection,confidence,created_at')
      .single();
    if (error) throw error;
    savedReflection = data as ExecutiveReflectionRow;
  }

  return { memory: memory as ExecutiveMemoryRow, reflection: savedReflection };
}

type CouncilSeat = {
  seat: string;
  taskOverride: AridonTask;
  mode: AridonMode;
  purpose: string;
};

export type CouncilMemberResult = {
  seat: string;
  purpose: string;
  provider: string;
  model: string;
  answer: string;
  routing: Record<string, unknown>;
  sources: Array<{ title: string; url: string }>;
};

export type CouncilResult = {
  members: CouncilMemberResult[];
  synthesis: string;
  synthesisRouting: Record<string, unknown>;
  sources: Array<{ title: string; url: string }>;
};

const COUNCIL_SEATS: CouncilSeat[] = [
  { seat: 'Operator', taskOverride: 'live_research', mode: 'research', purpose: 'Current facts, external evidence and execution reality.' },
  { seat: 'Strategist', taskOverride: 'long_context', mode: 'think', purpose: 'Long-horizon strategy, tradeoffs, contradictions and second-order effects.' },
  { seat: 'Builder', taskOverride: 'coding', mode: 'think', purpose: 'Systems thinking, implementation feasibility and failure modes.' },
  { seat: 'Signal', taskOverride: 'social_intelligence', mode: 'research', purpose: 'Market signal, public reaction, positioning and trend awareness.' },
];

export async function runAridonCouncil(args: {
  objective: string;
  companyContext: string;
  memoryContext?: string;
  maxMembers?: number;
}): Promise<CouncilResult> {
  const objective = cleanText(args.objective, 9000);
  if (!objective) throw new Error('Council objective is required.');

  const maxMembers = Math.max(2, Math.min(4, Math.round(args.maxMembers || 4)));
  const system = `You are one independent member of Aridon One Council. Analyze the owner's objective from your assigned seat. Be decision-oriented, challenge weak assumptions, identify what can actually be verified, and separate facts from inference. Do not claim external actions occurred. Do not expose private chain-of-thought. Return a concise executive analysis with recommended actions.`;
  const context = `COMPANY CONTEXT\n${args.companyContext.slice(0, 32000)}\n\n${args.memoryContext ? `EXECUTIVE MEMORY\n${args.memoryContext.slice(0, 12000)}\n\n` : ''}OWNER OBJECTIVE\n${objective}`;

  const settled = await Promise.allSettled(
    COUNCIL_SEATS.slice(0, maxMembers).map(async (seat) => {
      const result = await routeModel(
        [{ role: 'user', content: `${context}\n\nCOUNCIL SEAT\n${seat.seat}: ${seat.purpose}` }],
        system,
        { mode: seat.mode, taskOverride: seat.taskOverride, maxOutputTokens: 2400 },
      );
      return {
        seat: seat.seat,
        purpose: seat.purpose,
        provider: result.routing.provider,
        model: result.routing.model,
        answer: result.text,
        routing: result.routing as unknown as Record<string, unknown>,
        sources: result.sources,
      } satisfies CouncilMemberResult;
    }),
  );

  const uniqueByProvider = new Map<string, CouncilMemberResult>();
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    const key = result.value.provider;
    if (!uniqueByProvider.has(key)) uniqueByProvider.set(key, result.value);
  }
  const members = Array.from(uniqueByProvider.values());
  if (!members.length) throw new Error('No configured model completed an Aridon Council seat.');

  const transcript = members.map((member) =>
    `SEAT: ${member.seat}\nPROVIDER: ${member.provider}/${member.model}\nANALYSIS:\n${member.answer.slice(0, 9000)}`,
  ).join('\n\n---\n\n');

  const synthesisSystem = `You are Eva chairing Aridon One Council. Synthesize independent model analyses into one decision. Resolve contradictions, prefer claims supported by evidence, preserve minority warnings that could materially change the decision, and produce an executable recommendation. Do not claim an outside action occurred unless the supplied council evidence proves it. Do not expose private chain-of-thought.`;
  const synthesisResult = await routeModel(
    [{ role: 'user', content: `OWNER OBJECTIVE\n${objective}\n\nCOUNCIL TRANSCRIPT\n${transcript}` }],
    synthesisSystem,
    { mode: 'think', taskOverride: 'general', maxOutputTokens: 3600 },
  );

  const sourceMap = new Map<string, { title: string; url: string }>();
  for (const member of members) {
    for (const source of member.sources) sourceMap.set(source.url, source);
  }
  for (const source of synthesisResult.sources) sourceMap.set(source.url, source);

  return {
    members,
    synthesis: synthesisResult.text,
    synthesisRouting: synthesisResult.routing as unknown as Record<string, unknown>,
    sources: Array.from(sourceMap.values()).slice(0, 24),
  };
}
