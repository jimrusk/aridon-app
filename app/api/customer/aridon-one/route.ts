import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { loadCustomerExecutiveContext } from '../../../../lib/customerExecutiveContext';
import { getRouterStatus } from '../../../../lib/modelRouter';
import { loadExecutiveMemory, rememberExecutiveOutcome, runAridonCouncil } from '../../../../lib/aridonOne';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function numberOrNull(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function receiptForRun(run: any, actions: any[], executions: any[]) {
  const related = actions.filter((action) => String(action.source_ref || '') === String(run.id));
  const executionByAction = new Map(executions.map((execution) => [String(execution.action_id), execution]));
  const pending = related.filter((action) => action.approval_required && ['proposed', 'approved', 'executing', 'blocked'].includes(String(action.status || '').toLowerCase()));
  const failed = related.filter((action) => ['failed', 'error'].includes(String(action.status || '').toLowerCase()) || action.error);
  const completed = related.filter((action) => ['completed', 'executed', 'done'].includes(String(action.status || '').toLowerCase()));
  const verified = completed.filter((action) => executionByAction.has(String(action.id)) || Boolean(action.executed_at));

  let state = 'recorded';
  if (failed.length) state = 'partial';
  else if (pending.length) state = 'awaiting_approval';
  else if (related.length && completed.length === related.length && verified.length === completed.length) state = 'verified';
  else if (related.length && completed.length === related.length) state = 'completed';
  else if (related.length) state = 'partial';
  else if (['completed', 'complete', 'done', 'success'].includes(String(run.status || '').toLowerCase())) state = 'analysis_complete';

  return {
    id: `receipt:${run.id}`,
    runId: run.id,
    objective: run.objective,
    state,
    runStatus: run.status,
    issuedAt: run.completed_at || run.updated_at || run.created_at,
    totals: {
      actions: related.length,
      completed: completed.length,
      verified: verified.length,
      pendingApproval: pending.length,
      failed: failed.length,
    },
    proof: [
      {
        kind: 'run_record',
        verified: true,
        label: 'Aridon persisted the mission run',
        evidence: { runId: run.id, status: run.status, completedAt: run.completed_at || null },
      },
      ...related.slice(0, 12).map((action) => {
        const execution = executionByAction.get(String(action.id));
        return {
          kind: 'action',
          verified: Boolean(execution || action.executed_at),
          label: action.title,
          evidence: {
            actionId: action.id,
            adapter: action.adapter_key,
            status: action.status,
            executedAt: action.executed_at || execution?.finished_at || null,
            result: action.result || execution?.output || {},
            error: action.error || execution?.error || null,
          },
        };
      }),
    ],
  };
}

async function membershipForRequest(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { ok: false as const, response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
  if (!membership) return { ok: false as const, response: NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE }) };
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
    return { ok: false as const, response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) };
  }
  return { ok: true as const, auth, membership };
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await membershipForRequest(request, slug);
    if (!resolved.ok) return resolved.response;

    const { auth, membership } = resolved;
    const tenantId = membership.tenant.id;
    const [runs, actions, executions, outcomes, workers, memory] = await Promise.all([
      auth.db.from('customer_agent_runs').select('id,objective,status,plan,final_output,routing,started_at,completed_at,created_at,updated_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(20),
      auth.db.from('customer_action_queue').select('id,source,source_ref,executive,title,action_type,adapter_key,status,approval_required,result,error,executed_at,created_at,updated_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(120),
      auth.db.from('customer_action_executions').select('id,action_id,adapter_key,status,output,error,started_at,finished_at,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(120),
      auth.db.from('customer_outcomes').select('id,category,name,source,baseline_value,current_value,target_value,unit,status,attribution,notes,created_at,updated_at').eq('tenant_id', tenantId).order('updated_at', { ascending: false }).limit(30),
      auth.db.from('customer_cloud_workers').select('id,executive,name,objective,mode,priority,status,provider,checkpoint,result,cycle_count,max_cycles,next_run_at,last_run_at,completed_at,error,created_at,updated_at').eq('tenant_id', tenantId).order('updated_at', { ascending: false }).limit(30),
      loadExecutiveMemory(auth.db, tenantId, 'Eva', 20),
    ]);

    const errors = [runs.error, actions.error, executions.error, outcomes.error, workers.error].filter(Boolean);
    if (errors.length) throw errors[0];

    const runRows = runs.data || [];
    const actionRows = actions.data || [];
    const executionRows = executions.data || [];
    const receipts = runRows.map((run) => receiptForRun(run, actionRows, executionRows));

    return NextResponse.json({
      businessName: membership.tenant.business_name,
      slug,
      router: getRouterStatus(),
      memory,
      outcomes: outcomes.data || [],
      workers: workers.data || [],
      runs: runRows,
      receipts,
      metrics: {
        activeOutcomes: (outcomes.data || []).filter((item) => !['completed', 'archived', 'cancelled'].includes(String(item.status || '').toLowerCase())).length,
        activeWorkers: (workers.data || []).filter((item) => ['queued', 'running', 'waiting_approval'].includes(String(item.status || '').toLowerCase())).length,
        councilRuns: runRows.filter((item) => String(item.routing?.source || '') === 'aridon-one-council').length,
        verifiedReceipts: receipts.filter((item) => item.state === 'verified').length,
        awaitingApproval: receipts.filter((item) => item.state === 'awaiting_approval').length,
        memoryItems: memory.memories.length,
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Aridon One load error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Aridon One is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = new Date().toISOString();
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const slug = text(body?.slug, 80);
    const mode = text(body?.mode, 40).toLowerCase();
    const objective = text(body?.objective, 9000);
    if (!slug || !mode) return NextResponse.json({ error: 'Workspace and mode are required.' }, { status: 400, headers: NO_STORE });

    const resolved = await membershipForRequest(request, slug);
    if (!resolved.ok) return resolved.response;
    const { auth, membership } = resolved;
    const tenantId = membership.tenant.id;

    if (mode === 'council') {
      if (objective.length < 8) return NextResponse.json({ error: 'A clear Council objective is required.' }, { status: 400, headers: NO_STORE });
      const [company, memory] = await Promise.all([
        loadCustomerExecutiveContext(auth.db, membership.tenant),
        loadExecutiveMemory(auth.db, tenantId, 'Eva', 16),
      ]);
      const council = await runAridonCouncil({ objective, companyContext: company.context, memoryContext: memory.context, maxMembers: 4 });
      const completedAt = new Date().toISOString();
      const { data: run, error: runError } = await auth.db.from('customer_agent_runs').insert({
        tenant_id: tenantId,
        user_id: auth.user.id,
        objective,
        status: 'completed',
        plan: { mode: 'council', members: council.members, synthesis: council.synthesis, sources: council.sources },
        final_output: council.synthesis.slice(0, 12000),
        routing: {
          source: 'aridon-one-council',
          members: council.members.map((member) => ({ seat: member.seat, provider: member.provider, model: member.model })),
          synthesis: council.synthesisRouting,
        },
        retry_count: 0,
        started_at: startedAt,
        completed_at: completedAt,
        updated_at: completedAt,
      }).select('id,objective,status,plan,final_output,routing,started_at,completed_at,created_at,updated_at').single();
      if (runError) throw runError;

      await rememberExecutiveOutcome({
        db: auth.db,
        tenantId,
        executiveId: 'Eva',
        objective,
        outcome: council.synthesis.slice(0, 2200),
        reflection: `Aridon One Council compared ${council.members.length} distinct model provider${council.members.length === 1 ? '' : 's'} before Eva synthesized the decision. Preserve disagreements when they change risk or execution.`,
        source: 'aridon-one-council',
        memoryType: 'council_decision',
        confidence: council.members.length >= 3 ? 0.9 : 0.8,
      });

      return NextResponse.json({ mode: 'council', council, run }, { headers: NO_STORE });
    }

    if (mode === 'outcome') {
      if (objective.length < 8) return NextResponse.json({ error: 'A clear outcome objective is required.' }, { status: 400, headers: NO_STORE });
      const name = text(body?.name, 180) || objective.slice(0, 180);
      const successDefinition = text(body?.successDefinition, 3000);
      const unit = text(body?.unit, 40) || null;
      const baseline = numberOrNull(body?.baseline);
      const target = numberOrNull(body?.target);
      const executive = text(body?.executive, 80) || 'Eva';
      const priorityCandidate = text(body?.priority, 20).toLowerCase();
      const priority = ['low', 'medium', 'high', 'urgent'].includes(priorityCandidate) ? priorityCandidate : 'high';
      const now = new Date().toISOString();

      const { data: outcome, error: outcomeError } = await auth.db.from('customer_outcomes').insert({
        tenant_id: tenantId,
        category: 'aridon-one',
        name,
        source: 'aridon-one-outcome',
        baseline_value: baseline,
        current_value: baseline,
        target_value: target,
        unit,
        status: 'tracking',
        attribution: { owner: auth.user.id, executive, objective },
        notes: successDefinition || objective,
        updated_at: now,
      }).select('*').single();
      if (outcomeError) throw outcomeError;

      const { data: worker, error: workerError } = await auth.db.from('customer_cloud_workers').insert({
        tenant_id: tenantId,
        requested_by: auth.user.id,
        executive,
        name: `Outcome · ${name}`.slice(0, 240),
        objective: `${objective}${successDefinition ? `\n\nSUCCESS DEFINITION\n${successDefinition}` : ''}`.slice(0, 9000),
        mode: 'outcome',
        priority,
        status: 'queued',
        provider: 'aridon-one-router',
        checkpoint: { outcome_id: outcome.id, success_definition: successDefinition || null, created_by: 'aridon-one' },
        result: {},
        cycle_count: 0,
        max_cycles: 12,
        next_run_at: now,
        error: null,
        updated_at: now,
      }).select('*').single();
      if (workerError) throw workerError;

      await auth.db.from('customer_cloud_worker_events').insert({
        tenant_id: tenantId,
        worker_id: worker.id,
        event_type: 'outcome_started',
        message: `Aridon One started Outcome Mode for: ${name}`.slice(0, 6000),
        payload: { outcome_id: outcome.id, objective, successDefinition, executive, priority },
      });

      await rememberExecutiveOutcome({
        db: auth.db,
        tenantId,
        executiveId: executive,
        objective,
        outcome: `Persistent Outcome Mode started. Worker ${worker.id} will continue on Aridon's cloud-worker schedule until the objective is completed, blocked, or waiting for owner approval.`,
        reflection: successDefinition ? `Success is defined as: ${successDefinition}` : 'Success still needs to be judged against the owner objective without inventing a numeric target.',
        source: 'aridon-one-outcome',
        memoryType: 'persistent_objective',
        confidence: 0.95,
      });

      return NextResponse.json({ mode: 'outcome', outcome, worker, scheduler: 'every 5 minutes' }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: 'Unknown Aridon One mode. Use council or outcome.' }, { status: 400, headers: NO_STORE });
  } catch (error) {
    console.error('Aridon One action error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Aridon One could not complete this request.' }, { status: 500, headers: NO_STORE });
  }
}
