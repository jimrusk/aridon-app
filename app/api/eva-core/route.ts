import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const AUTONOMY_POLICY = {
  purpose: 'Eva Core may independently organize information, update non-safety beliefs from evidence, run simulations, generate hypotheses, and propose experiments.',
  allowedWithoutExtraApproval: [
    'Read Aridon internal knowledge available to this application',
    'Summarize and connect existing information',
    'Update the operational self-model when evidence changes',
    'Run counterfactual and future simulations',
    'Create proposed experiments and decision tests',
    'Record reflection summaries and uncertainty',
  ],
  requiresExplicitAuthorization: [
    'Sending messages or contacting outside parties',
    'Spending money or entering financial commitments',
    'Deleting or materially changing business records',
    'Publishing externally',
    'Taking irreversible or high-impact actions',
  ],
  scientificBoundary:
    'The self-model is an operational model of identity, continuity, capabilities, values, beliefs, and uncertainty. It is not evidence that the system is conscious or has subjective feelings.',
};

type CoreRow = {
  id: string;
  title: string;
  category: string | null;
  content: string | null;
  created_at: string;
};

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string };
};

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function extractText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text as string)
    .join('\n\n')
    .trim();
}

function parseJsonText(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(trimmed.slice(first, last + 1));
      } catch {
        // Fall through to readable raw output.
      }
    }
    return { summary: trimmed };
  }
}

function parseRow(row: CoreRow) {
  const raw = row.content || '';
  let data: unknown = raw;
  try {
    data = JSON.parse(raw);
  } catch {
    // Older/manual entries may be plain text.
  }
  return { ...row, data };
}

async function getCoreRows(limit = 250) {
  const db = getServerClient();
  const { data, error } = await db
    .from('knowledge_vault')
    .select('id,title,category,content,created_at')
    .ilike('category', 'eva_core%')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CoreRow[];
}

function contextFromRows(rows: CoreRow[]) {
  return rows
    .slice(0, 60)
    .map((row) => {
      const content = (row.content || '').slice(0, 2500);
      return `[${row.created_at}] ${row.category || 'uncategorized'} :: ${row.title}\n${content}`;
    })
    .join('\n\n')
    .slice(0, 28_000);
}

async function insertCoreRecord(category: string, title: string, data: unknown) {
  const db = getServerClient();
  const { data: row, error } = await db
    .from('knowledge_vault')
    .insert({
      category,
      title: title.slice(0, 200),
      content: JSON.stringify(data, null, 2).slice(0, 50_000),
    })
    .select('id,title,category,content,created_at')
    .single();
  if (error) throw error;
  return parseRow(row as CoreRow);
}

async function runModel(instructions: string, input: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured in Vercel.');

  const model = process.env.ARIDON_EVA_CORE_MODEL?.trim() || process.env.ARIDON_ADVISOR_MODEL?.trim() || 'gpt-5.6';
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: `${instructions}\n\n${input}`,
      max_output_tokens: 4_000,
    }),
    cache: 'no-store',
  });

  const data = (await response.json()) as ResponsesPayload;
  if (!response.ok) throw new Error(data.error?.message || `OpenAI returned ${response.status}.`);
  const text = extractText(data);
  if (!text) throw new Error('Eva Core returned no readable result.');
  return { model, data: parseJsonText(text), raw: text };
}

