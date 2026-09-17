import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string; annotations?: Array<{ type?: string; url?: string }> }> }>;
  error?: { message?: string };
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function stringArray(value: unknown, limit = 12) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, limit)
    : [];
}

function extractText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text as string)
    .join('\n')
    .trim();
}

function extractSources(data: ResponsesPayload) {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      for (const annotation of content.annotations || []) {
        if (annotation.type === 'url_citation' && annotation.url && !seen.has(annotation.url)) {
          seen.add(annotation.url);
          urls.push(annotation.url);
        }
      }
    }
  }
  return urls.slice(0, 40);
}

function parseJson(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error('Scout returned an unreadable contact result.');
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
}

function normalizeEmail(value: unknown) {
  const email = text(value, 254).toLowerCase();
  return email && /^\S+@\S+\.\S+$/.test(email) ? email : '';
}

async function gate(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id);
  if (!membership) return { response: NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE }) };
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) };
  return { auth, membership };
}

export async function POST(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const leadIds = Array.isArray(body?.leadIds)
      ? body.leadIds.filter((item: unknown): item is string => typeof item === 'string').map((item: string) => item.trim()).filter(Boolean).slice(0, 8)
      : [];
    if (!leadIds.length) return NextResponse.json({ error: 'Select at least one prospect to enrich.' }, { status: 400, headers: NO_STORE });

    const tenantId = membership.tenant.id;
    const { data: leads, error: leadsError } = await auth.db
      .from('customer_sales_leads')
      .select('id,company_name,website,location,recommended_buyer_role,contact_name,contact_email,contact_phone,contact_title,source_urls')
      .eq('tenant_id', tenantId)
      .in('id', leadIds);
    if (leadsError) throw leadsError;
    if (!leads?.length) return NextResponse.json({ error: 'No matching prospects were found.' }, { status: 404, headers: NO_STORE });

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error('The AI service is not configured on this deployment.');

    const prompt = `You are Scout, Aridon's public-business contact enrichment agent.

Find a credible business contact for each organization below, preferably a person whose current role matches the recommended buyer role. Use current public web research only.

STRICT VERIFICATION RULES:
- Prefer official company leadership/team pages, official staff directories, official press releases, procurement contacts, conference bios, and clearly public professional profiles.
- Never guess, infer, synthesize, or pattern-generate an email address. Return an email only when it is explicitly published in a public source you can cite.
- Never return a personal/home phone number. A phone must be a publicly listed business line, direct business line, departmental line, or official company contact number.
- Never use leaked credentials, breach dumps, data-broker private records, private profiles, private messages, or non-public contact data.
- If a person's name and title are verified but email/phone are not public, return the name/title and leave those fields blank.
- If there is no confidently verified decision-maker, return the best official departmental role/contact and explain that in notes.
- source_urls must directly support the person, role, email, or phone you return.

PROSPECTS:
${JSON.stringify(leads).slice(0, 24000)}

Return JSON only with this exact shape:
{
  "contacts": [
    {
      "lead_id":"",
      "contact_name":"",
      "contact_title":"",
      "contact_email":"",
      "contact_phone":"",
      "confidence":"high",
      "notes":"",
      "source_urls":[""]
    }
  ]
}`;

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.CUSTOMER_SALES_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
        input: prompt,
        max_output_tokens: 5000,
        tools: [{ type: 'web_search', search_context_size: 'medium' }],
      }),
      cache: 'no-store',
    });
    const rawResponse = (await response.json()) as ResponsesPayload;
    if (!response.ok) throw new Error(rawResponse.error?.message || `AI service returned ${response.status}.`);
    const raw = extractText(rawResponse);
    if (!raw) throw new Error('Scout returned no readable contact result.');
    const parsed = parseJson(raw);
    const contacts = Array.isArray(parsed.contacts) ? parsed.contacts.slice(0, leads.length) : [];
    const allowedIds = new Set(leads.map((lead) => lead.id));
    const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
    const updated: Record<string, unknown>[] = [];

    for (const rawContact of contacts) {
      if (!rawContact || typeof rawContact !== 'object') continue;
      const item = rawContact as Record<string, unknown>;
      const leadId = text(item.lead_id, 80);
      if (!leadId || !allowedIds.has(leadId)) continue;
      const existing = leadMap.get(leadId);
      if (!existing) continue;

      const name = text(item.contact_name, 160);
      const title = text(item.contact_title, 180);
      const email = normalizeEmail(item.contact_email);
      const phone = text(item.contact_phone, 80);
      const confidenceRaw = text(item.confidence, 20).toLowerCase();
      const confidence = ['high', 'medium', 'low'].includes(confidenceRaw) ? confidenceRaw : 'low';
      const contactSources = stringArray(item.source_urls, 12).filter((url) => /^https?:\/\//i.test(url));
      const existingSources = stringArray(existing.source_urls, 20).filter((url) => /^https?:\/\//i.test(url));
      const sourceUrls = Array.from(new Set([...existingSources, ...contactSources])).slice(0, 20);

      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        source_urls: sourceUrls,
      };
      if (name) patch.contact_name = name;
      if (title) patch.contact_title = title;
      if (email) patch.contact_email = email;
      if (phone) patch.contact_phone = phone;
      if (name || title || email || phone) patch.status = 'contact_enriched';

      const { data, error } = await auth.db
        .from('customer_sales_leads')
        .update(patch)
        .eq('id', leadId)
        .eq('tenant_id', tenantId)
        .select('*')
        .single();
      if (error) throw error;
      updated.push({ ...data, enrichment_confidence: confidence, enrichment_notes: text(item.notes, 1200) });
    }

    await auth.db.from('customer_sales_events').insert({
      tenant_id: tenantId,
      user_id: auth.user.id,
      event_name: 'public_contacts_enriched',
      event_data: {
        requested: leads.length,
        enriched: updated.length,
        response_source_count: extractSources(rawResponse).length,
      },
    });

    return NextResponse.json({ contacts: updated, enriched: updated.length }, { headers: NO_STORE });
  } catch (error) {
    console.error('Scout contact enrichment error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Scout could not enrich these contacts.' }, { status: 500, headers: NO_STORE });
  }
}
