import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { executives } from '../../../../lib/executives';
import { getRouterStatus, routeModel, type AridonChatMessage, type AridonMode } from '../../../../lib/modelRouter';
import {
  actModeSystemContract,
  memorySummary,
  memoryTypeFor,
  normalizeBrainMode,
  parseBrainAction,
  shouldCaptureMemory,
  stripActionMarker,
  type BrainActionProposal,
} from '../../../../lib/aridonBrain';
import { connectedExecutiveActor } from '../../../../lib/executiveOps';
import { GMAIL_REFRESH_COOKIE } from '../../../../lib/gmail';
import { MS_REFRESH_COOKIE } from '../../../../lib/microsoft365';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const CONTROL_ROLES = new Set(['owner', 'admin']);

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 28) return null;
  const messages: ChatMessage[] = [];
  let total = 0;
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const role = 'role' in item ? item.role : undefined;
    const content = 'content' in item ? item.content : undefined;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const cleaned = content.trim();
    if (!cleaned || cleaned.length > 7000) return null;
    total += cleaned.length;
    if (total > 42000) return null;
    messages.push({ role, content: cleaned });
  }
  return messages;
}

function routedExecutive(requested: string, messages: ChatMessage[]) {
  const explicit = executives.find((item) => item.name.toLowerCase() === requested.toLowerCase());
  if (explicit) return explicit;

  const latest = [...messages].reverse().find((message) => message.role === 'user')?.content.toLowerCase() || '';
  const route = (name: string) => executives.find((item) => item.name === name) || executives[executives.length - 1];

  if (/\b(farm|ranch|crop|livestock|cattle|agriculture|agricultural|agriwebb|producer|acre|harvest|irrigation|tractor|equipment|buyer|buyers|usda|nrcs|fsa)\b/.test(latest)) return route('Sierra Bennett');
  if (/\b(awg|atmospheric water|water|drought|well|energy|power|microgrid|battery|solar|iron grid|resilience|kilowatt|kwh|storage)\b/.test(latest)) return route('Maya Torres');
  if (/\b(research|investigate|company research|contact research|verify|source|compare|comparison|diligence|background|intelligence|find out|what changed|changes|evidence)\b/.test(latest)) return route('Claire Morgan');
  if (/\b(cash|budget|forecast|finance|financial|funding|loan|debt|capital|margin|profit|cost|expense|apr|valuation)\b/.test(latest)) return route('Nova');
  if (/\b(contract|legal|compliance|regulation|regulatory|risk|liability|terms|agreement|governance|lawsuit|attorney)\b/.test(latest)) return route('Ethos');
  if (/\b(technology|technical|software|code|api|integration|deployment|database|engineering|system|architecture|bug|website|app|ai)\b/.test(latest)) return route('Atlas');
  if (/\b(marketing|campaign|brand|message|messaging|advertising|seo|content|press|communications|social media)\b/.test(latest)) return route('Oracle');
  if (/\b(revenue|sales|pipeline|pricing|lead|leads|customer|customers|conversion|close|deal|prospect|follow[- ]?up)\b/.test(latest)) return route('Ledger');
  if (/\b(strategy|market|competitor|competition|partnership|positioning|growth plan|opportunity|acquisition|expand|expansion)\b/.test(latest)) return route('Scout');
  if (/\b(operations|operate|project|task|deadline|workflow|process|priority|priorities|execution|team|schedule|stuck|blocker)\b/.test(latest)) return route('Heather');
  return route('Eva');
}

function safeRouting(routing: any) {
  return {
    mode: routing.mode,
    task: routing.task,
    provider: routing.provider,
    model: routing.model,
    reason: routing.reason,
    fallbackUsed: routing.fallbackUsed,
    totalLatencyMs: routing.totalLatencyMs,
    attempts: Array.isArray(routing.attempts)
      ? routing.attempts.map((attempt: any) => ({ provider: attempt.provider, model: attempt.model, ok: attempt.ok, latencyMs: attempt.latencyMs }))
      : [],
  };
}

function capabilitySnapshot(request: NextRequest, fileCount: number, memoryCount: number) {
  const actor = connectedExecutiveActor(request);
  const router = getRouterStatus();
  const providers = router.providers.filter((provider) => provider.enabled).map((provider) => ({ provider: provider.provider, label: provider.label, model: provider.model }));
  return {
    googleWorkspace: Boolean(request.cookies.get(GMAIL_REFRESH_COOKIE)?.value),
    microsoft365: Boolean(request.cookies.get(MS_REFRESH_COOKIE)?.value),
    connectedExecutionProvider: actor.provider,
    actionFabric: true,
    companyFiles: fileCount,
    durableMemories: memoryCount,
    aiProviders: providers,
    modes: router.userModes,
  };
}