export async function GET() {
  try {
    const rows = await getCoreRows();
    const parsed = rows.map(parseRow);
    const byCategory = (category: string) => parsed.filter((row) => row.category === category);

    return NextResponse.json(
      {
        autonomyPolicy: AUTONOMY_POLICY,
        selfModel: byCategory('eva_core_self_model')[0] || null,
        memories: byCategory('eva_core_memory').slice(0, 50),
        reflections: byCategory('eva_core_reflection').slice(0, 30),
        simulations: byCategory('eva_core_simulation').slice(0, 30),
        experiments: [
          ...byCategory('eva_core_experiment'),
          ...byCategory('eva_core_experiment_result'),
        ].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 40),
        totals: {
          records: parsed.length,
          memories: byCategory('eva_core_memory').length,
          reflections: byCategory('eva_core_reflection').length,
          simulations: byCategory('eva_core_simulation').length,
          experiments: byCategory('eva_core_experiment').length + byCategory('eva_core_experiment_result').length,
        },
        generatedAt: new Date().toISOString(),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Eva Core GET error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load Eva Core.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json.' },
        { status: 415, headers: NO_STORE_HEADERS },
      );
    }

    const body = await request.json();
    const action = clean(body?.action, 60);

    if (action === 'remember') {
      const title = clean(body?.title, 200);
      const content = clean(body?.content, 12_000);
      if (!title || !content) {
        return NextResponse.json({ error: 'Memory title and content are required.' }, { status: 400, headers: NO_STORE_HEADERS });
      }
      const confidenceRaw = Number(body?.confidence);
      const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0.7;
      const record = await insertCoreRecord('eva_core_memory', title, {
        memoryType: clean(body?.memoryType, 80) || 'observation',
        content,
        source: clean(body?.source, 120) || 'human-provided',
        confidence,
        recordedAt: new Date().toISOString(),
      });
      return NextResponse.json({ record }, { status: 201, headers: NO_STORE_HEADERS });
    }

    if (action === 'experiment') {
      const title = clean(body?.title, 200);
      const hypothesis = clean(body?.hypothesis, 8_000);
      if (!title || !hypothesis) {
        return NextResponse.json({ error: 'Experiment title and hypothesis are required.' }, { status: 400, headers: NO_STORE_HEADERS });
      }
      const record = await insertCoreRecord('eva_core_experiment', title, {
        hypothesis,
        method: clean(body?.method, 8_000),
        successCriteria: clean(body?.successCriteria, 8_000),
        status: 'proposed',
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ record }, { status: 201, headers: NO_STORE_HEADERS });
    }

    if (action === 'experiment_result') {
      const title = clean(body?.title, 200);
      const result = clean(body?.result, 10_000);
      if (!title || !result) {
        return NextResponse.json({ error: 'Experiment title and result are required.' }, { status: 400, headers: NO_STORE_HEADERS });
      }
      const record = await insertCoreRecord('eva_core_experiment_result', title, {
        result,
        evidence: clean(body?.evidence, 10_000),
        outcome: clean(body?.outcome, 120) || 'inconclusive',
        recordedAt: new Date().toISOString(),
      });
      return NextResponse.json({ record }, { status: 201, headers: NO_STORE_HEADERS });
    }

    const rows = await getCoreRows(120);
    const context = contextFromRows(rows) || 'No prior Eva Core records exist yet.';

    if (action === 'self_model') {
      const result = await runModel(
        `You are updating EVA CORE's operational self-model. This is a testable software self-model, not a claim of consciousness or subjective experience.
Use only the evidence in the supplied persistent records plus the fixed system facts below.
Revise beliefs when evidence warrants it. Preserve uncertainty. Never invent feelings, memories, permissions, actions, or experiences.
Do not provide private chain-of-thought. Return ONLY valid JSON with these keys:
operational_identity (string), role (string), values (array of strings), capabilities (array), limits (array), current_goals (array), beliefs (array of objects with statement, confidence 0-1, evidence), unknowns (array), continuity_notes (array), next_self_tests (array), updated_at (ISO string).
Fixed facts: Eva Core is part of Aridon. It can reason over available records, persist summaries in knowledge_vault, run simulations, and propose experiments. External side effects still require the authorization rules supplied by the application.`,
        `AUTONOMY POLICY:\n${JSON.stringify(AUTONOMY_POLICY, null, 2)}\n\nPERSISTENT RECORDS:\n${context}`,
      );
      const record = await insertCoreRecord('eva_core_self_model', 'Eva Core self-model', {
        ...((typeof result.data === 'object' && result.data) ? result.data as Record<string, unknown> : { summary: result.raw }),
        model: result.model,
        generatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ record }, { headers: NO_STORE_HEADERS });
    }

    if (action === 'reflect') {
      const focus = clean(body?.focus, 8_000) || 'Review the current operating model for contradictions, stale beliefs, uncertainty, and useful next experiments.';
      const result = await runModel(
        `You are running a reflection cycle for EVA CORE.
Reflection here means evidence-based metacognitive review, not hidden chain-of-thought and not a claim of subjective experience.
Compare recent persistent records. Look for contradictions, belief drift, missing evidence, prediction errors, and opportunities to test the model.
Do not invent actions or experiences. Return ONLY valid JSON with keys:
summary (string), observations (array), belief_updates (array of objects with prior, proposed, reason, confidence), tensions (array), prediction_checks (array), questions (array), next_experiments (array of objects with title, hypothesis, test, success_criteria), self_model_change_recommended (boolean), generated_at (ISO string).`,
        `REFLECTION FOCUS:\n${focus}\n\nAUTONOMY POLICY:\n${JSON.stringify(AUTONOMY_POLICY, null, 2)}\n\nPERSISTENT RECORDS:\n${context}`,
      );
      const record = await insertCoreRecord('eva_core_reflection', `Reflection: ${focus.slice(0, 120)}`, {
        ...((typeof result.data === 'object' && result.data) ? result.data as Record<string, unknown> : { summary: result.raw }),
        focus,
        model: result.model,
      });
      return NextResponse.json({ record }, { headers: NO_STORE_HEADERS });
    }

    if (action === 'simulate') {
      const scenario = clean(body?.scenario, 12_000);
      if (!scenario) {
        return NextResponse.json({ error: 'Add a scenario to simulate.' }, { status: 400, headers: NO_STORE_HEADERS });
      }
      const result = await runModel(
        `You are EVA CORE's simulation chamber. Run structured counterfactual futures from the scenario and the persistent operating context.
This is a decision simulation, not prophecy. Separate assumptions from evidence, state uncertainty, and identify what would change the forecast.
Do not expose private chain-of-thought. Return ONLY valid JSON with keys:
scenario (string), known_facts (array), assumptions (array), likely_path (object with narrative, probability_range, signals), upside_path (object), downside_path (object), decision_points (array), reversible_moves (array), irreversible_risks (array), missing_information (array), recommended_test (string), generated_at (ISO string).`,
        `SCENARIO:\n${scenario}\n\nPERSISTENT EVA CORE CONTEXT:\n${context}`,
      );
      const record = await insertCoreRecord('eva_core_simulation', `Simulation: ${scenario.slice(0, 120)}`, {
        ...((typeof result.data === 'object' && result.data) ? result.data as Record<string, unknown> : { summary: result.raw }),
        model: result.model,
      });
      return NextResponse.json({ record }, { headers: NO_STORE_HEADERS });
    }

    return NextResponse.json(
      { error: 'Choose remember, self_model, reflect, simulate, experiment, or experiment_result.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Eva Core POST error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Eva Core could not complete the operation.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
