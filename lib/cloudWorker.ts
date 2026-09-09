import 'server-only';

import { getServerClient } from './supabase';
import { loadCustomerExecutiveContext } from './customerExecutiveContext';
import { normalizeActionAdapterKey } from './actionFabric';
import {
  executeDirectActionAdapter,
  normalizeDirectActionAdapterKey,
  type DirectActionAdapterKey,
} from './directActionAdapters';

const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const ACTIVE_STATUSES = ['queued', 'running', 'waiting_approval'];

export type CloudWorkerRow = {
  id: string;
  tenant_id: string;
  requested_by?: string | null;
  executive: string;
  name: string;
  objective: string;
  mode: string;
  priority: string;
  status: string;
  provider: string;
  browser_identity_id?: string | null;
  checkpoint?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  cycle_count: number;
  max_cycles: number;
  next_run_at?: string | null;
  lease_until?: string | null;
  last_run_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  paused_at?: string | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
};

type WorkerAction = {
  title?: string;
  owner?: string;
  actionType?: string;
  adapterKey?: string;
  rationale?: string;
  expectedOutcome?: string;
  riskLevel?: string;
  payload?: Record<string, unknown>;
};

type WorkerCycle = {
  summary?: string;
  status?: 'continue' | 'completed' | 'waiting_for_approval';
  findings?: string[];
  nextSteps?: string[];
  checkpoint?: Record<string, unknown>;
  actions?: WorkerAction[];
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

function text(value: unknown, max = 2000) {
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
  return sources.slice(0, 20);
}

function parseCycle(value: string): WorkerCycle {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned) as WorkerCycle;
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1)) as WorkerCycle;
      } catch {
        // Keep the raw result instead of losing the worker cycle.
      }
    }
    return { summary: cleaned, status: 'completed', findings: [], nextSteps: [], actions: [] };
  }
}

async function event(worker: CloudWorkerRow, eventType: string, message: string, payload: Record<string, unknown> = {}) {
  const db = getServerClient();
  const { error } = await db.from('customer_cloud_worker_events').insert({
    tenant_id: worker.tenant_id,
    worker_id: worker.id,
    event_type: eventType,
    message: message.slice(0, 6000),
    payload,
  });
  if (error) console.error('Cloud worker event error', error);
}

async function approvalState(worker: CloudWorkerRow) {
  const db = getServerClient();
  const { data, error } = await db
    .from('customer_action_queue')
    .select('id,status,title,adapter_key,approval_required,error')
    .eq('tenant_id', worker.tenant_id)
    .eq('source', 'cloud-worker')
    .eq('source_ref', worker.id)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  const actions = data || [];
  const pending = actions.filter((item) => ['proposed', 'approved', 'executing', 'blocked'].includes(String(item.status || '').toLowerCase()));
  return { actions, pending };
}

async function claimWorker(worker: CloudWorkerRow) {
  const db = getServerClient();
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + 2 * 60_000).toISOString();
  const { data, error } = await db
    .from('customer_cloud_workers')
    .update({
      status: 'running',
      lease_until: leaseUntil,
      last_run_at: now.toISOString(),
      started_at: worker.started_at || now.toISOString(),
      error: null,
      updated_at: now.toISOString(),
    })
    .eq('id', worker.id)
    .eq('tenant_id', worker.tenant_id)
    .in('status', ACTIVE_STATUSES)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as CloudWorkerRow | null;
}

