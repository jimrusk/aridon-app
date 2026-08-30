import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 1200) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function fallbackPackage(website: string, brandName: string, action: string, why: string) {
  return {
    title: action || 'Prepare AI visibility improvement',
    goal: why || 'Improve the clarity, evidence, and answer-readiness of the public website.',
    implementation: [
      'Choose the single highest-intent page tied to this issue.',
      'Rewrite the page around a direct buyer question and answer it near the top.',
      'Add verifiable proof, concrete details, and a clear entity/service description.',
      'Strengthen title, description, internal links, canonical/schema/crawl signals as relevant.',
      'Publish only after owner review, then re-run the Aridon visibility scan and compare measured outcomes.',
    ],
    draft: {
      suggestedTitle: `${brandName || 'Business'} | Clear answers for buyers`,
      suggestedMetaDescription: `Learn what ${brandName || 'this business'} does, who it helps, the proof behind the offer, and the next step.`,
      faqSeeds: [
        `What does ${brandName || 'this business'} do?`,
        `Who is ${brandName || 'this business'} best for?`,
        `What should a buyer compare before choosing a provider?`,
      ],
    },
    successMetrics: ['AI/search citation observations', 'qualified organic/AI referral traffic', 'qualified leads', 'conversion rate', 'attributed revenue'],
    approvalRequired: true,
    publicationStatus: 'draft-only',
    website,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json().catch(() => ({}));
    const website = clean(body?.website, 500);
    const brandName = clean(body?.brandName, 120);
    const action = clean(body?.action, 500);
    const why = clean(body?.why, 900);
    const evidence = Array.isArray(body?.evidence) ? body.evidence.map((item: unknown) => clean(item, 500)).filter(Boolean).slice(0, 12) : [];
    if (!website || !action) return NextResponse.json({ error: 'Website and action are required.' }, { status: 400, headers: NO_STORE });

    const fallback = fallbackPackage(website, brandName, action, why);
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ok: true, package: fallback }, { headers: NO_STORE });

    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1400,
        messages: [
          {
            role: 'system',
            content: 'You are Aridon AI Visibility Fixer. Use only supplied evidence. Never invent rankings, citations, customers, results, credentials, locations, prices, or claims. Return JSON with title, goal, implementation (5 concise steps), draft {suggestedTitle, suggestedMetaDescription, faqSeeds (3)}, successMetrics (5). External publishing or production edits always require owner approval. The package is draft-only.',
          },
          { role: 'user', content: JSON.stringify({ website, brandName, action, why, evidence }) },
        ],
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      const pkg = {
        title: clean(parsed?.title, 300) || fallback.title,
        goal: clean(parsed?.goal, 900) || fallback.goal,
        implementation: Array.isArray(parsed?.implementation) ? parsed.implementation.map((x: unknown) => clean(x, 500)).filter(Boolean).slice(0, 5) : fallback.implementation,
        draft: {
          suggestedTitle: clean(parsed?.draft?.suggestedTitle, 180) || fallback.draft.suggestedTitle,
          suggestedMetaDescription: clean(parsed?.draft?.suggestedMetaDescription, 320) || fallback.draft.suggestedMetaDescription,
          faqSeeds: Array.isArray(parsed?.draft?.faqSeeds) ? parsed.draft.faqSeeds.map((x: unknown) => clean(x, 260)).filter(Boolean).slice(0, 3) : fallback.draft.faqSeeds,
        },
        successMetrics: Array.isArray(parsed?.successMetrics) ? parsed.successMetrics.map((x: unknown) => clean(x, 180)).filter(Boolean).slice(0, 5) : fallback.successMetrics,
        approvalRequired: true,
        publicationStatus: 'draft-only',
        website,
      };
      return NextResponse.json({ ok: true, package: pkg }, { headers: NO_STORE });
    } catch (error) {
      console.error('AI visibility fix generation failed; using fallback.', error);
      return NextResponse.json({ ok: true, package: fallback }, { headers: NO_STORE });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not prepare the fix package.' }, { status: 500, headers: NO_STORE });
  }
}
