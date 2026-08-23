import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const NO_STORE = { 'Cache-Control': 'no-store' };

type FinanceSnapshot = {
  revenue?: number;
  budgetRevenue?: number;
  grossMargin?: number;
  payroll?: number;
  otherOpex?: number;
  budgetOpex?: number;
  cash?: number;
  receivables?: number;
  payables?: number;
  operatingIncome?: number;
  operatingMargin?: number;
  runwayMonths?: number;
  scenario?: {
    label?: string;
    revenueGrowth?: number;
    marginShift?: number;
    opexGrowth?: number;
  };
  projectedMonth12Revenue?: number;
  projectedMonth12OperatingIncome?: number;
};

type FinanceResponse = {
  summary: string;
  actions: string[];
  risks: string[];
  scenarioIdeas: string[];
  demo?: boolean;
};

function cleanText(value: unknown, max = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function num(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeSnapshot(raw: FinanceSnapshot): FinanceSnapshot {
  return {
    revenue: num(raw?.revenue),
    budgetRevenue: num(raw?.budgetRevenue),
    grossMargin: num(raw?.grossMargin),
    payroll: num(raw?.payroll),
    otherOpex: num(raw?.otherOpex),
    budgetOpex: num(raw?.budgetOpex),
    cash: num(raw?.cash),
    receivables: num(raw?.receivables),
    payables: num(raw?.payables),
    operatingIncome: num(raw?.operatingIncome),
    operatingMargin: num(raw?.operatingMargin),
    runwayMonths: num(raw?.runwayMonths),
    scenario: {
      label: cleanText(raw?.scenario?.label, 40),
      revenueGrowth: num(raw?.scenario?.revenueGrowth),
      marginShift: num(raw?.scenario?.marginShift),
      opexGrowth: num(raw?.scenario?.opexGrowth),
    },
    projectedMonth12Revenue: num(raw?.projectedMonth12Revenue),
    projectedMonth12OperatingIncome: num(raw?.projectedMonth12OperatingIncome),
  };
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function demoAnalysis(snapshot: FinanceSnapshot): FinanceResponse {
  const revenue = num(snapshot.revenue);
  const budgetRevenue = num(snapshot.budgetRevenue);
  const operatingIncome = num(snapshot.operatingIncome);
  const operatingMargin = num(snapshot.operatingMargin);
  const runway = num(snapshot.runwayMonths);
  const cash = num(snapshot.cash);
  const receivables = num(snapshot.receivables);
  const payables = num(snapshot.payables);
  const revenueGap = revenue - budgetRevenue;
  const risks: string[] = [];
  const actions: string[] = [];
  const scenarioIdeas: string[] = [];

  if (operatingIncome < 0) {
    risks.push(`The business is currently losing about ${money(Math.abs(operatingIncome))} per month at the operating level.`);
    actions.push('Set a break-even plan that identifies the revenue, gross-margin, and expense combination required to stop the monthly loss.');
  } else {
    actions.push(`Protect the current ${percent(operatingMargin)} operating margin before adding fixed cost.`);
  }

  if (runway > 0 && runway < 6) {
    risks.push(`Estimated cash runway is only about ${runway.toFixed(1)} months at the current burn rate.`);
    actions.push('Freeze or stage nonessential fixed-cost additions until cash runway improves.');
  }

  if (revenueGap < 0) {
    risks.push(`Revenue is ${money(Math.abs(revenueGap))} below the monthly plan.`);
    actions.push('Separate the revenue shortfall into pipeline volume, conversion rate, pricing, and timing so the owner can attack the actual driver.');
  } else {
    actions.push(`Revenue is ${money(revenueGap)} above the current monthly plan; test how much of that outperformance is repeatable before raising the expense base.`);
  }

  if (receivables > revenue * 0.75) {
    risks.push(`Receivables of ${money(receivables)} are high relative to one month of revenue and may be tying up cash.`);
    actions.push('Review aging receivables and make collections a near-term cash priority.');
  }

  if (payables > cash * 0.5 && cash > 0) {
    risks.push('Payables are large relative to available cash, which can tighten near-term liquidity.');
  }

  scenarioIdeas.push('Run a hiring case that adds payroll while holding revenue flat for three months.');
  scenarioIdeas.push('Run a margin-pressure case with gross margin down 3 points and expenses unchanged.');
  scenarioIdeas.push('Run a collections case that converts a meaningful portion of receivables to cash and compare runway.');

  return {
    summary: `The finance picture is ${operatingIncome >= 0 ? 'currently operating above break-even' : 'currently below break-even'} with ${money(cash)} in cash, ${money(revenue)} in monthly revenue, and a ${percent(operatingMargin)} operating margin. The best next move is to manage the biggest driver rather than react to the headline number alone.`,
    actions: actions.slice(0, 5),
    risks: risks.length ? risks.slice(0, 5) : ['No major threshold breach is visible from the supplied snapshot, but the assumptions should still be stress-tested.'],
    scenarioIdeas,
    demo: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Send a JSON request.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const question = cleanText(body?.question, 4000);
    const snapshot = normalizeSnapshot((body?.snapshot || {}) as FinanceSnapshot);

    if (question.length < 8) {
      return NextResponse.json({ error: 'Ask a specific finance or planning question.' }, { status: 400, headers: NO_STORE });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(demoAnalysis(snapshot), { headers: NO_STORE });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.25,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `You are Nova, Aridon's finance planning and analysis executive. Analyze only the numerical snapshot supplied by the user. You specialize in forecasting, scenario planning, budget-vs-actual variance, cash runway, working capital, anomaly detection, and decision-ready financial explanations.\n\nRULES\n- Never invent historical results, bank balances, contracts, pipeline, accounting data, tax facts, or assumptions that were not supplied.\n- Clearly distinguish observed numbers from suggested scenarios.\n- Do not present projections as guarantees.\n- Prioritize owner decisions, cash protection, profitability, and reversible tests.\n- Keep consequential financial commitments behind owner approval.\n- Return valid JSON only in this exact shape: {"summary":"...","actions":["..."],"risks":["..."],"scenarioIdeas":["..."]}.\n- actions, risks, and scenarioIdeas should each contain 2 to 5 concise items.`,
        },
        {
          role: 'user',
          content: `QUESTION\n${question}\n\nFINANCE SNAPSHOT\n${JSON.stringify(snapshot, null, 2)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(raw) as FinanceResponse;
      if (!parsed?.summary || !Array.isArray(parsed.actions) || !Array.isArray(parsed.risks) || !Array.isArray(parsed.scenarioIdeas)) {
        throw new Error('Invalid finance response shape');
      }
      return NextResponse.json(parsed, { headers: NO_STORE });
    } catch {
      return NextResponse.json(demoAnalysis(snapshot), { headers: NO_STORE });
    }
  } catch (error) {
    console.error('Finance route error', error);
    return NextResponse.json({ error: 'Aridon Finance could not complete this analysis.' }, { status: 500, headers: NO_STORE });
  }
}
