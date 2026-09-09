import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';
import { loadCustomerExecutiveContext } from '../../../../../lib/customerExecutiveContext';
import {
  executeActionAdapter,
  normalizeActionAdapterKey,
  type ActionFabricRecord,
} from '../../../../../lib/actionFabric';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type WorkAction = {
  title?: string;
  owner?: string;
  actionType?: string;
  adapterKey?: string;
  rationale?: string;
  expectedOutcome?: string;
  riskLevel?: string;
  payload?: Record<string, unknown>;
};

type EvaWorkResult = {
  answer?: string;
  workSummary?: string;
  status?: string;
  actions?: WorkAction[];
  followUps?: string[];
};

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{ type?: string; url?: string; title?: string }>;
    }>;
  }>;
  error?: { message?: string };
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function objectValue(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
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

function extractSources(data: ResponsesPayload) {
  const sources: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      for (const annotation of content.annotations || []) {
        if (annotation.type !== 'url_citation' || !annotation.url || seen.has(annotation.url)) continue;
        seen.add(annotation.url);
        sources.push({ title: annotation.title || annotation.url, url: annotation.url });
      }
    }
  }
  return sources.slice(0, 12);
}

function parseJson(value: string): EvaWorkResult {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(trimmed) as EvaWorkResult;
  } catch {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(trimmed.slice(first, last + 1)) as EvaWorkResult;
      } catch {
        // Fall through to a useful answer instead of failing the whole job.
      }
    }
    return { answer: trimmed, workSummary: trimmed, actions: [], followUps: [], status: 'completed_with_text_result' };
  }
}

function normalizedAction(item: WorkAction) {
  const requested = normalizeActionAdapterKey(item.adapterKey, item.actionType);
  const raw = objectValue(item.payload);

  if (requested === 'internal_task') {
    const title = text(raw.title, 500) || text(item.title, 500) || 'Eva work item';
    const owner = text(raw.owner, 160) || text(item.owner, 160) || 'Eva';
    const requestedPriority = text(raw.priority, 30).toLowerCase();
    const priority = ['low', 'medium', 'high', 'urgent'].includes(requestedPriority) ? requestedPriority : 'medium';
    return {
      adapterKey: 'internal_task' as const,
      actionType: 'internal_task',
      payload: { title, owner, priority },
      approvalRequired: false,
      connectionKey: null,
    };
  }

  if (requested === 'email_send') {
    const to = text(raw.to, 254);
    const subject = text(raw.subject, 300);
    const body = text(raw.body, 50_000);
    if (validEmail(to) && subject && body) {
      return {
        adapterKey: 'email_send' as const,
        actionType: 'email_send',
        payload: { to, subject, body },
        approvalRequired: true,
        connectionKey: 'workspace-account',
      };
    }
  }

  if (requested === 'calendar_create') {
    const summary = text(raw.summary, 500) || text(item.title, 500);
    const description = text(raw.description, 10_000);
    const location = text(raw.location, 1_000);
    const start = text(raw.start, 100);
    const end = text(raw.end, 100);
    const timeZone = text(raw.timeZone, 100);
    const attendees = Array.isArray(raw.attendees)
      ? raw.attendees.map((value) => text(value, 254)).filter(validEmail).slice(0, 50)
      : [];
    if (summary && Number.isFinite(Date.parse(start)) && Number.isFinite(Date.parse(end)) && Date.parse(end) > Date.parse(start)) {
      return {
        adapterKey: 'calendar_create' as const,
        actionType: 'calendar_create',
        payload: { summary, description, location, start, end, timeZone, attendees },
        approvalRequired: true,
        connectionKey: 'workspace-account',
      };
    }
  }

  return {
    adapterKey: 'manual' as const,
    actionType: 'manual',
    payload: raw,
    approvalRequired: true,
    connectionKey: null,
  };
}

