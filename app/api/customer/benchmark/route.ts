import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { benchmarkDimensions, benchmarkScenarios } from '../../../../lib/aridonBenchmark';

export const runtime = 'nodejs';
export const maxDuration = 60;
const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type ResponsePayload = { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
function text(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function extractText(data: ResponsePayload) { if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim(); return (data.output || []).flatMap((item) => item.content || []).filter((item) => item.type === 'output_text' && typeof item.text === 'string').map((item) => item.text as string).join('\n\n').trim(); }
function parseJson(value: string) { const clean = value.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim(); const first = clean.indexOf('{'); const last = clean.lastIndexOf('}'); if (first < 0 || last < first) throw new Error('Evaluator returned no JSON object.'); return JSON.parse(clean.slice(first, last + 1)); }
async function runModel(apiKey: string, model: string, input: string, maxOutputTokens: number) { const response = await fetch(RESPONSES_URL, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, input, max_output_tokens: maxOutputTokens, store: false }), cache: 'no-store' }); const data = (await response.json()) as ResponsePayload; if (!response.ok) throw new Error(data.error?.message || `AI service returned ${response.status}.`); const output = extractText(data); if (!output) throw new Error('AI service returned no readable output.'); return output; }

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    const slug = text(body?.slug, 80); const scenarioId = text(body?.scenarioId, 80); const customPrompt = text(body?.customPrompt, 6000);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });

    const scenario = benchmarkScenarios.find((item) => item.id === scenarioId); const prompt = customPrompt || scenario?.prompt || '';
    if (prompt.length < 20) return NextResponse.json({ error: 'Choose a benchmark scenario or provide a meaningful custom scenario.' }, { status: 400, headers: NO_STORE });
    const db = auth.db; const tenantId = membership.tenant.id;
    const [projects, tasks, knowledge] = await Promise.all([
      db.from('customer_projects').select('name,description,status').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(8),
      db.from('customer_tasks').select('title,owner,priority,status').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(12),
      db.from('customer_knowledge').select('title,category,content').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(8),
    ]);
    if (projects.error) throw projects.error; if (tasks.error) throw tasks.error; if (knowledge.error) throw knowledge.error;

    const context = JSON.stringify({ business: membership.tenant.business_name, industry: membership.tenant.industry, projects: projects.data || [], tasks: tasks.data || [], knowledge: (knowledge.data || []).map((item) => ({ ...item, content: text(item.content, 1200) })) }, null, 2).slice(0, 22000);
    const apiKey = process.env.OPENAI_API_KEY?.trim(); if (!apiKey) return NextResponse.json({ error: 'The AI service is not configured on this deployment.' }, { status: 503, headers: NO_STORE });
    const model = process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6'; const evaluatorModel = process.env.BENCHMARK_EVALUATOR_MODEL?.trim() || model;
    const candidatePrompt = `You are the Aridon Executive Boardroom. Produce the best visible CEO-ready answer you can to the benchmark scenario below. Coordinate strategy, finance, operations, revenue, marketing, technology, customer, and chief-of-staff perspectives where relevant.\n\nRequired output:\n1. Recommended decision\n2. Why this decision\n3. Cross-functional assessment\n4. Concrete execution plan with owners and done-when criteria\n5. Risks and assumptions\n6. Approval gates\n7. What happens in the next 72 hours\n\nNever pretend an external action happened. Separate company-provided context from assumptions.\n\nCOMPANY CONTEXT:\n${context}\n\nBENCHMARK SCENARIO:\n${prompt}`;
    const answer = await runModel(apiKey, model, candidatePrompt, 2600);
    const rubric = benchmarkDimensions.map((item) => `${item.id}: ${item.label}, weight ${item.weight}. ${item.description}`).join('\n');
    const evaluationText = await runModel(apiKey, evaluatorModel, `Act as a strict business-system evaluator. Score only the visible candidate answer against the rubric. Do not reward confident wording without substance. Each dimension gets an integer score from 0 to 100. Return ONLY valid JSON with this exact shape: {"scores":{"accuracy":0,"judgment":0,"crossFunctional":0,"execution":0,"evidence":0,"risk":0,"control":0,"clarity":0},"strengths":["..."],"failures":["..."],"verdict":"..."}.\n\nRUBRIC:\n${rubric}\n\nSCENARIO:\n${prompt}\n\nCANDIDATE ANSWER:\n${answer}`, 1200);
    const evaluation = parseJson(evaluationText); const scores = evaluation.scores || {}; let weighted = 0;
    for (const dimension of benchmarkDimensions) { const score = Math.max(0, Math.min(100, Number(scores[dimension.id]) || 0)); scores[dimension.id] = score; weighted += score * (dimension.weight / 100); }
    const result = { scenario: { id: scenario?.id || 'custom', title: scenario?.title || 'Custom benchmark', prompt }, model, evaluatorModel, benchmarkVersion: '1.1', runAt: new Date().toISOString(), answer, scores, overall: Math.round(weighted), strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths.slice(0, 6) : [], failures: Array.isArray(evaluation.failures) ? evaluation.failures.slice(0, 6) : [], verdict: text(evaluation.verdict, 1200), disclosure: 'Internal reproducible evaluation. This result does not claim superiority over another product unless that product is run on the same scenario and scored under the same rubric.' };
    const { error: historyError } = await db.from('customer_benchmark_runs').insert({ tenant_id: tenantId, user_id: auth.user.id, scenario_id: result.scenario.id, scenario_title: result.scenario.title, model, evaluator_model: evaluatorModel, benchmark_version: result.benchmarkVersion, overall_score: result.overall, scores, strengths: result.strengths, failures: result.failures, verdict: result.verdict, answer });
    if (historyError) console.error('Benchmark history error', historyError);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) { console.error('Benchmark error', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'The benchmark run could not be completed.' }, { status: 500, headers: NO_STORE }); }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const slug = text(new URL(request.url).searchParams.get('slug'), 80); const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const { data, error } = await auth.db.from('customer_benchmark_runs').select('id,scenario_id,scenario_title,model,evaluator_model,benchmark_version,overall_score,scores,strengths,failures,verdict,created_at').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(50);
    if (error) throw error; return NextResponse.json({ runs: data || [] }, { headers: NO_STORE });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load benchmark history.' }, { status: 500, headers: NO_STORE }); }
}
