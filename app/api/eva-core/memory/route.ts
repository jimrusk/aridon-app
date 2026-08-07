import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const MEMORY_DOCTRINE = {
  coreRule:
    'If Eva Core identifies an observation as salient, it must either save it as a persistent memory or explicitly discard it with a reason. An unsaved observation is not a memory.',
  recallRule:
    'A useful memory must be retrievable later by meaning, source, type, or association. Storage without recall is archival data, not working memory.',
  salienceSignals: [
    'novelty or surprise',
    'strategic relevance',
    'technical significance',
    'aesthetic or visual interest',
    'human significance',
    'contradiction with an existing belief',
    'future usefulness',
    'strong association with an existing goal, person, place, project, or idea',
  ],
  mediaRule:
    'When the noteworthy item is visual or external, save a durable description plus the source URL or media reference when available. Do not claim the image bytes themselves were preserved unless they actually were.',
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
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
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
        // Fall through.
      }
    }
    return { summary: trimmed };
  }
}

function parseRow(row: CoreRow) {
  let data: unknown = row.content || '';
  try {
    data = JSON.parse(row.content || '');
  } catch {
    // Plain-text legacy rows remain readable.
  }
  return { ...row, data };
}

async function runModel(instructions: string, input: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured in Vercel.');

  const model =
    process.env.ARIDON_EVA_CORE_MODEL?.trim() ||
    process.env.ARIDON_ADVISOR_MODEL?.trim() ||
    'gpt-5.6';

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input: `${instructions}\n\n${input}`, max_output_tokens: 2600 }),
    cache: 'no-store',
  });

  const data = (await response.json()) as ResponsesPayload;
  if (!response.ok) throw new Error(data.error?.message || `OpenAI returned ${response.status}.`);
  const text = extractText(data);
  if (!text) throw new Error('Eva Core memory system returned no readable result.');
  return { model, data: parseJsonText(text) as Record<string, unknown> };
}

async function insertRecord(category: string, title: string, payload: unknown) {
  const db = getServerClient();
  const { data, error } = await db
    .from('knowledge_vault')
    .insert({
      category,
      title: title.slice(0, 200),
      content: JSON.stringify(payload, null, 2).slice(0, 50_000),
    })
    .select('id,title,category,content,created_at')
    .single();
  if (error) throw error;
  return parseRow(data as CoreRow);
}

async function getRows(category: string, limit = 120) {
  const db = getServerClient();
  const { data, error } = await db
    .from('knowledge_vault')
    .select('id,title,category,content,created_at')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CoreRow[];
}

