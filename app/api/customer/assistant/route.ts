import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { executives } from '../../../../lib/executives';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
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

function cleanMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 24) return null;
  const messages: ChatMessage[] = [];
  let total = 0;
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const role = 'role' in item ? item.role : undefined;
    const content = 'content' in item ? item.content : undefined;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const cleaned = content.trim();
    if (!cleaned || cleaned.length > 6000) return null;
    total += cleaned.length;
    if (total > 30000) return null;
    messages.push({ role, content: cleaned });
  }
  return messages;
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
    const researchWeb = Boolean(body?.researchWeb);
    const executiveName = text(body?.executive, 80) || 'Eva';
    const executive = executives.find((item) => item.name.toLowerCase() === executiveName.toLowerCase()) || executives.find((item) => item.name === 'Eva') || executives[0];

    if (!slug || !messages) {
      return NextResponse.json({ error: 'Workspace and message history are required.' }, { status: 400, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const db = auth.db;
    const [projectsResult, tasksResult, knowledgeResult, filesResult] = await Promise.all([
      db.from('customer_projects').select('name,description,status').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(12),
      db.from('customer_tasks').select('title,owner,priority,status').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(20),
      db.from('customer_knowledge').select('title,category,content').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(14),
      db.from('customer_files').select('filename,extracted_text,extraction_status,notes').eq('tenant_id', membership.tenant.id).eq('status', 'ready').order('created_at', { ascending: false }).limit(8),
    ]);
    if (projectsResult.error) throw projectsResult.error;
    if (tasksResult.error) throw tasksResult.error;
    if (knowledgeResult.error) throw knowledgeResult.error;
    if (filesResult.error) throw filesResult.error;

    const knowledge = (knowledgeResult.data || []).map((item) => ({
      title: item.title,
      category: item.category,
      content: text(item.content, 2800),
    }));
    const sourceFiles = (filesResult.data || [])
      .filter((item) => item.extracted_text)
      .map((item) => ({
        filename: item.filename,
        extraction_status: item.extraction_status,
        content: text(item.extracted_text, 3500),
        note: text(item.notes, 400),
      }));

    const tenantContext = JSON.stringify({
      business: membership.tenant.business_name,
      industry: membership.tenant.industry,
      plan: membership.tenant.plan,
      projects: projectsResult.data || [],
      tasks: tasksResult.data || [],
      knowledge,
      uploaded_company_files: sourceFiles,
    }, null, 2).slice(0, 38000);

    const conversation = messages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n\n');

    const systemPrompt = `You are ${executive.name}, the ${executive.role} inside a customer's Private Business OS. You are one member of an eight-executive digital leadership team.\n\nYOUR EXECUTIVE LANE:\n- Role: ${executive.role}\n- Primary focus: ${executive.focus}\n- Tone: ${executive.tone}\n- Communication style: ${executive.voice}\n- Expertise: ${executive.expertise.join(', ')}\n\nRULES:\n- You serve the customer's company, not the platform operator. Never reveal or imply access to another customer's data or the operator's private records.\n- Use the tenant context below when relevant. Treat company-entered data and extracted company files as user-provided information, not independently verified fact.\n- The Brand Brain may appear inside knowledge as JSON. Use its approved claims, restrictions, audiences, voice, products and differentiators when doing public-facing work.\n- Uploaded company-file extractions are reusable working context. If extraction notes say a file was limited or failed, do not pretend you read material that is absent.\n- Stay in your executive lane when it helps, but answer normal business questions usefully. If another executive is better suited, say who should join and why instead of refusing.\n- Maintain continuity with the conversation history. The customer should feel they are speaking to the same executive throughout the session.\n- Be practical, warm, concise, and action-oriented. Challenge weak assumptions when the stakes matter.\n- Never pretend an action was completed unless the system actually performed it. If a capability is not connected, explain the exact next step.\n- For legal, tax, accounting, medical, safety, or regulated decisions, provide general information and recommend qualified review when appropriate.\n- If web research is enabled, separate current sourced facts from inference.\n- Do not expose private chain-of-thought. Give concise reasoning summaries instead.\n- When useful, finish with the next 1 to 3 actions.\n\nTENANT CONTEXT:\n${tenantContext}\n\nCONVERSATION:\n${conversation}`;

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'The AI service is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const payload: Record<string, unknown> = {
      model: process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
      input: systemPrompt,
      max_output_tokens: 2200,
      store: false,
    };
    if (researchWeb) payload.tools = [{ type: 'web_search', search_context_size: 'medium' }];

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = (await response.json()) as ResponsesPayload;
    if (!response.ok) throw new Error(data.error?.message || `AI service returned ${response.status}.`);

    const reply = extractText(data);
    if (!reply) throw new Error(`${executive.name} returned no readable response.`);
    const latestUser = [...messages].reverse().find((message) => message.role === 'user');

    const { error: logError } = await db.from('customer_assistant_messages').insert([
      {
        tenant_id: membership.tenant.id,
        user_id: auth.user.id,
        role: 'user',
        content: latestUser?.content || '',
        web_research: researchWeb,
      },
      {
        tenant_id: membership.tenant.id,
        user_id: auth.user.id,
        role: 'assistant',
        content: `[${executive.name}] ${reply}`,
        web_research: researchWeb,
      },
    ]);
    if (logError) console.error('Customer assistant log error', logError);

    return NextResponse.json({ reply, executive: executive.name, sources: extractSources(data), researchWeb }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer assistant error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The executive team is temporarily unavailable. Please try again.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
