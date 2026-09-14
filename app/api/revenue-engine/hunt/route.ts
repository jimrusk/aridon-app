import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };
const HUNTERS = ['buyer', 'partner', 'investor', 'grant', 'acquisition', 'seo'] as const;
type HunterType = (typeof HUNTERS)[number];

const hunterNames: Record<HunterType, string> = {
  buyer: 'Buyer Hunter',
  partner: 'Partner Hunter',
  investor: 'Investor Hunter',
  grant: 'Grant Hunter',
  acquisition: 'Acquisition Hunter',
  seo: 'SEO Publisher',
};

function validPublicUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) return null;
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function readPublicPage(rawUrl: string) {
  const url = validPublicUrl(rawUrl);
  if (!url) return { text: '', sourceUrl: '', sourceStatus: 'No readable public URL supplied.' };

  try {
    const response = await fetch(url.toString(), {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AridonRevenueEngine/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return { text: '', sourceUrl: url.toString(), sourceStatus: `Source returned HTTP ${response.status}.` };
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('text/plain')) return { text: '', sourceUrl: url.toString(), sourceStatus: 'Source was not readable text.' };
    const html = (await response.text()).slice(0, 700000);
    return { text: stripHtml(html).slice(0, 22000), sourceUrl: url.toString(), sourceStatus: 'Public source loaded.' };
  } catch {
    return { text: '', sourceUrl: url.toString(), sourceStatus: 'Public source could not be loaded.' };
  }
}

function fallback(type: HunterType, target: string, signal: string, sourceUrl: string, sourceStatus: string) {
  const safeTarget = target || 'Target organization';
  const score = signal || sourceUrl ? 68 : 45;
  return {
    hunter: hunterNames[type],
    target: safeTarget,
    score,
    grade: score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D',
    fit: type === 'seo' ? 'Content opportunity needs live AI analysis.' : `${safeTarget} needs a stronger evidence pass before outreach.`,
    buying_signal: signal || 'No explicit buying signal supplied.',
    why_now: 'Validate the signal and decision-maker before spending outreach effort.',
    likely_decision_maker: 'Research required',
    recommended_offer: 'Lead with one measurable pilot or discovery conversation.',
    next_action: 'Verify the source, identify the decision-maker, then prepare a tailored first-touch message.',
    risks: ['Insufficient public evidence', 'Decision-maker not yet verified'],
    outreach_subject: `Aridon + ${safeTarget}`,
    outreach_body: `Hello,\n\nWe identified a potential fit between ${safeTarget} and Aridon. Rather than make assumptions, we would like to compare priorities and see whether a small measurable pilot makes sense.\n\nBest,\nEva\nAridon`,
    seo_angles: type === 'seo' ? ['Answer a high-intent buyer question', 'Publish a proof-led industry brief', 'Create a comparison page tied to a real buyer problem'] : [],
    evidence: [signal].filter(Boolean),
    source_url: sourceUrl,
    source_status: sourceStatus,
    mode: 'fallback',
  };
}

function systemPrompt(type: HunterType) {
  const common = `You are Aridon's Revenue Engine. Analyze only the supplied target, signal and public-source text. Do not invent contacts, financials, budgets, partnerships, grants, buyer intent or claims. Separate evidence from inference. Give a 0-100 opportunity score. Return concise JSON only. The user's company is Aridon, an AI business operating system with work in agriculture, water resilience, energy, cybersecurity/Sentinel, acquisitions and a Southwest technology campus.`;
  const instructions: Record<HunterType, string> = {
    buyer: 'Find whether this organization appears to have a problem Aridon could solve, what the strongest buying signal is, the likely role/title of the decision-maker, the smallest credible paid or pilot offer, and a short first-touch email.',
    partner: 'Evaluate strategic partnership fit, what each side contributes, the best low-friction pilot, likely partnership owner/title, risks, and a short first-touch email.',
    investor: 'Evaluate strategic/investment fit for Aridon or its campus. Do not imply willingness to invest without evidence. Identify mandate fit, likely investment role/title, strongest proof needed, risks, and a short first-touch email.',
    grant: 'Evaluate whether the source appears relevant to an Aridon funding opportunity. Never claim eligibility without evidence. Identify program fit, likely applicant angle, missing eligibility facts, deadline if explicitly present, next action, and a concise inquiry email if useful.',
    acquisition: 'Evaluate a business acquisition target using only supplied facts. Flag valuation, earnings, owner dependence, recurring revenue, transferability, concentration, regulatory or diligence questions where supported. Do not invent price or financials. Provide the next diligence request and broker/seller outreach.',
    seo: 'Act as an AI-search and SEO publisher. From the target topic and source evidence, produce useful buyer questions, 3 article/page angles, a recommended title, search intent, proof points needed, CTA, and a short publishing brief. Avoid keyword stuffing and unsupported claims.',
  };
  return `${common}\n${instructions[type]}\nReturn fields: hunter, target, score, grade, fit, buying_signal, why_now, likely_decision_maker, recommended_offer, next_action, risks (array), outreach_subject, outreach_body, seo_angles (array), evidence (array).`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = HUNTERS.includes(body?.type) ? (body.type as HunterType) : 'buyer';
    const target = typeof body?.target === 'string' ? body.target.trim().slice(0, 240) : '';
    const signal = typeof body?.signal === 'string' ? body.signal.trim().slice(0, 7000) : '';
    const rawUrl = typeof body?.sourceUrl === 'string' ? body.sourceUrl.trim().slice(0, 1600) : '';

    if (!target && !signal && !rawUrl) {
      return NextResponse.json({ error: 'Add a target, public URL, or market signal.' }, { status: 400, headers: NO_STORE });
    }

    const source = rawUrl ? await readPublicPage(rawUrl) : { text: '', sourceUrl: '', sourceStatus: 'No public URL supplied.' };
    const basic = fallback(type, target, signal, source.sourceUrl, source.sourceStatus);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(basic, { headers: NO_STORE });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.15,
      max_tokens: 1600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt(type) },
        {
          role: 'user',
          content: JSON.stringify({
            hunter: hunterNames[type],
            target,
            signal,
            source_url: source.sourceUrl,
            source_status: source.sourceStatus,
            source_text: source.text,
          }),
        },
      ],
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch {
      parsed = {};
    }

    const score = Math.max(0, Math.min(100, Number(parsed.score) || basic.score));
    const result = {
      ...basic,
      ...parsed,
      hunter: hunterNames[type],
      target: parsed.target || target || basic.target,
      score,
      grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D',
      source_url: source.sourceUrl,
      source_status: source.sourceStatus,
      mode: 'ai',
    };

    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error('Revenue Engine hunt error', error);
    return NextResponse.json({ error: 'Revenue Engine could not complete this hunt.' }, { status: 500, headers: NO_STORE });
  }
}
