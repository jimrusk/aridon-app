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
    id: 'farmington-water-pilot', name: 'Mark Hathcock & Benedikte Webb', organization: 'City of Farmington Water/Wastewater',
    emails: ['mhathcock@farmingtonnm.gov', 'bwebb@farmingtonnm.gov'], cc: ['nduckett@farmingtonnm.gov'],
    subject: 'Farmington San Juan Basin Water Resilience Pilot - AWG-1000', sentAt: '2026-08-08T17:00:10-05:00', status: 'awaiting_reply', priority: 'high',
    nextAction: 'Benedikte Webb is out until August 11. Watch Mark Hathcock, mayor office, and alternate utility contacts.'
  },
  {
    id: 'aztec-water-pilot', name: 'Jeric Jaramillo', organization: 'City of Aztec', emails: ['jjaramillo@aztecnm.gov'], cc: ['procurement@aztecnm.gov'],
    subject: 'Aztec Stage 2 Water Shortage - AWG-1000 Resilience Pilot', sentAt: '2026-08-08T17:00:21-05:00', status: 'awaiting_reply', priority: 'high',
    nextAction: 'Watch Public Works, Water Plant, procurement, and mayor-office routing.'
  },
  {
    id: 'nm-grid-modernization', name: 'Chadette Pfaff', organization: 'New Mexico EMNRD', emails: ['chadette.pfaff@emnrd.nm.gov'],
    subject: 'AWG-1000 + Microgrid Resilience Pilot - Grid Modernization Program Fit', sentAt: '2026-08-08T17:03:43-05:00', status: 'awaiting_reply', priority: 'high',
    nextAction: 'Deadline August 15, 2026. Follow up next business day if no response.'
  },
  {
    id: 'construction-water', name: 'Barnard Construction & Spencer Construction', organization: 'Remote Construction Water Outreach',
    emails: ['info@barnard-inc.com', 'bids@spencerconstructionaz.com'], subject: 'New Mexico Construction Water Alternative - AWG + Storage + Remote Power',
    sentAt: '2026-08-08T17:03:53-05:00', status: 'awaiting_reply', priority: 'medium', nextAction: 'Watch for procurement/project routing; follow up in 3 business days.'
  },
  {
    id: 'elemental-dcii', name: 'Elemental Impact Applications Team', organization: 'Elemental Impact - Data Center Innovation Initiative', emails: ['apply@elementalimpact.com'],
    subject: 'DCII Fit - Aridon Atmospheric Water + Resilient Power Demonstration', sentAt: '2026-08-08T17:03:59-05:00', status: 'awaiting_reply', priority: 'high',
    nextAction: 'Watch for program-fit guidance or application routing; follow up in 3 business days.'
  },
  {
    id: 'navajo-tariq', name: 'Najam Tariq', organization: 'Navajo Nation', emails: ['najamtariq@navajo-nsn.gov'],
    subject: 'Navajo Water Resilience Pilot: AWG-1000 Supplemental Supply Demonstration', sentAt: '2026-08-06T12:26:27-05:00', status: 'awaiting_reply', priority: 'high',
    nextAction: 'Monitor through Monday; if no reply, send a short follow-up Tuesday focused on selecting one site for paid qualification.'
  },
  {
    id: 'az-wifa', name: 'WIFA Arizona Team', organization: 'Water Infrastructure Finance Authority of Arizona', emails: ['contact@azwifa.gov'],
    subject: 'Funding and Partnership Inquiry: Arizona AWG-1000 Water Resilience Pilot', sentAt: '2026-08-06T12:26:18-05:00', status: 'awaiting_reply', priority: 'high',
    nextAction: 'Monitor through Monday; then request a specific program-fit call and eligible-host pathway.'
  },
  {
    id: 'adwr-buschatzke', name: 'Tom Buschatzke', organization: 'Arizona Department of Water Resources', emails: ['tbuschatzke@azwater.gov'],
    subject: 'Arizona AWG-1000 Pilot Proposal: Measured Supplemental Water and Groundwater Demand Offset', sentAt: '2026-08-06T12:26:08-05:00', status: 'awaiting_reply', priority: 'high',
    nextAction: 'Monitor through Monday; follow up Tuesday asking for the right augmentation/pilot staff lead.'
  },
  {
    id: 'cap-arizona', name: 'Central Arizona Project Team', organization: 'Central Arizona Project', emails: ['info@cap-az.com'],
    subject: 'Arizona Water Resilience Pilot: AWG-1000 Technical Demonstration Proposal', sentAt: '2026-08-06T12:25:57-05:00', status: 'awaiting_reply', priority: 'high',
    nextAction: 'Monitor for technical routing; follow up Tuesday if no response.'
  },
  {
    id: 'kimley-horn', name: 'Will Wilhelm', organization: 'Kimley-Horn', emails: ['will.wilhelm@kimley-horn.com'],
    subject: 'Water sovereignty in the Southwest - exploring partnership with Kimley-Horn', sentAt: '2026-08-03T14:38:38-05:00', status: 'follow_up_due', priority: 'high',
    nextAction: 'Follow-up sent August 8; watch for engineering-partnership response.'
  },
  {
    id: 'agis-capital', name: 'Carl Evers', organization: 'AGIS Capital', emails: ['cevers@agiscapital.com'],
    subject: 'Water & power sovereignty for the Southwest - discovery call', sentAt: '2026-08-03T12:43:02-07:00', status: 'follow_up_due', priority: 'high',
    nextAction: 'Follow-up sent August 8; watch for investor/strategic-call response.'
  },
  {
    id: 'juniper-jai', name: 'Jai Thattil', organization: 'Juniper Networks', emails: ['jthattil@juniper.net'],
    subject: 'Water & power sovereignty for data center infrastructure', sentAt: '2026-08-04T07:52:39-05:00', status: 'follow_up_due', priority: 'high',
    nextAction: 'Follow-up sent August 8; watch for data-center infrastructure routing.'
  },
  {
    id: 'colorado-ris', name: 'Lauren Ris', organization: 'Colorado Water Conservation Board', emails: ['lauren.ris@state.co.us'],
    subject: "Southwest Water Security Alliance - Colorado's leadership opportunity", sentAt: '2026-07-27T21:12:07-07:00', status: 'follow_up_due', priority: 'high',
    nextAction: 'Follow-up sent August 8; ask for correct Colorado compact/water-resilience staff routing.'
  },
  {
    id: 'nevada-entsminger', name: 'John Entsminger', organization: 'Southern Nevada Water Authority', emails: ['john.entsminger@snwa.com'],
    subject: "Southwest Water Security Alliance - Nevada's long-term certainty play", sentAt: '2026-07-27T23:12:07-05:00', status: 'follow_up_due', priority: 'high',
    nextAction: 'Follow-up sent August 8; watch for policy/partnership routing.'
  },
  {
    id: 'az-governor', name: "Governor's Constituent Services", organization: 'State of Arizona', emails: ['engage@az.gov'],
    subject: 'Southwestern Water Security Alliance - Proposal for a Regional Water Compact Working Group', sentAt: '2026-07-19T10:59:53-04:00', status: 'follow_up_due', priority: 'medium',
    nextAction: 'Follow-up sent August 8 asking for routing to water-policy staff.'
  },
  {
    id: 'utah-water', name: 'Utah Water Resources Director Office', organization: 'State of Utah', emails: ['rcarroll@utah.gov'],
    subject: "Southwestern Water Security Alliance - Utah's Role in a New Regional Water Compact", sentAt: '2026-07-19T10:59:53-04:00', status: 'follow_up_due', priority: 'medium',
    nextAction: 'Follow-up sent August 8 asking for routing to the appropriate state water-policy lead.'
  }
];
