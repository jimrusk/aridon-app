import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { loadCustomerExecutiveContext } from '../../../../lib/customerExecutiveContext';
import { executives } from '../../../../lib/executives';
import { routeModel } from '../../../../lib/modelRouter';
import { normalizeActionAdapterKey } from '../../../../lib/actionFabric';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function numeric(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseJson(value: string) {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(trimmed); } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(trimmed.slice(start, end + 1)); } catch { return null; }
    }
    return null;
  }
}

function objectValue(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function missionActionSpec(item: any) {
  const requested = normalizeActionAdapterKey(item?.adapterKey, item?.actionType);
  const raw = objectValue(item?.payload);

  if (requested === 'email_send') {
    const to = text(raw.to, 254);
    const subject = text(raw.subject, 300);
    const body = text(raw.body, 50_000);
    if (validEmail(to) && subject && body) {
      return { adapterKey: 'email_send' as const, actionType: 'email_send', payload: { to, subject, body }, connectionKey: 'workspace-account' };
    }
  }

  if (requested === 'calendar_create') {
    const summary = text(raw.summary, 500) || text(item?.action, 500);
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
        connectionKey: 'workspace-account',
      };
    }
  }

  if (requested === 'internal_task') {
    const title = text(raw.title, 500) || text(item?.action, 500) || 'Mission task';
    const owner = text(raw.owner, 160) || text(item?.owner, 80) || 'Eva';
    const requestedPriority = text(raw.priority, 30).toLowerCase();
    const priority = ['low', 'medium', 'high', 'urgent'].includes(requestedPriority) ? requestedPriority : 'medium';
    return { adapterKey: 'internal_task' as const, actionType: 'internal_task', payload: { title, owner, priority }, connectionKey: null };
  }

  return { adapterKey: 'manual' as const, actionType: 'mission_step', payload: {}, connectionKey: null };
}

