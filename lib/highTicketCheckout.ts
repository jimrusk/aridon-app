export const highTicketOffers = {
  freeScan: {
    key: 'free-scan',
    name: 'Free Aridon Business Scan',
    price: '$0',
    priceDetail: 'No card required',
    href: '/analyze-business',
    type: 'free',
    summary: 'Fast executive readout of the business website, conversion, trust, visibility, indexing readiness, and highest-signal opportunities.',
  },
  healthScan: {
    key: 'health-scan',
    name: 'Aridon Starter Diagnostic',
    stripeName: 'Aridon Business Health Scan',
    price: '$198',
    priceDetail: 'one time',
    href: 'https://book.stripe.com/cNidR8dQ35qX6ZE7JM4AU0d',
    type: 'one-time',
    summary: 'A focused diagnostic that identifies conversion leaks, trust gaps, missed revenue opportunities, AI opportunities, and the highest-priority next actions.',
  },
  actionPlan: {
    key: 'action-plan',
    name: 'Aridon Action Plan',
    price: '$497',
    priceDetail: 'one time',
    href: 'https://book.stripe.com/4gM7sKeU73iPdo28NQ4AU0i',
    type: 'one-time',
    summary: 'A decision-ready 90-day roadmap that turns the scan into prioritized growth, follow-up, conversion, competitive, and automation actions.',
  },
  implementationSprint: {
    key: 'implementation-sprint',
    name: 'Aridon Implementation Sprint',
    price: '$2,500',
    priceDetail: 'one time',
    href: 'https://book.stripe.com/dRmdR8aDR3iP2Jo0hk4AU0j',
    type: 'one-time',
    summary: 'Done-for-you implementation of the highest-priority fixes, including lead capture, follow-up automation, website or landing-page improvements, and reporting setup.',
  },
  growthEngine: {
    key: 'growth-engine',
    name: 'Aridon Growth Engine',
    price: '$7,500',
    priceDetail: 'one time',
    href: 'https://book.stripe.com/eVq7sK7rF9Hd0Bg5BE4AU0k',
    type: 'one-time',
    summary: 'Full done-for-you growth system across website conversion, lead generation, CRM and follow-up, AI workflows, campaign assets, reporting, and sales process improvements.',
  },
  managedGrowth: {
    key: 'managed-growth',
    name: 'Aridon Managed Growth',
    price: '$1,500',
    priceDetail: 'per month',
    href: 'https://buy.stripe.com/fZueVc5jx9Hd83I9RU4AU0l',
    type: 'subscription',
    summary: 'Ongoing optimization, monitoring, follow-up improvements, campaign work, new growth opportunities, and executive reporting after implementation.',
  },
  enterprise: {
    key: 'enterprise',
    name: 'Aridon Enterprise',
    price: '$20K–$50K+',
    priceDetail: 'custom scope',
    href: '/analyze-business',
    type: 'sales-led',
    summary: 'Custom multi-location, multi-team, integration-heavy, or enterprise deployments. Start with the scan so scope and economics can be grounded in evidence.',
  },
} as const;

export type HighTicketOfferKey = keyof typeof highTicketOffers;

export const highTicketFunnel = [
  highTicketOffers.freeScan,
  highTicketOffers.healthScan,
  highTicketOffers.actionPlan,
  highTicketOffers.implementationSprint,
  highTicketOffers.growthEngine,
  highTicketOffers.managedGrowth,
  highTicketOffers.enterprise,
] as const;

export const postPurchaseUpsell = {
  'health-scan': highTicketOffers.actionPlan,
  'action-plan': highTicketOffers.implementationSprint,
  'implementation-sprint': highTicketOffers.growthEngine,
  'growth-engine': highTicketOffers.managedGrowth,
} as const;
