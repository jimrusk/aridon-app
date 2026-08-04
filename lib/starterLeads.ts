export type StarterLead = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: 'new' | 'qualified' | 'active' | 'closed';
  notes: string;
  created_at: string;
};

const SEEDED_AT = '2026-08-03T00:00:00.000Z';

// A visible starter pipeline for a new or temporarily disconnected database.
// These are public agency and institutional contacts relevant to Aridon's
// atmospheric-water, drought resilience, Tribal, and manufacturing work.
export const STARTER_LEADS: StarterLead[] = [
  {
    id: 'starter-corpus-manager',
    name: 'Peter Zanoni',
    company: 'City of Corpus Christi',
    email: 'PeterZ@CorpusChristiTX.gov',
    status: 'active',
    notes: 'City Manager • Phone: (361) 826-3220 • AWG-1000 water-security pilot follow-up.',
    created_at: SEEDED_AT,
  },
  {
    id: 'starter-corpus-water',
    name: 'Ashley Marion',
    company: 'Corpus Christi Water',
    email: 'ashleym6@corpuschristiTX.gov',
    status: 'qualified',
    notes: 'Strategic Business Manager • Phone: (361) 826-3706 • Water-supply project and pilot coordination.',
    created_at: SEEDED_AT,
  },
  {
    id: 'starter-navajo-dwr',
    name: 'Jason John',
    company: 'Navajo Nation Department of Water Resources',
    email: '',
    status: 'qualified',
    notes: 'Department Director • Phone: (928) 729-4003 • Tribal water-resilience and AWG pilot pathway.',
    created_at: SEEDED_AT,
  },
  {
    id: 'starter-nm-water',
    name: 'Water Use & Conservation Program',
    company: 'New Mexico Office of the State Engineer',
    email: 'water.nm@ose.nm.gov',
    status: 'active',
    notes: 'Phone: (505) 827-6755 • State drought planning, conservation, and public-water-system coordination.',
    created_at: SEEDED_AT,
  },
  {
    id: 'starter-nm-aztec',
    name: 'District 5 Office',
    company: 'New Mexico Office of the State Engineer',
    email: '',
    status: 'qualified',
    notes: 'Aztec district office • Phone: (505) 383-4571 • Four Corners water-rights and local pilot coordination.',
    created_at: SEEDED_AT,
  },
  {
    id: 'starter-adwr',
    name: 'Tom Buschatzke',
    company: 'Arizona Department of Water Resources',
    email: '',
    status: 'qualified',
    notes: 'Director • Phone: (602) 771-8426 • Arizona drought, Colorado River, and augmentation strategy.',
    created_at: SEEDED_AT,
  },
  {
    id: 'starter-wifa',
    name: 'Water Infrastructure Finance Authority',
    company: 'WIFA Arizona',
    email: '',
    status: 'new',
    notes: 'Main line: (602) 364-1310 • Long-Term Water Augmentation Fund and infrastructure financing.',
    created_at: SEEDED_AT,
  },
  {
    id: 'starter-sjc-sbdc',
    name: 'Small Business Development Center',
    company: 'San Juan College',
    email: 'sbdc@sanjuancollege.edu',
    status: 'active',
    notes: 'Phone: (505) 566-3528 • Business planning, capital readiness, government contracting, and manufacturing support.',
    created_at: SEEDED_AT,
  },
  {
    id: 'starter-sjc-enterprise',
    name: 'Enterprise Center',
    company: 'San Juan College',
    email: 'enterprisecenter@sanjuancollege.edu',
    status: 'qualified',
    notes: 'Phone: (505) 566-3700 • AWG-1000 prototyping, workforce training, and local production partnership.',
    created_at: SEEDED_AT,
  },
  {
    id: 'starter-4ced',
    name: 'Four Corners Economic Development',
    company: '4CED',
    email: 'info@4cornersed.com',
    status: 'active',
    notes: 'Phone: (505) 566-3702 • Regional manufacturing, site selection, incentives, and partner introductions.',
    created_at: SEEDED_AT,
  },
];
