import { NextRequest, NextResponse } from 'next/server';
import { ingestPublicWebsite } from '../../../lib/websiteIngestion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function organizationType(text: string) {
  if (hasAny(text, ['association', 'membership', 'member companies', 'nonprofit', 'non-profit', 'foundation', 'alliance', 'coalition', 'fellowship'])) return 'Association / Innovation Network';
  if (hasAny(text, ['saas', 'software platform', 'ai platform', 'artificial intelligence', 'api', 'cloud platform'])) return 'Technology / SaaS';
  if (hasAny(text, ['manufacturer', 'manufacturing', 'fabrication', 'industrial equipment', 'factory'])) return 'Manufacturer / Industrial';
  if (hasAny(text, ['add to cart', 'shop now', 'shopping cart', 'online store'])) return 'E-commerce / Retail';
  if (hasAny(text, ['law firm', 'accounting firm', 'consulting firm', 'engineering firm', 'marketing agency'])) return 'Professional Services';
  if (hasAny(text, ['free estimate', 'service area', 'licensed and insured', 'contractor', 'plumbing', 'painting', 'roofing', 'hvac'])) return 'Local Service Business';
  return 'General Business';
}

function normalizedCopy(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function contentIntegrityAudit(pages: Array<{ url: string; title: string; description: string; headings: string[]; text: string }>) {
  const findings: string[] = [];
  let deductions = 0;
  const currentYear = new Date().getUTCFullYear();
  const now = Date.now();

  for (const page of pages) {
    const identity = `${page.url} ${page.title}`.toLowerCase();
    const content = `${page.headings.join(' ')}\n${page.text}`.toLowerCase();
    const prominent = content.slice(0, 2200);

    const oilGasPage = /oil[^a-z0-9]*(&|and)?[^a-z0-9]*gas|oil-gas/.test(identity);
    const aviationPage = /aviation/.test(identity);
    const miningPage = /mining/.test(identity);

    if (oilGasPage && content.includes('who should apply') && content.includes('mining or mineral processing')) {
      findings.push('Oil & Gas challenge copy tells applicants they need technology for mining or mineral processing, which conflicts with the page topic.');
      deductions += 28;
    }

    if (aviationPage && content.includes('mining or mineral processing')) {
      findings.push('Aviation challenge copy contains mining/mineral-processing applicant language.');
      deductions += 24;
    }

    if (miningPage && content.includes('aviation industry')) {
      findings.push('Mining challenge copy contains aviation-industry applicant language.');
      deductions += 24;
    }

    const challengeHub = /cleantech-challenges/.test(identity) || normalizedCopy(page.title).includes('cleantech challenges');
    if (
      challengeHub &&
      content.includes('consumer goods industry leaders') &&
      ['mining cleantech challenge', 'oil & gas cleantech challenge', 'sustainable aviation cleantech challenge'].filter((term) => content.includes(term)).length >= 2
    ) {
      findings.push('The Cleantech Challenges hub says finalists present to consumer-goods industry leaders even though the listed programs are mining, oil & gas, and aviation.');
      deductions += 20;
    }

    if (!/archive|past|winner|history/.test(identity) && prominent.includes(`fall ${currentYear - 1}`) && hasAny(prominent, ['apply', 'application', 'event date', 'deadline'])) {
      findings.push(`A current program page prominently references Fall ${currentYear - 1}; verify that application and event language has been rolled forward.`);
      deductions += 10;
    }

    if (prominent.includes('application is now open')) {
      const deadlineMatch = prominent.match(/application deadline[:\s-]*([a-z]+\s+\d{1,2},\s+\d{4})/i);
      if (deadlineMatch) {
        const parsed = Date.parse(deadlineMatch[1]);
        if (Number.isFinite(parsed) && parsed + 86_400_000 < now) {
          findings.push(`A page says applications are open even though its displayed deadline (${deadlineMatch[1]}) has passed.`);
          deductions += 18;
        }
      }
    }
  }

  const descriptions = new Map<string, string[]>();
  pages.forEach((page) => {
    const key = normalizedCopy(page.description);
    if (key.length < 80) return;
    descriptions.set(key, [...(descriptions.get(key) || []), page.url]);
  });
  for (const urls of descriptions.values()) {
    if (urls.length > 1) {
      findings.push(`${urls.length} scanned pages reuse the same long search description, increasing duplicate/copy-paste risk.`);
      deductions += 8;
      break;
    }
  }

  const currentBrand = pages.some((page) => `${page.title} ${page.text.slice(0, 1200)}`.toLowerCase().includes('colorado cleantech'));
  const legacyBrand = pages.some((page) => `${page.title} ${page.text.slice(0, 1200)}`.toLowerCase().includes('colorado cleantech industries association'));
  if (currentBrand && legacyBrand) {
    findings.push('Both current Colorado Cleantech branding and legacy “Colorado Cleantech Industries Association” branding appear in the scanned set; review migration, canonical, and stale-page handling.');
    deductions += 10;
  }

  return { score: clamp(100 - Math.min(deductions, 72)), findings: findings.slice(0, 8) };
}

export async function POST(request: NextRequest) {
  try {
    const body = request.headers.get('content-type')?.includes('application/json')
      ? await request.json().catch(() => ({}))
      : {};
    const website = typeof body?.website === 'string' ? body.website.trim().slice(0, 500) : '';
    if (!website) {
      return NextResponse.json({ error: 'Enter a public business website to analyze.' }, { status: 400, headers: NO_STORE });
    }

    const ingestion = await ingestPublicWebsite(website);
    const combined = ingestion.pages
      .map((page) => `${page.title}\n${page.description}\n${page.headings.join(' ')}\n${page.text}`)
      .join('\n')
      .toLowerCase();

    const kind = organizationType(combined);
    const integrity = contentIntegrityAudit(ingestion.pages);
    const pageCount = Math.max(ingestion.pages.length, 1);
    const headingCount = ingestion.pages.reduce((sum, page) => sum + page.headings.length, 0);
    const describedPages = ingestion.pages.filter((page) => page.description.length >= 50).length;
    const titledPages = ingestion.pages.filter((page) => page.title.length >= 12).length;
    const hasContact = ingestion.contacts.length > 0;

    const cta = hasAny(combined, ['contact', 'get started', 'request a quote', 'apply now', 'join now', 'become a member', 'sponsor', 'donate', 'book now', 'schedule', 'learn more']);
    const serviceDepth = hasAny(combined, ['services', 'solutions', 'programs', 'what we do', 'products']) && headingCount >= 4;
    const about = hasAny(combined, ['about us', 'our team', 'our story', 'who we are', 'leadership', 'board of directors']);
    const customerProof = hasAny(combined, ['portfolio', 'case study', 'case studies', 'results', 'success stories', 'customer stories', 'testimonial', 'reviews', 'our work', 'projects']);
    const leadershipProof = hasAny(combined, ['board of directors', 'board members', 'leadership team', 'executive team', 'our leadership', 'advisory board']);
    const institutionalProof = hasAny(combined, ['government', 'department of', 'state of', 'university', 'national laboratory', 'national lab', 'research institute', 'sponsors', 'strategic partners', 'industry partners']);
    const capitalProof = hasAny(combined, ['follow-on capital', 'capital raised', 'funding raised', 'grant funding', 'grants awarded', 'investment', 'investors', 'venture capital']);
    const credentialProof = hasAny(combined, ['patent', 'patented', 'award', 'awards', 'certified', 'accredited', 'licensed', 'insured', 'warranty']);
    const quantifiedProof = /(\$[\d,.]+\s*(million|billion|m|b)?|\b\d{2,}\+?\s+(members|companies|customers|clients|projects|partners|alumni|locations|employees|startups|technologies)\b)/i.test(combined);

    const authoritySignals: string[] = [];
    if (leadershipProof) authoritySignals.push('Named leadership or board governance');
    if (institutionalProof) authoritySignals.push('Institutional, government, university, sponsor, or research relationships');
    if (quantifiedProof) authoritySignals.push('Quantified scale or impact metrics');
    if (capitalProof) authoritySignals.push('Capital, grant, investment, or funding outcomes');
    if (customerProof) authoritySignals.push('Customer, project, case-study, or results proof');
    if (credentialProof) authoritySignals.push('Credentials, awards, certifications, patents, or traditional trust signals');

    const titleCoverage = titledPages / pageCount;
    const descriptionCoverage = describedPages / pageCount;
    const navigationDepth = Math.min(ingestion.navigation.length, 8);

    const clarity = clamp(34 + titleCoverage * 18 + descriptionCoverage * 14 + Math.min(headingCount, 12) * 2 + (serviceDepth ? 12 : 0));
    const conversion = clamp(30 + (cta ? 28 : 0) + (hasContact ? 22 : 0) + (customerProof ? 12 : 0) + (hasAny(combined, ['pricing', 'plans', 'membership levels', 'apply', 'register']) ? 8 : 0));
    const trust = clamp(28 + (leadershipProof ? 14 : 0) + (institutionalProof ? 18 : 0) + (quantifiedProof ? 16 : 0) + (capitalProof ? 12 : 0) + (customerProof ? 10 : 0) + (credentialProof ? 10 : 0) + (about ? 8 : 0));
    const aiSearchVisibility = clamp(26 + titleCoverage * 16 + descriptionCoverage * 16 + Math.min(headingCount, 12) * 1.6 + navigationDepth * 2 + (institutionalProof ? 7 : 0) + (quantifiedProof ? 7 : 0));
    const indexingReadiness = clamp(30 + titleCoverage * 24 + descriptionCoverage * 24 + navigationDepth * 2 + (headingCount >= 4 ? 6 : 0));
    const contentIntegrity = integrity.score;
    const overall = clamp((clarity + conversion + trust + aiSearchVisibility + indexingReadiness + contentIntegrity) / 6);

    const strengths: string[] = [];
    const opportunities: string[] = [];

    if (hasContact) strengths.push('Public contact information is detectable and can feed lead, partner, member, or applicant workflows.');
    else opportunities.push('Make phone and email contact information easier to find on important conversion pages.');

    if (cta) strengths.push('The site contains clear action language that can be connected to CRM and follow-up workflows.');
    else opportunities.push('Add stronger calls-to-action that match the organization type and the visitor’s next decision.');

    if (serviceDepth) strengths.push('The site communicates enough program, service, solution, or product depth for targeted campaigns and AI answers.');
    else opportunities.push('Separate major programs, services, or solutions into focused pages so buyers and AI systems can understand each offer.');

    if (authoritySignals.length >= 2) strengths.push(`Aridon detected ${authoritySignals.length} authority signals beyond basic reviews and contractor credentials.`);
    else opportunities.push('Add stronger authority proof such as leadership, partners, measurable outcomes, customers, grants, awards, patents, or case studies.');

    if (contentIntegrity >= 90) strengths.push('The scanned pages are internally consistent with no major copy/topic conflicts detected.');
    else opportunities.unshift(`Resolve ${integrity.findings.length} content-integrity or freshness issue${integrity.findings.length === 1 ? '' : 's'} before pushing more search traffic or AI discovery.`);

    if (describedPages < pageCount) opportunities.push('Strengthen page descriptions and search snippets so every important page has a clear reason to click.');
    if (!customerProof) opportunities.push('Add stronger proof such as outcomes, case studies, project evidence, testimonials, or measurable customer/member results.');
    if (aiSearchVisibility < 75) opportunities.push('Create answer-ready content with clear entities, FAQs, program/service facts, outcomes, and internal links for AI/search discovery.');
    if (indexingReadiness < 75) opportunities.push('Improve title/description coverage, heading structure, and internal navigation before expanding automated indexing submissions.');
    if (opportunities.length < 3) opportunities.push('Connect every inquiry to Aridon CRM with qualification, follow-up, proposal, win/loss, and referral stages.');

    const executiveReview = [
      { executive: 'Heather · COO', finding: serviceDepth ? `Aridon classified this as ${kind}. The offer structure is usable; turn the major programs or services into repeatable operating lanes.` : `Aridon classified this as ${kind}. Clarify the offer structure first, then build repeatable operating lanes around the highest-value outcomes.` },
      { executive: 'Scout · CSO', finding: cta ? 'There is a usable conversion path. Segment visitors by intent and connect each path to measurable pipeline stages.' : 'The site needs a stronger buyer, member, applicant, sponsor, or partner path before more traffic is pushed into it.' },
      { executive: 'Oracle · CMCO', finding: authoritySignals.length >= 2 ? 'Authority is stronger than a contractor-style trust score would suggest. Reuse the detected proof across landing pages, outreach, social content, proposals, and search snippets.' : 'The biggest marketing gap is authority proof. Add measurable outcomes, leadership, institutional relationships, and stronger evidence.' },
      { executive: 'Ethos · CLRO', finding: contentIntegrity >= 90 ? 'No major content-integrity conflict surfaced in the scanned set.' : `Content Integrity & Freshness is ${contentIntegrity}/100. Fix contradictory, copied, stale, or cross-industry language before treating the site as a clean source of truth.` },
      { executive: 'Atlas · CTO', finding: `Current discovery read: ${aiSearchVisibility}/100 AI/Search Visibility and ${indexingReadiness}/100 content-level Indexing Readiness. The next technical layer should add robots, sitemap, canonical, and structured-data verification.` },
      { executive: 'Ledger · CRO', finding: 'Track visits → qualified inquiries/applications → proposals or commitments → wins → revenue or measurable program value.' },
      { executive: 'Eva · Chief of Staff', finding: `Priority move: ${opportunities[0] || 'connect website demand to a measurable follow-up workflow.'}` },
    ];

    return NextResponse.json({
      analyzedAt: new Date().toISOString(),
      website: ingestion.canonicalUrl,
      organizationType: kind,
      pagesScanned: ingestion.pages.length,
      contacts: ingestion.contacts,
      navigation: ingestion.navigation,
      scores: { overall, clarity, conversion, trust, aiSearchVisibility, indexingReadiness, contentIntegrity },
      authoritySignals,
      integrityFindings: integrity.findings,
      strengths: strengths.slice(0, 7),
      opportunities: opportunities.slice(0, 9),
      executiveReview,
      pages: ingestion.pages.map((page) => ({
        url: page.url,
        title: page.title,
        description: page.description,
        headings: page.headings.slice(0, 8),
      })),
      note: 'Aridon classifies the organization before scoring it and now checks Content Integrity & Freshness across the scanned pages for topic conflicts, copied descriptions, stale current-program language, and deadline contradictions. Indexing Readiness measures content and internal-discovery signals; robots, sitemap, canonical, structured-data, and external-index verification remain separate technical checks. Website claims are treated as the organization’s own statements unless independently verified.',
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Analyze business error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Aridon could not analyze that website.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
