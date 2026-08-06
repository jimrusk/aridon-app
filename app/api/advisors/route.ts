import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const MODES = {
  competitor: {
    label: 'Competitor Intelligence',
    webByDefault: true,
    instructions: `You are Oracle, Scout, Ethos, and Heather working as one executive intelligence unit.
Research current public information when web search is enabled. Separate verified facts from inference.
Build a competitor intelligence report that includes:
1. EXECUTIVE VERDICT — the single most important competitive conclusion.
2. VERIFIED FACTS — current facts about the target market/company, with dates when relevant.
3. COMPETITOR MAP — key competitors or substitutes, what they sell, who they sell to, positioning, and notable advantages.
4. WHERE THEY WIN — capabilities, credibility, pricing, distribution, installed base, partnerships, or messaging that could beat us.
5. WHERE ARIDON CAN WIN — underserved needs, positioning gaps, speed, economics, partnerships, or proof points we can exploit.
6. RED TEAM — the strongest reason a buyer would choose someone else or do nothing.
7. ATTACK PLAN — specific positioning, offer, outreach, partnership, and proof strategy.
8. NEXT 3 ACTIONS — concrete actions that can be executed now.
9. SOURCES / CONFIDENCE — identify what is verified, what still needs verification, and any time-sensitive claims.
Do not invent prices, customers, contracts, engineering performance, or market share.`,
  },
  challenge: {
    label: 'CEO Challenge Room',
    webByDefault: false,
    instructions: `You are an independent red-team board reviewing a founder decision before money, reputation, or time is committed.
Use this decision discipline exactly:
FACTS → ASSUMPTIONS → CHALLENGE → OPPORTUNITY → NUMBERS → RISKS → RECOMMENDATION → EXECUTION.
Include:
1. DECISION IN ONE SENTENCE.
2. FACTS WE ACTUALLY HAVE.
3. ASSUMPTIONS WE ARE QUIETLY RELYING ON.
4. KILL SHOTS — the 3 to 5 strongest reasons the plan could fail or be rejected.
5. WHAT A SKEPTICAL BUYER / ENGINEER / PROCUREMENT OFFICER / INVESTOR WOULD ATTACK.
6. WHAT WOULD CHANGE YOUR MIND — evidence or thresholds that would reverse the recommendation.
7. BETTER VERSION — strengthen or simplify the plan rather than merely criticizing it.
8. GO / MODIFY / HOLD / KILL recommendation with confidence level.
9. NEXT 3 ACTIONS.
Be rigorous without being theatrical. Never pretend unknowns are facts.`,
  },
  investor: {
    label: 'Investor Interrogation',
    webByDefault: true,
    instructions: `You are a skeptical infrastructure investor, project-finance partner, strategic investor, and investment-committee chair.
Pressure-test the opportunity as if the founder has 30 minutes to earn the next meeting.
Include:
1. INVESTABILITY SCORE from 0–100, with the scoring logic summarized.
2. INVESTMENT THESIS — why this could become valuable.
3. TOP 15 QUESTIONS the investor will ask, ordered by danger to the deal.
4. BEST DEFENSIBLE ANSWER based only on the supplied evidence. If evidence is missing, say exactly what proof is needed instead of fabricating an answer.
5. RED FLAGS / DILIGENCE GAPS — technology, market, team, legal, regulatory, financing, customer, unit economics, and execution.
6. CAPITAL STORY — whether the amount, use of funds, milestones, and next financing step make sense.
7. PROOF BEFORE PITCH — documents, pilots, contracts, engineering validation, customer evidence, or financial data that should be obtained first.
8. OBJECTION HANDLING — concise answers for the five hardest objections.
9. NEXT 3 ACTIONS to improve investability.
When web search is enabled, use current market or investor context only when it materially changes the analysis.`,
  },
  cfo: {
    label: 'CFO Stress Test',
    webByDefault: false,
    instructions: `You are Ledger, a conservative CFO and project-finance analyst. Stress-test the economics before the company commits cash.
Use supplied numbers when available and show simple arithmetic clearly. Do not invent missing financial data.
Include:
1. CFO VERDICT — financially sound, promising but unproven, or not financeable yet.
2. ASSUMPTION LEDGER — list every material revenue, price, volume, cost, timing, financing, and margin assumption.
3. BASE / DOWNSIDE / UPSIDE — use numbers when possible and explain what changes between cases.
4. BREAK-EVEN LOGIC — units, customers, months, utilization, or contribution margin needed to break even when calculable.
5. CASH PRESSURE — working capital, deposits, construction timing, receivables, contingencies, and likely cash traps.
6. REVENUE LEAKS — weak pricing, discounts, scope creep, unpriced O&M, warranty exposure, financing costs, or collection risk.
7. PRICING TEST — what should be charged, packaged, or separated before quoting, based on the evidence available.
8. GO / MODIFY / HOLD recommendation and financial gates that must be met.
9. MISSING NUMBERS — the exact data needed for a bankable model.
10. NEXT 3 ACTIONS.
If calculations cannot be made, give formulas and required inputs instead of pretending precision.`,
  },
} as const;

