import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const NO_STORE = { 'Cache-Control': 'no-store' };

type DealInput = {
  businessName: string;
  askingPrice: number;
  revenue: number;
  ebitda: number;
  cashAvailable: number;
  sellerFinanceWillingness: number;
  sellerUrgency: number;
  listingMonths: number;
  competingBuyers: number;
  buyerAlternatives: number;
  sellerAlternatives: number;
  sellerReason: string;
  sellerPriorities: string;
  walkAwayPrice: number;
};

export type AcquisitionAnalysis = {
  sellerRead: {
    primaryMotivation: string;
    likelyPriorities: string[];
    leverageSummary: string;
  };
  negotiation: {
    openingPosition: string;
    sequence: string[];
    probingQuestions: string[];
    concessionsToTrade: string[];
    avoid: string[];
  };
  loi: {
    headline: string;
    terms: string[];
    diligenceFocus: string[];
  };
  assumptions: string[];
  approvalGates: string[];
};

function cleanText(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanNumber(value: unknown, min = 0, max = 1_000_000_000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(max, Math.max(min, parsed));
}

function normalize(body: any): DealInput {
  return {
    businessName: cleanText(body?.businessName, 160) || 'Target business',
    askingPrice: cleanNumber(body?.askingPrice),
    revenue: cleanNumber(body?.revenue),
    ebitda: cleanNumber(body?.ebitda),
    cashAvailable: cleanNumber(body?.cashAvailable),
    sellerFinanceWillingness: cleanNumber(body?.sellerFinanceWillingness, 0, 100),
    sellerUrgency: cleanNumber(body?.sellerUrgency, 1, 5),
    listingMonths: cleanNumber(body?.listingMonths, 0, 120),
    competingBuyers: cleanNumber(body?.competingBuyers, 0, 20),
    buyerAlternatives: cleanNumber(body?.buyerAlternatives, 0, 10),
    sellerAlternatives: cleanNumber(body?.sellerAlternatives, 0, 10),
    sellerReason: cleanText(body?.sellerReason),
    sellerPriorities: cleanText(body?.sellerPriorities),
    walkAwayPrice: cleanNumber(body?.walkAwayPrice),
  };
}

function demoResponse(deal: DealInput): AcquisitionAnalysis {
  const urgency = deal.sellerUrgency >= 4 ? 'high' : deal.sellerUrgency >= 3 ? 'moderate' : 'low';
  const competition = deal.competingBuyers >= 3 ? 'meaningful buyer competition' : deal.competingBuyers > 0 ? 'some buyer competition' : 'limited visible buyer competition';
  const finance = deal.sellerFinanceWillingness >= 60 ? 'Seller financing appears to be a strong structuring lever.' : deal.sellerFinanceWillingness >= 30 ? 'Seller financing may be available, but it should be traded for something the seller values.' : 'Do not assume seller financing is available; first discover what problem the seller is trying to solve.';
  const motivation = deal.sellerReason || `Seller urgency currently appears ${urgency}; the underlying reason still needs to be confirmed.`;

  return {
    sellerRead: {
      primaryMotivation: motivation,
      likelyPriorities: [
        deal.sellerPriorities || 'Confirm whether price, speed, certainty, taxes, legacy, employees, or monthly income matters most.',
        finance,
        deal.listingMonths >= 9 ? 'A longer listing period may make certainty and simplicity more valuable than headline price.' : 'The listing is still relatively fresh, so expect the seller to protect optionality.',
      ],
      leverageSummary: `Current facts suggest ${urgency} seller urgency and ${competition}. Buyer alternatives score ${deal.buyerAlternatives}/10 versus seller alternatives ${deal.sellerAlternatives}/10. Treat this as a negotiation hypothesis until verified directly.`,
    },
    negotiation: {
      openingPosition: 'Open with a structure, not a naked price. Tie every improvement in price to better financing, diligence protection, transition support, or performance conditions.',
      sequence: [
        'Confirm why the seller is moving now and what a successful exit looks like to them.',
        'Separate headline price from cash at close, seller note, earnout, working capital, transition help, and closing certainty.',
        'Present two or three complete structures rather than haggling one number at a time.',
        'Trade concessions instead of giving them away. If price rises, improve terms somewhere else.',
        'Put the preferred structure into a concise LOI with diligence, financing, and approval protections.',
      ],
      probingQuestions: [
        'Besides price, what has to be true for you to feel good about this sale?',
        'What is driving the timing of the sale right now?',
        'Would predictable monthly income after closing be useful to you?',
        'What happened with any prior buyers or offers?',
        'Which employees, customers, or legacy issues matter most after closing?',
      ],
      concessionsToTrade: [
        'Higher headline price in exchange for seller financing or earnout protection',
        'Faster close in exchange for clean diligence access and defined working-capital treatment',
        'Reduced contingency risk in exchange for stronger transition support',
        'More cash at closing only when supported by verified earnings and financing capacity',
      ],
      avoid: [
        'Do not reveal the maximum price or cash limit early.',
        'Do not negotiate from unverified seller financials.',
        'Do not let urgency push legal, tax, financing, or diligence review out of the process.',
      ],
    },
    loi: {
      headline: `Indicative acquisition framework for ${deal.businessName}`,
      terms: [
        'Purchase price and exact mix of cash, lender proceeds, seller note, and any earnout',
        'Working-capital target and treatment of cash, debt, inventory, and assumed liabilities',
        'Financing and satisfactory due-diligence contingencies',
        'Transition assistance, training, non-compete/non-solicit, and key employee considerations',
        'Exclusivity period, target close date, confidentiality, and which provisions are binding or non-binding',
      ],
      diligenceFocus: [
        'Reconcile tax returns, bank statements, P&L, balance sheet, payroll, and claimed add-backs',
        'Customer concentration, recurring revenue quality, churn, backlog, and major contracts',
        'Owner dependence, employee retention, licensing, litigation, liens, and compliance',
        'Equipment condition, leases, inventory quality, working capital, and near-term capital needs',
      ],
    },
    assumptions: [
      'This is an acquisition screening and negotiation aid, not a business valuation, legal opinion, tax opinion, or lending commitment.',
      deal.walkAwayPrice > 0 ? `The entered walk-away price is $${Math.round(deal.walkAwayPrice).toLocaleString('en-US')}.` : 'No walk-away price has been entered. Set one before substantive negotiation.',
      'Seller motivations and competing-offer claims should be independently verified where possible.',
    ],
    approvalGates: [
      'Owner approval before sending an LOI, counteroffer, or seller communication',
      'M&A counsel review before signing binding terms or definitive agreements',
      'CPA/tax review of purchase-price allocation and seller-finance consequences',
      'Lender approval before treating debt proceeds or SBA eligibility as committed',
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Send a JSON request.' }, { status: 415, headers: NO_STORE });
    }

    const deal = normalize(await request.json());
    if (deal.askingPrice <= 0) {
      return NextResponse.json({ error: 'Enter an asking price before running the deal strategy.' }, { status: 400, headers: NO_STORE });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ...demoResponse(deal), demo: true }, { headers: NO_STORE });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1900,
      messages: [
        {
          role: 'system',
          content: `You are the Aridon Acquisition Deal Engine, an internal decision-support system for evaluating and negotiating small and lower-middle-market business acquisitions. Analyze seller psychology, leverage, deal structure, LOI priorities, and diligence risk without pretending uncertain facts are known.\n\nRULES\n- Treat seller motivation as a hypothesis until verified.\n- Negotiate complete deal structures, not price alone.\n- Never claim financing, legal enforceability, tax treatment, valuation certainty, or seller intent is guaranteed.\n- Preserve human approval for external communications, offers, LOIs, signatures, spending, and binding commitments.\n- Keep recommendations commercially useful and concise.\n- Return valid JSON only using exactly this shape: {"sellerRead":{"primaryMotivation":"...","likelyPriorities":["..."],"leverageSummary":"..."},"negotiation":{"openingPosition":"...","sequence":["..."],"probingQuestions":["..."],"concessionsToTrade":["..."],"avoid":["..."]},"loi":{"headline":"...","terms":["..."],"diligenceFocus":["..."]},"assumptions":["..."],"approvalGates":["..."]}.`,
        },
        {
          role: 'user',
          content: `Analyze this acquisition target.\n\n${JSON.stringify(deal, null, 2)}\n\nWhen financial information is incomplete, explicitly say what needs verification. The user wants seller-financed and low-cash structures when they are commercially plausible, but do not force a structure that the facts do not support.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    try {
      return NextResponse.json(JSON.parse(raw) as AcquisitionAnalysis, { headers: NO_STORE });
    } catch {
      return NextResponse.json({ ...demoResponse(deal), demo: true }, { headers: NO_STORE });
    }
  } catch (error) {
    console.error('Acquisition analysis route error', error);
    return NextResponse.json({ error: 'The Acquisition Deal Engine could not complete this analysis.' }, { status: 500, headers: NO_STORE });
  }
}
