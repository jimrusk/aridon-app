import { NextRequest, NextResponse } from 'next/server';
import { ingestPublicWebsite } from '../../../lib/websiteIngestion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function includesAny(text: string, terms: string[]) {
  const haystack = text.toLowerCase();
  return terms.some((term) => haystack.includes(term));
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

    const headingCount = ingestion.pages.reduce((sum, page) => sum + page.headings.length, 0);
    const describedPages = ingestion.pages.filter((page) => page.description.length >= 50).length;
    const titledPages = ingestion.pages.filter((page) => page.title.length >= 12).length;
    const hasContact = ingestion.contacts.length > 0;
    const hasCallsToAction = includesAny(combined, ['contact', 'call today', 'get started', 'free estimate', 'request a quote', 'book now', 'schedule', 'learn more']);
    const hasTrustSignals = includesAny(combined, ['testimonial', 'review', 'years of experience', 'years in business', 'licensed', 'insured', 'guarantee', 'warranty', 'certified']);
    const hasServiceDepth = includesAny(combined, ['services', 'solutions', 'what we do']) && headingCount >= 4;
    const hasAboutSignal = includesAny(combined, ['about us', 'our team', 'our story', 'who we are']);
    const hasLocationSignal = includesAny(combined, ['serving', 'service area', 'located in', 'address', 'city', 'county', 'area']);
    const hasProofSignal = includesAny(combined, ['portfolio', 'gallery', 'case study', 'before and after', 'our work', 'projects']);

    const clarity = clamp(38 + titledPages * 10 + describedPages * 8 + Math.min(headingCount, 12) * 2 + (hasServiceDepth ? 12 : 0));
    const conversion = clamp(35 + (hasCallsToAction ? 28 : 0) + (hasContact ? 22 : 0) + (hasProofSignal ? 10 : 0));
    const trust = clamp(35 + (hasTrustSignals ? 30 : 0) + (hasAboutSignal ? 17 : 0) + (hasProofSignal ? 13 : 0));
    const localVisibility = clamp(38 + (hasLocationSignal ? 27 : 0) + describedPages * 8 + Math.min(ingestion.navigation.length, 8) * 2);
    const overall = clamp((clarity + conversion + trust + localVisibility) / 4);

    const strengths: string[] = [];
    const opportunities: string[] = [];

    if (hasContact) strengths.push('Public contact information is easy for Aridon to detect and use in lead workflows.');
    else opportunities.push('Make phone and email contact information easier to find on every important page.');

    if (hasCallsToAction) strengths.push('The site contains clear action language that can be connected to a CRM and follow-up process.');
    else opportunities.push('Add stronger calls-to-action such as Request a Quote, Book a Call, or Schedule an Estimate.');

    if (hasServiceDepth) strengths.push('The site communicates multiple services or solutions clearly enough to build targeted campaigns.');
    else opportunities.push('Separate major services into focused pages so search engines and buyers can understand each offer.');

    if (hasTrustSignals) strengths.push('The site includes trust language that can support conversion.');
    else opportunities.push('Add verified trust signals such as reviews, guarantees, certifications, insurance, years in business, or case studies.');

    if (!hasProofSignal) opportunities.push('Add stronger proof such as project galleries, before-and-after examples, case studies, or measurable customer outcomes.');
    if (describedPages < ingestion.pages.length) opportunities.push('Strengthen page descriptions and search snippets so each important page has a clear reason to click.');
    if (!hasLocationSignal) opportunities.push('Add genuine service-area and location language to improve local search relevance.');
    if (opportunities.length < 3) opportunities.push('Connect every inquiry to Aridon CRM with estimate, proposal, follow-up, win/loss, and review-request stages.');

    const executiveReview = [
      { executive: 'Heather · COO', finding: hasServiceDepth ? 'The offer is understandable. Aridon can turn the service mix into repeatable operating lanes and follow-up tasks.' : 'Clarify the service mix first, then build repeatable operating lanes around the highest-value offers.' },
      { executive: 'Scout · CSO', finding: hasCallsToAction ? 'There is a usable conversion path. The next move is connecting inquiries to pipeline stages and timed follow-up.' : 'The site needs a stronger buyer path before outbound traffic is increased.' },
      { executive: 'Oracle · CMCO', finding: hasProofSignal ? 'Proof is visible. Aridon should reuse it across service pages, outreach, social content, and proposals.' : 'The biggest marketing gap is proof. Add customer outcomes, project evidence, and stronger authority signals.' },
      { executive: 'Ledger · CRO', finding: 'Track visits → inquiries → estimates/proposals → wins → revenue so growth work can be tied to money instead of vanity metrics.' },
      { executive: 'Eva · Chief of Staff', finding: `Priority move: ${opportunities[0] || 'connect website leads to a measurable follow-up workflow.'}` },
    ];

    return NextResponse.json({
      analyzedAt: new Date().toISOString(),
      website: ingestion.canonicalUrl,
      pagesScanned: ingestion.pages.length,
      contacts: ingestion.contacts,
      navigation: ingestion.navigation,
      scores: { overall, clarity, conversion, trust, localVisibility },
      strengths: strengths.slice(0, 5),
      opportunities: opportunities.slice(0, 7),
      executiveReview,
      pages: ingestion.pages.map((page) => ({
        url: page.url,
        title: page.title,
        description: page.description,
        headings: page.headings.slice(0, 8),
      })),
      note: 'This first-pass Aridon analysis uses public website signals. Claims on the business website are treated as the business’s own statements unless independently verified.',
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Analyze business error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Aridon could not analyze that website.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
