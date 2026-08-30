import { buildIndexEngine } from './indexEngine';
import type { WebsiteIngestionResult } from './websiteIngestion';

export type VisibilityPrompt = {
  prompt: string;
  intent: 'brand' | 'buyer' | 'comparison' | 'trust' | 'local';
  covered: boolean;
  evidence: string;
};

export type CitationSignal = {
  label: string;
  status: 'strong' | 'partial' | 'missing';
  detail: string;
};

export type VisibilityAction = {
  id: string;
  title: string;
  why: string;
  impact: 'high' | 'medium';
  approvalRequired: boolean;
  status: 'queued';
};

export type ProviderState = {
  name: string;
  status: 'content-ready' | 'connected-proxy' | 'connect' | 'external-verification';
  detail: string;
};

export type VisibilitySiteReport = {
  website: string;
  brandName: string;
  scores: {
    overall: number;
    searchReadiness: number;
    aiReadiness: number;
    citationReadiness: number;
    answerCoverage: number;
  };
  prompts: VisibilityPrompt[];
  citationSignals: CitationSignal[];
  fixQueue: VisibilityAction[];
  sourcePages: Array<{ url: string; title: string; score: number }>;
  providerStates: ProviderState[];
  caveat: string;
};

export type CompetitorVisibility = {
  website: string;
  brandName: string;
  overall: number;
  aiReadiness: number;
  citationReadiness: number;
  answerCoverage: number;
  readinessShare: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tidy(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function brandName(input: WebsiteIngestionResult) {
  const home = input.pages[0];
  const raw = tidy(home?.title || home?.headings?.[0] || new URL(input.canonicalUrl).hostname.replace(/^www\./, ''));
  const first = raw.split(/\s+[|–—-]\s+/)[0]?.trim();
  return (first || raw || 'This business').slice(0, 100);
}

function countSignals(text: string, patterns: RegExp[]) {
  return patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);
}

function usefulHeadings(input: WebsiteIngestionResult) {
  const blocked = /^(home|about|contact|services?|products?|solutions?|blog|news|welcome|learn more)$/i;
  const values = input.pages.flatMap((page) => page.headings).map(tidy).filter((value) => value.length >= 5 && value.length <= 90 && !blocked.test(value));
  return [...new Set(values)].slice(0, 8);
}

function providerStates(): ProviderState[] {
  return [
    {
      name: 'ChatGPT / OpenAI',
      status: process.env.OPENAI_API_KEY ? 'content-ready' : 'connect',
      detail: process.env.OPENAI_API_KEY
        ? 'Aridon can analyze and simulate answer quality from supplied evidence. Live public-answer mention checks require an approved search/observation adapter.'
        : 'Connect the OpenAI key for Aridon content analysis. Live public-answer verification is a separate observation step.',
    },
    {
      name: 'Google AI / Gemini',
      status: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ? 'connected-proxy' : 'external-verification',
      detail: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL
        ? 'Search Console can measure search/indexing outcomes. AI Overview inclusion still requires observed-result verification.'
        : 'No direct Gemini/AI Overview observation is claimed until an approved provider or observed-result source is connected.',
    },
    { name: 'Perplexity', status: 'external-verification', detail: 'Aridon tracks citation readiness now. Live Perplexity citations require an observed-result adapter.' },
    { name: 'Claude', status: 'external-verification', detail: 'Aridon tracks answer and citation readiness now. Live Claude answer verification remains provider-dependent.' },
    { name: 'Microsoft Copilot', status: 'external-verification', detail: 'Aridon prepares Bing/search discovery signals but does not invent Copilot mentions.' },
  ];
}

function buildSiteReport(input: WebsiteIngestionResult): VisibilitySiteReport {
  const index = buildIndexEngine({ pages: input.pages, navigation: input.navigation, knowledge: input.knowledge });
  const name = brandName(input);
  const text = input.pages.map((page) => `${page.title}\n${page.description}\n${page.headings.join('\n')}\n${page.text}`).join('\n').toLowerCase();
  const pages = Math.max(1, input.pages.length);
  const described = input.pages.filter((page) => page.description.trim().length >= 50).length;
  const headed = input.pages.filter((page) => page.headings.length >= 2).length;
  const deep = input.pages.filter((page) => page.text.trim().length >= 900).length;

  const proofCount = countSignals(text, [/case stud/, /testimonial|reviews?/, /results?/, /award/, /certif/, /clients?/, /years? of/, /portfolio/]);
  const answerCount = countSignals(text, [/faq|frequently asked/, /how (we|to)/, /what (we|is|are)/, /why /, /pricing|price|cost/, /compare|versus| vs\.? /]);
  const entityCount = countSignals(text, [/about us|about /, /team|leadership|founder/, /contact/, /location|located|address/, /phone|email/]);

  const citationReadiness = clamp(28 + (described / pages) * 18 + (headed / pages) * 15 + Math.min(22, proofCount * 4) + Math.min(17, entityCount * 4));
  const answerCoverage = clamp(24 + (deep / pages) * 20 + (headed / pages) * 18 + Math.min(28, answerCount * 5) + (input.navigation.length >= 4 ? 10 : 0));
  const overall = clamp((index.searchReadiness + index.aiReadiness + citationReadiness + answerCoverage) / 4);

  const headings = usefulHeadings(input);
  const topicA = headings[0] || 'services';
  const topicB = headings[1] || topicA;
  const coverage = (needle: string) => text.includes(needle.toLowerCase().split(/\s+/).slice(0, 3).join(' '));
  const prompts: VisibilityPrompt[] = [
    { prompt: `What does ${name} do?`, intent: 'brand', covered: entityCount >= 2, evidence: entityCount >= 2 ? 'About/contact/entity signals are present.' : 'The site needs a clearer entity description.' },
    { prompt: `Who is ${name} best for?`, intent: 'buyer', covered: /who we help|ideal client|for (business|owners|teams|companies|families|patients|customers)/i.test(text), evidence: /who we help|ideal client/i.test(text) ? 'Buyer-fit language is visible.' : 'Buyer-fit language is limited.' },
    { prompt: `Best ${topicA} provider`, intent: 'buyer', covered: coverage(topicA) && proofCount >= 2, evidence: proofCount >= 2 ? 'Relevant topic and proof signals coexist.' : 'Topic exists but proof is thin.' },
    { prompt: `${name} reviews and results`, intent: 'trust', covered: proofCount >= 2, evidence: proofCount >= 2 ? 'Trust/results signals are present.' : 'Case studies, reviews, or quantified results are missing or weak.' },
    { prompt: `${name} vs alternatives for ${topicB}`, intent: 'comparison', covered: /compare|versus|alternative|difference/i.test(text), evidence: /compare|versus|alternative|difference/i.test(text) ? 'Comparison language exists.' : 'No strong comparison content was detected.' },
    { prompt: `${topicA} near me`, intent: 'local', covered: /location|located|serving|service area|address/i.test(text), evidence: /location|located|serving|service area|address/i.test(text) ? 'Geographic/service-area signals are present.' : 'Local/service-area context is weak.' },
  ];

  const citationSignals: CitationSignal[] = [
    { label: 'Clear entity identity', status: entityCount >= 3 ? 'strong' : entityCount >= 1 ? 'partial' : 'missing', detail: entityCount >= 3 ? 'About, contact, and identity signals make the entity easier to resolve.' : 'Strengthen who the company is, where it operates, and how to contact it.' },
    { label: 'Answer-ready pages', status: answerCount >= 4 ? 'strong' : answerCount >= 1 ? 'partial' : 'missing', detail: answerCount >= 4 ? 'The site contains useful answer-style structure.' : 'Add concise FAQ, how-it-works, pricing/cost, and comparison answers.' },
    { label: 'Proof worth citing', status: proofCount >= 4 ? 'strong' : proofCount >= 1 ? 'partial' : 'missing', detail: proofCount >= 4 ? 'Multiple proof signals can support citations.' : 'Add verifiable case studies, outcomes, credentials, reviews, and primary-source proof.' },
    { label: 'Search metadata', status: described === pages ? 'strong' : described > 0 ? 'partial' : 'missing', detail: described === pages ? 'Important scanned pages have useful descriptions.' : 'Some important pages need unique titles/descriptions.' },
    { label: 'Internal crawl paths', status: input.navigation.length >= 5 ? 'strong' : input.navigation.length >= 2 ? 'partial' : 'missing', detail: input.navigation.length >= 5 ? 'Internal navigation gives crawlers multiple discovery paths.' : 'Strengthen internal links among service, proof, FAQ, location, and contact pages.' },
  ];

  const fixQueue: VisibilityAction[] = [];
  if (answerCoverage < 78) fixQueue.push({ id: 'answer-pages', title: 'Build answer-first FAQ and buyer-intent pages', why: 'AI systems need concise, specific answers to the questions buyers actually ask.', impact: 'high', approvalRequired: true, status: 'queued' });
  if (citationReadiness < 78) fixQueue.push({ id: 'proof', title: 'Turn proof into citation-ready case studies', why: 'Claims are more useful when supported by outcomes, credentials, dates, and primary-source evidence.', impact: 'high', approvalRequired: true, status: 'queued' });
  if (index.searchReadiness < 82) fixQueue.push({ id: 'crawl', title: 'Repair crawl, metadata, sitemap, canonical, and schema signals', why: 'Discovery problems upstream limit both search and AI visibility downstream.', impact: 'high', approvalRequired: true, status: 'queued' });
  if (!/compare|versus|alternative|difference/i.test(text)) fixQueue.push({ id: 'comparison', title: 'Publish a fair alternatives/comparison page', why: 'Comparison prompts are high-intent and commonly answered from structured source pages.', impact: 'medium', approvalRequired: true, status: 'queued' });
  if (!/location|located|serving|service area|address/i.test(text)) fixQueue.push({ id: 'local', title: 'Clarify service area and local relevance', why: 'Location-aware queries need explicit geographic context.', impact: 'medium', approvalRequired: true, status: 'queued' });
  while (fixQueue.length < 5) fixQueue.push({ id: `measure-${fixQueue.length}`, title: 'Measure visibility after the next approved change', why: 'A fix only counts when citations, qualified traffic, leads, or conversion outcomes improve.', impact: 'medium', approvalRequired: false, status: 'queued' });

  return {
    website: input.canonicalUrl,
    brandName: name,
    scores: { overall, searchReadiness: index.searchReadiness, aiReadiness: index.aiReadiness, citationReadiness, answerCoverage },
    prompts,
    citationSignals,
    fixQueue: fixQueue.slice(0, 5),
    sourcePages: index.pageIndex.slice(0, 8).map((page) => ({ url: page.url, title: page.title, score: page.score })),
    providerStates: providerStates(),
    caveat: 'These scores measure discoverability, answer coverage, citation readiness, and competitive readiness from public site evidence. Aridon does not claim a live ChatGPT, Gemini, Perplexity, Claude, Copilot, or AI Overview mention unless that result has actually been observed through an approved provider or observation source.',
  };
}

export function buildAIVisibilityReport(primary: WebsiteIngestionResult, competitorInputs: WebsiteIngestionResult[] = []) {
  const site = buildSiteReport(primary);
  const rawCompetitors = competitorInputs.map(buildSiteReport);
  const total = Math.max(1, site.scores.overall + rawCompetitors.reduce((sum, item) => sum + item.scores.overall, 0));
  const competitors: CompetitorVisibility[] = [site, ...rawCompetitors].map((item) => ({
    website: item.website,
    brandName: item.brandName,
    overall: item.scores.overall,
    aiReadiness: item.scores.aiReadiness,
    citationReadiness: item.scores.citationReadiness,
    answerCoverage: item.scores.answerCoverage,
    readinessShare: clamp((item.scores.overall / total) * 100),
  }));

  return {
    generatedAt: new Date().toISOString(),
    site,
    competitors,
    competitiveMetricLabel: 'AI visibility readiness share (proxy, not observed model share-of-voice)',
    nextMeasurement: 'Re-run after approved fixes and compare overall, citation readiness, answer coverage, observed provider citations, qualified AI/search traffic, leads, and attributed revenue.',
  };
}
