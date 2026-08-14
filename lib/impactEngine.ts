export type ImpactEngineInput = {
  pages: Array<{ url: string; title: string; description: string; headings: string[]; text: string }>;
  navigation: string[];
  contacts: string[];
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function has(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function buildImpactAnalysis(input: ImpactEngineInput) {
  const text = input.pages.map((p) => `${p.title} ${p.description} ${p.headings.join(' ')} ${p.text}`).join(' ').toLowerCase();
  const total = Math.max(1, input.pages.length);
  const titled = input.pages.filter((p) => p.title.trim().length >= 12).length;
  const described = input.pages.filter((p) => p.description.trim().length >= 50).length;
  const headed = input.pages.filter((p) => p.headings.length > 0).length;
  const mission = has(text, ['mission', 'our purpose', 'what we do']);
  const impact = has(text, ['impact', 'outcomes', 'results', 'people served', 'annual report']);
  const support = has(text, ['donate', 'give now', 'support us', 'get involved']);
  const governance = has(text, ['board of directors', 'governance', 'leadership', 'annual report']);
  const programs = has(text, ['programs', 'services', 'initiatives', 'projects']);

  const missionClarity = clamp(35 + (mission ? 35 : 0) + (programs ? 15 : 0) + (headed / total) * 15);
  const fundingReadiness = clamp(30 + (impact ? 30 : 0) + (governance ? 20 : 0) + (described / total) * 20);
  const supporterConversion = clamp(30 + (support ? 35 : 0) + (input.contacts.length ? 20 : 0) + (input.navigation.length ? 15 : 0));
  const impactProof = clamp(25 + (impact ? 45 : 0) + (governance ? 15 : 0) + (described / total) * 15);
  const digitalDiscovery = clamp(30 + (titled / total) * 25 + (described / total) * 25 + (headed / total) * 10 + (input.navigation.length ? 10 : 0));
  const overall = clamp((missionClarity + fundingReadiness + supporterConversion + impactProof + digitalDiscovery) / 5);

  const strengths: string[] = [];
  const priorities: string[] = [];
  if (mission) strengths.push('Mission language is visible and understandable.'); else priorities.push('Clarify the mission in plain language.');
  if (impact) strengths.push('Impact or outcome language is visible.'); else priorities.push('Add measurable outcomes and impact proof.');
  if (support) strengths.push('A supporter action path is visible.'); else priorities.push('Create a clear donate, volunteer, or supporter action path.');
  if (governance) strengths.push('Leadership or governance signals are visible.'); else priorities.push('Add appropriate leadership, board, and annual reporting trust signals.');
  if (described < input.pages.length) priorities.push('Strengthen page descriptions for search and AI discovery.');
  if (priorities.length < 3) priorities.push('Connect funding, outreach, board actions, and impact reporting into one recurring workflow.');

  return {
    analyzedAt: new Date().toISOString(),
    scores: { overall, missionClarity, fundingReadiness, supporterConversion, impactProof, digitalDiscovery },
    strengths,
    priorities: priorities.slice(0, 7),
    fundingLanes: [
      { lane: 'Public Grants', action: 'Track opportunities, deadlines, eligibility clues, and required materials.' },
      { lane: 'Foundations & Philanthropy', action: 'Match mission, geography, populations served, and outcomes to likely funder profiles.' },
      { lane: 'Corporate & Community Sponsors', action: 'Package programs, community outcomes, sponsorship value, and reporting.' },
    ],
    operatingModules: ['Funding Intelligence', 'Grant Builder', 'Donor & Funder CRM', 'Impact Measurement', 'Board & Governance', 'Community Outreach', 'AI + Search Discovery'],
    executiveReview: [
      { executive: 'Heather · COO', finding: priorities[0] || 'Build a repeatable mission-to-execution operating cadence.' },
      { executive: 'Eva · Chief of Staff', finding: 'Keep funding, board actions, supporter follow-up, and impact reporting in one prioritized queue.' },
      { executive: 'Oracle · Communications', finding: impact ? 'Reuse impact evidence across reports, outreach, and funding materials.' : 'Strengthen proof-of-impact content before scaling outreach.' },
      { executive: 'Ledger · Revenue', finding: 'Track funding opportunities and supporter relationships as measurable pipelines.' },
    ],
    plan: { name: 'Impact Starter', price: '$198/month', checkoutStatus: 'planned' },
    note: 'This first-pass analysis uses public website signals and does not independently verify organization claims or current funding availability.',
  };
}