function normalizeWorkerAction(item: WorkerAction) {
  const raw = objectValue(item.payload);
  const direct = normalizeDirectActionAdapterKey(item.adapterKey, item.actionType);

  if (direct === 'crm_lead_create') {
    const companyName = text(raw.companyName ?? raw.company_name, 300);
    if (companyName) return { adapterKey: direct, actionType: direct, payload: { ...raw, companyName }, approvalRequired: false, connectionKey: null };
  }

  if (direct === 'knowledge_save') {
    const title = text(raw.title, 500) || text(item.title, 500);
    const content = text(raw.content, 80_000);
    if (title && content) return { adapterKey: direct, actionType: direct, payload: { ...raw, title, content }, approvalRequired: false, connectionKey: null };
  }

  if (direct === 'github_issue_create') {
    const title = text(raw.title, 256) || text(item.title, 256);
    if (title) return { adapterKey: direct, actionType: direct, payload: { ...raw, title }, approvalRequired: true, connectionKey: 'github' };
  }

  if (direct === 'vercel_deploy_hook') {
    return { adapterKey: direct, actionType: direct, payload: raw, approvalRequired: true, connectionKey: 'vercel_hook' };
  }

  const requested = normalizeActionAdapterKey(item.adapterKey, item.actionType);
  if (requested === 'internal_task') {
    const title = text(raw.title, 500) || text(item.title, 500) || 'Eva cloud-worker task';
    const owner = text(raw.owner, 160) || text(item.owner, 160) || 'Eva';
    const requestedPriority = text(raw.priority, 30).toLowerCase();
    const priority = ['low', 'medium', 'high', 'urgent'].includes(requestedPriority) ? requestedPriority : 'medium';
    return { adapterKey: 'internal_task' as const, actionType: 'internal_task', payload: { title, owner, priority }, approvalRequired: false, connectionKey: null };
  }

  if (requested === 'email_send') {
    const to = text(raw.to, 254);
    const subject = text(raw.subject, 300);
    const body = text(raw.body, 50_000);
    if (validEmail(to) && subject && body) {
      return { adapterKey: 'email_send' as const, actionType: 'email_send', payload: { to, subject, body }, approvalRequired: true, connectionKey: 'workspace-account' };
    }
  }

  if (requested === 'calendar_create') {
    const summary = text(raw.summary, 500) || text(item.title, 500);
    const description = text(raw.description, 10_000);
    const location = text(raw.location, 1000);
    const start = text(raw.start, 100);
    const end = text(raw.end, 100);
    const timeZone = text(raw.timeZone, 100);
    const attendees = Array.isArray(raw.attendees)
      ? raw.attendees.map((value) => text(value, 254)).filter(validEmail).slice(0, 50)
      : [];
    if (summary && Number.isFinite(Date.parse(start)) && Number.isFinite(Date.parse(end)) && Date.parse(end) > Date.parse(start)) {
      return { adapterKey: 'calendar_create' as const, actionType: 'calendar_create', payload: { summary, description, location, start, end, timeZone, attendees }, approvalRequired: true, connectionKey: 'workspace-account' };
    }
  }

  return { adapterKey: 'manual' as const, actionType: 'manual', payload: raw, approvalRequired: true, connectionKey: null };
}

async function completeAutoAction(db: ReturnType<typeof getServerClient>, action: any, result: Record<string, unknown>, startedAt: string) {
  const finishedAt = new Date().toISOString();
  const { data, error } = await db.from('customer_action_queue').update({
    status: 'completed',
    attempt_count: 1,
    last_attempt_at: startedAt,
    result,
    executed_at: finishedAt,
    updated_at: finishedAt,
  }).eq('id', action.id).select('*').single();
  if (error) throw error;
  return data;
}

