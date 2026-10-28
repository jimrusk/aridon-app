export type IntelligenceLane = 'business_need' | 'real_estate' | 'business_acquisition';

export type ScoreBreakdown = Record<string, number>;

export const intelligenceLanes = {
  business_need: {
    id: 'business_need' as const,
    number: 'Aridon One',
    name: 'Business Need Radar',
    shortName: 'Need Radar',
    line: 'Find businesses showing source-backed signs that they need help now.',
    scoreLabel: 'Opportunity Score',
    scoreKeys: ['urgency', 'economic_impact', 'offer_fit', 'evidence', 'access', 'timing'] as const,
    weights: { urgency: 0.24, economic_impact: 0.20, offer_fit: 0.20, evidence: 0.18, access: 0.10, timing: 0.08 },
    defaultProfile: {
      objective: 'Find businesses with visible, current problems or growth events that create a credible reason to buy our services.',
      geographies: ['United States'],
      industries: [],
      keywords: [],
      exclusions: '',
      offer: '',
      idealCustomer: '',
      companySize: '',
      preferredSignals: ['website or conversion weakness', 'growth or expansion', 'hiring', 'funding', 'customer experience problems', 'regulatory or technology change'],
    },
  },
  real_estate: {
    id: 'real_estate' as const,
    number: 'Aridon Two',
    name: 'Property Seller Radar',
    shortName: 'Property Radar',
    line: 'Find properties with public, source-backed signals of potential seller motivation.',
    scoreLabel: 'Seller Signal Score',
    scoreKeys: ['explicit_motivation', 'public_distress_signal', 'equity_or_discount', 'recency', 'property_fit', 'access'] as const,
    weights: { explicit_motivation: 0.28, public_distress_signal: 0.20, equity_or_discount: 0.18, recency: 0.14, property_fit: 0.10, access: 0.10 },
    defaultProfile: {
      objective: 'Find current real-estate opportunities with a lawful public seller, broker, attorney, trustee, or listing contact path where terms can actually be discussed. Prioritize owner-finance, seller-carry, assumable financing where lender consent permits, lease-option, FSBO, probate/estate, pre-foreclosure before auction, price reductions, and other situations where a negotiated purchase is plausible. Pure auction-only leads should rank below contactable negotiated opportunities.',
      geographies: [],
      propertyTypes: ['single family', 'small multifamily'],
      priceRange: '',
      keywords: [],
      exclusions: '',
      preferredSignals: ['public seller or broker contact path', 'seller financing or owner carry', 'assumable financing where lender consent permits', 'lease option or lease purchase', 'FSBO', 'pre-foreclosure before auction with public contact path', 'probate or estate sale', 'price reduction', 'long market time', 'foreclosure or auction notice'],
    },
  },
  business_acquisition: {
    id: 'business_acquisition' as const,
    number: 'Aridon Three',
    name: 'Business Acquisition Radar',
    shortName: 'Acquisition Radar',
    line: 'Find businesses with public signs that a sale, succession, or ownership transition may be possible.',
    scoreLabel: 'Acquisition Signal Score',
    scoreKeys: ['sale_intent', 'business_quality', 'strategic_fit', 'evidence', 'timing', 'access'] as const,
    weights: { sale_intent: 0.30, business_quality: 0.20, strategic_fit: 0.20, evidence: 0.15, timing: 0.10, access: 0.05 },
    defaultProfile: {
      objective: 'Find businesses with credible public evidence of a sale or ownership transition and a public seller or broker contact path. Prioritize deals where seller financing, owner carry, earn-outs, equity rollover, staged buyouts, assumable debt with lender consent, real-estate lease/purchase choices, or extended transition support may be negotiable. Capture NDA/CIM and proof-of-funds requirements when public.',
      geographies: ['United States'],
      targetIndustries: [],
      revenueRange: '',
      purchasePriceRange: '',
      keywords: [],
      exclusions: '',
      preferredSignals: ['business-for-sale listing', 'seller financing or owner carry', 'earn-out or staged buyout', 'equity rollover', 'assumable debt where lender consent permits', 'real estate lease or separate purchase option', 'NDA or CIM available', 'retirement announcement', 'succession or ownership transition', 'broker mandate', 'strategic alternatives review', 'recapitalization or divestiture'],
    },
  },
} as const;

