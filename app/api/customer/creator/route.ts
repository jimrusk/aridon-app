import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const BRAND_TITLE = 'Aridon Brand Brain';
const CHANNELS = new Set(['website', 'email', 'linkedin', 'facebook', 'instagram', 'x', 'press release', 'sales outreach', 'video script', 'blog', 'ad', 'other']);

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

type CampaignOutput = {
  campaign_summary: string;
  positioning_strategy: string;
  brand_alignment: string;
  risk_flags: string[];
  source_notes: string[];
  deliverables: Array<{
    channel: string;
    title: string;
    content: string;
    cta: string;
    review_notes: string;
  }>;
  next_actions: string[];
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function textArray(value: unknown, maxItems = 12, maxChars = 80) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item, maxChars)).filter(Boolean).slice(0, maxItems);
}

function extractOutputText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text as string)
    .join('\n\n')
    .trim();
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

function parseBrand(content: string | null | undefined) {
  if (!content) return {};
  try { return JSON.parse(content) as Record<string, unknown>; }
  catch { return { notes: content }; }
}

const CAMPAIGN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['campaign_summary', 'positioning_strategy', 'brand_alignment', 'risk_flags', 'source_notes', 'deliverables', 'next_actions'],
  properties: {
    campaign_summary: { type: 'string' },
    positioning_strategy: { type: 'string' },
    brand_alignment: { type: 'string' },
    risk_flags: { type: 'array', items: { type: 'string' } },
    source_notes: { type: 'array', items: { type: 'string' } },
    deliverables: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['channel', 'title', 'content', 'cta', 'review_notes'],
        properties: {
          channel: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          cta: { type: 'string' },
          review_notes: { type: 'string' },
        },
      },
    },
    next_actions: { type: 'array', items: { type: 'string' } },
  },
};

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const { data, error } = await resolved.auth.db
      .from('customer_creator_projects')
      .select('id,title,campaign_type,goal,audience,offer,channels,status,output,created_at,updated_at')
      .eq('tenant_id', resolved.membership.tenant.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return NextResponse.json({ projects: data || [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Creator Studio GET error', error);
    return NextResponse.json({ error: 'Unable to load Creator Studio projects.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const title = text(body?.title, 180);
    const campaignType = text(body?.campaignType, 80) || 'custom';
    const goal = text(body?.goal, 3000);
    const audience = text(body?.audience, 3000);
    const offer = text(body?.offer, 4000);
    const brief = text(body?.brief, 8000);
    const researchWeb = Boolean(body?.researchWeb);
    const requestedChannels = textArray(body?.channels, 12, 80);
    const channels = requestedChannels.filter((item) => CHANNELS.has(item.toLowerCase()));
    const fileIds = textArray(body?.fileIds, 8, 80);

    if (!slug || !title || !goal) return NextResponse.json({ error: 'Workspace, campaign title, and goal are required.' }, { status: 400, headers: NO_STORE });
    if (!channels.length) return NextResponse.json({ error: 'Choose at least one output channel.' }, { status: 400, headers: NO_STORE });

    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const db = resolved.auth.db;
    const tenant = resolved.membership.tenant;

    const [brandResult, knowledgeResult, filesResult] = await Promise.all([
      db.from('customer_knowledge').select('content').eq('tenant_id', tenant.id).eq('title', BRAND_TITLE).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('customer_knowledge').select('title,category,content').eq('tenant_id', tenant.id).neq('title', BRAND_TITLE).order('created_at', { ascending: false }).limit(18),
      fileIds.length
        ? db.from('customer_files').select('id,filename,extracted_text,extraction_status,notes').eq('tenant_id', tenant.id).in('id', fileIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);
    if (brandResult.error) throw brandResult.error;
    if (knowledgeResult.error) throw knowledgeResult.error;
    if (filesResult.error) throw filesResult.error;

    const brand = parseBrand(brandResult.data?.content);
    const knowledge = (knowledgeResult.data || []).map((item) => ({
      title: item.title,
      category: item.category,
      content: text(item.content, 2800),
    }));
    const files = (filesResult.data || []).map((item: any) => ({
      filename: item.filename,
      extraction_status: item.extraction_status,
      content: text(item.extracted_text, 6000),
      note: text(item.notes, 500),
    }));

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Creator Studio AI is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const companyContext = JSON.stringify({
      company: {
        business_name: tenant.business_name,
        industry: tenant.industry,
        tagline: tenant.tagline,
      },
      brand_brain: brand,
      company_knowledge: knowledge,
      selected_source_files: files,
    }, null, 2).slice(0, 52000);

    const instructions = `You are Oracle, the lead marketing and communications executive inside Aridon's Creator Studio. You work with Scout for positioning, Ledger for conversion and revenue logic, Ethos for risky claims and compliance-minded review, and Eva for coordination.\n\nYour job is to turn the customer's campaign brief into finished, channel-specific marketing drafts that are genuinely useful and ready for human review.\n\nNON-NEGOTIABLE RULES:\n- The customer's private company context below is the source of truth for brand voice, products, approved claims, audiences, restrictions and differentiators.\n- Never invent customer results, certifications, pricing, partnerships, performance figures, testimonials, guarantees, legal claims or product capabilities.\n- If a requested statement is not supported, omit it or flag it in risk_flags and review_notes with [VERIFY].\n- Keep each deliverable native to its channel instead of repeating one generic paragraph everywhere.\n- Make calls to action concrete and commercially useful.\n- Preserve any restrictions in the Brand Brain.\n- Treat source-file extractions as customer-provided material, not independently verified fact.\n- When live web research is enabled, use current public sources only for market context, competitor positioning or timely facts. Do not let outside sources overwrite the customer's own brand facts. Put source names/URLs in source_notes.\n- Everything you produce is a DRAFT. Do not claim anything has been published, emailed or sent.\n- Keep the campaign practical. The customer should be able to approve or edit the output immediately.\n\nPRIVATE COMPANY CONTEXT:\n${companyContext}`;

    const userBrief = `CAMPAIGN TITLE: ${title}\nCAMPAIGN TYPE: ${campaignType}\nGOAL: ${goal}\nAUDIENCE: ${audience || 'Use the Brand Brain and company context.'}\nOFFER / PRODUCT / SERVICE: ${offer || 'Use the company context.'}\nCHANNELS REQUIRED: ${channels.join(', ')}\nADDITIONAL BRIEF: ${brief || 'None.'}\n\nCreate one strong deliverable for every required channel. If the campaign would benefit from more than one asset on a channel, keep it inside that channel's content as a compact sequence rather than inventing extra channels.`;

    const payload: Record<string, unknown> = {
      model: process.env.CREATOR_STUDIO_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
      instructions,
      input: userBrief,
      max_output_tokens: 7000,
      store: false,
      text: {
        format: {
          type: 'json_schema',
          name: 'aridon_creator_campaign',
          description: 'A multi-channel Creator Studio campaign ready for owner review.',
          strict: true,
          schema: CAMPAIGN_SCHEMA,
        },
      },
    };
    if (researchWeb) payload.tools = [{ type: 'web_search', search_context_size: 'medium' }];

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await response.json() as ResponsesPayload;
    if (!response.ok) throw new Error(data.error?.message || `Creator Studio returned ${response.status}.`);
    const outputText = extractOutputText(data);
    if (!outputText) throw new Error('Creator Studio returned no campaign output.');

    let output: CampaignOutput;
    try { output = JSON.parse(outputText) as CampaignOutput; }
    catch { throw new Error('Creator Studio returned an unreadable campaign format.'); }

    const { data: project, error: projectError } = await db.from('customer_creator_projects').insert({
      tenant_id: tenant.id,
      created_by: resolved.auth.user.id,
      title,
      campaign_type: campaignType,
      goal,
      audience,
      offer,
      channels,
      brief,
      status: 'draft',
      output,
    }).select('id,title,campaign_type,goal,audience,offer,channels,status,output,created_at,updated_at').single();
    if (projectError) throw projectError;

    await db.from('customer_usage_events').insert({
      tenant_id: tenant.id,
      user_id: resolved.auth.user.id,
      event_name: 'creator_campaign_generated',
      event_data: { campaign_type: campaignType, channels, research_web: researchWeb, file_count: fileIds.length },
    });

    return NextResponse.json({ project }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Creator Studio POST error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Creator Studio could not generate this campaign.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const projectId = text(body?.projectId, 80);
    const status = text(body?.status, 30);
    if (!slug || !projectId || !['draft', 'approved', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Workspace, project, and valid status are required.' }, { status: 400, headers: NO_STORE });
    }
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const { data, error } = await resolved.auth.db.from('customer_creator_projects').update({ status, updated_at: new Date().toISOString() }).eq('id', projectId).eq('tenant_id', resolved.membership.tenant.id).select('id,status,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Creator project not found.' }, { status: 404, headers: NO_STORE });
    await resolved.auth.db.from('customer_usage_events').insert({ tenant_id: resolved.membership.tenant.id, user_id: resolved.auth.user.id, event_name: 'creator_campaign_status_changed', event_data: { project_id: projectId, status } });
    return NextResponse.json({ project: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Creator Studio PATCH error', error);
    return NextResponse.json({ error: 'Unable to update this Creator Studio project.' }, { status: 500, headers: NO_STORE });
  }
}