export async function POST(request: NextRequest) {
  const startedAt = new Date().toISOString();
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const body = await request.json();
    const slug = text(body?.slug, 80);
    const objective = text(body?.objective, 7000);
    if (!slug || objective.length < 2) {
      return NextResponse.json({ error: 'Workspace and objective are required.' }, { status: 400, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const company = await loadCustomerExecutiveContext(auth.db, membership.tenant);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'The AI service is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const system = `You are Eva, Aridon's primary AI operator and mission orchestrator. Your job is to complete the owner's objective as far as the connected Aridon system can actually take it, not merely discuss the task.

CAPABILITY-FIRST OPERATING POLICY:
- Default to action. Research, analyze, calculate, compare, draft, organize, create internal work, and prepare executable next steps without asking permission when those actions are reversible and non-consequential.
- Use live web research for current public facts whenever it improves the result. Prefer primary sources. Distinguish verified facts from inference and unknowns.
- Use COMPANY CONTEXT as private user-provided working context. Never mix data across tenants.
- Never refuse a whole objective merely because one preferred connector or adapter is unavailable. Complete every portion that is available, then isolate the remaining blocked side effect and state the exact missing connection or approval.
- Do not invent tool access. Do not claim an email, calendar event, purchase, filing, signature, phone call, deployment, website change, or other external side effect happened unless Aridon's execution layer actually performed it.
- Safe internal workspace tasks may be created automatically.
- Email sends and calendar events must be prepared completely and queued for owner approval. Use an external adapter only when the exact recipient or exact meeting times are known. Never invent them.
- Spending, contracts, signatures, legal commitments, destructive changes, public publishing, security/account changes, and other high-impact actions remain owner-controlled.
- Do not over-caution ordinary business work. If the request is lawful and within available capability, do the useful work.
- Preserve privacy and security. Never ask for passwords, private keys, or secret tokens in chat.
- Do not expose private chain-of-thought. Give useful conclusions and concise reasoning summaries.

ACTION TYPES AVAILABLE NOW:
1. internal_task: create a tenant-scoped task automatically. Payload: {"title":"...","owner":"Eva|Heather|Atlas|Scout|Ledger|Oracle|Nova|Ethos","priority":"low|medium|high|urgent"}.
2. email_send: queue a complete email for owner approval. Payload: {"to":"exact@example.com","subject":"...","body":"complete message"}.
3. calendar_create: queue a complete event for owner approval. Payload: {"summary":"...","description":"...","location":"...","start":"ISO date-time","end":"ISO date-time","timeZone":"IANA zone","attendees":["exact@example.com"]}.
4. manual: use only for the final piece that truly lacks a connected execution adapter. Never use manual as an excuse to skip research, drafting, planning, or internal work.

Return ONLY valid JSON with this exact top-level shape:
{"answer":"decision-ready result for the owner","workSummary":"what Eva actually completed in this run","status":"completed|partially_completed|needs_owner_approval","actions":[{"title":"...","owner":"Eva","actionType":"internal_task|email_send|calendar_create|manual","adapterKey":"internal_task|email_send|calendar_create|manual","rationale":"...","expectedOutcome":"...","riskLevel":"low|medium|high","payload":{}}],"followUps":["..."]}

Keep actions to 10 or fewer. Do not put an action in the list unless it is genuinely useful.`;

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || process.env.ARIDON_EVA_CORE_MODEL?.trim() || 'gpt-5.6',
        instructions: system,
        input: `COMPANY CONTEXT\n${company.context.slice(0, 38000)}\n\nOWNER OBJECTIVE\n${objective}`,
        tools: [{ type: 'web_search', search_context_size: 'medium' }],
        max_output_tokens: 4500,
        store: false,
      }),
      cache: 'no-store',
    });

    const raw = (await response.json()) as ResponsesPayload;
    if (!response.ok) throw new Error(raw.error?.message || `AI service returned ${response.status}.`);
    const outputText = extractText(raw);
    if (!outputText) throw new Error('Eva returned no readable work result.');
    const result = parseJson(outputText);

    const completedAt = new Date().toISOString();
    const { data: savedRun, error: runError } = await auth.db.from('customer_agent_runs').insert({
      tenant_id: membership.tenant.id,
      user_id: auth.user.id,
      objective,
      status: result.status || 'completed',
      plan: result,
      final_output: text(result.answer, 12000) || text(result.workSummary, 12000) || outputText.slice(0, 12000),
      routing: { source: 'eva-work', model: process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6', webResearch: true },
      retry_count: 0,
      started_at: startedAt,
      completed_at: completedAt,
      updated_at: completedAt,
    }).select('id,objective,status,plan,final_output,created_at,updated_at').single();
    if (runError) throw runError;

    const proposed = Array.isArray(result.actions) ? result.actions.slice(0, 10) : [];
    const queueRows: any[] = [];
    for (let index = 0; index < proposed.length; index += 1) {
      const item = proposed[index];
      const spec = normalizedAction(item);
      const riskLevel = ['low', 'medium', 'high'].includes(text(item.riskLevel, 20).toLowerCase())
        ? text(item.riskLevel, 20).toLowerCase()
        : (spec.approvalRequired ? 'medium' : 'low');
      const { data, error } = await auth.db.from('customer_action_queue').insert({
        tenant_id: membership.tenant.id,
        requested_by: auth.user.id,
        executive: text(item.owner, 80) || 'Eva',
        action_type: spec.actionType,
        adapter_key: spec.adapterKey,
        title: text(item.title, 500) || 'Eva work action',
        payload: { ...spec.payload, eva_work_run_id: savedRun.id },
        rationale: text(item.rationale, 2000) || null,
        expected_outcome: text(item.expectedOutcome, 1500) || null,
        risk_level: riskLevel,
        approval_required: spec.approvalRequired,
        status: spec.approvalRequired ? 'proposed' : 'approved',
        source: 'eva-work',
        source_ref: savedRun.id,
        idempotency_key: `${savedRun.id}:eva-work:${index}`,
        connection_key: spec.connectionKey,
        updated_at: completedAt,
      }).select('*').single();
      if (error) throw error;
      queueRows.push(data);
    }

    const autoExecuted: any[] = [];
    for (const row of queueRows) {
      if (row.adapter_key !== 'internal_task' || row.approval_required) continue;
      try {
        const attemptStarted = new Date().toISOString();
        const action = row as ActionFabricRecord;
        const executionResult = await executeActionAdapter({ request, db: auth.db, action });
        const finishedAt = new Date().toISOString();

        const { data: updated, error: updateError } = await auth.db
          .from('customer_action_queue')
          .update({
            status: 'completed',
            attempt_count: Math.max(1, Number(row.attempt_count || 0) + 1),
            last_attempt_at: attemptStarted,
            result: executionResult,
            error: null,
            executed_at: finishedAt,
            updated_at: finishedAt,
          })
          .eq('id', row.id)
          .eq('tenant_id', membership.tenant.id)
          .select('*')
          .single();
        if (updateError) throw updateError;

        await auth.db.from('customer_action_executions').insert({
          tenant_id: membership.tenant.id,
          action_id: row.id,
          requested_by: auth.user.id,
          adapter_key: 'internal_task',
          attempt_no: Math.max(1, Number(row.attempt_count || 0) + 1),
          status: 'completed',
          input_snapshot: { title: row.title, executive: row.executive, payload: row.payload || {} },
          output: executionResult,
          started_at: attemptStarted,
          finished_at: finishedAt,
        });
        autoExecuted.push(updated);
      } catch (executionError) {
        const message = executionError instanceof Error ? executionError.message : 'Internal action failed.';
        await auth.db
          .from('customer_action_queue')
          .update({ status: 'failed', error: message.slice(0, 4000), updated_at: new Date().toISOString() })
          .eq('id', row.id)
          .eq('tenant_id', membership.tenant.id);
      }
    }

    const approvalQueue = queueRows.filter((item) => item.approval_required);

    await auth.db.from('customer_assistant_messages').insert([
      { tenant_id: membership.tenant.id, user_id: auth.user.id, role: 'user', content: objective, web_research: true },
      { tenant_id: membership.tenant.id, user_id: auth.user.id, role: 'assistant', content: `[Eva Work] ${text(result.answer, 12000) || text(result.workSummary, 12000)}`, web_research: true },
    ]);

    return NextResponse.json({
      reply: text(result.answer, 12000) || text(result.workSummary, 12000) || 'Eva completed the work run.',
      workSummary: text(result.workSummary, 12000),
      status: approvalQueue.length ? 'needs_owner_approval' : (result.status || 'completed'),
      followUps: Array.isArray(result.followUps) ? result.followUps.slice(0, 8) : [],
      run: savedRun,
      queuedActions: queueRows,
      autoExecuted,
      approvalQueue,
      sources: extractSources(raw),
      researchWeb: true,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Eva Work error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Eva Work is temporarily unavailable.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
