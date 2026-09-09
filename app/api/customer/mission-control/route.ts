import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { loadCustomerExecutiveContext } from '../../../../lib/customerExecutiveContext';
import { executives } from '../../../../lib/executives';
import { routeModel } from '../../../../lib/modelRouter';

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

    const membership = await customerTenantForUser(auth.user.id, slug);
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
      db.from('customer_action_queue').select('id,executive,action_type,title,rationale,expected_outcome,risk_level,approval_required,status,created_at,updated_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(24),
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

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const company = await loadCustomerExecutiveContext(auth.db, membership.tenant);
    const roster = executives.map((executive) => `${executive.name} | ${executive.role} | ${executive.focus}`).join('\n');
    const system = `You are Eva, Aridon's Mission Control orchestrator. Convert the owner's objective into a controlled, measurable mission for the AI executive team.\n\nEXECUTIVE ROSTER\n${roster}\n\nChoose one industryPack from: ${industryPacks.map((pack) => pack.id).join(', ')}.\n\nReturn JSON only with this exact shape: {"missionTitle":"...","objective":"...","industryPack":"...","executiveLead":"...","supportingExecutives":["..."],"outcomeMetric":{"name":"...","unit":"...","baseline":"...","target":"..."},"successDefinition":"...","phases":[{"name":"...","purpose":"...","actions":["..."]}],"immediateActions":[{"owner":"...","action":"...","approvalRequired":true,"reason":"..."}],"approvalGates":["..."],"risks":["..."],"nextDecision":"..."}.\n\nRules: create plans, analysis, research steps, draft deliverables, and internal actions. Never claim an email was sent, a purchase was made, a contract was signed, money was moved, a public filing was submitted, or any external action occurred unless the company context proves it. Preserve owner control over external sends, spending, signatures, commitments, consequential claims, and destructive actions. Do not invent customer facts, contacts, prices, approvals, partners, metrics, citations, or results.`;

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
      const queuePayload = immediateActions.map((item: any) => ({
        tenant_id: membership.tenant.id,
        requested_by: auth.user.id,
        executive: text(item?.owner, 80) || routing.executiveLead,
        action_type: 'mission_step',
        title: text(item?.action, 500) || 'Mission step',
        payload: { mission_run_id: savedRun.id, industry_pack: routing.industryPack },
        rationale: text(item?.reason, 1500) || null,
        expected_outcome: text(mission.successDefinition, 1200) || successDefinition || null,
        risk_level: item?.approvalRequired ? 'medium' : 'low',
        approval_required: Boolean(item?.approvalRequired),
        status: 'proposed',
        updated_at: completedAt,
      }));
      const { data, error } = await auth.db.from('customer_action_queue').insert(queuePayload).select('id,executive,title,risk_level,approval_required,status');
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
