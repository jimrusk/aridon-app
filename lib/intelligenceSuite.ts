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
      objective: 'Find current real-estate opportunities where public records or public listings indicate a credible reason an owner may consider selling.',
      geographies: [],
      propertyTypes: ['single family', 'small multifamily'],
      priceRange: '',
      keywords: [],
      exclusions: '',
      preferredSignals: ['foreclosure or auction notice', 'tax sale or delinquency notice', 'code violation', 'vacant property registry', 'probate or estate sale', 'FSBO', 'price reduction', 'long market time'],
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
      objective: 'Find businesses with credible public evidence of a sale, succession, strategic review, recapitalization, closure transition, or other ownership-change path.',
      geographies: ['United States'],
      targetIndustries: [],
      revenueRange: '',
      purchasePriceRange: '',
      keywords: [],
      exclusions: '',
      preferredSignals: ['business-for-sale listing', 'broker mandate', 'strategic alternatives review', 'succession announcement', 'retirement announcement', 'ownership transition', 'closure transition', 'recapitalization or divestiture'],
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
  const shared = `You are the source-disciplined research engine inside ${intelligenceLanes[lane].number}: ${intelligenceLanes[lane].name}. Use public web research to find CURRENT, REAL leads. Return no more than ${count} strong leads. Exclude weak filler.\n\nCUSTOMER: ${businessName}\nCUSTOMER INDUSTRY: ${industry || 'not specified'}\nSAVED RADAR PROFILE: ${JSON.stringify(profile).slice(0, 22000)}\n\nEVIDENCE RULES:\n- Never invent a company, property, listing, notice, event, price, deadline, contact, owner fact, financial figure, or source.\n- Every returned lead must have at least one public source URL supporting the core signal. Prefer primary or official sources.\n- Separate confirmed facts from reasonable pursuit strategy. If a fact cannot be verified, omit it or state that it is unverified.\n- Do not infer sensitive personal facts, financial hardship, health, family status, age, race, religion, disability, or other protected traits.\n- Return public business, broker, listing, agency, or official contact paths only. Do not provide private personal phone numbers or private email addresses.\n- A high score requires current evidence, not enthusiasm.\n\nReturn JSON only in exactly this shape:\n{\n  \"leads\":[\n    {\n      \"entity_name\":\"\",\n      \"entity_type\":\"\",\n      \"location\":\"\",\n      \"address\":\"\",\n      \"source_url\":\"\",\n      \"source_urls\":[\"\"],\n      \"signal_summary\":\"\",\n      \"why_now\":\"\",\n      \"value_text\":\"\",\n      \"estimated_value\":null,\n      \"score_breakdown\":{},\n      \"signals\":[{\"name\":\"\",\"strength\":0,\"evidence\":\"\",\"source_url\":\"\"}],\n      \"risks\":[\"\"],\n      \"contact_path\":\"\",\n      \"recommended_next_step\":\"\",\n      \"draft_outreach\":\"\",\n      \"facts\":{}\n    }\n  ]\n}`;

  if (lane === 'business_need') {
    return `${shared}\n\nBUSINESS NEED RADAR RULES:\nFind organizations showing verifiable signals that create a plausible need for the customer's offer. Useful signals include a weak or broken public digital buying path, current expansion, hiring, funding, product launch, customer-experience issues, regulatory deadlines, technology transitions, or other current events that create urgency. Do not label a company as distressed or claim it intends to buy unless a source actually supports that.\n\nscore_breakdown must contain exactly these 0-100 fields: urgency, economic_impact, offer_fit, evidence, access, timing.`;
  }

  if (lane === 'real_estate') {
    return `${shared}\n\nPROPERTY SELLER RADAR RULES:\nFind properties using public property records, government notices, court/estate notices, broker/listing pages, and other lawful public sources. Useful signals include foreclosure/auction notices, tax-sale or delinquency notices, code violations, vacant-property registries, probate or estate-sale notices, FSBO listings, verified price reductions, or long market time. Treat each as a signal, never proof of personal hardship or willingness to sell. Do not infer motivation from owner age, health, family circumstances, race, religion, disability, or other sensitive traits. Do not return private owner contact data. Prefer the property address plus an official, broker, listing, attorney, trustee, or other public contact path.\n\nscore_breakdown must contain exactly these 0-100 fields: explicit_motivation, public_distress_signal, equity_or_discount, recency, property_fit, access.`;
  }

  return `${shared}\n\nBUSINESS ACQUISITION RADAR RULES:\nFind businesses with public evidence of a possible ownership transaction or transition. Strong signals include an explicit business-for-sale or broker listing, strategic-alternatives review, divestiture, recapitalization, succession or retirement announcement, ownership transition, or closure/transition announcement. Do not infer a desire to sell from an owner's age, health, family situation, ethnicity, religion, disability, or other sensitive trait. A merely struggling company is not a sale lead unless there is evidence of a transaction or transition path.\n\nscore_breakdown must contain exactly these 0-100 fields: sale_intent, business_quality, strategic_fit, evidence, timing, access.`;
}
