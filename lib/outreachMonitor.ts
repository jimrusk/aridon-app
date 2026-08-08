export type OutreachStatus = 'awaiting_reply' | 'replied' | 'follow_up_due' | 'closed';

export type OutreachTarget = {
  id: string;
  name: string;
  organization: string;
  emails: string[];
  cc?: string[];
  subject: string;
  sentAt: string;
  status: OutreachStatus;
  priority: 'high' | 'medium';
  nextAction: string;
};

export const OUTREACH_TARGETS: OutreachTarget[] = [
  {
    id: 'farmington-water-pilot',
    name: 'Mark Hathcock & Benedikte Webb',
    organization: 'City of Farmington Water/Wastewater',
    emails: ['mhathcock@farmingtonnm.gov', 'bwebb@farmingtonnm.gov'],
    cc: ['nduckett@farmingtonnm.gov'],
    subject: 'Farmington San Juan Basin Water Resilience Pilot - AWG-1000',
    sentAt: '2026-08-08T17:00:10-05:00',
    status: 'awaiting_reply',
    priority: 'high',
    nextAction: 'Watch for reply; if no response, follow up in 2 business days.',
  },
  {
    id: 'aztec-water-pilot',
    name: 'Jeric Jaramillo',
    organization: 'City of Aztec',
    emails: ['jjaramillo@aztecnm.gov'],
    cc: ['procurement@aztecnm.gov'],
    subject: 'Aztec Stage 2 Water Shortage - AWG-1000 Resilience Pilot',
    sentAt: '2026-08-08T17:00:21-05:00',
    status: 'awaiting_reply',
    priority: 'high',
    nextAction: 'Watch for routing or reply from Public Works, Water Plant, procurement, or Mayor office; follow up in 2 business days.',
  },
  {
    id: 'nm-grid-modernization',
    name: 'Chadette Pfaff',
    organization: 'New Mexico EMNRD',
    emails: ['chadette.pfaff@emnrd.nm.gov'],
    subject: 'AWG-1000 + Microgrid Resilience Pilot - Grid Modernization Program Fit',
    sentAt: '2026-08-08T17:03:43-05:00',
    status: 'awaiting_reply',
    priority: 'high',
    nextAction: 'Watch closely because the application deadline is August 15, 2026; follow up next business day if needed.',
  },
  {
    id: 'construction-water',
    name: 'Barnard Construction & Spencer Construction',
    organization: 'Remote Construction Water Outreach',
    emails: ['info@barnard-inc.com', 'bids@spencerconstructionaz.com'],
    subject: 'New Mexico Construction Water Alternative - AWG + Storage + Remote Power',
    sentAt: '2026-08-08T17:03:53-05:00',
    status: 'awaiting_reply',
    priority: 'medium',
    nextAction: 'Watch for procurement/project routing; follow up in 3 business days.',
  },
  {
    id: 'elemental-dcii',
    name: 'Elemental Impact Applications Team',
    organization: 'Elemental Impact - Data Center Innovation Initiative',
    emails: ['apply@elementalimpact.com'],
    subject: 'DCII Fit - Aridon Atmospheric Water + Resilient Power Demonstration',
    sentAt: '2026-08-08T17:03:59-05:00',
    status: 'awaiting_reply',
    priority: 'high',
    nextAction: 'Watch for program-fit guidance or application routing; follow up in 3 business days.',
  },
];