export function normalizeIntelligenceLane(value: unknown): IntelligenceLane | null {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'business_need' || normalized === 'real_estate' || normalized === 'business_acquisition' ? normalized : null;
}

function clamp(value: unknown) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

export function normalizeScoreBreakdown(lane: IntelligenceLane, value: unknown): ScoreBreakdown {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const keys = intelligenceLanes[lane].scoreKeys as readonly string[];
  return Object.fromEntries(keys.map((key) => [key, clamp(raw[key])])) as ScoreBreakdown;
}

export function weightedIntelligenceScore(lane: IntelligenceLane, value: unknown) {
  const breakdown = normalizeScoreBreakdown(lane, value);
  const weights = intelligenceLanes[lane].weights as Record<string, number>;
  const score = Object.entries(weights).reduce((total, [key, weight]) => total + (breakdown[key] || 0) * weight, 0);
  return { score: clamp(score), breakdown };
}

export function buildIntelligencePrompt(args: {
  lane: IntelligenceLane;
  businessName: string;
  industry?: string | null;
  profile: Record<string, unknown>;
  count: number;
}) {
  const { lane, businessName, industry, profile, count } = args;
  const shared = `You are the source-disciplined research engine inside ${intelligenceLanes[lane].number}: ${intelligenceLanes[lane].name}. Use public web research to find CURRENT, REAL leads. Return no more than ${count} strong leads. Exclude weak filler.\n\nCUSTOMER: ${businessName}\nCUSTOMER INDUSTRY: ${industry || 'not specified'}\nSAVED RADAR PROFILE: ${JSON.stringify(profile).slice(0, 22000)}\n\nEVIDENCE RULES:\n- Never invent a company, property, listing, notice, event, price, deadline, contact, owner fact, financial figure, financing term, or source.\n- Every returned lead must have at least one public source URL supporting the core signal. Prefer primary or official sources.\n- Separate confirmed facts from reasonable pursuit strategy. If a fact cannot be verified, omit it or state that it is unverified.\n- Do not infer sensitive personal facts, financial hardship, health, family status, age, race, religion, disability, or other protected traits.\n- Return public business, broker, listing, agency, attorney, trustee, or official contact paths only. Do not provide private personal phone numbers or private email addresses.\n- A high score requires current evidence, not enthusiasm.\n\nReturn JSON only in exactly this shape:\n{\n  \"leads\":[\n    {\n      \"entity_name\":\"\",\n      \"entity_type\":\"\",\n      \"location\":\"\",\n      \"address\":\"\",\n      \"source_url\":\"\",\n      \"source_urls\":[\"\"],\n      \"signal_summary\":\"\",\n      \"why_now\":\"\",\n      \"value_text\":\"\",\n      \"estimated_value\":null,\n      \"score_breakdown\":{},\n      \"signals\":[{\"name\":\"\",\"strength\":0,\"evidence\":\"\",\"source_url\":\"\"}],\n      \"risks\":[\"\"],\n      \"contact_path\":\"\",\n      \"recommended_next_step\":\"\",\n      \"draft_outreach\":\"\",\n      \"facts\":{}\n    }\n  ]\n}`;

  if (lane === 'business_need') {
    return `${shared}\n\nBUSINESS NEED RADAR RULES:\nFind organizations showing verifiable signals that create a plausible need for the customer's offer. Useful signals include a weak or broken public digital buying path, current expansion, hiring, funding, product launch, customer-experience issues, regulatory deadlines, technology transitions, or other current events that create urgency. Do not label a company as distressed or claim it intends to buy unless a source actually supports that.\n\nscore_breakdown must contain exactly these 0-100 fields: urgency, economic_impact, offer_fit, evidence, access, timing.`;
  }

  if (lane === 'real_estate') {
    return `${shared}\n\nPROPERTY SELLER RADAR RULES:\nFind properties using public property records, government notices, court/estate notices, broker/listing pages, and other lawful public sources. Prefer opportunities where there is a public seller, broker, attorney, trustee, or listing contact path and a negotiated purchase is plausible. Useful signals include explicit seller financing or owner carry, assumable financing where lender consent permits, lease-option or lease-purchase language, FSBO, probate or estate-sale notices, pre-foreclosure before auction, verified price reductions, long market time, foreclosure/auction notices, tax-sale or delinquency notices, code violations, and vacant-property registries. Pure auction-only leads should rank below contactable negotiated opportunities when strong contactable alternatives exist.\n- Treat distress or auction signals only as public transaction signals, never proof of personal hardship or willingness to sell.\n- Never contact, recommend contacting, or identify occupants from a foreclosure lead unless a lawful public seller/listing contact is explicitly available.\n- Never claim an existing mortgage is assumable or can be taken subject-to unless a public source says so. Any assumption or subject-to strategy must be framed as conditional on lender/loan-document requirements and legal review.\n- Put all publicly stated deal terms in facts when available: asking_price, down_payment, seller_financing, interest_rate, amortization, term, balloon, existing_financing, assumable_status, lease_option, auction_date, nda_required, proof_of_funds_required. Omit unknown fields rather than guessing.\n- value_text should summarize the known price/financing structure, not merely estimated market value.\n- contact_path should identify the best lawful public route to discuss terms.\n- draft_outreach should be a concise buyer inquiry asking what the seller wants at closing, whether seller carry/owner financing is available, desired down payment, monthly payment or note terms, rate/amortization/balloon, whether any financing is assumable with required consent, whether lease-option or staged purchase is possible, timing, and whether an NDA or proof of funds is needed. Do not promise terms or claim available capital.\n\nscore_breakdown must contain exactly these 0-100 fields: explicit_motivation, public_distress_signal, equity_or_discount, recency, property_fit, access.`;
  }

  return `${shared}\n\nBUSINESS ACQUISITION RADAR RULES:\nFind businesses with public evidence of a possible ownership transaction or transition. Strong signals include an explicit business-for-sale or broker listing, strategic-alternatives review, divestiture, recapitalization, succession or retirement announcement, ownership transition, or closure/transition announcement. Prefer opportunities with a public seller or broker contact path and enough information to begin a real acquisition conversation.\n- Do not infer a desire to sell from an owner's age, health, family situation, ethnicity, religion, disability, or other sensitive trait. A merely struggling company is not a sale lead unless there is evidence of a transaction or transition path.\n- Capture publicly stated deal structure in facts when available: asking_price, revenue, sde, ebitda, down_payment, seller_financing, seller_note_rate, amortization, term, balloon, earnout, equity_rollover, staged_buyout, existing_debt, assumable_debt_status, real_estate_included, real_estate_lease_option, transition_support, nda_required, cim_available, proof_of_funds_required. Omit unknown fields rather than guessing.\n- Any debt assumption must be described as conditional on lender consent and the governing loan documents.\n- value_text should summarize the known purchase price and financing/structure choices.\n- contact_path should identify the best public seller or broker route.\n- draft_outreach should be a concise buyer inquiry asking what the seller wants at closing, minimum down payment, seller-note terms, monthly/annual debt-service expectations, rate/amortization/balloon, earn-out or equity-rollover flexibility, staged purchase possibilities, whether existing debt can be assumed with lender consent, real-estate purchase versus lease choices, transition support, and NDA/CIM/proof-of-funds requirements. Do not promise price, financing, proof of funds, or closing timing.\n\nscore_breakdown must contain exactly these 0-100 fields: sale_intent, business_quality, strategic_fit, evidence, timing, access.`;
}
