export type ProspectDemo = {
  slug: string;
  active: boolean;
  expiresAt: string;
  companyName: string;
  industry: string;
  location: string;
  website: string;
  contactEmail: string;
  publicSummary: string;
  services: string[];
  opportunities: string[];
  sampleBrief: string[];
  starterQuestions: string[];
};

export const prospectDemos: ProspectDemo[] = [
  {
    slug: 'adobe-roofing-8f3k',
    active: true,
    expiresAt: '2026-08-24T00:00:00-06:00',
    companyName: 'Adobe Roofing Company',
    industry: 'Roofing contractor',
    location: 'Albuquerque, New Mexico',
    website: 'https://adoberoofing.com/',
    contactEmail: 'info@adoberoofing.com',
    publicSummary: 'Public website information describes Adobe Roofing as a full-service New Mexico roofing contractor serving commercial, residential and industrial customers, with inspection, consultation, installation, repair, maintenance and energy-saving services.',
    services: ['Commercial roofing', 'Residential roofing', 'Industrial roofing', 'Inspection and consultation', 'Installation and repair', 'Maintenance and energy savings'],
    opportunities: [
      'Create one follow-up system for every estimate, inspection and maintenance opportunity.',
      'Separate commercial, residential and industrial pipelines so high-value jobs do not get buried.',
      'Turn maintenance customers into recurring inspection and renewal campaigns.',
      'Give the owner a daily brief of new leads, overdue follow-ups, jobs at risk and next actions.',
    ],
    sampleBrief: [
      'Priority: identify estimates older than 48 hours that have not received a follow-up.',
      'Revenue: rank open commercial opportunities by value and probability before the next sales call block.',
      'Operations: flag active jobs with unresolved scheduling, material or customer communication dependencies.',
      'Retention: create a maintenance reminder list from completed jobs and inspection dates.',
    ],
    starterQuestions: [
      'We get estimate requests but follow-up is inconsistent. Build a better process.',
      'How should we separate residential, commercial and industrial opportunities so the best jobs get attention first?',
      'Create a 30-day plan to turn completed roofing jobs into maintenance and referral business.',
    ],
  },
  {
    slug: 'cool-me-down-4q7m',
    active: true,
    expiresAt: '2026-08-24T00:00:00-06:00',
    companyName: 'Cool Me Down LLC',
    industry: 'HVAC services',
    location: 'Phoenix, Arizona',
    website: 'https://www.coolmedownllc.net/',
    contactEmail: 'CoolMeDownLLC@gmail.com',
    publicSummary: 'Public website information describes Cool Me Down as a licensed, bonded and insured family-owned HVAC company providing residential and commercial installation, maintenance and repair for air conditioning and heating systems.',
    services: ['Air conditioning installation', 'Air conditioning repair', 'Air conditioning maintenance', 'Heating installation', 'Heating repair', 'Heating maintenance'],
    opportunities: [
      'Route quote requests into a same-day follow-up queue with ownership and deadlines.',
      'Turn one-time repairs and installs into seasonal maintenance campaigns.',
      'Track pricing objections and competitive-loss reasons so discounting becomes more deliberate.',
      'Give the owner a morning service-and-sales brief covering urgent jobs, open quotes and callbacks.',
    ],
    sampleBrief: [
      'Priority: contact all unclosed quote requests from the last 24 hours before new leads age out.',
      'Revenue: identify repair customers who are strong candidates for replacement or maintenance plans.',
      'Operations: group today’s open customer callbacks by urgency and service type.',
      'Retention: prepare a seasonal maintenance reminder campaign for prior installation customers.',
    ],
    starterQuestions: [
      'We compete heavily on price. How can we improve conversion without racing to the bottom?',
      'Build a follow-up system for quote requests, repairs and maintenance customers.',
      'What should the owner see every morning to keep service calls and sales moving?',
    ],
  },
  {
    slug: 'tbc-development-6n2p',
    active: true,
    expiresAt: '2026-08-24T00:00:00-06:00',
    companyName: 'TBC Development',
    industry: 'Commercial construction and development',
    location: 'Dallas, Texas',
    website: 'https://txcommercialconstruction.com/',
    contactEmail: 'info@txcommercialconstruction.com',
    publicSummary: 'Public website information describes TBC Development as a commercial construction and development company offering new construction, development, finish-out and renovation, with project intake that captures budget and project details.',
    services: ['Commercial new construction', 'Development', 'Finish-out', 'Renovation', 'Project consultation', 'Design and management coordination'],
    opportunities: [
      'Score inbound projects by budget, fit, timing and next milestone before estimator time is committed.',
      'Create an executive view spanning lead qualification, estimating, design dependencies and project handoffs.',
      'Maintain a follow-up clock for proposals, owner decisions, design-team dependencies and subcontractor commitments.',
      'Give leadership a CEO brief of pipeline movement, project risk, cash exposure and next approvals.',
    ],
    sampleBrief: [
      'Pipeline: rank new project inquiries by strategic fit, budget clarity and probability of reaching proposal.',
      'Operations: flag projects waiting on owner decisions, design information or subcontractor commitments.',
      'Finance: surface proposals or commitments with meaningful cash-flow exposure before approval.',
      'Growth: identify project types and referral sources producing the strongest qualified opportunities.',
    ],
    starterQuestions: [
      'How should we qualify incoming commercial projects before investing estimating time?',
      'Create an executive handoff process from inquiry to proposal to active project.',
      'What should leadership review weekly to spot construction project risk earlier?',
    ],
  },
  {
    slug: '416-landscape-3r9v',
    active: true,
    expiresAt: '2026-08-24T00:00:00-06:00',
    companyName: '416 Landscape LLC',
    industry: 'Landscape design and construction',
    location: 'Littleton, Colorado',
    website: 'https://www.416landscape.com/',
    contactEmail: '416landscapes@gmail.com',
    publicSummary: 'Public website information describes 416 Landscape as a Colorado landscaping company offering landscape design, hardscaping and landscaping, with consultation and quote requests supported by a project gallery.',
    services: ['Landscape design', 'Hardscaping', 'Landscaping', 'Consultations', 'Project estimates'],
    opportunities: [
      'Create a simple lead board from consultation request through estimate, decision, scheduling and completion.',
      'Automate quote follow-up so warm prospects do not disappear during busy field weeks.',
      'Turn project photos and completed work into a repeatable referral and social-content pipeline.',
      'Give the owner a weekly view of booked work, open estimates, schedule gaps and next revenue actions.',
    ],
    sampleBrief: [
      'Priority: follow up with open estimates before filling lower-value schedule gaps.',
      'Revenue: identify the project categories with the strongest close rate and average ticket.',
      'Operations: compare booked work against crew capacity for the next four weeks.',
      'Marketing: select recent completed projects for testimonial, referral and portfolio follow-up.',
    ],
    starterQuestions: [
      'We are busy in the field and quotes can go cold. Build a simple follow-up system.',
      'How should we balance booked work, crew capacity and new estimates over the next month?',
      'Turn our completed projects into a repeatable referral and marketing process.',
    ],
  },
];

export function getProspectDemo(slug: string) {
  return prospectDemos.find((demo) => demo.slug === slug);
}
