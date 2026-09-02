import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const NO_STORE = { 'Cache-Control': 'no-store' };

type Input = {
  company: string;
  sector: string;
  stage: string;
  revenue: number;
  recurringRevenue: number;
  grossMargin: number;
  ebitda: number;
  monthlyBurn: number;
  cash: number;
  valuation: number;
  raise: number;
  customerConcentration: number;
  growthRate: number;
  moat: string;
  claim: string;
  notes: string;
};

type Score = { label: string; score: number; reason: string };

type Output = {
  overallScore: number;
  decision: 'PASS' | 'INVESTIGATE' | 'DUE DILIGENCE' | 'INVEST';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  thesis: string;
  scorecard: Score[];
  redFlags: string[];
  questions: string[];
  diligenceChecklist: string[];
  proofPlan: string[];
  memo: {
    opportunity: string;
    market: string;
    economics: string;
    teamExecution: string;
    risks: string;
    recommendation: string;
  };
  assumptions: string[];
  demo?: boolean;
};

function text(value: unknown, max = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function num(value: unknown, min = -1_000_000_000, max = 1_000_000_000) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(min, n));
}

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function normalize(body: any): Input {
  return {
    company: text(body?.company, 160) || 'Target company',
    sector: text(body?.sector, 160) || 'Not specified',
    stage: text(body?.stage, 80) || 'Not specified',
    revenue: num(body?.revenue, 0),
    recurringRevenue: num(body?.recurringRevenue, 0),
    grossMargin: num(body?.grossMargin, -100, 100),
    ebitda: num(body?.ebitda),
    monthlyBurn: num(body?.monthlyBurn, 0),
    cash: num(body?.cash, 0),
    valuation: num(body?.valuation, 0),
    raise: num(body?.raise, 0),
    customerConcentration: num(body?.customerConcentration, 0, 100),
    growthRate: num(body?.growthRate, -100, 1000),
    moat: text(body?.moat, 1500),
    claim: text(body?.claim, 1500),
    notes: text(body?.notes, 4000),
  };
}

