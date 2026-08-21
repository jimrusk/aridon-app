export const ACQUISITION_STAGES = [
  'lead_captured',
  'reviewing',
  'qualified',
  'contact_strategy_ready',
  'negotiating',
  'loi_drafted',
  'loi_sent',
  'diligence',
  'final_approval',
  'closed',
  'lost',
] as const;

export type AcquisitionStage = (typeof ACQUISITION_STAGES)[number];

export const STAGE_LABELS: Record<AcquisitionStage, string> = {
  lead_captured: 'Lead Captured',
  reviewing: 'Reviewing',
  qualified: 'Qualified',
  contact_strategy_ready: 'Contact Strategy Ready',
  negotiating: 'Negotiating',
  loi_drafted: 'LOI Drafted',
  loi_sent: 'LOI Sent',
  diligence: 'In Diligence',
  final_approval: 'Final Approval',
  closed: 'Closed',
  lost: 'Lost / Pass',
};

export type AcquisitionLeadInput = {
  business_name: string;
  website?: string;
  source_url?: string;
  source_type?: string;
  industry?: string;
  city?: string;
  state?: string;
  seller_name?: string;
  seller_email?: string;
  seller_phone?: string;
  asking_price?: number;
  estimated_revenue?: number;
  estimated_ebitda?: number;
  cash_available?: number;
  lender_capacity?: number;
  listing_age_days?: number;
  owner_urgency?: number;
  seller_finance_willingness?: number;
  competition_level?: number;
  buyer_alternatives?: number;
  seller_alternatives?: number;
  reason_for_sale?: string;
  seller_priorities?: string;
  notes?: string;
  stage?: AcquisitionStage;
  next_follow_up_at?: string | null;
};

export type AcquisitionScore = {
  overall_score: number;
  owner_motivation_score: number;
  pricing_score: number;
  financing_score: number;
  flexibility_score: number;
  risk_score: number;
  strategic_fit_score: number;
  closing_probability_score: number;
  recommendation: 'hot' | 'promising' | 'needs_work' | 'pass';
  score_notes: string[];
};

export type DealStructure = {
  structure_name: string;
  purchase_price: number;
  down_payment: number;
  seller_note: number;
  earnout: number;
  lender_need: number;
  funding_gap: number;
  monthly_payment_estimate: number;
  buyer_safety_score: number;
  seller_attractiveness_score: number;
  rationale: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0);

export function sanitizeLead(input: Record<string, unknown>): AcquisitionLeadInput {
  const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const stage = ACQUISITION_STAGES.includes(input.stage as AcquisitionStage) ? (input.stage as AcquisitionStage) : 'lead_captured';
  const date = text(input.next_follow_up_at, 64);
  return {
    business_name: text(input.business_name ?? input.businessName, 180),
    website: text(input.website, 1000),
    source_url: text(input.source_url ?? input.sourceUrl, 1600),
    source_type: text(input.source_type ?? input.sourceType, 80) || 'manual',
    industry: text(input.industry, 120),
    city: text(input.city, 120),
    state: text(input.state, 80),
    seller_name: text(input.seller_name ?? input.sellerName, 160),
    seller_email: text(input.seller_email ?? input.sellerEmail, 254),
    seller_phone: text(input.seller_phone ?? input.sellerPhone, 80),
    asking_price: Math.max(0, num(input.asking_price ?? input.askingPrice)),
    estimated_revenue: Math.max(0, num(input.estimated_revenue ?? input.revenue)),
    estimated_ebitda: Math.max(0, num(input.estimated_ebitda ?? input.ebitda)),
    cash_available: Math.max(0, num(input.cash_available ?? input.cashAvailable)),
    lender_capacity: Math.max(0, num(input.lender_capacity ?? input.lenderCapacity)),
    listing_age_days: Math.max(0, Math.round(num(input.listing_age_days) || num(input.listingMonths) * 30)),
    owner_urgency: Math.round(clamp(num(input.owner_urgency ?? input.sellerUrgency) || 3, 1, 5)),
    seller_finance_willingness: Math.round(clamp(num(input.seller_finance_willingness ?? input.sellerFinanceWillingness) || 50, 0, 100)),
    competition_level: Math.round(clamp(num(input.competition_level ?? input.competingBuyers) || 0, 0, 10)),
    buyer_alternatives: Math.round(clamp(num(input.buyer_alternatives ?? input.buyerAlternatives) || 5, 0, 10)),
    seller_alternatives: Math.round(clamp(num(input.seller_alternatives ?? input.sellerAlternatives) || 5, 0, 10)),
    reason_for_sale: text(input.reason_for_sale ?? input.sellerReason, 3000),
    seller_priorities: text(input.seller_priorities ?? input.sellerPriorities, 3000),
    notes: text(input.notes, 10000),
    stage,
    next_follow_up_at: date || null,
  };
}

