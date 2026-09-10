import { NextRequest, NextResponse } from 'next/server';
import { getUserScopedClient } from '../../../../lib/supabase';
import { customerTenantForUser } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type Payload = { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
function text(value: unknown, max = 1500) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function extractText(data: Payload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text' && typeof item.text === 'string').map(item => item.text as string).join('\n\n').trim();
}
function parseJson(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const first = cleaned.indexOf('{'); const last = cleaned.lastIndexOf('}');
  if (first < 0 || last < first) throw new Error('Supplier discovery returned no JSON object.');
  return JSON.parse(cleaned.slice(first, last + 1));
}
function host(value: string) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./,''); } catch { return value.toLowerCase().replace(/^https?:\/\//,'').split('/')[0]; }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) return NextResponse.json({ error: 'Sign in to run live supplier discovery.' }, { status: 401, headers: NO_STORE });
    const token = authorization.slice(7).trim();
    const db = getUserScopedClient(token);
    const { data: userData, error: userError } = await db.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: 'Your Aridon session has expired.' }, { status: 401, headers: NO_STORE });

    const body = await request.json();
    const niche = text(body?.niche, 250);
    const geography = text(body?.geography, 200) || 'United States';
    const slug = text(body?.slug, 80) || undefined;
    if (!niche) return NextResponse.json({ error: 'Choose a product niche first.' }, { status: 400, headers: NO_STORE });
    const membership = await customerTenantForUser(userData.user.id, slug, token);
    if (!membership) return NextResponse.json({ error: 'No Aridon workspace is available for this account.' }, { status: 403, headers: NO_STORE });

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Live AI research is not configured.' }, { status: 503, headers: NO_STORE });
    const model = process.env.OPENAI_COMMERCE_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6';
    const prompt = `You are Aridon's Supplier Scout. Search the live public web for legitimate manufacturers, master distributors, or dealer programs relevant to this high-ticket product niche: ${niche}. Primary geography: ${geography}.\n\nReturn 8 to 12 strong candidates. Prefer real manufacturers with active official websites, dealer/reseller/partner information, product catalogs, warranty/support infrastructure, and evidence they serve the requested market. Do not include marketplaces, affiliate programs, obvious retail-only stores, dropshipping directories, or companies whose existence cannot be verified. Never claim a company is accepting Aridon as a dealer. Never invent margins, MAP terms, pricing, contacts, territories, certifications, or authorization.\n\nScore each candidate 0-100 using: niche fit 30, manufacturer/distributor legitimacy 20, dealer/channel fit evidence 20, fulfillment/support evidence 15, product depth/quality 10, public contactability 5.\n\nReturn ONLY JSON: {"suppliers":[{"name":"...","website":"https://official...","contact":"public contact page/email/phone if clearly found, otherwise blank","score":0,"whyFit":"short evidence-based reason","sourceUrl":"best official source or official dealer page","evidence":["brief factual finding with source context","..."]}]}. Use official company pages as the primary source whenever possible.`;

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: prompt, tools: [{ type: 'web_search', search_context_size: 'high' }], max_output_tokens: 4200, store: false }),
      cache: 'no-store',
    });
    const raw = (await response.json()) as Payload;
    if (!response.ok) throw new Error(raw.error?.message || `Supplier research returned ${response.status}.`);
    const parsed = parseJson(extractText(raw));
    const discovered = Array.isArray(parsed?.suppliers) ? parsed.suppliers.slice(0, 12).map((item: any) => ({
      name: text(item?.name, 180),
      website: text(item?.website, 500),
      contact: text(item?.contact, 500),
      score: Math.max(0, Math.min(100, Number(item?.score) || 50)),
      why_fit: text(item?.whyFit, 1200),
      source_url: text(item?.sourceUrl, 700),
      evidence: Array.isArray(item?.evidence) ? item.evidence.map((x: unknown) => text(x, 600)).filter(Boolean).slice(0, 8) : [],
      discovered_by_ai: true,
      status: 'Research',
    })).filter((item: any) => item.name && item.website) : [];
    if (!discovered.length) throw new Error('No verified supplier candidates were returned.');

    const existing = await db.from('commerce_suppliers').select('id,website,name').eq('tenant_id', membership.tenant.id);
    if (existing.error) throw existing.error;
    const existingHosts = new Set((existing.data || []).map((row: any) => host(row.website || row.name || '')));
    const unique = discovered.filter((item: any) => !existingHosts.has(host(item.website || item.name)));
    const rows = unique.map((item: any) => ({ ...item, tenant_id: membership.tenant.id, created_by: userData.user.id }));
    if (!rows.length) return NextResponse.json({ suppliers: [], duplicatesSkipped: discovered.length, message: 'All discovered suppliers were already in your pipeline.' }, { headers: NO_STORE });
    const insert = await db.from('commerce_suppliers').insert(rows).select('*');
    if (insert.error) throw insert.error;
    return NextResponse.json({ suppliers: insert.data || [], duplicatesSkipped: discovered.length - rows.length }, { headers: NO_STORE });
  } catch (error) {
    console.error('commerce supplier discovery failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Supplier discovery failed.' }, { status: 500, headers: NO_STORE });
  }
}