function fallback(input: Input): Output {
  const recurringPct = input.revenue > 0 ? (input.recurringRevenue / input.revenue) * 100 : 0;
  const runway = input.monthlyBurn > 0 ? input.cash / input.monthlyBurn : input.cash > 0 ? 36 : 0;
  const revenueMultiple = input.revenue > 0 && input.valuation > 0 ? input.valuation / input.revenue : 0;

  const marketScore = clamp(52 + Math.min(20, Math.max(-15, input.growthRate * 0.35)) + (input.sector.toLowerCase().includes('ai') ? 5 : 0));
  const economicsScore = clamp(45 + Math.max(-20, Math.min(24, (input.grossMargin - 40) * 0.45)) + Math.min(16, recurringPct * 0.16) + (input.ebitda > 0 ? 10 : 0));
  const executionScore = clamp(52 + Math.min(20, Math.max(-15, input.growthRate * 0.3)) + (runway >= 12 ? 10 : runway >= 6 ? 2 : -12));
  const defensibilityScore = clamp(40 + (input.moat.length >= 100 ? 22 : input.moat.length >= 40 ? 12 : 0) - (input.customerConcentration >= 40 ? 12 : 0));
  const diligenceScore = clamp(70 - (input.customerConcentration >= 30 ? 15 : 0) - (revenueMultiple >= 15 ? 12 : revenueMultiple >= 8 ? 6 : 0) - (runway > 0 && runway < 6 ? 15 : 0));
  const overallScore = clamp((marketScore + economicsScore + executionScore + defensibilityScore + diligenceScore) / 5);

  const decision: Output['decision'] = overallScore >= 82 ? 'INVEST' : overallScore >= 70 ? 'DUE DILIGENCE' : overallScore >= 55 ? 'INVESTIGATE' : 'PASS';
  const redFlags: string[] = [];
  if (input.customerConcentration >= 40) redFlags.push(`Top-customer concentration is ${Math.round(input.customerConcentration)}%; verify contract durability and downside if that account leaves.`);
  if (runway > 0 && runway < 6) redFlags.push(`Estimated runway is only ${runway.toFixed(1)} months at the entered burn rate.`);
  if (revenueMultiple >= 15) redFlags.push(`Entered valuation is about ${revenueMultiple.toFixed(1)}× annual revenue; the growth and moat must justify that premium.`);
  if (input.revenue <= 0) redFlags.push('No verified annual revenue was entered. Treat market traction and valuation conclusions as provisional.');
  if (!input.moat) redFlags.push('Defensibility is not yet described. Determine whether the advantage is data, workflow lock-in, IP, distribution, cost, or merely features.');
  if (!redFlags.length) redFlags.push('No obvious numerical deal-breaker appears in the entered facts, but source documents still need reconciliation.');

  return {
    overallScore,
    decision,
    confidence: input.notes.length > 80 && input.revenue > 0 ? 'MEDIUM' : 'LOW',
    thesis: `${input.company} warrants ${decision === 'PASS' ? 'a disciplined pass or major re-pricing' : decision === 'INVESTIGATE' ? 'a focused second look' : 'formal diligence'} based on the entered growth, economics, concentration, runway, and defensibility signals. The score is a screening aid, not an investment conclusion.`,
    scorecard: [
      { label: 'Market', score: marketScore, reason: `Growth entered at ${Math.round(input.growthRate)}%; sector is ${input.sector}.` },
      { label: 'Economics', score: economicsScore, reason: `Gross margin ${Math.round(input.grossMargin)}%; recurring revenue about ${Math.round(recurringPct)}% of entered revenue.` },
      { label: 'Execution', score: executionScore, reason: runway ? `Estimated runway ${runway.toFixed(1)} months.` : 'Runway cannot yet be established from the entered data.' },
      { label: 'Defensibility', score: defensibilityScore, reason: input.moat || 'Moat needs to be demonstrated rather than asserted.' },
      { label: 'Diligence quality', score: diligenceScore, reason: `Customer concentration ${Math.round(input.customerConcentration)}%; valuation/revenue multiple ${revenueMultiple ? revenueMultiple.toFixed(1) + '×' : 'not established'}.` },
    ],
    redFlags,
    questions: [
      'Which customer behavior proves this is a must-have rather than a nice-to-have product?',
      'Reconcile booked revenue, cash collections, bank deposits, deferred revenue, and any ARR presentation.',
      'What happens to revenue, gross margin, and burn if the largest customer leaves tomorrow?',
      'What proprietary data, IP, integration depth, distribution advantage, or switching cost compounds over time?',
      'Which assumptions in the next 18-month plan have already been demonstrated, and which are still hypotheses?',
      'What milestone does this financing buy, and what capital is likely required after that milestone?',
    ],
    diligenceChecklist: [
      'Bank statements, tax returns, P&L, balance sheet, cash-flow statement, and monthly revenue bridge',
      'Customer list with revenue concentration, contracts, renewals, churn, backlog, and cohort retention',
      'Cap table, prior financings, SAFEs/notes, option pool, board rights, and outstanding commitments',
      'Product architecture, security posture, data rights, IP ownership, key dependencies, and technical debt',
      'Sales pipeline by stage, historical conversion, CAC, payback, gross retention, net retention, and sales-cycle length',
      'Founder/key employee references, compensation, vesting, succession risk, and hiring plan',
    ],
    proofPlan: [
      'Pick the single claim that makes the company investable and define evidence that could falsify it.',
      'Reconcile reported revenue to bank/cash evidence before using it in valuation multiples.',
      'Interview a small set of customers without management present when permitted.',
      'Stress-test the plan at slower growth, lower margin, and a six-month financing delay.',
      'Document the go/no-go conditions before emotional momentum builds around the deal.',
    ],
    memo: {
      opportunity: `${input.company} is a ${input.stage} opportunity in ${input.sector}. It is seeking ${input.raise ? '$' + Math.round(input.raise).toLocaleString('en-US') : 'an unspecified amount'} at an entered valuation of ${input.valuation ? '$' + Math.round(input.valuation).toLocaleString('en-US') : 'not yet specified'}.`,
      market: `Entered growth is ${Math.round(input.growthRate)}%. Validate whether growth comes from repeatable demand, one-off contracts, channel concentration, or market expansion.`,
      economics: `Entered annual revenue is $${Math.round(input.revenue).toLocaleString('en-US')}, gross margin ${Math.round(input.grossMargin)}%, EBITDA $${Math.round(input.ebitda).toLocaleString('en-US')}, and recurring revenue $${Math.round(input.recurringRevenue).toLocaleString('en-US')}.`,
      teamExecution: `Runway is ${runway ? runway.toFixed(1) + ' months' : 'not established'}. Evaluate whether the team has repeatedly converted product capability into paying customer outcomes.`,
      risks: redFlags.join(' '),
      recommendation: `${decision}. Advance only if the evidence supporting revenue quality, customer durability, defensibility, and financing runway clears the stated diligence questions.`,
    },
    assumptions: [
      'This screen relies on user-entered information and may be incomplete or incorrect.',
      'Scores are decision support, not a valuation, audit, legal opinion, investment recommendation, or commitment of capital.',
      'Source documents and management claims should be independently verified before an investment decision.',
    ],
    demo: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Send a JSON request.' }, { status: 415, headers: NO_STORE });
    }

    const input = normalize(await request.json());
    if (!process.env.OPENAI_API_KEY) return NextResponse.json(fallback(input), { headers: NO_STORE });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2600,
      messages: [
        {
          role: 'system',
          content: `You are Aridon Investment Intelligence, an investor-side screening and diligence copilot. Your job is to help an experienced angel, venture, private-equity, or strategic investor decide what deserves attention and what must be verified. Never treat founder claims as proven facts. Distinguish evidence from assumptions. Be commercially useful, skeptical without being cynical, and concise. Do not make a legal, tax, audit, valuation-certainty, or investment-guarantee claim. Return valid JSON only in exactly this shape: {"overallScore":0,"decision":"PASS|INVESTIGATE|DUE DILIGENCE|INVEST","confidence":"LOW|MEDIUM|HIGH","thesis":"...","scorecard":[{"label":"Market","score":0,"reason":"..."},{"label":"Economics","score":0,"reason":"..."},{"label":"Execution","score":0,"reason":"..."},{"label":"Defensibility","score":0,"reason":"..."},{"label":"Diligence quality","score":0,"reason":"..."}],"redFlags":["..."],"questions":["..."],"diligenceChecklist":["..."],"proofPlan":["..."],"memo":{"opportunity":"...","market":"...","economics":"...","teamExecution":"...","risks":"...","recommendation":"..."},"assumptions":["..."]}. Scores must be integers 0-100.`,
        },
        {
          role: 'user',
          content: `Screen this opportunity from the investor's side. Identify contradictions, missing evidence, valuation pressure points, customer concentration, revenue quality, capital/runway risk, defensibility, technical proof needs, and the highest-value questions for management.\n\n${JSON.stringify(input, null, 2)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(raw) as Output;
      parsed.overallScore = clamp(Number(parsed.overallScore) || 0);
      parsed.scorecard = Array.isArray(parsed.scorecard) ? parsed.scorecard.map((s) => ({ ...s, score: clamp(Number(s.score) || 0) })) : [];
      return NextResponse.json(parsed, { headers: NO_STORE });
    } catch {
      return NextResponse.json(fallback(input), { headers: NO_STORE });
    }
  } catch (error) {
    console.error('Investor intelligence analysis error', error);
    return NextResponse.json({ error: 'Investor Intelligence could not complete the screen.' }, { status: 500, headers: NO_STORE });
  }
}
