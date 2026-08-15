import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedIntelligenceAccess } from '../../../../../lib/intelligenceAuth';
import { buildIntelligencePrompt, normalizeIntelligenceLane, weightedIntelligenceScore, type IntelligenceLane } from '../../../../../lib/intelligenceSuite';

export const runtime = 'nodejs';
export const maxDuration = 300;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string; annotations?: Array<{ type?: string; url?: string; title?: string }> }> }>;
  error?: { message?: string };
};

type FailureDb = { from: (table: string) => any };

type Signal = { name: string; strength: number; evidence: string; source_url: string };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function stringArray(value: unknown, limit = 20) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, limit);
}

function safeHttpUrl(value: unknown) {
  const raw = text(value, 1400);
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
  try { return new URL(value).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function clamp(value: unknown) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
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
        const url = annotation.type === 'url_citation' ? safeHttpUrl(annotation.url) : '';
        if (url && !seen.has(url)) { seen.add(url); urls.push(url); }
      }
    }
  }
  return urls.slice(0, 80);
}

function parseJson(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error('The radar returned an unreadable analysis.');
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
}

function cleanSignals(value: unknown): Signal[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const raw = entry as Record<string, unknown>;
    const name = text(raw.name, 180);
    const evidence = text(raw.evidence, 2500);
    if (!name || !evidence) return [];
    return [{ name, strength: clamp(raw.strength), evidence, source_url: safeHttpUrl(raw.source_url) }];
  });
}

function cleanFacts(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const facts: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(raw).slice(0, 30)) {
    const safeKey = key.trim().slice(0, 100);
    if (!safeKey) continue;
    if (typeof item === 'string') facts[safeKey] = item.trim().slice(0, 2000);
    else if (typeof item === 'number' && Number.isFinite(item)) facts[safeKey] = item;
    else if (typeof item === 'boolean' || item === null) facts[safeKey] = item;
  }
  return facts;
}

function fingerprint(lane: IntelligenceLane, entityName: string, location: string, primaryUrl: string) {
  return createHash('sha256').update(`${lane}|${entityName.toLowerCase()}|${location.toLowerCase()}|${normalizedUrl(primaryUrl).toLowerCase()}`).digest('hex');
}

function confidenceScore(exactCitation: boolean, hostCitation: boolean, sourceCount: number, signals: Signal[]) {
  const evidenceSignals = signals.filter((signal) => signal.source_url && signal.evidence).length;
  return clamp((exactCitation ? 60 : hostCitation ? 45 : 20) + Math.min(20, sourceCount * 4) + Math.min(20, evidenceSignals * 4));
}

