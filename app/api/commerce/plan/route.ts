import { NextResponse } from 'next/server';
import OpenAI from 'openai';

type Input = {
  niche?: string;
  avgSale?: number;
  supplierCostPct?: number;
  adCost?: number;
  freightReserve?: number;
  returnReserve?: number;
  targetOrders?: number;
};

type Plan = {
  thesis: string;
  idealCustomer: string;
  supplierProfile: string[];
  launchSteps: string[];
  showroomSections: string[];
  trafficPlan: string[];
  outreachSubject: string;
  outreachBody: string;
  riskGates: string[];
};

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

function fallback(input: Input): Plan {
  const niche = (input.niche || 'high-ticket equipment').trim();
  const avgSale = Number(input.avgSale || 15000);
  const supplierCostPct = Number(input.supplierCostPct || 68);
  const margin = Math.max(0, 100 - supplierCostPct);

  return {
    thesis: `${niche} is worth testing as a consultative high-ticket category when buyers have a clear operational need, the average order supports a healthy dealer margin, and suppliers can fulfill directly without Aridon carrying inventory. At roughly $${avgSale.toLocaleString()} per sale and ${margin.toFixed(0)}% gross margin before acquisition and freight reserves, the first objective is supplier approval and unit-economics validation, not a large catalog.`,
    idealCustomer: `A buyer already comparing solutions in ${niche}, has budget authority or financing access, and values help choosing, configuring, shipping or installing the right system.`,
    supplierProfile: [
      'Established manufacturer or master distributor with documented dealer/reseller terms.',
      'Direct-to-customer or dealer-assisted fulfillment with clear freight, damage and lead-time procedures.',
      'Adequate dealer margin after MAP policy, shipping, payment fees, returns and customer acquisition.',
      'Reliable warranty, parts and technical-support process that Aridon can explain accurately to buyers.',
      'Permission to use approved product data, images and brand assets in an online showroom.',
    ],
    launchSteps: [
      `Define a narrow first category inside ${niche} and the buyer problem it solves.`,
      'Build a 25-company manufacturer prospect list using public sources and verify each company before outreach.',
      'Contact the best 10 for dealer terms, territory, MAP, fulfillment, warranty and onboarding requirements.',
      'Model three real products only after supplier pricing and freight terms are confirmed.',
      'Build a premium showroom around buyer questions, product comparisons, financing and consultation rather than a giant generic catalog.',
      'Launch high-intent search and Shopping traffic only after conversion tracking, call handling and margin gates are ready.',
      'Review every lead and order for 30 days, then scale the products and suppliers with proven contribution margin.',
    ],
    showroomSections: [
      'Problem-led hero with a clear consultation or quote CTA.',
      'Three verified flagship product slots with configuration, delivery and financing guidance.',
      'Buyer guide explaining sizing, installation, operating cost and ownership tradeoffs.',
      'Comparison section that helps buyers choose between verified options without fake rankings.',
      'Trust section covering dealer authorization, warranty path, delivery expectations and human support.',
      'Quote / consultation intake that captures budget, location, timing and technical requirements.',
    ],
    trafficPlan: [
      'Start with high-intent Google Search terms that include product type, commercial use, price, quote, dealer or financing intent.',
      'Add Shopping campaigns only when product feed rights, pricing and availability are supplier-confirmed.',
      'Use remarketing for researched visitors, but keep first-month spend capped until contribution margin is proven.',
      'Route high-value leads to a human-assisted sales workflow instead of forcing every buyer through self-checkout.',
    ],
    outreachSubject: `Dealer partnership inquiry for ${niche}`,
    outreachBody: `Hello,\n\nI’m reaching out from Aridon. We are building a focused premium online showroom for buyers actively searching for ${niche}. Our model is to work with established manufacturers as an authorized sales and demand-generation partner rather than carrying unapproved inventory.\n\nWe would like to learn whether you are accepting new dealers or online retail partners. If so, could you share your dealer requirements, wholesale or margin structure, MAP policy if applicable, fulfillment and freight process, warranty responsibilities, territory rules, and approved product-content process?\n\nWe are intentionally starting with a small number of suppliers so we can represent each line accurately and support buyers well.\n\nIf there is a fit, I’d be glad to schedule a short call and walk through our approach.\n\nBest,\nAridon`,
    riskGates: [
      'No supplier is shown as approved until written dealer authorization or equivalent evidence is recorded.',
      'No product margin is treated as real until wholesale pricing, freight, payment fees and expected returns are included.',
      'No copied manufacturer images, descriptions or trademarks without permission or a licensed feed.',
      'No claims about delivery time, warranty, savings or performance that have not been verified.',
      'No paid-traffic scale-up until lead-to-sale conversion and contribution margin are measured on real traffic.',
    ],
  };
}

function sanitizePlan(raw: any, fb: Plan): Plan {
  const array = (value: any, fallbackValue: string[]) => Array.isArray(value) && value.length ? value.map(String).slice(0, 10) : fallbackValue;
  return {
    thesis: typeof raw?.thesis === 'string' ? raw.thesis : fb.thesis,
    idealCustomer: typeof raw?.idealCustomer === 'string' ? raw.idealCustomer : fb.idealCustomer,
    supplierProfile: array(raw?.supplierProfile, fb.supplierProfile),
    launchSteps: array(raw?.launchSteps, fb.launchSteps).slice(0, 7),
    showroomSections: array(raw?.showroomSections, fb.showroomSections),
    trafficPlan: array(raw?.trafficPlan, fb.trafficPlan),
    outreachSubject: typeof raw?.outreachSubject === 'string' ? raw.outreachSubject : fb.outreachSubject,
    outreachBody: typeof raw?.outreachBody === 'string' ? raw.outreachBody : fb.outreachBody,
    riskGates: array(raw?.riskGates, fb.riskGates),
  };
}

export async function POST(req: Request) {
  let input: Input;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE });
  }

  const niche = String(input.niche || '').trim();
  if (!niche) return NextResponse.json({ error: 'Add a niche or product family first.' }, { status: 400, headers: NO_STORE });

  const fb = fallback(input);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ plan: fb, mode: 'deterministic' }, { headers: NO_STORE });

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_COMMERCE_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content: `You are the Aridon Commerce Engine. Build practical, conservative high-ticket ecommerce launch plans for legitimate physical products. Never invent supplier names, contact details, dealer authorization, margins, MAP rules, certifications, product performance, prices, demand data or legal claims. Distinguish assumptions from verified facts. Prefer supplier-direct fulfillment and consultative sales. Output JSON only with these keys: thesis (string), idealCustomer (string), supplierProfile (string[]), launchSteps (exactly 7 strings), showroomSections (string[]), trafficPlan (string[]), outreachSubject (string), outreachBody (string), riskGates (string[]).`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            niche,
            economics: {
              averageSale: input.avgSale,
              supplierCostPct: input.supplierCostPct,
              adCostPerOrder: input.adCost,
              freightReserve: input.freightReserve,
              returnsReserve: input.returnReserve,
              targetOrdersPerMonth: input.targetOrders,
            },
            objective: 'Create a narrow supplier-first launch plan, premium showroom structure, manufacturer outreach and paid-traffic plan with strong verification gates.',
          }),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text);
    return NextResponse.json({ plan: sanitizePlan(parsed, fb), mode: 'ai' }, { headers: NO_STORE });
  } catch (error) {
    console.error('commerce plan failed', error);
    return NextResponse.json({ plan: fb, mode: 'fallback' }, { headers: NO_STORE });
  }
}