async function materializeActions(worker: CloudWorkerRow, cycle: WorkerCycle, cycleNo: number) {
  const db = getServerClient();
  const proposed = Array.isArray(cycle.actions) ? cycle.actions.slice(0, 10) : [];
  const created: any[] = [];

  for (let index = 0; index < proposed.length; index += 1) {
    const item = proposed[index];
    const spec = normalizeWorkerAction(item);
    const idempotencyKey = `${worker.id}:cycle:${cycleNo}:action:${index}`;

    const { data: existing, error: existingError } = await db
      .from('customer_action_queue')
      .select('*')
      .eq('tenant_id', worker.tenant_id)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      created.push(existing);
      continue;
    }

    const now = new Date().toISOString();
    const risk = ['low', 'medium', 'high'].includes(text(item.riskLevel, 20).toLowerCase())
      ? text(item.riskLevel, 20).toLowerCase()
      : (spec.approvalRequired ? 'medium' : 'low');

    const { data: action, error } = await db.from('customer_action_queue').insert({
      tenant_id: worker.tenant_id,
      requested_by: worker.requested_by || null,
      executive: text(item.owner, 80) || worker.executive || 'Eva',
      action_type: spec.actionType,
      adapter_key: spec.adapterKey,
      title: text(item.title, 500) || 'Cloud worker action',
      payload: { ...spec.payload, cloud_worker_id: worker.id, cloud_worker_cycle: cycleNo },
      rationale: text(item.rationale, 2000) || null,
      expected_outcome: text(item.expectedOutcome, 1500) || null,
      risk_level: risk,
      approval_required: spec.approvalRequired,
      status: spec.approvalRequired ? 'proposed' : 'approved',
      approved_by: spec.approvalRequired ? null : worker.requested_by || null,
      approved_at: spec.approvalRequired ? null : now,
      source: 'cloud-worker',
      source_ref: worker.id,
      idempotency_key: idempotencyKey,
      connection_key: spec.connectionKey,
      updated_at: now,
    }).select('*').single();
    if (error) throw error;

    if (spec.adapterKey === 'internal_task' && !spec.approvalRequired) {
      const payload = spec.payload as { title: string; owner: string; priority: string };
      const { data: task, error: taskError } = await db.from('customer_tasks').insert({
        tenant_id: worker.tenant_id,
        title: payload.title,
        owner: payload.owner,
        priority: payload.priority,
        status: 'open',
      }).select('id,title,owner,priority,status,created_at').single();
      if (taskError) throw taskError;
      created.push(await completeAutoAction(db, action, { adapter: 'internal_task', created: true, task, completedAt: new Date().toISOString() }, now));
      continue;
    }

    const direct = normalizeDirectActionAdapterKey(spec.adapterKey, spec.actionType);
    if (direct && !spec.approvalRequired) {
      const result = await executeDirectActionAdapter({ db, key: direct as DirectActionAdapterKey, action });
      created.push(await completeAutoAction(db, action, result as Record<string, unknown>, now));
      continue;
    }

    created.push(action);
  }
  return created;
}

async function runModelCycle(worker: CloudWorkerRow, context: string, recentEvents: any[]) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured for Cloud Workers.');

  const browserConfigured = Boolean(process.env.BROWSERBASE_API_KEY?.trim() && process.env.BROWSERBASE_PROJECT_ID?.trim());
  const system = `You are Eva operating an Aridon persistent cloud worker. The owner assigned an outcome, not a chat question. Work the objective forward and leave a durable checkpoint for the next cycle.\n\nCAPABILITY-FIRST RULES:\n- Do useful work now. Research current public information, compare sources, reason, draft, organize, calculate, create safe internal tasks, create CRM leads, and save durable research to the Knowledge Vault.\n- Use live web search whenever current public facts matter. Prefer primary sources and distinguish verified facts from inference.\n- Never invent a completed side effect. Email, calendar, GitHub issue, and Vercel deploy actions must be fully prepared and queued for owner approval.\n- Do not refuse an entire job because one action or website needs a missing connection. Finish every available part and isolate the exact blocker.\n- Never invent credentials, contacts, prices, approvals, or private facts.\n- If a website requires interactive browser clicking/sign-in and browser infrastructure is unavailable, record that exact step in nextSteps and continue all non-browser work.\n- Spending, contracts, signatures, destructive actions, security/account changes, public publishing, and consequential commitments remain owner controlled.\n- Do not expose private chain-of-thought. Return concise findings and a durable work checkpoint.\n\nCONNECTED EXECUTION LANES:\n- live web research: available\n- internal task creation: available\n- CRM lead creation: available\n- Knowledge Vault save: available\n- approval-gated email/calendar: available through Action Center\n- approval-gated GitHub issue creation: available when GitHub is connected\n- approval-gated Vercel deployment hook: available when Vercel is connected\n- interactive cloud browser provider: ${browserConfigured ? 'configured; persistent browser identities may be assigned to browser workers' : 'not configured; use web research and identify only the exact browser-only step'}\n\nReturn ONLY JSON with this shape:\n{"summary":"what this cycle accomplished","status":"continue|completed|waiting_for_approval","findings":["..."],"nextSteps":["..."],"checkpoint":{"facts":[],"openQuestions":[],"progress":"..."},"actions":[{"title":"...","owner":"Eva","actionType":"internal_task|crm_lead_create|knowledge_save|email_send|calendar_create|github_issue_create|vercel_deploy_hook|manual","adapterKey":"internal_task|crm_lead_create|knowledge_save|email_send|calendar_create|github_issue_create|vercel_deploy_hook|manual","rationale":"...","expectedOutcome":"...","riskLevel":"low|medium|high","payload":{}}]}\n\nFor crm_lead_create include payload.companyName and any known website/contact/research fields. For knowledge_save include payload.title, payload.category, payload.content. For github_issue_create include payload.repository as owner/name when known, payload.title, and payload.body. Use vercel_deploy_hook only when a deployment is explicitly needed.\n\nUse status continue when another autonomous research/work cycle can materially advance the objective. Use waiting_for_approval only when the next meaningful step depends on an owner-approved queued action. Use completed when the requested outcome is substantially delivered or no further connected work can improve it. Maximum 10 actions.`;

  const input = `WORKER\nName: ${worker.name}\nExecutive: ${worker.executive}\nMode: ${worker.mode}\nCycle: ${Number(worker.cycle_count || 0) + 1} of ${worker.max_cycles}\nObjective: ${worker.objective}\n\nPRIOR CHECKPOINT\n${JSON.stringify(worker.checkpoint || {}, null, 2).slice(0, 12000)}\n\nRECENT WORKER EVENTS\n${JSON.stringify(recentEvents, null, 2).slice(0, 10000)}\n\nCOMPANY CONTEXT\n${context.slice(0, 36000)}`;

  const response = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ARIDON_WORKER_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
      instructions: system,
      input,
      tools: [{ type: 'web_search', search_context_size: 'medium' }],
      max_output_tokens: 5000,
      store: false,
    }),
    cache: 'no-store',
  });

  const raw = (await response.json()) as ResponsesPayload;
  if (!response.ok) throw new Error(raw.error?.message || `OpenAI worker cycle returned ${response.status}.`);
  const output = extractText(raw);
  if (!output) throw new Error('Cloud worker returned no readable result.');
  return { cycle: parseCycle(output), sources: extractSources(raw), raw: output };
}