const industryPacks = [
  { id: 'business-core', name: 'Business Core', description: 'Executive strategy, operations, company memory and controlled execution.' },
  { id: 'growth-sales', name: 'Growth & Sales', description: 'Customers, positioning, pipeline, outreach and measurable revenue work.' },
  { id: 'finance-capital', name: 'Finance & Capital', description: 'Cash, funding, grants, investors, budgets and capital strategy.' },
  { id: 'agriculture', name: 'Aridon Ag', description: 'Farm, ranch, greenhouse, grain, grazing, irrigation and producer economics.' },
  { id: 'utilities-grid', name: 'Utilities & Grid', description: 'Electric, water, resilience, asset intelligence and utility operations.' },
  { id: 'water-awg', name: 'Water & AWG', description: 'Atmospheric water, treatment, pilots, manufacturing and water security.' },
  { id: 'manufacturing-rd', name: 'Manufacturing & R&D', description: 'Engineering programs, prototypes, vendors, testing and domestic manufacturing.' },
  { id: 'acquisitions', name: 'Acquisitions', description: 'Deal screening, underwriting, diligence, structures and takeover planning.' },
  { id: 'campus-infrastructure', name: 'Campus & Infrastructure', description: 'Sites, buildings, tenants, sponsors, utilities and phased development.' },
];

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const tenantId = membership.tenant.id;
    const db = auth.db;
    const [projects, tasks, knowledge, files, messages, outcomes, runs, actionQueue, memories] = await Promise.all([
      db.from('customer_projects').select('id,name,status,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(40),
      db.from('customer_tasks').select('id,title,owner,priority,status,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(80),
      db.from('customer_knowledge').select('id,title,category,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(40),
      db.from('customer_files').select('id,filename,status,extraction_status,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(40),
      db.from('customer_assistant_messages').select('id,role,content,web_research,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(30),
      db.from('customer_outcomes').select('id,category,name,source,baseline_value,current_value,target_value,unit,status,notes,created_at,updated_at').eq('tenant_id', tenantId).order('updated_at', { ascending: false }).limit(20),
      db.from('customer_agent_runs').select('id,objective,status,plan,final_output,routing,started_at,completed_at,created_at,updated_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(20),
      db.from('customer_action_queue').select('id,executive,action_type,adapter_key,title,rationale,expected_outcome,risk_level,approval_required,status,created_at,updated_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(24),
      db.from('customer_executive_memories').select('id,executive_id,memory_type,summary,confidence,source,created_at,last_reinforced_at').eq('tenant_id', tenantId).order('last_reinforced_at', { ascending: false }).limit(20),
    ]);

    const errors = [projects.error, tasks.error, knowledge.error, files.error, messages.error, outcomes.error, runs.error, actionQueue.error, memories.error].filter(Boolean);
    if (errors.length) throw errors[0];

    const taskRows = tasks.data || [];
    const projectRows = projects.data || [];
    const messageRows = messages.data || [];
    const outcomeRows = outcomes.data || [];
    const runRows = runs.data || [];
    const queueRows = actionQueue.data || [];
    const memoryRows = memories.data || [];

    const completedTasks = taskRows.filter((item) => {
      const status = String(item.status || '').toLowerCase();
      return status.includes('complete') || status === 'done';
    }).length;
    const activeProjects = projectRows.filter((item) => !['complete', 'completed', 'done', 'archived'].includes(String(item.status || '').toLowerCase())).length;
    const pendingApprovals = queueRows.filter((item) => item.approval_required && !['approved', 'completed', 'executed', 'rejected', 'cancelled'].includes(String(item.status || '').toLowerCase())).length;
    const trackedOutcomes = outcomeRows.filter((item) => !['archived', 'cancelled'].includes(String(item.status || '').toLowerCase())).length;
    const completedMissionRuns = runRows.filter((item) => ['complete', 'completed', 'done', 'success'].includes(String(item.status || '').toLowerCase())).length;

    const recentActivity = messageRows
      .filter((item) => item.role === 'assistant')
      .slice(0, 8)
      .map((item) => ({ id: item.id, summary: text(item.content, 220), webResearch: Boolean(item.web_research), createdAt: item.created_at }));

    return NextResponse.json({
      businessName: membership.tenant.business_name,
      plan: membership.tenant.plan,
      role: membership.role,
      telemetry: {
        activeProjects,
        openTasks: Math.max(0, taskRows.length - completedTasks),
        completedTasks,
        companyBrainItems: (knowledge.data || []).length,
        readyFiles: (files.data || []).filter((item) => item.status === 'ready').length,
        executiveRuns: messageRows.filter((item) => item.role === 'assistant').length,
        webResearchRuns: messageRows.filter((item) => item.role === 'assistant' && item.web_research).length,
        trackedOutcomes,
        pendingApprovals,
        missionRuns: runRows.length,
        completedMissionRuns,
        executiveMemories: memoryRows.length,
      },
      taskPressure: taskRows.slice(0, 12),
      projectPulse: projectRows.slice(0, 10),
      recentActivity,
      outcomes: outcomeRows,
      missionRuns: runRows,
      actionQueue: queueRows,
      memories: memoryRows,
      industryPacks,
      system: {
        companyBrain: true,
        boardroom: true,
        execution: true,
        ceoBrief: true,
        approvalPolicy: true,
        voiceRoom: true,
        liveWebResearch: true,
        growthCommand: true,
        benchmarkLab: true,
        outcomeEngine: true,
        actionCenter: true,
        industryRouting: true,
        multiModelRouting: true,
        actionFabric: true,
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Mission Control load error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mission Control is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = new Date().toISOString();
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const body = await request.json();
    const slug = text(body?.slug, 80);
    const objective = text(body?.objective, 6000);
    const successDefinition = text(body?.successDefinition, 3000);
    if (!slug || objective.length < 12) {
      return NextResponse.json({ error: 'Workspace and a clear objective are required.' }, { status: 400, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const company = await loadCustomerExecutiveContext(auth.db, membership.tenant);
    const roster = executives.map((executive) => `${executive.name} | ${executive.role} | ${executive.focus}`).join('\n');
    const system = `You are Eva, Aridon's Mission Control orchestrator. Convert the owner's objective into a controlled, measurable mission for the AI executive team.\n\nEXECUTIVE ROSTER\n${roster}\n\nChoose one industryPack from: ${industryPacks.map((pack) => pack.id).join(', ')}.\n\nReturn JSON only with this exact shape: {"missionTitle":"...","objective":"...","industryPack":"...","executiveLead":"...","supportingExecutives":["..."],"outcomeMetric":{"name":"...","unit":"...","baseline":"...","target":"..."},"successDefinition":"...","phases":[{"name":"...","purpose":"...","actions":["..."]}],"immediateActions":[{"owner":"...","action":"...","adapterKey":"manual|internal_task|email_send|calendar_create","payload":{},"approvalRequired":true,"reason":"..."}],"approvalGates":["..."],"risks":["..."],"nextDecision":"..."}.\n\nACTION FABRIC RULES:\n- Every immediate action is a proposal. External actions always require owner approval before execution.\n- Use internal_task when Aridon can safely create an internal workspace task. Payload: {"title":"...","owner":"...","priority":"low|medium|high|urgent"}.\n- Use email_send only when the exact recipient email address is explicitly present in COMPANY CONTEXT or OWNER OBJECTIVE. Never infer or fabricate an email address. Payload: {"to":"exact@example.com","subject":"...","body":"complete draft message"}.\n- Use calendar_create only when exact start and end date-times are explicitly known. Never guess meeting dates or times. Payload: {"summary":"...","description":"...","location":"...","start":"ISO date-time","end":"ISO date-time","timeZone":"IANA zone if known","attendees":["exact@example.com"]}.\n- If an external action would be useful but exact execution details are missing, use manual. Do not invent the missing details.\n- Do not put secrets, tokens, passwords, bank details, or private credentials into an action payload.\n\nGENERAL RULES: create plans, analysis, research steps, draft deliverables, and internal actions. Never claim an email was sent, a purchase was made, a contract was signed, money was moved, a public filing was submitted, or any external action occurred unless the company context proves it. Preserve owner control over external sends, spending, signatures, commitments, consequential claims, and destructive actions. Do not invent customer facts, contacts, prices, approvals, partners, metrics, citations, or results.`;

    const modelResult = await routeModel([
      {
        role: 'user',
        content: `COMPANY CONTEXT\n${company.context}\n\nOWNER OBJECTIVE\n${objective}\n\nSUCCESS DEFINITION\n${successDefinition || 'Define the clearest measurable success condition without inventing a numeric target.'}`,
      },
    ], system);

    const mission = parseJson(modelResult.text);
    if (!mission || typeof mission !== 'object') throw new Error('Mission Control returned an invalid planning result.');

    const completedAt = new Date().toISOString();
    const routing = {
      industryPack: typeof mission.industryPack === 'string' ? mission.industryPack : 'business-core',
      executiveLead: typeof mission.executiveLead === 'string' ? mission.executiveLead : 'Eva',
      supportingExecutives: Array.isArray(mission.supportingExecutives) ? mission.supportingExecutives.slice(0, 8) : [],
      model: {
        task: modelResult.routing.task,
        provider: modelResult.routing.provider,
        model: modelResult.routing.model,
        reason: modelResult.routing.reason,
        fallbackUsed: modelResult.routing.fallbackUsed,
        attempts: modelResult.routing.attempts,
        totalLatencyMs: modelResult.routing.totalLatencyMs,
      },
      source: 'mission-control',
    };

    const { data: savedRun, error: runError } = await auth.db.from('customer_agent_runs').insert({
      tenant_id: membership.tenant.id,
      user_id: auth.user.id,
      objective,
      status: 'completed',
      plan: mission,
      final_output: typeof mission.nextDecision === 'string' ? mission.nextDecision : null,
      routing,
      retry_count: 0,
      started_at: startedAt,
      completed_at: completedAt,
      updated_at: completedAt,
    }).select('id,objective,status,plan,final_output,routing,started_at,completed_at,created_at,updated_at').single();
    if (runError) throw runError;

    const immediateActions = Array.isArray(mission.immediateActions) ? mission.immediateActions.slice(0, 10) : [];
    let queuedActions: unknown[] = [];
    if (immediateActions.length) {
      const queuePayload = immediateActions.map((item: any, index: number) => {
        const spec = missionActionSpec(item);
        return {
          tenant_id: membership.tenant.id,
          requested_by: auth.user.id,
          executive: text(item?.owner, 80) || routing.executiveLead,
          action_type: spec.actionType,
          adapter_key: spec.adapterKey,
          title: text(item?.action, 500) || 'Mission step',
          payload: { ...spec.payload, mission_run_id: savedRun.id, industry_pack: routing.industryPack },
          rationale: text(item?.reason, 1500) || null,
          expected_outcome: text(mission.successDefinition, 1200) || successDefinition || null,
          risk_level: spec.adapterKey === 'email_send' || spec.adapterKey === 'calendar_create' ? 'medium' : 'low',
          approval_required: true,
          status: 'proposed',
          source: 'mission-control',
          source_ref: savedRun.id,
          idempotency_key: `${savedRun.id}:${index}`,
          connection_key: spec.connectionKey,
          updated_at: completedAt,
        };
      });
      const { data, error } = await auth.db.from('customer_action_queue').insert(queuePayload).select('id,executive,action_type,adapter_key,title,risk_level,approval_required,status');
      if (error) throw error;
      queuedActions = data || [];
    }

    const outcomeMetric = mission.outcomeMetric && typeof mission.outcomeMetric === 'object' ? mission.outcomeMetric : null;
    let trackedOutcome: unknown = null;
    if (outcomeMetric && text(outcomeMetric.name, 160)) {
      const { data, error } = await auth.db.from('customer_outcomes').insert({
        tenant_id: membership.tenant.id,
        category: routing.industryPack,
        name: text(outcomeMetric.name, 160),
        source: 'mission-control',
        baseline_value: numeric(outcomeMetric.baseline),
        current_value: numeric(outcomeMetric.baseline),
        target_value: numeric(outcomeMetric.target),
        unit: text(outcomeMetric.unit, 40) || null,
        status: 'tracking',
        attribution: {
          mission_run_id: savedRun.id,
          executive_lead: routing.executiveLead,
          model_provider: modelResult.routing.provider,
          model: modelResult.routing.model,
        },
        notes: text(mission.successDefinition, 2500) || successDefinition || null,
        updated_at: completedAt,
      }).select('id,category,name,baseline_value,current_value,target_value,unit,status,notes,created_at,updated_at').single();
      if (error) throw error;
      trackedOutcome = data;
    }

    await auth.db.from('customer_usage_events').insert({
      tenant_id: membership.tenant.id,
      user_id: auth.user.id,
      event_name: 'mission_control_run',
      event_data: {
        objective: objective.slice(0, 500),
        industry_pack: routing.industryPack,
        executive_lead: routing.executiveLead,
        model_provider: modelResult.routing.provider,
        model: modelResult.routing.model,
        fallback_used: modelResult.routing.fallbackUsed,
      },
    });

    return NextResponse.json({ mission, run: savedRun, queuedActions, trackedOutcome, modelRouting: modelResult.routing }, { headers: NO_STORE });
  } catch (error) {
    console.error('Mission Control run error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mission Control is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}
