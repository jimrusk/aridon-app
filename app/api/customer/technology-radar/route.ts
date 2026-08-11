import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { radarCategories, radarDecisions, radarQuestions } from '../../../../lib/technologyRadar';

export const runtime = 'nodejs';
export const maxDuration = 60;
const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type Payload = { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string; annotations?: Array<{ type?: string; url?: string; title?: string }> }> }>; error?: { message?: string } };

function text(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function extractText(data: Payload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || []).flatMap((item) => item.content || []).filter((item) => item.type === 'output_text' && typeof item.text === 'string').map((item) => item.text as string).join('\n\n').trim();
}
function parseJson(value: string) {
  const clean = value.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const first = clean.indexOf('{'); const last = clean.lastIndexOf('}');
  if (first < 0 || last < first) throw new Error('Radar returned no JSON object.');
  return JSON.parse(clean.slice(first, last + 1));
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const result = await auth.db.from('customer_technology_radar_items').select('*').eq('tenant_id', membership.tenant.id).order('scanned_at', { ascending: false }).limit(100);
    if (result.error) throw result.error;
    return NextResponse.json({ businessName: membership.tenant.business_name, categories: radarCategories, decisions: radarDecisions, items: result.data || [] }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load Technology Radar.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const focus = text(body?.focus, 500);
    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'AI service is not configured.' }, { status: 503, headers: NO_STORE });
    const model = process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6';
    const prompt = `You are Atlas, Aridon's CTO, running a live Technology Radar for ${membership.tenant.business_name}. Search the current web for significant new or trending technology that could improve, threaten, complement, or accelerate an AI business command platform. Cover these categories: ${radarCategories.join('; ')}. ${focus ? `Special focus: ${focus}.` : ''}\n\nEvaluate each candidate using these questions:\n${radarQuestions.map((q) => `- ${q}`).join('\n')}\n\nClassify every item with exactly one decision: use, integrate, beat, watch, ignore. Prefer a small set of high-signal findings over hype. Return ONLY JSON with shape {"items":[{"category":"...","name":"...","summary":"...","recommendation":"use|integrate|beat|watch|ignore","impactScore":0,"confidence":0.0,"rationale":"...","sourceUrls":["https://..."]}]}. Include 5 to 10 items. Do not invent launches, capabilities, pricing, or availability.`;

    const response = await fetch(RESPONSES_URL, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, input: prompt, tools: [{ type: 'web_search', search_context_size: 'high' }], max_output_tokens: 2400, store: false }), cache: 'no-store' });
    const data = (await response.json()) as Payload;
    if (!response.ok) throw new Error(data.error?.message || `AI service returned ${response.status}.`);
    const parsed = parseJson(extractText(data));
    const allowed = new Set(['use','integrate','beat','watch','ignore']);
    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 10).map((item: any) => ({
      tenant_id: membership.tenant.id,
      category: text(item.category, 120) || 'AI technology',
      name: text(item.name, 180) || 'Unnamed technology',
      summary: text(item.summary, 1200),
      recommendation: allowed.has(item.recommendation) ? item.recommendation : 'watch',
      impact_score: Math.max(0, Math.min(100, Number(item.impactScore) || 50)),
      confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.7)),
      source_urls: Array.isArray(item.sourceUrls) ? item.sourceUrls.filter((url: unknown) => typeof url === 'string').slice(0, 6) : [],
      rationale: text(item.rationale, 1200),
    })) : [];
    if (!items.length) throw new Error('Atlas found no radar items to store.');
    const insert = await auth.db.from('customer_technology_radar_items').insert(items).select('*');
    if (insert.error) throw insert.error;
    return NextResponse.json({ items: insert.data || [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Technology Radar error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Technology Radar scan failed.' }, { status: 500, headers: NO_STORE });
  }
}
