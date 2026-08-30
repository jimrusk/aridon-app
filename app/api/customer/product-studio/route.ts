import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const BRAND_TITLE = 'Aridon Brand Brain';

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

type ProductOutput = {
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

function cleanProductOutput(value: unknown): ProductOutput {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const deliverables = Array.isArray(source.deliverables) ? source.deliverables : [];
  return {
    campaign_summary: text(source.campaign_summary, 10000),
    positioning_strategy: text(source.positioning_strategy, 10000),
    brand_alignment: text(source.brand_alignment, 8000),
    risk_flags: textArray(source.risk_flags, 30, 2500),
    source_notes: textArray(source.source_notes, 30, 3000),
    deliverables: deliverables.slice(0, 12).map((item) => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      return {
        channel: text(row.channel, 120),
        title: text(row.title, 500),
        content: text(row.content, 30000),
        cta: text(row.cta, 3000),
        review_notes: text(row.review_notes, 5000),
      };
    }).filter((item) => item.channel && item.content),
    next_actions: textArray(source.next_actions, 30, 2500),
  };
}

const PRODUCT_SCHEMA = {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = text(body?.slug, 80);
    const title = text(body?.title, 180) || 'Knowledge Product Draft';
    const productType = text(body?.productType, 120) || 'guide / workbook';
    const audience = text(body?.audience, 3000);
    const problem = text(body?.problem, 4000);
    const transformation = text(body?.transformation, 4000);
    const notes = text(body?.notes, 14000);
    const priceIdea = text(body?.priceIdea, 500);
    const fileIds = textArray(body?.fileIds, 8, 80);
    const includeLaunchKit = body?.includeLaunchKit !== false;

    if (!slug || !audience || (!notes && !fileIds.length)) {
      return NextResponse.json({ error: 'Workspace, target audience, and either notes or a source file are required.' }, { status: 400, headers: NO_STORE });
    }

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
      content: text(item.content, 2600),
    }));
    const files = (filesResult.data || []).map((item: any) => ({
      filename: item.filename,
      extraction_status: item.extraction_status,
      content: text(item.extracted_text, 7000),
      note: text(item.notes, 500),
    }));

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Knowledge Product Studio AI is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const companyContext = JSON.stringify({
      company: {
        business_name: tenant.business_name,
        industry: tenant.industry,
        tagline: tenant.tagline,
      },
      brand_brain: brand,
      company_knowledge: knowledge,
      selected_source_files: files,
      owner_notes: notes,
    }, null, 2).slice(0, 62000);

    const instructions = `You are Oracle Product Architect inside Aridon's Knowledge Product Studio. Your job is to turn a business owner's real expertise into a useful, sellable digital product while preserving the owner's voice and facts. Scout reviews audience fit and positioning. Ledger reviews pricing logic and monetization. Ethos reviews unsupported claims, sensitive advice, and trust risks. Eva coordinates the final draft.\n\nNON-NEGOTIABLE RULES:\n- The private company context below is the source of truth. Never invent credentials, results, testimonials, customers, legal rights, certifications, prices, performance claims, partnerships, or facts.\n- Treat uploaded material as customer-provided source material, not independently verified truth.\n- Build a REAL PRODUCT DRAFT, not merely a product idea or outline. The first deliverable must contain the substantive product content a buyer would receive.\n- Organize the product for practical use. Use sections, exercises, checklists, templates, prompts, examples, tables-in-text, or action steps when they improve the chosen format.\n- When source material is incomplete, add clearly marked [OWNER INPUT NEEDED] prompts instead of fabricating missing knowledge.\n- Preserve the owner's approved brand voice and restricted claims.\n- Do not reproduce third-party copyrighted material that may appear in source files. Transform the owner's knowledge into original wording and flag anything that looks third-party or uncertain.\n- If the product touches legal, medical, financial, tax, safety, or regulated professional advice, keep it educational, add an appropriate review note, and do not present it as individualized professional advice.\n- Everything is a DRAFT. Nothing is automatically published, sold, emailed, or sent. Human approval is required.\n\nOUTPUT REQUIREMENTS:\n1. campaign_summary: product concept, buyer, problem, promised outcome, format, and what makes it useful.\n2. positioning_strategy: recommended packaging, price logic or price range if supportable, free-to-paid ladder, and how this product can lead into the company's core offer. If pricing is uncertain, label it as a test recommendation.\n3. brand_alignment: explain how the product matches the Brand Brain and company expertise.\n4. risk_flags: unsupported claims, missing inputs, third-party material concerns, or professional-review needs.\n5. source_notes: name the owner notes, company knowledge, and source files used.\n6. deliverables: ALWAYS include a first deliverable with channel 'digital product' containing the substantial product draft. Also include a 'sales page' deliverable. If launch kit is requested, include 'email launch' and 'social launch' deliverables.\n7. next_actions: concrete owner-review, formatting, pricing-test, publishing, and sales steps.\n\nPRIVATE COMPANY CONTEXT:\n${companyContext}`;

    const userBrief = `WORKING TITLE: ${title}\nPRODUCT TYPE: ${productType}\nTARGET AUDIENCE: ${audience}\nPROBLEM TO SOLVE: ${problem || 'Infer only from supplied owner/company context and mark any uncertainty.'}\nDESIRED TRANSFORMATION / RESULT: ${transformation || 'Infer conservatively from supplied owner/company context.'}\nOWNER PRICE IDEA: ${priceIdea || 'None. Recommend a test range only if the evidence supports doing so.'}\nINCLUDE LAUNCH KIT: ${includeLaunchKit ? 'Yes' : 'No'}\n\nTurn this expertise into a product someone could actually use. The digital product deliverable should contain enough substantive content to serve as a strong first edition, not a teaser.`;

    const payload = {
      model: process.env.CREATOR_STUDIO_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
      instructions,
      input: userBrief,
      max_output_tokens: 12000,
      store: false,
      text: {
        format: {
          type: 'json_schema',
          name: 'aridon_knowledge_product',
          description: 'A private knowledge-to-product package ready for owner review.',
          strict: true,
          schema: PRODUCT_SCHEMA,
        },
      },
    };

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await response.json() as ResponsesPayload;
    if (!response.ok) throw new Error(data.error?.message || `Knowledge Product Studio returned ${response.status}.`);
    const outputText = extractOutputText(data);
    if (!outputText) throw new Error('Knowledge Product Studio returned no product output.');

    let parsed: unknown;
    try { parsed = JSON.parse(outputText); }
    catch { throw new Error('Knowledge Product Studio returned an unreadable product format.'); }
    const output = cleanProductOutput(parsed);
    if (!output.deliverables.some((item) => item.channel.toLowerCase() === 'digital product')) {
      throw new Error('Knowledge Product Studio returned no usable product draft.');
    }

    const channels = output.deliverables.map((item) => item.channel).slice(0, 12);
    const goal = `Turn the owner's expertise into a ${productType} for ${audience}.`;
    const offer = [problem, transformation].filter(Boolean).join(' → ').slice(0, 4000);

    const { data: project, error: projectError } = await db.from('customer_creator_projects').insert({
      tenant_id: tenant.id,
      created_by: resolved.auth.user.id,
      title,
      campaign_type: 'knowledge-product',
      goal,
      audience,
      offer,
      channels,
      brief: notes,
      status: 'draft',
      output,
    }).select('id,title,campaign_type,goal,audience,offer,channels,status,output,created_at,updated_at').single();
    if (projectError) throw projectError;

    await db.from('customer_usage_events').insert({
      tenant_id: tenant.id,
      user_id: resolved.auth.user.id,
      event_name: 'knowledge_product_generated',
      event_data: { product_type: productType, source_file_count: fileIds.length, include_launch_kit: includeLaunchKit },
    });

    return NextResponse.json({ project }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Knowledge Product Studio POST error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Knowledge Product Studio could not create this product.' }, { status: 500, headers: NO_STORE });
  }
}
