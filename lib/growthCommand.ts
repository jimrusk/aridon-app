export type GrowthModule = {
  id: string;
  name: string;
  owner: string;
  mission: string;
  status: 'active' | 'ready' | 'connector';
  metrics: string[];
};

export const growthModules: GrowthModule[] = [
  { id: 'marketing-autopilot', name: 'Marketing Autopilot', owner: 'Marketing + Revenue + Technology', mission: 'Run the daily scan-diagnose-prioritize-draft-measure loop, automatically complete reversible marketing work and route publishing, outbound and spend changes into approval.', status: 'active', metrics: ['Marketing health', 'Actions completed', 'Approvals waiting'] },
  { id: 'seo', name: 'SEO Sentinel', owner: 'Marketing + Technology', mission: 'Audit technical SEO, metadata, internal links, page quality and conversion friction.', status: 'active', metrics: ['Technical health', 'Indexed pages', 'Priority fixes'] },
  { id: 'ai-visibility', name: 'AI Visibility Monitor', owner: 'Strategy + Marketing', mission: 'Track the questions Aridon should win in AI answer engines and build the content needed to earn those mentions.', status: 'ready', metrics: ['Tracked prompts', 'Brand mentions', 'Citation coverage'] },
  { id: 'competitors', name: 'Competitor War Room', owner: 'Strategy', mission: 'Watch competitor positioning, pages, partnerships, contracts, press, keywords and market moves.', status: 'active', metrics: ['Competitors watched', 'Material changes', 'Response actions'] },
  { id: 'opportunities', name: 'Opportunity Radar', owner: 'Revenue + Strategy', mission: 'Turn market signals, funding, buyer intent and emerging problems into prioritized business-development opportunities.', status: 'active', metrics: ['New opportunities', 'Qualified targets', 'Next actions'] },
  { id: 'content', name: 'Content Factory', owner: 'Marketing', mission: 'Convert one useful insight into landing pages, articles, briefs, outreach, social content and sales collateral.', status: 'active', metrics: ['Assets queued', 'Assets approved', 'Campaign reuse'] },
  { id: 'pr', name: 'Digital PR Agent', owner: 'Communications', mission: 'Find relevant reporters, publications and timely story angles, then prepare pitches for owner approval.', status: 'ready', metrics: ['Media targets', 'Pitch drafts', 'Earned mentions'] },
  { id: 'authority', name: 'Authority Builder', owner: 'Marketing + Partnerships', mission: 'Identify legitimate industry, government, education and partner references that can strengthen authority.', status: 'ready', metrics: ['Authority targets', 'Partner links', 'Referring domains'] },
  { id: 'ads', name: 'Ad Commander', owner: 'Revenue + Marketing', mission: 'Plan highly targeted paid campaigns around qualified buyer intent and measure meetings and opportunities, not vanity clicks.', status: 'connector', metrics: ['Qualified leads', 'Cost per meeting', 'Pipeline influenced'] },
  { id: 'conversion', name: 'Conversion Lab', owner: 'Revenue', mission: 'Improve calls-to-action, forms, offers and page paths using measurable lead and meeting outcomes.', status: 'active', metrics: ['Conversion rate', 'Form completion', 'Meeting rate'] },
  { id: 'attribution', name: 'Revenue Attribution', owner: 'Finance + Revenue', mission: 'Connect campaigns and content to leads, opportunities, proposals, contracts and expansion revenue.', status: 'connector', metrics: ['Pipeline sourced', 'Pipeline influenced', 'Revenue won'] },
];

export const aridonSearchBattlegrounds = [
  'Atmospheric water generation for municipalities',
  'AI data center water independence',
  'Southwest drought resilience technology',
  'Tribal water infrastructure solutions',
  'Off-grid water infrastructure',
  'Federal water resilience technology',
  'Groundwater depletion solutions',
  'Emergency municipal water supply',
];

export const landingPageMatrix = [
  { market: 'Cities & Utilities', pages: ['Municipal Water Resilience', 'Emergency Water Supply', 'Drought Response'] },
  { market: 'Tribal Nations', pages: ['Tribal Water Resilience', 'Remote Community Supply', 'Funding-Ready Pilot Programs'] },
  { market: 'Data Centers', pages: ['Water Independence', 'Onsite Water Supply', 'Water + Energy Resilience'] },
  { market: 'Agriculture', pages: ['Farm Water Resilience', 'Livestock Water Supply', 'Groundwater Relief'] },
  { market: 'Federal & Defense', pages: ['Mission-Resilient Water', 'Remote Operations', 'Emergency Infrastructure'] },
  { market: 'Southwest States', pages: ['New Mexico', 'Arizona', 'Texas', 'Nevada', 'Utah', 'Colorado', 'California'] },
];

export const approvalPolicy = {
  automatic: ['Research', 'Internal analysis', 'Draft creation', 'Opportunity scoring', 'Website diagnostics'],
  approvalRequired: ['External messages', 'Paid ad spend', 'Press outreach', 'Publishing consequential claims', 'Contract or legal commitments', 'Material website changes'],
};
