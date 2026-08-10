import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';
import { normalizeOpportunityPlan, opportunityAccess } from '../../../../../lib/opportunityIntelligence';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string; annotations?: Array<{ type?: string; url?: string; title?: string }> }> }>;
  error?: { message?: string };
};

type FailureDb = {
  from: (table: string) => any;
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function stringArray(value: unknown, limit = 20) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
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
  return urls.slice(0, 60);
}

function parseJson(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error('The opportunity scan returned an unreadable analysis.');
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
}

function safeHttpUrl(value: unknown) {
  const raw = text(value, 1000);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function normalizedUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = '';
    const result = url.toString();
    return result.endsWith('/') ? result.slice(0, -1) : result;
  } catch {
    return value.replace(/\/$/, '');
  }
}

function urlHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function cleanDate(value: unknown) {
  const raw = text(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function score(value: unknown) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function fingerprint(title: string, issuer: string, primaryUrl: string) {
  return createHash('sha256').update(`${title.toLowerCase()}|${issuer.toLowerCase()}|${normalizedUrl(primaryUrl).toLowerCase()}`).digest('hex');
}

async function askOpportunityScout(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('The AI research service is not configured on this deployment.');
  const payload = {
    model: process.env.OPPORTUNITY_INTELLIGENCE_MODEL?.trim() || process.env.CUSTOMER_SALES_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
    input: prompt,
    tools: [{ type: 'web_search', search_context_size: 'medium' }],
    max_output_tokens: 7000,
  };
  const response = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const data = (await response.json()) as ResponsesPayload;
  if (!response.ok) throw new Error(data.error?.message || `AI research returned ${response.status}.`);
  const raw = extractText(data);
  if (!raw) throw new Error('The opportunity scan returned no readable result.');
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

export async function POST(request: NextRequest) {
  let runId = '';
  let failureDb: FailureDb | null = null;
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;
    failureDb = auth.db as unknown as FailureDb;
    const tenantId = membership.tenant.id;

    const [{ data: tenant, error: tenantError }, { data: profile, error: profileError }] = await Promise.all([
      auth.db.from('customer_tenants').select('opportunity_plan').eq('id', tenantId).single(),
      auth.db.from('customer_opportunity_profiles').select('*').eq('tenant_id', tenantId).maybeSingle(),
    ]);
    if (tenantError) throw tenantError;
    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ error: 'Save the Opportunity Intelligence profile before running a scan.' }, { status: 400, headers: NO_STORE });

    const plan = normalizeOpportunityPlan(tenant?.opportunity_plan);
    const accessPlan = opportunityAccess(plan);
    const body = await request.json().catch(() => ({}));
    const requestedCount = Math.max(1, Math.min(accessPlan.scanLimit, Number(body?.count) || accessPlan.scanLimit));

    const { data: run, error: runError } = await auth.db
      .from('customer_opportunity_runs')
      .insert({
        tenant_id: tenantId,
        user_id: auth.user.id,
        status: 'running',
        profile_snapshot: profile,
      })
      .select('id')
      .single();
    if (runError) throw runError;
    runId = run.id;

    const prompt = `You are Aridon Opportunity Intelligence, a source-disciplined business pursuit analyst. Find CURRENT, REAL opportunities for the company below using public web research. The product exists to find one qualified opportunity, prove the fit, and produce a next-action-ready pursuit path, not a giant generic report.\n\nCOMPANY: ${membership.tenant.business_name}\nINDUSTRY: ${membership.tenant.industry || 'not specified'}\nSAVED OPPORTUNITY PROFILE: ${JSON.stringify(profile).slice(0, 22000)}\nMAXIMUM RESULTS: ${requestedCount}\n\nSearch only the opportunity categories requested in the profile. These may include federal grants, government contracts, state/local funding, municipal or tribal opportunities, corporate RFPs, strategic partners, customers, investors, or expansion incentives.\n\nNON-NEGOTIABLE EVIDENCE RULES:\n- Never invent an opportunity, solicitation, grant, RFP, program, company, deadline, award value, eligibility rule, contact, case study, customer result, certification, or relationship.\n- Every returned opportunity must have at least one public source URL that supports its existence.\n- For formal government funding or procurement, prefer the issuing agency or official solicitation/program page as the primary source.\n- Separate confirmed facts from reasonable pursuit strategy.\n- If a deadline, value, eligibility rule, or decision-maker cannot be verified, say that explicitly instead of guessing.\n- Ignore opportunities that are clearly closed, stale, incompatible, or outside the profile.\n\nSCORING: fit_score is 0-100 and should consider capability match, eligibility, geography, timing, buyer need, realistic path to win, and value. A high score requires evidence, not enthusiasm.\n\nReturn JSON only in exactly this shape:\n{\n  "opportunities":[\n    {\n      "title":"",\n      "opportunity_type":"",\n      "issuer":"",\n      "location":"",\n      "source_url":"",\n      "source_urls":[""],\n      "deadline_text":"",\n      "deadline_date":"YYYY-MM-DD or empty",\n      "value_text":"",\n      "estimated_value":null,\n      "fit_score":0,\n      "eligibility":"",\n      "fit_reason":"",\n      "why_now":"",\n      "requirements":[""],\n      "risks":[""],\n      "partner_strategy":"",\n      "decision_maker_path":"",\n      "recommended_next_step":"",\n      "draft_outreach":""\n    }\n  ]\n}\n\nThe draft_outreach is a restrained first-contact draft for human review only. Do not claim prior relationships or proof that is not in the sources/profile. Return no more than ${requestedCount} strong opportunities and exclude weak filler.`;

    const result = await askOpportunityScout(prompt);
    const rawItems = Array.isArray(result.json.opportunities) ? result.json.opportunities.slice(0, requestedCount) : [];
    const citedNormalized = new Set(result.sources.map(normalizedUrl));
    const citedHosts = new Set(result.sources.map(urlHost).filter(Boolean));
    const saved: Record<string, unknown>[] = [];

    for (const raw of rawItems) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const title = text(item.title, 500);
      const issuer = text(item.issuer, 300);
      const itemSources = [safeHttpUrl(item.source_url), ...stringArray(item.source_urls, 12).map(safeHttpUrl)].filter(Boolean);
      const dedupedSources = [...new Set(itemSources)];
      const primaryUrl = dedupedSources[0] || '';
      if (!title || !primaryUrl) continue;

      const exactCitation = dedupedSources.some((url) => citedNormalized.has(normalizedUrl(url)));
      const hostCitation = dedupedSources.some((url) => citedHosts.has(urlHost(url)));
      const verificationStatus = exactCitation ? 'source_backed' : hostCitation ? 'partially_verified' : 'unverified';
      const now = new Date().toISOString();
      const payload = {
        tenant_id: tenantId,
        run_id: runId,
        fingerprint: fingerprint(title, issuer, primaryUrl),
        title,
        opportunity_type: text(item.opportunity_type, 180) || null,
        issuer: issuer || null,
        location: text(item.location, 250) || null,
        source_url: primaryUrl,
        source_urls: dedupedSources,
        deadline_text: text(item.deadline_text, 500) || null,
        deadline_date: cleanDate(item.deadline_date),
        value_text: text(item.value_text, 500) || null,
        estimated_value: optionalNumber(item.estimated_value),
        fit_score: score(item.fit_score),
        verification_status: verificationStatus,
        eligibility: text(item.eligibility, 5000) || null,
        fit_reason: text(item.fit_reason, 5000) || null,
        why_now: text(item.why_now, 4000) || null,
        requirements: stringArray(item.requirements, 20),
        risks: stringArray(item.risks, 20),
        partner_strategy: text(item.partner_strategy, 5000) || null,
        decision_maker_path: text(item.decision_maker_path, 4000) || null,
        recommended_next_step: text(item.recommended_next_step, 4000) || null,
        draft_outreach: text(item.draft_outreach, 6000) || null,
        created_by: auth.user.id,
        last_seen_at: now,
        updated_at: now,
      };

      const { data, error } = await auth.db
        .from('customer_opportunities')
        .upsert(payload, { onConflict: 'tenant_id,fingerprint' })
        .select('*')
        .single();
      if (error) throw error;
      saved.push(data as Record<string, unknown>);
    }

    await auth.db
      .from('customer_opportunity_runs')
      .update({
        status: 'completed',
        result_count: saved.length,
        source_urls: result.sources,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    return NextResponse.json({ opportunities: saved, sourceUrls: result.sources, access: accessPlan }, { headers: NO_STORE });
  } catch (error) {
    console.error('Opportunity Intelligence scan error', error);
    if (runId && failureDb) {
      try {
        await failureDb
          .from('customer_opportunity_runs')
          .update({ status: 'failed', error_message: error instanceof Error ? error.message.slice(0, 3000) : 'Unknown scan error', completed_at: new Date().toISOString() })
          .eq('id', runId);
      } catch {
        // Keep the original scan error as the response.
      }
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opportunity scan could not be completed.' }, { status: 500, headers: NO_STORE });
  }
}
