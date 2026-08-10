export type OpportunityPlan = 'scout' | 'pursuit' | 'command';

export type OpportunityAccess = OpportunityPlan | 'demo';

export const opportunityPlans = {
  scout: {
    id: 'scout' as const,
    name: 'Scout',
    price: '$149/month',
    monthlyCents: 14900,
    priceId: 'price_1U2jnOD4wDvqb7JrgNog5a1C',
    paymentLink: 'https://buy.stripe.com/eVqeVceU73iP4Rwfce4AU03',
    scanLimit: 6,
    pursuitLimit: 1,
    line: 'Always-on opportunity discovery for one company.',
    features: [
      'Live opportunity research',
      'Source-backed fit scoring',
      'Deadline and eligibility signals',
      'One active pursuit',
      'Saved opportunity pipeline',
    ],
  },
  pursuit: {
    id: 'pursuit' as const,
    name: 'Pursuit',
    price: '$399/month',
    monthlyCents: 39900,
    priceId: 'price_1U2jnXD4wDvqb7JrStDOKP9a',
    paymentLink: 'https://buy.stripe.com/9B69AS8vJ06D6ZE1lo4AU04',
    scanLimit: 10,
    pursuitLimit: 5,
    line: 'For companies actively chasing revenue, contracts and funding.',
    features: [
      'Everything in Scout',
      'Up to five active pursuits',
      'Partner and decision-maker paths',
      'Proposal and outreach starting drafts',
      'Risk and competitor analysis',
    ],
  },
  command: {
    id: 'command' as const,
    name: 'Command',
    price: '$999/month',
    monthlyCents: 99900,
    priceId: 'price_1U2jncD4wDvqb7JrjAWgJXre',
    paymentLink: 'https://buy.stripe.com/dRm5kC5jx06D2Joggi4AU05',
    scanLimit: 15,
    pursuitLimit: 20,
    line: 'Executive-grade opportunity intelligence across multiple markets.',
    features: [
      'Everything in Pursuit',
      'Up to twenty active pursuits',
      'Multi-market monitoring',
      'Executive-board review',
      'Custom opportunity rules and priority research',
    ],
  },
} as const;

export const demoOpportunityAccess = {
  name: 'Demo',
  price: 'Included',
  scanLimit: 3,
  pursuitLimit: 1,
} as const;

export const opportunityTypeOptions = [
  'Federal grants',
  'Government contracts',
  'State and local funding',
  'Municipal opportunities',
  'Tribal opportunities',
  'Corporate RFPs',
  'Strategic partnerships',
  'Customer opportunities',
  'Investor opportunities',
  'Expansion incentives',
] as const;

export function normalizeOpportunityPlan(value: unknown): OpportunityPlan | null {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'scout' || normalized === 'pursuit' || normalized === 'command' ? normalized : null;
}

export function opportunityAccess(value: unknown) {
  const plan = normalizeOpportunityPlan(value);
  if (!plan) return { id: 'demo' as const, ...demoOpportunityAccess };
  return opportunityPlans[plan];
}
