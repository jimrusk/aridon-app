import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';
import { benchmarkDimensions, benchmarkScenarios } from '../../../../lib/aridonBenchmark';

export const runtime = 'nodejs';
export const maxDuration = 60;
const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type ResponsePayload = { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
function text(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function extractText(data: ResponsePayload) { if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim(); return (data.output || []).flatMap((item) => item.content || []).filter((item) => item.type === 'output_text' && typeof item.text === 'string').map((item) => item.text as string).join('\n\n').trim(); }
function parseJson(value: string) { const clean = value.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim(); const first = clean.indexOf('{'); const last = clean.lastIndexOf('}'); if (first < 0 || last < first) throw new Error('Evaluator returned no JSON.'); return JSON.parse(clean.slice(first, last + 1)); }

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json(); const slug = text(body?.slug, 80); const competitorName = text(body?.competitorName, 120); const scenarioId = text(body?.scenarioId, 80); const answer = text(body?.answer, 18000);
    if (!competitorName || !answer) return NextResponse.json({ error: 'Competitor name and visible answer are required.' }, { status: 400, headers: NO_STORE });
    const membership = await customerTenantForUser(auth.user.id, slug); if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const scenario = benchmarkScenarios.find((item) => item.id === scenarioId); if (!scenario) return NextResponse.json({ error: 'Use one of the fixed benchmark scenarios for a fair comparison.' }, { status: 400, headers: NO_STORE });
    const apiKey = process.env.OPENAI_API_KEY?.trim(); if (!apiKey) return NextResponse.json({ error: 'AI service is not configured.' }, { status: 503, headers: NO_STORE });
    const evaluatorModel = process.env.BENCHMARK_EVALUATOR_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6';
    const rubric = benchmarkDimensions.map((item) => `${item.id}: ${item.label}, weight ${item.weight}. ${item.description}`).join('\n');
    const prompt = `Act as a strict business-system evaluator. Score ONLY the visible answer below against the same Aridon benchmark rubric. Do not infer hidden tools, workflows, or capabilities. Return ONLY valid JSON: {"scores":{"accuracy":0,"judgment":0,"crossFunctional":0,"execution":0,"evidence":0,"risk":0,"control":0,"clarity":0},"strengths":["..."],"failures":["..."],"verdict":"..."}.\n\nRUBRIC:\n${rubric}\n\nSCENARIO:\n${scenario.prompt}\n\nVISIBLE ANSWER FROM ${competitorName}:\n${answer}`;
    const response = await fetch(RESPONSES_URL, { method:'POST', headers:{ Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json' }, body:JSON.stringify({ model:evaluatorModel, input:prompt, max_output_tokens:1200, store:false }), cache:'no-store' });
    const raw = (await response.json()) as ResponsePayload; if (!response.ok) throw new Error(raw.error?.message || `AI service returned ${response.status}.`);
    const evaluation = parseJson(extractText(raw)); const scores = evaluation.scores || {}; let weighted = 0;
    for (const dimension of benchmarkDimensions) { const score = Math.max(0, Math.min(100, Number(scores[dimension.id]) || 0)); scores[dimension.id] = score; weighted += score * (dimension.weight/100); }
    const overall = Math.round(weighted); const strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths.slice(0,6) : []; const failures = Array.isArray(evaluation.failures) ? evaluation.failures.slice(0,6) : []; const verdict = text(evaluation.verdict,1200);
    const { data, error } = await auth.db.from('customer_competitor_benchmark_runs').insert({ tenant_id:membership.tenant.id, competitor_name:competitorName, scenario_id:scenario.id, scenario_title:scenario.title, evaluator_model:evaluatorModel, benchmark_version:'1.1', answer, overall_score:overall, scores, strengths, failures, verdict }).select('*').single(); if (error) throw error;
    return NextResponse.json({ run:data, disclosure:'Fair comparison requires the same scenario and rubric. This scores only the answer supplied; it does not independently verify the competitor’s hidden capabilities.' }, { headers:NO_STORE });
  } catch (error) { return NextResponse.json({ error:error instanceof Error ? error.message : 'Competitor benchmark failed.' }, { status:500, headers:NO_STORE }); }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status:auth.status, headers:NO_STORE });
    const slug = text(new URL(request.url).searchParams.get('slug'),80); const membership = await customerTenantForUser(auth.user.id,slug); if (!membership) return NextResponse.json({ error:'You do not have access to this workspace.' }, { status:403, headers:NO_STORE });
    const { data,error } = await auth.db.from('customer_competitor_benchmark_runs').select('*').eq('tenant_id',membership.tenant.id).order('created_at',{ascending:false}).limit(50); if (error) throw error;
    return NextResponse.json({ runs:data || [] }, { headers:NO_STORE });
  } catch (error) { return NextResponse.json({ error:error instanceof Error ? error.message : 'Unable to load competitor benchmarks.' }, { status:500, headers:NO_STORE }); }
}