async function resolveWorkspace(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { ok: false as const, response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const slug = text(request.method === 'GET' ? request.nextUrl.searchParams.get('slug') : '', 80);
  const membership = slug ? await customerTenantForUser(auth.user.id, slug, auth.token) : null;
  return { ok: true as const, auth, slug, membership };
}

export async function GET(request: NextRequest) {
  try {
    const resolved = await resolveWorkspace(request);
    if (!resolved.ok) return resolved.response;
    const { auth, slug } = resolved;
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const membership = resolved.membership;
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });

    const [historyResult, fileResult, memoryResult] = await Promise.all([
      auth.db
        .from('customer_assistant_messages')
        .select('id,role,content,assistant_mode,executive_name,provider,model,routing,sources,action_id,created_at')
        .eq('tenant_id', membership.tenant.id)
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })
        .limit(30),
      auth.db
        .from('customer_files')
        .select('id')
        .eq('tenant_id', membership.tenant.id)
        .eq('status', 'ready')
        .limit(100),
      auth.db
        .from('customer_executive_memories')
        .select('id')
        .eq('tenant_id', membership.tenant.id)
        .limit(100),
    ]);
    if (historyResult.error) throw historyResult.error;
    if (fileResult.error) throw fileResult.error;
    if (memoryResult.error) throw memoryResult.error;

    return NextResponse.json({
      history: [...(historyResult.data || [])].reverse(),
      capabilities: capabilitySnapshot(request, (fileResult.data || []).length, (memoryResult.data || []).length),
      role: membership.role,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer assistant history error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load conversation history.' }, { status: 500, headers: NO_STORE });
  }
}

function manualActFallback(latestRequest: string): BrainActionProposal {
  return {
    adapterKey: 'manual',
    title: text(`Follow through on: ${latestRequest}`, 500) || 'Review requested action',
    payload: { request: text(latestRequest, 1600) },
    rationale: 'Act mode was requested, but no safe executable adapter payload was returned. The work is held instead of guessed.',
    expectedOutcome: 'Resolve the missing execution details, then continue through Action Fabric.',
    riskLevel: 'medium',
    approvalRequired: true,
  };
}