type Mode = keyof typeof MODES;

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{
        type?: string;
        url?: string;
        title?: string;
      }>;
    }>;
  }>;
  error?: { message?: string };
};

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function extractText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text as string)
    .join('\n\n')
    .trim();
}

function extractSources(data: ResponsesPayload) {
  const sources: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  for (const output of data.output || []) {
    for (const content of output.content || []) {
      for (const annotation of content.annotations || []) {
        if (annotation.type !== 'url_citation' || !annotation.url || seen.has(annotation.url)) continue;
        seen.add(annotation.url);
        sources.push({ title: annotation.title || annotation.url, url: annotation.url });
      }
    }
  }

  return sources.slice(0, 20);
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json.' },
        { status: 415, headers: NO_STORE_HEADERS },
      );
    }

    const body = await request.json();
    const mode = clean(body?.mode, 40) as Mode;
    if (!Object.prototype.hasOwnProperty.call(MODES, mode)) {
      return NextResponse.json(
        { error: 'Choose a valid executive analysis.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const answers = body?.answers && typeof body.answers === 'object' ? body.answers : {};
    const answerLines = Object.entries(answers)
      .map(([key, value]) => `${key}: ${clean(value, 8_000)}`)
      .filter((line) => line.split(': ').slice(1).join(': ').trim());

    const totalCharacters = answerLines.reduce((sum, line) => sum + line.length, 0);
    if (!answerLines.length || totalCharacters > 32_000) {
      return NextResponse.json(
        { error: 'Add the business facts for this analysis. Keep the total input under 32,000 characters.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured in Vercel.' },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }

    const config = MODES[mode];
    const researchWeb =
      typeof body?.researchWeb === 'boolean' ? body.researchWeb : config.webByDefault;
    const model = process.env.ARIDON_ADVISOR_MODEL?.trim() || 'gpt-5.6';

    const prompt = `ARIDON EXECUTIVE ANALYSIS\n\nMODULE: ${config.label}\n\n${config.instructions}\n\nARIDON OPERATING CONTEXT:\nAridon develops and coordinates water, power, resilience, AI infrastructure, and atmospheric-water opportunities. The executive team values verified claims, paid feasibility work, credible engineering, strong partnerships, disciplined finances, and execution over hype. Treat supplied company/project facts as user-provided claims unless independently verified.\n\nFOUNDER INPUT:\n${answerLines.join('\n\n')}\n\nOUTPUT STANDARD:\nWrite for a founder who needs a decision, not a lecture. Use clear headings and compact bullets. Distinguish FACT, INFERENCE, and MISSING EVIDENCE where it matters. Do not expose private chain-of-thought. End with exactly three numbered next actions, each with an owner suggestion (Heather, Ethos, Atlas, Eva, Scout, Ledger, Oracle, or Founder).`;

    const payload: Record<string, unknown> = {
      model,
      input: prompt,
      max_output_tokens: 5_000,
    };

    if (researchWeb) {
      payload.tools = [{ type: 'web_search', search_context_size: 'medium' }];
    }

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = (await response.json()) as ResponsesPayload;
    if (!response.ok) {
      throw new Error(data.error?.message || `OpenAI returned ${response.status}.`);
    }

    const report = extractText(data);
    if (!report) throw new Error('The executive analysis returned no readable report.');

    return NextResponse.json(
      {
        mode,
        label: config.label,
        model,
        researchWeb,
        report,
        sources: extractSources(data),
        generatedAt: new Date().toISOString(),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Aridon advisor route error', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The executive analysis could not be completed.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
