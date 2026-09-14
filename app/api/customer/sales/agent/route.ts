import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';
import { researchScoutProspects, websiteDomain } from '../../../../../lib/scoutProspecting';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string; annotations?: Array<{ type?: string; url?: string; title?: string }> }> }>;
  error?: { message?: string };
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function extractText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || []).flatMap((item) => item.content || []).filter((item) => item.type === 'output_text' && typeof item.text === 'string').map((item) => item.text as string).join('\n').trim();
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
  return urls.slice(0, 30);
}

function parseJson(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error('Scout returned an unreadable analysis.');
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
}

async function askScout(prompt: string, researchWeb: boolean) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('The AI service is not configured on this deployment.');
  const payload: Record<string, unknown> = {
    model: process.env.CUSTOMER_SALES_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
    input: prompt,
    max_output_tokens: 5000,
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
  const raw = extractText(data);
  if (!raw) throw new Error('Scout returned no readable result.');
  return { json: parseJson(raw), sources: extractSources(data) };
}

async function gate(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id);
  if (!membership) return { response: NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE }) };
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) };
  return { auth, membership };
}

function stringArray(value: unknown, limit = 12) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, limit) : [];
}

export async function POST(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    const action = text(body?.action, 40);
    const tenantId = membership.tenant.id;

    if (action === 'learn') {
      const website = text(body?.website, 500);
      const offer = text(body?.offer, 5000);
      const goal = text(body?.goal, 2000);
      const geography = text(body?.geography, 1000);
      const exclusions = text(body?.exclusions, 2000);
      if (!website && !offer) return NextResponse.json({ error: 'Add a company website or describe what the business sells.' }, { status: 400, headers: NO_STORE });

      const prompt = `You are Scout, an AI sales strategist building a durable sales profile for ${membership.tenant.business_name}.
Use current public web research when a website is provided. Never invent customers, revenue, certifications, case studies, pricing, people, or proof. Treat company-supplied claims as claims until independently verified.

BUSINESS: ${membership.tenant.business_name}
INDUSTRY: ${membership.tenant.industry || 'not specified'}
WEBSITE: ${website || 'not supplied'}
OWNER DESCRIPTION / OFFER: ${offer || 'not supplied'}
SALES GOAL: ${goal || 'not supplied'}
TARGET GEOGRAPHY: ${geography || 'not supplied'}
EXCLUSIONS: ${exclusions || 'none supplied'}

Return JSON only with this exact shape:
{
  "company_summary":"",
  "offer_summary":"",
  "ideal_customer_profile":"",
  "buyer_roles":[""],
  "industries":[""],
  "geographies":[""],
  "differentiators":[""],
  "proof_points":[""],
  "trigger_events":[""],
  "disqualifiers":[""],
  "messaging_angles":[""]
}
Keep each list practical. Proof points must only include evidence actually found or supplied.`;
      const result = await askScout(prompt, Boolean(website));
      const j = result.json;
      const payload = {
        tenant_id: tenantId,
        website: website || null,
        company_summary: text(j.company_summary, 5000) || null,
        offer_summary: text(j.offer_summary, 5000) || offer || null,
        sales_goal: goal || null,
        ideal_customer_profile: text(j.ideal_customer_profile, 5000) || null,
        buyer_roles: stringArray(j.buyer_roles, 15),
        industries: stringArray(j.industries, 15),
        geographies: stringArray(j.geographies, 15),
        differentiators: stringArray(j.differentiators, 15),
        proof_points: stringArray(j.proof_points, 15),
        trigger_events: stringArray(j.trigger_events, 15),
        disqualifiers: [...stringArray(j.disqualifiers, 15), ...(exclusions ? [exclusions] : [])].slice(0, 16),
        messaging_angles: stringArray(j.messaging_angles, 15),
        source_urls: result.sources,
        updated_by: auth.user.id,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await auth.db.from('customer_sales_profiles').upsert(payload, { onConflict: 'tenant_id' }).select('*').single();
      if (error) throw error;
      await auth.db.from('customer_sales_events').insert({ tenant_id: tenantId, user_id: auth.user.id, event_name: 'sales_profile_learned', event_data: { website, source_count: result.sources.length } });
      return NextResponse.json({ profile: data }, { headers: NO_STORE });
    }

    if (action === 'find_prospects') {
      const { data: profile, error: profileError } = await auth.db.from('customer_sales_profiles').select('*').eq('tenant_id', tenantId).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return NextResponse.json({ error: 'Teach Scout about the business first.' }, { status: 400, headers: NO_STORE });

      const count = Math.max(3, Math.min(20, Number(body?.count) || 10));
      const focus = text(body?.focus, 3000);
      const intent = text(body?.intent, 40) || 'customer';
      const qualificationThreshold = Math.max(50, Math.min(95, Number(body?.qualificationThreshold) || 75));
      const requiredSignals = stringArray(body?.requiredSignals, 12);
      const exclusions = stringArray(body?.exclusions, 16);

      const result = await researchScoutProspects({
        sellerName: membership.tenant.business_name,
        industry: membership.tenant.industry,
        sellerProfile: profile as Record<string, unknown>,
        count,
        focus,
        intent,
        qualificationThreshold,
        requiredSignals,
        exclusions,
      });

      const { data: existingLeads, error: existingError } = await auth.db.from('customer_sales_leads').select('website').eq('tenant_id', tenantId);
      if (existingError) throw existingError;
      const seenDomains = new Set((existingLeads || []).map((lead) => websiteDomain(lead.website)).filter(Boolean));
      const prospects: Record<string, unknown>[] = [];

      for (const item of result.prospects) {
        const domain = websiteDomain(item.website);
        if (domain && seenDomains.has(domain)) continue;

        const payload = {
          tenant_id: tenantId,
          company_name: item.company_name,
          website: item.website || null,
          location: item.location || null,
          recommended_buyer_role: item.recommended_buyer_role || null,
          fit_score: item.fit_score,
          priority_tier: item.priority_tier,
          score_breakdown: item.score_breakdown,
          fit_reason: item.fit_reason || null,
          trigger_event: item.trigger_event || null,
          buying_signals: item.buying_signals,
          evidence_quality: item.score_breakdown.evidence_quality * 4,
          research_notes: item.research_notes || null,
          personalization: item.personalization || null,
          source_urls: item.source_urls,
          source_type: 'scout_web_research_v2',
          status: 'researched',
          created_by: auth.user.id,
        };
        const { data, error } = await auth.db.from('customer_sales_leads').insert(payload).select('*').single();
        if (error) throw error;
        if (domain) seenDomains.add(domain);
        prospects.push(data as Record<string, unknown>);
      }

      await auth.db.from('customer_sales_events').insert({
        tenant_id: tenantId,
        user_id: auth.user.id,
        event_name: 'prospects_researched_v2',
        event_data: {
          requested: count,
          saved: prospects.length,
          intent,
          qualification_threshold: qualificationThreshold,
          required_signals: requiredSignals,
          exclusions,
        },
      });
      return NextResponse.json({ prospects, source_urls: result.source_urls, qualification_threshold: qualificationThreshold }, { headers: NO_STORE });
    }

    if (action === 'build_sequence') {
      const leadIds = Array.isArray(body?.leadIds) ? body.leadIds.filter((item: unknown): item is string => typeof item === 'string').slice(0, 30) : [];
      if (!leadIds.length) return NextResponse.json({ error: 'Select at least one prospect.' }, { status: 400, headers: NO_STORE });
      const objective = text(body?.objective, 3000) || 'Start a relevant business conversation and earn a qualified meeting.';
      const [profileResult, leadsResult] = await Promise.all([
        auth.db.from('customer_sales_profiles').select('*').eq('tenant_id', tenantId).maybeSingle(),
        auth.db.from('customer_sales_leads').select('id,company_name,website,location,recommended_buyer_role,fit_score,priority_tier,fit_reason,trigger_event,buying_signals,research_notes,personalization,source_urls').eq('tenant_id', tenantId).in('id', leadIds),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (leadsResult.error) throw leadsResult.error;
      if (!profileResult.data) return NextResponse.json({ error: 'Teach Scout about the business first.' }, { status: 400, headers: NO_STORE });
      if (!leadsResult.data?.length) return NextResponse.json({ error: 'The selected prospects could not be loaded.' }, { status: 400, headers: NO_STORE });

      const prompt = `You are Scout, building a restrained B2B email sequence. Write for relevance and credibility, not volume spam. Never fabricate proof, urgency, relationships, or customer results. Use short plain-text emails. Use placeholders only from this set: {{firstName}}, {{companyName}}, {{jobTitle}}, {{personalization}}. Include a simple opt-out sentence in the final step.

SELLER PROFILE: ${JSON.stringify(profileResult.data).slice(0, 17000)}
SELECTED PROSPECT SAMPLE: ${JSON.stringify(leadsResult.data).slice(0, 14000)}
OBJECTIVE: ${objective}

Return JSON only:
{
 "name":"",
 "audience_summary":"",
 "sequence":[
  {"step":1,"delay_days":0,"subject":"","body":"","purpose":""},
  {"step":2,"delay_days":3,"subject":"","body":"","purpose":""},
  {"step":3,"delay_days":5,"subject":"","body":"","purpose":""},
  {"step":4,"delay_days":7,"subject":"","body":"","purpose":""}
 ]
}
Keep each body under 130 words and each subject under 60 characters.`;
      const result = await askScout(prompt, false);
      const sequence = Array.isArray(result.json.sequence) ? result.json.sequence.slice(0, 6) : [];
      if (!sequence.length) throw new Error('Scout did not produce a usable sequence.');
      const payload = {
        tenant_id: tenantId,
        name: text(result.json.name, 180) || `${membership.tenant.business_name} outreach`,
        objective,
        audience_summary: text(result.json.audience_summary, 3000) || null,
        sequence,
        selected_lead_ids: leadsResult.data.map((lead) => lead.id),
        status: 'draft',
        created_by: auth.user.id,
      };
      const { data, error } = await auth.db.from('customer_sales_campaigns').insert(payload).select('*').single();
      if (error) throw error;
      await auth.db.from('customer_sales_events').insert({ tenant_id: tenantId, user_id: auth.user.id, event_name: 'sequence_built', event_data: { campaign_id: data.id, leads: leadsResult.data.length, steps: sequence.length } });
      return NextResponse.json({ campaign: data }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: 'Choose a valid Scout action.' }, { status: 400, headers: NO_STORE });
  } catch (error) {
    console.error('Scout sales agent error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Scout could not complete this sales task.' }, { status: 500, headers: NO_STORE });
  }
}
