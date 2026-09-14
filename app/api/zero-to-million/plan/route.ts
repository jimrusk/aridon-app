import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

type Input = {
  business?: string;
  skills?: string;
  customers?: string;
  problem?: string;
  offer?: string;
  price?: number;
  monthlyRevenue?: number;
  monthlyCustomers?: number;
  hoursPerWeek?: number;
  cashAvailable?: number;
  proof?: string;
};

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function stageFor(revenue: number) {
  if (revenue <= 0) return { id: 0, name: 'White Belt', target: 1000, mission: 'Get one real customer to pay for one clear outcome.' };
  if (revenue < 5000) return { id: 1, name: 'Proof', target: 5000, mission: 'Repeat the same offer until strangers buy it.' };
  if (revenue < 20000) return { id: 2, name: 'Repeatability', target: 20000, mission: 'Make acquisition and delivery repeatable without custom chaos.' };
  if (revenue < 50000) return { id: 3, name: 'Systemize', target: 50000, mission: 'Remove founder bottlenecks and protect margin.' };
  if (revenue < 100000) return { id: 4, name: 'Scale', target: 100000, mission: 'Scale the winning channel and deepen retention.' };
  return { id: 5, name: 'Million-Dollar Run Rate', target: 100000, mission: 'Defend quality, cash flow, customer concentration and leadership capacity.' };
}

function fallback(input: Required<Input>) {
  const stage = stageFor(input.monthlyRevenue);
  const price = Math.max(1, input.price || 1000);
  const targetCustomers = Math.ceil(stage.target / price);
  const currentCustomers = input.monthlyCustomers || Math.floor(input.monthlyRevenue / price);
  const gapCustomers = Math.max(0, targetCustomers - currentCustomers);
  const weeklyConversations = Math.max(5, Math.ceil(gapCustomers * 5 / 4));
  const edge = input.skills
    ? `Use ${input.skills.split(',')[0]?.trim() || 'your strongest skill'} to solve ${input.problem || 'a painful customer problem'} faster or more completely than a generic provider.`
    : `Define the narrow advantage that makes ${input.business || 'this business'} the sensible choice for ${input.customers || 'one specific customer group'}.`;
  const primaryOffer = input.offer || `A tightly scoped paid pilot for ${input.customers || 'one buyer type'} that solves ${input.problem || 'one measurable problem'}.`;
  const bottleneck = !input.offer ? 'Offer clarity' : !input.proof ? 'Proof and trust' : input.monthlyRevenue < 5000 ? 'Consistent conversations' : input.monthlyRevenue < 20000 ? 'Repeatable acquisition' : 'Founder capacity';

  return {
    mode: 'deterministic',
    stage,
    edge,
    primary_offer: primaryOffer,
    bottleneck,
    revenue_math: {
      current_monthly_revenue: input.monthlyRevenue,
      next_monthly_target: stage.target,
      price,
      customers_needed_at_price: targetCustomers,
      current_customers: currentCustomers,
      additional_customers_needed: gapCustomers,
      suggested_weekly_sales_conversations: weeklyConversations,
    },
    seven_day_sprint: [
      'Choose one buyer and one painful problem. Freeze secondary offers for seven days.',
      `Package the offer at about $${price.toLocaleString()} with a specific deliverable, timeline and success measure.`,
      'Create one proof page using screenshots, customer evidence, demos, numbers or a live walkthrough. No superlatives without evidence.',
      `Build a list of at least ${Math.max(20, weeklyConversations)} qualified prospects with an observable reason to care now.`,
      `Start at least ${weeklyConversations} real sales conversations. Ask for the smallest credible next step, not a giant commitment.`,
      'Record objections word-for-word and revise the offer around the recurring friction.',
      'Review revenue, pipeline, delivery capacity and cash. Keep the winner, cut the distraction, set next week’s single constraint.',
    ],
    manufacture_luck: [
      'Increase the number of useful conversations with customers, partners, investors and operators.',
      'Publish proof and useful lessons so opportunity can find you.',
      'Ask for introductions immediately after a useful conversation or successful result.',
    ],
    reinvestment_rule: input.monthlyRevenue < 20000
      ? 'Keep fixed overhead lean. Reinvest first into customer acquisition that has evidence, delivery capacity, and proof assets. Do not scale paid ads until the offer converts organically or through direct outreach.'
      : 'Protect cash reserves, then reinvest into the proven acquisition channel, delivery automation, customer success and leadership capacity. Measure payback before increasing spend.',
    stop_doing: [
      'Launching additional offers before the primary offer has repeated sales.',
      'Counting followers, verbal interest or meetings as revenue proof.',
      'Building features that are not tied to a live customer problem or measurable strategic advantage.',
    ],
    scorecard: ['Cash collected', 'Qualified conversations', 'Proposals/pilots sent', 'Close rate', 'Delivery margin', 'Customer proof created'],
  };
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const input: Required<Input> = {
      business: String(raw?.business || '').slice(0, 500),
      skills: String(raw?.skills || '').slice(0, 1200),
      customers: String(raw?.customers || '').slice(0, 800),
      problem: String(raw?.problem || '').slice(0, 1200),
      offer: String(raw?.offer || '').slice(0, 1200),
      price: num(raw?.price),
      monthlyRevenue: num(raw?.monthlyRevenue),
      monthlyCustomers: num(raw?.monthlyCustomers),
      hoursPerWeek: num(raw?.hoursPerWeek, 20),
      cashAvailable: num(raw?.cashAvailable),
      proof: String(raw?.proof || '').slice(0, 1800),
    };

    const base = fallback(input);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json(base, { headers: NO_STORE });

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      max_tokens: 1800,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are Aridon's zero-to-$1M operator. Return strict JSON only. Be commercially practical, skeptical of vanity metrics and evidence-first. Never invent customers, revenue, contracts, credentials or market proof. The goal is to choose one primary offer, expose the current bottleneck, manufacture useful luck through more high-quality interactions, and create a seven-day sprint. Preserve the supplied deterministic revenue_math and stage exactly unless there is a calculation error. Required fields: stage, edge, primary_offer, bottleneck, revenue_math, seven_day_sprint (7 strings), manufacture_luck (3-5 strings), reinvestment_rule, stop_doing (3-5 strings), scorecard (4-7 strings).`,
        },
        { role: 'user', content: JSON.stringify({ input, deterministic: base }) },
      ],
    });

    try {
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return NextResponse.json({ ...base, ...parsed, stage: base.stage, revenue_math: base.revenue_math, mode: 'ai-assisted' }, { headers: NO_STORE });
    } catch {
      return NextResponse.json(base, { headers: NO_STORE });
    }
  } catch (error) {
    console.error('Zero-to-million planning error', error);
    return NextResponse.json({ error: 'Unable to build the operating plan right now.' }, { status: 500, headers: NO_STORE });
  }
}
