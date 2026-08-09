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

type DemoSeed = Omit<ProspectDemo, 'active' | 'expiresAt' | 'services' | 'opportunities' | 'sampleBrief' | 'starterQuestions'> & {
  kind: 'roofing' | 'hvac' | 'construction' | 'landscape';
};

const expiresAt = '2026-08-24T00:00:00-06:00';

const presets = {
  roofing: {
    services: ['Roof inspections and estimates', 'Repair and replacement', 'Residential and commercial roofing', 'Customer follow-up'],
    opportunities: [
      'Create one follow-up queue for every inspection, estimate and open proposal.',
      'Rank open opportunities by urgency, job value, probability and next action.',
      'Turn completed jobs into maintenance, review and referral campaigns.',
      'Give the owner a daily brief of new leads, overdue follow-ups, jobs at risk and next actions.',
    ],
    sampleBrief: [
      'Priority: identify estimates older than 48 hours that have not received a follow-up.',
      'Revenue: rank open roofing opportunities by value, urgency and close probability.',
      'Operations: flag active jobs with unresolved scheduling, material or customer dependencies.',
      'Retention: prepare review, referral and maintenance follow-up for recently completed jobs.',
    ],
    starterQuestions: [
      'We get inspection and estimate requests but follow-up can slip. Build a better process.',
      'How should we prioritize open roofing opportunities so the best jobs get attention first?',
      'Create a 30-day plan to turn completed roofing jobs into reviews, referrals and repeat business.',
    ],
  },
  hvac: {
    services: ['Heating and cooling service', 'Installation and replacement', 'Repair', 'Maintenance and customer follow-up'],
    opportunities: [
      'Route quote and service requests into a same-day follow-up queue with clear ownership.',
      'Turn one-time repairs and installations into seasonal maintenance campaigns.',
      'Track pricing objections and lost-job reasons so sales decisions become more deliberate.',
      'Give the owner a morning service-and-sales brief covering urgent jobs, open quotes and callbacks.',
    ],
    sampleBrief: [
      'Priority: contact unclosed quote requests from the last 24 hours before they age out.',
      'Revenue: identify repair customers who may be candidates for replacement or maintenance plans.',
      'Operations: group today’s callbacks by urgency, service type and promised response time.',
      'Retention: prepare seasonal maintenance reminders for prior installation and repair customers.',
    ],
    starterQuestions: [
      'Build a follow-up system for quote requests, repairs and maintenance customers.',
      'How can we improve conversion without competing only on price?',
      'What should the owner see every morning to keep service calls and sales moving?',
    ],
  },
  construction: {
    services: ['Commercial construction', 'Preconstruction and estimating', 'Project management', 'Client and partner coordination'],
    opportunities: [
      'Score inbound projects by budget, fit, timing and next milestone before estimator time is committed.',
      'Create an executive view spanning qualification, estimating, design dependencies and project handoffs.',
      'Maintain a follow-up clock for proposals, owner decisions, design information and subcontractor commitments.',
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
  landscape: {
    services: ['Landscape design or maintenance', 'Project estimates', 'Scheduling and operations', 'Customer follow-up'],
    opportunities: [
      'Create a simple lead board from consultation request through estimate, decision, scheduling and completion.',
      'Automate quote follow-up so warm prospects do not disappear during busy field weeks.',
      'Turn completed work into a repeatable review, referral and marketing pipeline.',
      'Give the owner a weekly view of booked work, open estimates, schedule gaps and next revenue actions.',
    ],
    sampleBrief: [
      'Priority: follow up with open estimates before filling lower-value schedule gaps.',
      'Revenue: identify project or service categories with the strongest close rate and average value.',
      'Operations: compare booked work against crew capacity for the next four weeks.',
      'Marketing: select recent completed work for testimonial, referral and portfolio follow-up.',
    ],
    starterQuestions: [
      'We are busy in the field and quotes can go cold. Build a simple follow-up system.',
      'How should we balance booked work, crew capacity and new estimates over the next month?',
      'Turn our completed work into a repeatable referral and marketing process.',
    ],
  },
} as const;

function makeDemo(seed: DemoSeed): ProspectDemo {
  const preset = presets[seed.kind];
  return {
    slug: seed.slug,
    active: true,
    expiresAt,
    companyName: seed.companyName,
    industry: seed.industry,
    location: seed.location,
    website: seed.website,
    contactEmail: seed.contactEmail,
    publicSummary: seed.publicSummary,
    services: [...preset.services],
    opportunities: [...preset.opportunities],
    sampleBrief: [...preset.sampleBrief],
    starterQuestions: [...preset.starterQuestions],
  };
}

export const prospectDemos: ProspectDemo[] = [
  // NEW MEXICO
  makeDemo({
    slug: 'adobe-roofing-8f3k', kind: 'roofing', companyName: 'Adobe Roofing Company', industry: 'Roofing contractor', location: 'Albuquerque, New Mexico', website: 'https://adoberoofing.com/', contactEmail: 'info@adoberoofing.com',
    publicSummary: 'Public website information describes Adobe Roofing as a full-service New Mexico roofing contractor serving commercial, residential and industrial customers with inspections, consultation, installation, repair, maintenance and energy-saving services.',
  }),
  makeDemo({
    slug: 'tru-air-nm-2h5x', kind: 'hvac', companyName: 'Tru Air Systems LLC', industry: 'HVAC services', location: 'Albuquerque, New Mexico', website: 'https://www.truairnm.com/', contactEmail: 'info@truairnm.com',
    publicSummary: 'Public website information identifies Tru Air Systems LLC as an Albuquerque HVAC business offering online estimates and service communications for heating and cooling customers.',
  }),
  makeDemo({
    slug: 'stonebridge-nm-7c4j', kind: 'construction', companyName: 'StoneBridge Construction & Design', industry: 'Commercial and residential construction', location: 'Albuquerque, New Mexico', website: 'https://stonebridgenm.com/', contactEmail: 'gilbert@stonebridgenm.com',
    publicSummary: 'Public website information describes StoneBridge as a New Mexico construction company with more than three decades of experience in commercial and residential construction, including commercial construction, steel buildings, sitework and grading.',
  }),
  makeDemo({
    slug: 'nm-landscaping-5w8d', kind: 'landscape', companyName: 'New Mexico Landscaping', industry: 'Landscape design and construction', location: 'Bernalillo / Albuquerque Metro, New Mexico', website: 'https://nmlandscaping.com/', contactEmail: 'info@nmlandscaping.com',
    publicSummary: 'Public website information describes New Mexico Landscaping as a family-owned landscaping business serving Albuquerque-area communities with landscaping, design and installation, including water-saving irrigation, native plants and xeriscaping.',
  }),

  // ARIZONA
  makeDemo({
    slug: 'wd-roofing-az-9m2r', kind: 'roofing', companyName: 'W&D Roofing & Contracting LLC', industry: 'Roofing contractor', location: 'Arizona', website: 'https://arizonaroofpro.com/', contactEmail: 'w.d.roofing@icloud.com',
    publicSummary: 'Public website information describes W&D Roofing & Contracting as a family-built Arizona roofing company serving residential and commercial customers with repairs, coatings, spray foam, flat, tile, shingle and metal roofing across multiple Arizona markets.',
  }),
  makeDemo({
    slug: 'cool-me-down-4q7m', kind: 'hvac', companyName: 'Cool Me Down LLC', industry: 'HVAC services', location: 'Phoenix, Arizona', website: 'https://www.coolmedownllc.net/', contactEmail: 'CoolMeDownLLC@gmail.com',
    publicSummary: 'Public website information describes Cool Me Down as a licensed, bonded and insured family-owned HVAC company providing residential and commercial air-conditioning and heating installation, maintenance and repair.',
  }),
  makeDemo({
    slug: 'sae-construction-az-1v6b', kind: 'construction', companyName: 'SAE Construction, Inc.', industry: 'Commercial construction', location: 'Yuma, Arizona', website: 'https://saeconstructionaz.com/', contactEmail: 'contact@saeconstructionaz.com',
    publicSummary: 'Public website information describes SAE Construction as a woman-owned commercial general construction firm based in Yuma with project-management, design-build, CMAR and bid-build experience serving public and private sector projects.',
  }),
  makeDemo({
    slug: 'element-landscape-az-3p9f', kind: 'landscape', companyName: 'Element Landscape Management', industry: 'Commercial and HOA landscape management', location: 'Gilbert / Phoenix Metro, Arizona', website: 'https://www.azelement.com/', contactEmail: 'contact@azelement.com',
    publicSummary: 'Public website information describes Element Landscape Management as a founder-led commercial and HOA landscape management company serving communities throughout the Phoenix metro area with horticultural, communication and sustainability-focused services.',
  }),

  // TEXAS
  makeDemo({
    slug: 'tx-roof-general-4t1n', kind: 'roofing', companyName: 'Texas Roofing & General Contractors', industry: 'Roofing and general contracting', location: 'Meadows Place / Houston Metro, Texas', website: 'https://txroof.org/', contactEmail: 'nick@txroof.org',
    publicSummary: 'Public website information identifies Texas Roofing & General Contractors as a Texas roofing and general contracting business serving customers from its Meadows Place location and providing direct estimate and project contact.',
  }),
  makeDemo({
    slug: 'texan-hvac-7k3s', kind: 'hvac', companyName: 'Texan Heating & Air', industry: 'HVAC services', location: 'Fort Worth, Texas', website: 'https://www.texanhvac.com/', contactEmail: 'service@texanhvac.com',
    publicSummary: 'Public website information describes Texan Heating & Air as a Fort Worth HVAC company with more than 20 years of combined experience providing air-conditioning and heating services with an emphasis on customer value.',
  }),
  makeDemo({
    slug: 'tbc-development-6n2p', kind: 'construction', companyName: 'TBC Development', industry: 'Commercial construction and development', location: 'Dallas, Texas', website: 'https://txcommercialconstruction.com/', contactEmail: 'info@txcommercialconstruction.com',
    publicSummary: 'Public website information describes TBC Development as a Dallas-Fort Worth full-service commercial design-build general contractor covering planning, design, estimating, project management, new construction, renovation and tenant finish-out.',
  }),
  makeDemo({
    slug: 'texas-landscaping-8y5c', kind: 'landscape', companyName: 'Texas Landscaping, LLC', industry: 'Landscaping and irrigation', location: 'North Texas', website: 'https://texaslandscaping.com/', contactEmail: 'info@texaslandscaping.com',
    publicSummary: 'Public website information describes Texas Landscaping, LLC as a Texas landscaping business that accepts project descriptions, measurements and photos for quotes and maintains direct customer communication through project completion.',
  }),

  // COLORADO
  makeDemo({
    slug: 'co-pro-roofing-2d8q', kind: 'roofing', companyName: 'Colorado Pro Roofing', industry: 'Roofing and exterior services', location: 'Colorado Springs, Colorado', website: 'https://coloradoproroofing.com/', contactEmail: 'info@coloradoproroofing.com',
    publicSummary: 'Public website information describes Colorado Pro Roofing as a locally owned Colorado Springs roofing and exterior company serving Front Range communities with inspections, repair, replacement, storm-damage support and exterior project services.',
  }),
  makeDemo({
    slug: 'falling-star-hvac-5j1a', kind: 'hvac', companyName: 'Falling Star Heating and Cooling', industry: 'HVAC and plumbing services', location: 'Colorado Springs, Colorado', website: 'https://fallingstarhvac.com/', contactEmail: 'info@fallingstarhvac.com',
    publicSummary: 'Public website information describes Falling Star Heating and Cooling as a disabled veteran-owned Colorado Springs HVAC company providing heating, cooling, indoor-air-quality, maintenance and emergency services.',
  }),
  makeDemo({
    slug: 'colorado-commercial-6g4u', kind: 'construction', companyName: 'Colorado Commercial Construction', industry: 'Commercial construction', location: 'Colorado', website: 'https://www.coloradocommercial.construction/', contactEmail: 'info@coloradocommercial.construction',
    publicSummary: 'Public website information describes Colorado Commercial Construction as a commercial construction company that guides owners and developers through budgeting, financing, design, planning, scheduling and construction from inception through delivery.',
  }),
  makeDemo({
    slug: '416-landscape-3r9v', kind: 'landscape', companyName: '416 Landscape LLC', industry: 'Landscape design and construction', location: 'Littleton, Colorado', website: 'https://www.416landscape.com/', contactEmail: '416landscapes@gmail.com',
    publicSummary: 'Public website information describes 416 Landscape as a Colorado landscaping company offering landscape design, hardscaping, landscaping, water features and irrigation systems, with free quote and consultation contact.',
  }),
];

export function getProspectDemo(slug: string) {
  return prospectDemos.find((demo) => demo.slug === slug);
}