export function scoreAcquisition(lead: AcquisitionLeadInput): AcquisitionScore {
  const asking = num(lead.asking_price);
  const ebitda = num(lead.estimated_ebitda);
  const revenue = num(lead.estimated_revenue);
  const urgency = clamp(num(lead.owner_urgency) || 3, 1, 5);
  const sellerFinance = clamp(num(lead.seller_finance_willingness), 0, 100);
  const competition = clamp(num(lead.competition_level), 0, 10);
  const listingAge = Math.max(0, num(lead.listing_age_days));
  const buyerAlternatives = clamp(num(lead.buyer_alternatives), 0, 10);
  const sellerAlternatives = clamp(num(lead.seller_alternatives), 0, 10);
  const cash = num(lead.cash_available);
  const lender = num(lead.lender_capacity);
  const multiple = ebitda > 0 ? asking / ebitda : 0;
  const notes: string[] = [];

  const ownerMotivation = Math.round(clamp(((urgency - 1) / 4) * 55 + Math.min(listingAge / 365, 1) * 25 + (10 - sellerAlternatives) * 2, 0, 100));

  let pricing = 45;
  if (multiple > 0) {
    if (multiple <= 2.5) pricing = 92;
    else if (multiple <= 3.25) pricing = 78;
    else if (multiple <= 4) pricing = 63;
    else if (multiple <= 5) pricing = 45;
    else pricing = 24;
    notes.push(`Asking multiple is ${multiple.toFixed(2)}x normalized EBITDA/SDE.`);
  } else if (asking > 0) {
    notes.push('Normalized EBITDA/SDE is missing, so pricing confidence is limited.');
  }

  const availableCapital = cash + lender + asking * (sellerFinance / 100) * 0.5;
  const capitalCoverage = asking > 0 ? availableCapital / asking : 0;
  const financing = Math.round(clamp(capitalCoverage * 80 + sellerFinance * 0.2, 0, 100));
  if (asking > 0 && capitalCoverage < 0.75) notes.push('Current cash/lender/seller-finance assumptions leave a meaningful funding gap.');
  if (sellerFinance >= 60) notes.push('Seller-finance willingness materially improves structure flexibility.');

  const flexibility = Math.round(clamp(sellerFinance * 0.55 + urgency * 7 + (10 - sellerAlternatives) * 2, 0, 100));

  let risk = 68;
  if (ebitda <= 0) risk -= 24;
  if (revenue <= 0) risk -= 10;
  if (competition >= 7) risk -= 12;
  if (!lead.reason_for_sale) risk -= 8;
  if (lead.reason_for_sale && /distress|lawsuit|tax|bankrupt|fraud|default/i.test(lead.reason_for_sale)) risk -= 20;
  risk = Math.round(clamp(risk, 0, 100));

  const strategicFit = Math.round(clamp(55 + buyerAlternatives * 2 + (sellerFinance >= 40 ? 12 : 0) + (listingAge > 180 ? 8 : 0), 0, 100));
  const closingProbability = Math.round(clamp(ownerMotivation * 0.25 + financing * 0.3 + flexibility * 0.25 + (100 - competition * 8) * 0.2, 0, 100));

  const overall = Math.round(clamp(
    ownerMotivation * 0.16 + pricing * 0.18 + financing * 0.2 + flexibility * 0.13 + risk * 0.14 + strategicFit * 0.08 + closingProbability * 0.11,
    0,
    100,
  ));

  const recommendation: AcquisitionScore['recommendation'] = overall >= 80 ? 'hot' : overall >= 65 ? 'promising' : overall >= 45 ? 'needs_work' : 'pass';
  if (competition <= 2) notes.push('Low visible buyer competition strengthens negotiating leverage.');
  if (listingAge >= 270) notes.push('Long market exposure may create additional timing leverage.');
  if (urgency >= 4) notes.push('High seller urgency can support structure trades, but verify the reason before relying on it.');

  return {
    overall_score: overall,
    owner_motivation_score: ownerMotivation,
    pricing_score: pricing,
    financing_score: financing,
    flexibility_score: flexibility,
    risk_score: risk,
    strategic_fit_score: strategicFit,
    closing_probability_score: closingProbability,
    recommendation,
    score_notes: notes,
  };
}