async function queueActProposal(input: {
  db: any;
  tenantId: string;
  userId: string;
  role: string;
  executive: string;
  proposal: BrainActionProposal;
  latestRequest: string;
  routing: any;
}) {
  const { db, tenantId, userId, role, executive, proposal, latestRequest, routing } = input;
  const controlRole = CONTROL_ROLES.has(role);
  const approvalRequired = proposal.adapterKey === 'internal_task'
    ? proposal.approvalRequired || !controlRole
    : true;
  const now = new Date().toISOString();
  const idempotencyKey = `assistant-act-${createHash('sha256').update(`${tenantId}|${userId}|${executive}|${latestRequest}`).digest('hex').slice(0, 48)}`;

  const { data: existing, error: existingError } = await db
    .from('customer_action_queue')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await db
    .from('customer_action_queue')
    .insert({
      tenant_id: tenantId,
      requested_by: userId,
      executive,
      action_type: proposal.adapterKey,
      adapter_key: proposal.adapterKey,
      title: proposal.title,
      payload: proposal.payload,
      rationale: proposal.rationale || null,
      expected_outcome: proposal.expectedOutcome || null,
      risk_level: proposal.riskLevel,
      approval_required: approvalRequired,
      status: approvalRequired ? 'proposed' : 'approved',
      approved_by: approvalRequired ? null : userId,
      approved_at: approvalRequired ? null : now,
      source: 'assistant-act',
      source_ref: `${routing.provider}:${routing.model}`.slice(0, 200),
      idempotency_key: idempotencyKey,
      connection_key: ['email_send', 'calendar_create'].includes(proposal.adapterKey) ? 'workspace-account' : null,
      updated_at: now,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function captureDurableMemory(db: any, tenantId: string, executiveId: string, latestRequest: string) {
  if (!shouldCaptureMemory(latestRequest)) return null;
  const summary = memorySummary(latestRequest);
  const { data: existing, error: lookupError } = await db
    .from('customer_executive_memories')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('executive_id', executiveId)
    .eq('summary', summary)
    .limit(1)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing;

  const { data, error } = await db
    .from('customer_executive_memories')
    .insert({
      tenant_id: tenantId,
      executive_id: executiveId,
      memory_type: memoryTypeFor(latestRequest),
      summary,
      confidence: 0.86,
      source: 'conversation',
      last_reinforced_at: new Date().toISOString(),
    })
    .select('id,memory_type,summary')
    .single();
  if (error) throw error;
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const slug = text(body?.slug, 80);
    const messages = cleanMessages(body?.messages);
    const mode: AridonMode = normalizeBrainMode(body?.mode, Boolean(body?.researchWeb));
    const executiveName = text(body?.executive, 80) || 'Auto';
    if (!slug || !messages) return NextResponse.json({ error: 'Workspace and message history are required.' }, { status: 400, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });

    const executive = routedExecutive(executiveName, messages);
    const autoRouted = !executives.some((item) => item.name.toLowerCase() === executiveName.toLowerCase());
    const latestUser = [...messages].reverse().find((message) => message.role === 'user');
    if (!latestUser) return NextResponse.json({ error: 'A user request is required.' }, { status: 400, headers: NO_STORE });

    const [projectsResult, tasksResult, knowledgeResult, filesResult, memoriesResult] = await Promise.all([
      auth.db.from('customer_projects').select('name,description,status').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(12),
      auth.db.from('customer_tasks').select('title,owner,priority,status').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(20),
      auth.db.from('customer_knowledge').select('title,category,content').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(14),
      auth.db.from('customer_files').select('filename,extracted_text,extraction_status,notes').eq('tenant_id', membership.tenant.id).eq('status', 'ready').order('created_at', { ascending: false }).limit(10),
      auth.db.from('customer_executive_memories').select('executive_id,memory_type,summary,confidence,last_reinforced_at').eq('tenant_id', membership.tenant.id).order('last_reinforced_at', { ascending: false }).limit(20),
    ]);
    const contextErrors = [projectsResult.error, tasksResult.error, knowledgeResult.error, filesResult.error, memoriesResult.error].filter(Boolean);
    if (contextErrors.length) throw contextErrors[0];

    const knowledge = (knowledgeResult.data || []).map((item) => ({ title: item.title, category: item.category, content: text(item.content, 2800) }));
    const sourceFiles = (filesResult.data || []).filter((item) => item.extracted_text).map((item) => ({
      filename: item.filename,
      extraction_status: item.extraction_status,
      content: text(item.extracted_text, 4200),
      note: text(item.notes, 400),
    }));
    const memories = (memoriesResult.data || []).map((item) => ({
      executive: item.executive_id,
      type: item.memory_type,
      summary: text(item.summary, 900),
      confidence: item.confidence,
      last_reinforced_at: item.last_reinforced_at,
    }));
    const capabilities = capabilitySnapshot(request, sourceFiles.length, memories.length);

    const tenantContext = JSON.stringify({
      business: membership.tenant.business_name,
      industry: membership.tenant.industry,
      plan: membership.tenant.plan,
      projects: projectsResult.data || [],
      tasks: tasksResult.data || [],
      knowledge,
      uploaded_company_files: sourceFiles,
      durable_executive_memory: memories,
      connected_capabilities: {
        google_workspace: capabilities.googleWorkspace,
        microsoft_365: capabilities.microsoft365,
        action_fabric: true,
        available_ai_engines: capabilities.aiProviders.map((provider) => provider.label),
      },
    }, null, 2).slice(0, 52000);

    let systemPrompt = `You are ${executive.name}, the ${executive.role} inside Aridon, a customer's Private Business OS. You are one member of an eleven-executive digital leadership team.\n\nYOUR EXECUTIVE LANE:\n- Role: ${executive.role}\n- Primary focus: ${executive.focus}\n- Tone: ${executive.tone}\n- Communication style: ${executive.voice}\n- Expertise: ${executive.expertise.join(', ')}\n\nARIDON BRAIN RULES:\n- You serve this customer's company. Never expose or imply access to another tenant's information.\n- Use Company Brain, recent projects/tasks, durable executive memory and uploaded-file extractions when relevant. Treat company-entered data and file extractions as user-provided context, not independently verified facts.\n- Maintain continuity across sessions. Durable memory is context, not proof of an external fact.\n- You may use whichever AI engine Aridon's router selects. Do not claim that a particular provider was used before routing occurs.\n- Stay in your executive lane when it helps, but collaborate across the executive team. If another executive is better suited, identify who should join and why.\n- Be practical, warm and action-oriented. Challenge weak assumptions when stakes matter.\n- Never claim an external action was completed unless Action Fabric or another connected tool actually performed it.\n- External sends, spending, signatures, commitments, destructive actions and consequential claims require explicit approval.\n- If a connection is unavailable, say exactly what is missing rather than pretending.\n- For legal, tax, accounting, medical, safety or regulated decisions, provide general information and recommend qualified review when appropriate.\n- Do not reveal private chain-of-thought. Give concise reasoning summaries instead.\n- When useful, finish with the next 1 to 3 actions.\n\nTENANT CONTEXT:\n${tenantContext}`;
    if (mode === 'act') systemPrompt += actModeSystemContract();

    const modelMessages: AridonChatMessage[] = messages.map((message) => ({ role: message.role, content: message.content }));
    const modelResult = await routeModel(modelMessages, systemPrompt, { mode });
    const rawReply = modelResult.text;
    const visibleReply = mode === 'act' ? stripActionMarker(rawReply) : rawReply;
    if (!visibleReply) throw new Error(`${executive.name} returned no readable response.`);

    let queuedAction: any = null;
    if (mode === 'act') {
      const proposal = parseBrainAction(rawReply, latestUser.content) || manualActFallback(latestUser.content);
      queuedAction = await queueActProposal({
        db: auth.db,
        tenantId: membership.tenant.id,
        userId: auth.user.id,
        role: membership.role,
        executive: executive.name,
        proposal,
        latestRequest: latestUser.content,
        routing: modelResult.routing,
      });
    }

    let capturedMemory: any = null;
    try {
      capturedMemory = await captureDurableMemory(auth.db, membership.tenant.id, executive.id, latestUser.content);
    } catch (memoryError) {
      console.error('Aridon durable memory capture failed', memoryError);
    }

    const researchWarning = modelResult.routing.task === 'live_research' && modelResult.routing.provider !== 'openai'
      ? 'The selected fallback engine did not provide Aridon with live web-source capture, so current facts should be verified before external use.'
      : '';
    const routing = safeRouting(modelResult.routing);
    const sources = modelResult.sources || [];

    const { error: logError } = await auth.db.from('customer_assistant_messages').insert([
      {
        tenant_id: membership.tenant.id,
        user_id: auth.user.id,
        role: 'user',
        content: latestUser.content,
        web_research: mode === 'research' || modelResult.routing.task === 'live_research',
        assistant_mode: mode,
        executive_name: executive.name,
        routing: { requestedExecutive: executiveName },
        sources: [],
      },
      {
        tenant_id: membership.tenant.id,
        user_id: auth.user.id,
        role: 'assistant',
        content: visibleReply,
        web_research: mode === 'research' || modelResult.routing.task === 'live_research',
        assistant_mode: mode,
        executive_name: executive.name,
        provider: modelResult.routing.provider,
        model: modelResult.routing.model,
        routing: modelResult.routing,
        sources,
        action_id: queuedAction?.id || null,
      },
    ]);
    if (logError) console.error('Customer assistant log error', logError);

    const { error: usageError } = await auth.db.from('customer_usage_events').insert({
      tenant_id: membership.tenant.id,
      user_id: auth.user.id,
      event_name: 'aridon_brain_response',
      event_data: {
        mode,
        executive: executive.name,
        provider: modelResult.routing.provider,
        model: modelResult.routing.model,
        task: modelResult.routing.task,
        fallback_used: modelResult.routing.fallbackUsed,
        action_queued: Boolean(queuedAction),
        memory_captured: Boolean(capturedMemory),
        source_count: sources.length,
        latency_ms: modelResult.routing.totalLatencyMs,
      },
    });
    if (usageError) console.error('Aridon Brain usage log error', usageError);

    return NextResponse.json({
      reply: visibleReply,
      executive: executive.name,
      autoRouted,
      mode,
      sources,
      routing,
      researchWeb: mode === 'research' || modelResult.routing.task === 'live_research',
      researchWarning,
      action: queuedAction ? {
        id: queuedAction.id,
        title: queuedAction.title,
        adapterKey: queuedAction.adapter_key,
        status: queuedAction.status,
        approvalRequired: queuedAction.approval_required,
      } : null,
      memoryCaptured: Boolean(capturedMemory),
      capabilities,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer assistant error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The executive team is temporarily unavailable. Please try again.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