export async function runCloudWorker(workerId: string) {
  const db = getServerClient();
  const { data: initial, error: loadError } = await db
    .from('customer_cloud_workers')
    .select('*')
    .eq('id', workerId)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!initial) throw new Error('Cloud worker not found.');
  let worker = initial as CloudWorkerRow;

  if (['completed', 'cancelled', 'paused'].includes(worker.status)) return { worker, skipped: true };

  if (worker.status === 'waiting_approval') {
    const approvals = await approvalState(worker);
    if (approvals.pending.length) {
      const next = new Date(Date.now() + 5 * 60_000).toISOString();
      const { data, error } = await db
        .from('customer_cloud_workers')
        .update({ next_run_at: next, lease_until: null, updated_at: new Date().toISOString() })
        .eq('id', worker.id)
        .select('*')
        .single();
      if (error) throw error;
      return { worker: data as CloudWorkerRow, waitingForApproval: approvals.pending };
    }
    await event(worker, 'approval_gate_cleared', 'Owner-controlled actions are no longer pending. Eva resumed the worker.');
    worker = { ...worker, status: 'queued' };
  }

  const claimed = await claimWorker(worker);
  if (!claimed) return { worker, skipped: true, reason: 'Worker was claimed by another runner.' };
  worker = claimed;
  await event(worker, 'cycle_started', `Eva started cloud-worker cycle ${Number(worker.cycle_count || 0) + 1}.`, { mode: worker.mode, provider: worker.provider });

  try {
    const { data: tenant, error: tenantError } = await db
      .from('customer_tenants')
      .select('id,business_name,industry,plan,status,subscription_status')
      .eq('id', worker.tenant_id)
      .single();
    if (tenantError) throw tenantError;

    const [company, eventsResult] = await Promise.all([
      loadCustomerExecutiveContext(db, tenant),
      db.from('customer_cloud_worker_events')
        .select('event_type,message,payload,created_at')
        .eq('worker_id', worker.id)
        .order('created_at', { ascending: false })
        .limit(12),
    ]);
    if (eventsResult.error) throw eventsResult.error;

    const model = await runModelCycle(worker, company.context, eventsResult.data || []);
    const cycleNo = Number(worker.cycle_count || 0) + 1;
    const actions = await materializeActions(worker, model.cycle, cycleNo);
    const approvalActions = actions.filter((action) => action.approval_required && !['completed', 'rejected', 'cancelled'].includes(String(action.status || '').toLowerCase()));
    const maxed = cycleNo >= Number(worker.max_cycles || 6);
    const requestedStatus = model.cycle.status || 'completed';
    const status = approvalActions.length
      ? 'waiting_approval'
      : requestedStatus === 'continue' && !maxed
        ? 'queued'
        : 'completed';
    const now = new Date().toISOString();
    const nextRunAt = status === 'queued' || status === 'waiting_approval'
      ? new Date(Date.now() + 5 * 60_000).toISOString()
      : null;
    const resultPayload = {
      summary: text(model.cycle.summary, 12000),
      findings: Array.isArray(model.cycle.findings) ? model.cycle.findings.slice(0, 30) : [],
      nextSteps: Array.isArray(model.cycle.nextSteps) ? model.cycle.nextSteps.slice(0, 20) : [],
      sources: model.sources,
      actions: actions.map((action) => ({ id: action.id, title: action.title, adapterKey: action.adapter_key, status: action.status, approvalRequired: action.approval_required })),
      cycle: cycleNo,
      maxCycles: worker.max_cycles,
      stoppedBecauseMaxCycles: maxed && requestedStatus === 'continue',
    };

    const { data: updated, error: updateError } = await db
      .from('customer_cloud_workers')
      .update({
        status,
        checkpoint: objectValue(model.cycle.checkpoint),
        result: resultPayload,
        cycle_count: cycleNo,
        next_run_at: nextRunAt,
        lease_until: null,
        completed_at: status === 'completed' ? now : null,
        error: null,
        updated_at: now,
      })
      .eq('id', worker.id)
      .select('*')
      .single();
    if (updateError) throw updateError;

    await event(updated as CloudWorkerRow, status === 'completed' ? 'completed' : status === 'waiting_approval' ? 'waiting_approval' : 'checkpoint', text(model.cycle.summary, 6000) || `Cycle ${cycleNo} finished.`, resultPayload);
    return { worker: updated as CloudWorkerRow, cycle: model.cycle, sources: model.sources, actions };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cloud worker cycle failed.';
    const now = new Date().toISOString();
    const retryAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const { data: failed, error: updateError } = await db
      .from('customer_cloud_workers')
      .update({
        status: Number(worker.cycle_count || 0) + 1 >= Number(worker.max_cycles || 6) ? 'failed' : 'queued',
        cycle_count: Number(worker.cycle_count || 0) + 1,
        next_run_at: Number(worker.cycle_count || 0) + 1 >= Number(worker.max_cycles || 6) ? null : retryAt,
        lease_until: null,
        error: message.slice(0, 4000),
        updated_at: now,
      })
      .eq('id', worker.id)
      .select('*')
      .single();
    if (updateError) console.error('Cloud worker failure update error', updateError);
    await event((failed || worker) as CloudWorkerRow, 'error', message, { retryAt });
    throw error;
  }
}

export async function runDueCloudWorkers(limit = 2) {
  const db = getServerClient();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('customer_cloud_workers')
    .select('*')
    .in('status', ACTIVE_STATUSES)
    .lte('next_run_at', now)
    .or(`lease_until.is.null,lease_until.lt.${now}`)
    .order('priority', { ascending: false })
    .order('next_run_at', { ascending: true })
    .limit(Math.max(1, Math.min(5, limit)));
  if (error) throw error;

  const outcomes: any[] = [];
  for (const row of data || []) {
    try {
      const result = await runCloudWorker(row.id);
      outcomes.push({ id: row.id, ok: true, status: result.worker?.status || row.status });
    } catch (workerError) {
      outcomes.push({ id: row.id, ok: false, error: workerError instanceof Error ? workerError.message : 'Worker failed.' });
    }
  }
  return outcomes;
}