async function askRadar(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('The AI research service is not configured on this deployment.');
  const payload = {
    model: process.env.INTELLIGENCE_SUITE_MODEL?.trim() || process.env.OPPORTUNITY_INTELLIGENCE_MODEL?.trim() || process.env.CUSTOMER_SALES_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
    input: prompt,
    tools: [{ type: 'web_search', search_context_size: 'low' }],
    max_output_tokens: 6000,
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
  if (!raw) throw new Error('The radar returned no readable result.');
  return { json: parseJson(raw), sources: extractSources(data) };
}

async function gate(request: NextRequest) {
  const access = await authenticatedIntelligenceAccess(request);
  if (!access.ok) {
    return { response: NextResponse.json({ error: access.error }, { status: access.status, headers: NO_STORE }) };
  }
  return { auth: { db: access.db, user: access.user }, membership: access.membership };
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
    const body = await request.json().catch(() => ({}));
    const lane = normalizeIntelligenceLane(body?.lane);
    if (!lane) return NextResponse.json({ error: 'Choose Aridon One, Two, or Three before scanning.' }, { status: 400, headers: NO_STORE });
    const requestedCount = Math.max(1, Math.min(12, Number(body?.count) || 6));

    const { data: profileRow, error: profileError } = await auth.db.from('customer_intelligence_profiles').select('*').eq('tenant_id', tenantId).eq('lane', lane).maybeSingle();
    if (profileError) throw profileError;
    const profile = profileRow?.profile && typeof profileRow.profile === 'object' ? profileRow.profile as Record<string, unknown> : {};

    const { data: run, error: runError } = await auth.db.from('customer_intelligence_runs').insert({
      tenant_id: tenantId,
      user_id: auth.user.id,
      lane,
      status: 'running',
      profile_snapshot: profile,
    }).select('id').single();
    if (runError) throw runError;
    runId = run.id;

    const prompt = buildIntelligencePrompt({ lane, businessName: membership.tenant.business_name, industry: membership.tenant.industry, profile, count: requestedCount });
    const result = await askRadar(prompt);
    const rawItems = Array.isArray(result.json.leads) ? result.json.leads.slice(0, requestedCount) : [];
    const citedNormalized = new Set(result.sources.map(normalizedUrl));
    const citedHosts = new Set(result.sources.map(urlHost).filter(Boolean));
    const saved: Record<string, unknown>[] = [];

    for (const raw of rawItems) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const entityName = text(item.entity_name, 500);
      const location = text(item.location, 400);
      const address = text(item.address, 700);
      const modelSources = [safeHttpUrl(item.source_url), ...stringArray(item.source_urls, 16).map(safeHttpUrl)].filter(Boolean);
      const signalSources = cleanSignals(item.signals).map((signal) => signal.source_url).filter(Boolean);
      const dedupedSources = [...new Set([...modelSources, ...signalSources])];
      const primaryUrl = dedupedSources[0] || '';
      if (!entityName || !primaryUrl) continue;

      const exactCitation = dedupedSources.some((url) => citedNormalized.has(normalizedUrl(url)));
      const hostCitation = dedupedSources.some((url) => citedHosts.has(urlHost(url)));
      if (!exactCitation && !hostCitation) continue;

      const verificationStatus = exactCitation ? 'source_backed' : 'partially_verified';
      const signals = cleanSignals(item.signals).map((signal) => ({
        ...signal,
        source_url: signal.source_url && (citedNormalized.has(normalizedUrl(signal.source_url)) || citedHosts.has(urlHost(signal.source_url))) ? signal.source_url : '',
      }));
      const scoring = weightedIntelligenceScore(lane, item.score_breakdown);
      const confidence = confidenceScore(exactCitation, hostCitation, dedupedSources.length, signals);
      const now = new Date().toISOString();
      const payload = {
        tenant_id: tenantId,
        run_id: runId,
        lane,
        fingerprint: fingerprint(lane, entityName, address || location, primaryUrl),
        entity_name: entityName,
        entity_type: text(item.entity_type, 180) || null,
        location: location || null,
        address: address || null,
        primary_url: primaryUrl,
        source_urls: dedupedSources,
        score: scoring.score,
        confidence,
        verification_status: verificationStatus,
        signal_summary: text(item.signal_summary, 5000) || null,
        why_now: text(item.why_now, 4000) || null,
        value_text: text(item.value_text, 1200) || null,
        estimated_value: optionalNumber(item.estimated_value),
        score_breakdown: scoring.breakdown,
        signals,
        facts: cleanFacts(item.facts),
        risks: stringArray(item.risks, 20),
        contact_path: text(item.contact_path, 3500) || null,
        recommended_next_step: text(item.recommended_next_step, 3500) || null,
        draft_outreach: text(item.draft_outreach, 6000) || null,
        created_by: auth.user.id,
        last_seen_at: now,
        updated_at: now,
      };

      const { data, error } = await auth.db.from('customer_intelligence_leads').upsert(payload, { onConflict: 'tenant_id,lane,fingerprint' }).select('*').single();
      if (error) throw error;
      saved.push(data as Record<string, unknown>);
    }

    await auth.db.from('customer_intelligence_runs').update({
      status: 'completed',
      result_count: saved.length,
      source_urls: result.sources,
      completed_at: new Date().toISOString(),
    }).eq('id', runId);

    return NextResponse.json({ lane, leads: saved, sourceUrls: result.sources }, { headers: NO_STORE });
  } catch (error) {
    console.error('Intelligence Suite scan error', error);
    if (runId && failureDb) {
      try {
        await failureDb.from('customer_intelligence_runs').update({
          status: 'failed',
          error_message: error instanceof Error ? error.message.slice(0, 3000) : 'Unknown radar error',
          completed_at: new Date().toISOString(),
        }).eq('id', runId);
      } catch {
        // Preserve the original scan error.
      }
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Radar scan could not be completed.' }, { status: 500, headers: NO_STORE });
  }
}