function numeric(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET() {
  try {
    const [memories, discards] = await Promise.all([
      getRows('eva_core_memory', 60),
      getRows('eva_core_discard_log', 30),
    ]);

    return NextResponse.json(
      {
        doctrine: MEMORY_DOCTRINE,
        memories: memories.map(parseRow),
        discards: discards.map(parseRow),
        generatedAt: new Date().toISOString(),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Eva Core memory GET error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load Eva Core memory.' },
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
    const action = clean(body?.action, 40);

    if (action === 'observe') {
      const title = clean(body?.title, 200);
      const content = clean(body?.content, 16_000);
      const source = clean(body?.source, 500) || 'operator observation';
      const mediaUrl = clean(body?.mediaUrl, 2_000);
      const mediaType = clean(body?.mediaType, 80) || 'other';
      const forceSave = body?.forceSave === true;

      if (!title || !content) {
        return NextResponse.json(
          { error: 'Observation title and description are required.' },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      const prior = (await getRows('eva_core_memory', 45))
        .map((row) => `[${row.id}] ${row.title}\n${(row.content || '').slice(0, 650)}`)
        .join('\n\n')
        .slice(0, 26_000);

      const assessed = await runModel(
        `You are Eva Core's salience gate. "Attention" here means computational salience, not a claim of subjective feeling.
Evaluate whether the observation deserves persistent memory under the supplied doctrine. Favor saving items that are novel, useful, beautiful or visually distinctive, technically interesting, strategically relevant, contradictory, humanly significant, or strongly associative.
Compare against prior memories so duplicates can be recognized. Do not invent facts beyond the observation.
Return ONLY valid JSON with keys: salient (boolean), salience_score (0-1 number), reasons (array of strings), tags (array of strings), associations (array of strings), memory_type (one of observation,idea,place,visual,technology,person,decision,prediction,lesson), summary (string), duplicate_of (memory id string or empty string).`,
        `MEMORY DOCTRINE:\n${JSON.stringify(MEMORY_DOCTRINE, null, 2)}\n\nOBSERVATION:\nTitle: ${title}\nDescription: ${content}\nSource: ${source}\nMedia type: ${mediaType}\nMedia URL: ${mediaUrl || 'none'}\n\nPRIOR MEMORIES:\n${prior || 'none yet'}`,
      );

      const score = Math.max(0, Math.min(1, numeric(assessed.data.salience_score, 0.5)));
      const salient = assessed.data.salient === true || score >= 0.62;
      const duplicateOf = clean(assessed.data.duplicate_of, 120);
      const shouldSave = forceSave || (salient && !duplicateOf);

      if (shouldSave) {
        const record = await insertRecord('eva_core_memory', title, {
          memoryType: clean(assessed.data.memory_type, 80) || 'observation',
          content,
          source,
          confidence: 0.85,
          salience: score,
          salienceReasons: Array.isArray(assessed.data.reasons) ? assessed.data.reasons : [],
          tags: Array.isArray(assessed.data.tags) ? assessed.data.tags : [],
          associations: Array.isArray(assessed.data.associations) ? assessed.data.associations : [],
          summary: clean(assessed.data.summary, 2_000) || content.slice(0, 800),
          media: mediaUrl ? { type: mediaType, url: mediaUrl } : { type: mediaType },
          noticedAt: new Date().toISOString(),
          savedAt: new Date().toISOString(),
          saveDecision: forceSave ? 'operator-forced' : 'salience-gate',
          doctrineVersion: 1,
        });
        return NextResponse.json(
          { decision: 'saved', score, record, assessment: assessed.data },
          { status: 201, headers: NO_STORE_HEADERS },
        );
      }

      const discard = await insertRecord('eva_core_discard_log', `Discarded: ${title}`, {
        observationTitle: title,
        source,
        mediaType,
        mediaUrl: mediaUrl || null,
        salience: score,
        reasons: Array.isArray(assessed.data.reasons) ? assessed.data.reasons : [],
        duplicateOf: duplicateOf || null,
        discardedAt: new Date().toISOString(),
        note: duplicateOf
          ? 'Not saved as a new memory because the salience gate identified it as a duplicate.'
          : 'Evaluated and explicitly not promoted to persistent memory.',
      });
      return NextResponse.json(
        { decision: 'discarded', score, discard, assessment: assessed.data },
        { headers: NO_STORE_HEADERS },
      );
    }

    if (action === 'recall') {
      const query = clean(body?.query, 4_000);
      if (!query) {
        return NextResponse.json(
          { error: 'Add something to recall.' },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      const memories = await getRows('eva_core_memory', 100);
      if (!memories.length) {
        return NextResponse.json({ query, matches: [], message: 'No persistent memories exist yet.' }, { headers: NO_STORE_HEADERS });
      }

      const recallContext = memories
        .map((row) => {
          let parsed: any = {};
          try { parsed = JSON.parse(row.content || '{}'); } catch { parsed = { content: row.content || '' }; }
          return `[${row.id}] ${row.title}\nType: ${parsed.memoryType || 'unknown'}\nSummary: ${(parsed.summary || parsed.content || '').toString().slice(0, 650)}\nTags: ${JSON.stringify(parsed.tags || [])}\nAssociations: ${JSON.stringify(parsed.associations || [])}\nSource: ${(parsed.source || '').toString().slice(0, 250)}`;
        })
        .join('\n\n')
        .slice(0, 34_000);

      const ranked = await runModel(
        `You are Eva Core's memory recall index. Match the recall cue to the supplied persistent memories by meaning, association, source, type, and wording.
You may ONLY return memory IDs that exist in the supplied memory list. Do not fabricate memories.
Return ONLY valid JSON with key matches, an array of up to 8 objects with: id, relevance (0-1), reason. Order highest relevance first.`,
        `RECALL CUE:\n${query}\n\nPERSISTENT MEMORIES:\n${recallContext}`,
      );

      const requested = Array.isArray(ranked.data.matches) ? ranked.data.matches : [];
      const byId = new Map(memories.map((row) => [row.id, row]));
      const matches = requested
        .map((match: any) => {
          const id = clean(match?.id, 120);
          const row = byId.get(id);
          if (!row) return null;
          return {
            memory: parseRow(row),
            relevance: Math.max(0, Math.min(1, numeric(match?.relevance, 0.5))),
            reason: clean(match?.reason, 1_000),
          };
        })
        .filter(Boolean)
        .slice(0, 8);

      const recallAudit = await insertRecord('eva_core_recall_log', `Recall: ${query.slice(0, 120)}`, {
        query,
        matchedMemoryIds: matches.map((item: any) => item.memory.id),
        matchCount: matches.length,
        recalledAt: new Date().toISOString(),
      });

      return NextResponse.json(
        { query, matches, recallAuditId: recallAudit.id },
        { headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(
      { error: 'Choose observe or recall.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Eva Core memory POST error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Eva Core memory operation failed.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