function estimateMonthlyPayment(principal: number, annualRate = 0.08, years = 7) {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function buildDealStructures(lead: AcquisitionLeadInput): DealStructure[] {
  const asking = Math.max(0, num(lead.asking_price));
  if (!asking) return [];
  const cashAvailable = Math.max(0, num(lead.cash_available));
  const lenderCapacity = Math.max(0, num(lead.lender_capacity));
  const sellerFinancePct = clamp(num(lead.seller_finance_willingness), 0, 100) / 100;

  const make = (
    name: string,
    priceFactor: number,
    cashPct: number,
    sellerPct: number,
    earnoutPct: number,
    buyerSafety: number,
    sellerAttractiveness: number,
    rationale: string,
  ): DealStructure => {
    const purchase = Math.round(asking * priceFactor);
    const down = Math.round(Math.min(cashAvailable, purchase * cashPct));
    const sellerCap = purchase * sellerFinancePct;
    const sellerNote = Math.round(Math.min(purchase * sellerPct, sellerCap));
    const earnout = Math.round(purchase * earnoutPct);
    const lenderNeed = Math.max(0, Math.round(purchase - down - sellerNote - earnout));
    const gap = Math.max(0, Math.round(lenderNeed - lenderCapacity));
    return {
      structure_name: name,
      purchase_price: purchase,
      down_payment: down,
      seller_note: sellerNote,
      earnout,
      lender_need: lenderNeed,
      funding_gap: gap,
      monthly_payment_estimate: Math.round(estimateMonthlyPayment(sellerNote)),
      buyer_safety_score: buyerSafety,
      seller_attractiveness_score: sellerAttractiveness,
      rationale,
    };
  };

  return [
    make('Cash-Certainty Offer', 0.88, 0.2, 0.12, 0, 88, 62, 'Trade a lower headline price for simplicity, shorter contingencies, and a cleaner close. Use only after earnings and liabilities are verified.'),
    make('Seller Income Offer', 1, 0.05, 0.5, 0.05, 76, 88, 'Protect the seller’s headline value while converting a large share into monthly seller income and reducing outside capital needs.'),
    make('Performance Offer', 1.05, 0.05, 0.28, 0.22, 91, 82, 'Offer a stronger headline number only when a meaningful portion is contingent on verified post-close performance.'),
    make('Hybrid Offer', 0.97, 0.08, 0.38, 0.08, 84, 84, 'Balance lender proceeds, seller financing, and modest performance protection to keep both sides invested in a clean transition.'),
    make('Low-Cash Control Offer', 0.94, 0.02, 0.58, 0.12, 72, 78, 'Minimize buyer cash at closing by maximizing seller financing and performance-based consideration. Requires strong seller trust and legal documentation.'),
  ];
}

export const DILIGENCE_SEED = [
  ['Financial', 'Three years of tax returns and year-to-date P&L'],
  ['Financial', 'Bank statements and reconciliation to reported revenue'],
  ['Financial', 'Normalized EBITDA/SDE bridge and owner add-backs'],
  ['Tax', 'Payroll, sales/use, property, and income tax status'],
  ['Legal', 'Entity documents, material contracts, litigation, liens, and claims'],
  ['HR / Payroll', 'Employee roster, compensation, benefits, PTO, and contractor classification'],
  ['Operations', 'SOPs, licenses, permits, key-person dependencies, and operating calendar'],
  ['Customers', 'Top customer concentration, churn, contracts, and pipeline quality'],
  ['Vendors', 'Critical supplier terms, exclusivity, concentration, and change-of-control rights'],
  ['Compliance', 'Industry-specific licenses, inspections, regulatory notices, and insurance'],
  ['Equipment / Assets', 'Asset list, serials, ownership, liens, maintenance, and replacement needs'],
  ['Technology', 'Domains, software accounts, data ownership, cybersecurity, and transferability'],
  ['Real Estate / Leases', 'Lease terms, renewals, landlord consent, CAM, and deferred maintenance'],
  ['Risk', 'Pending disputes, environmental issues, warranty exposure, refunds, and contingent liabilities'],
] as const;
