import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const FREE_MAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
  'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'mail.com',
]);

type Channel = 'email' | 'linkedin' | 'dm' | 'sms' | 'proposal' | 'report' | 'website' | 'other';

type TranslatorResult = {
  overallScore: number;
  sendGate: 'pass' | 'review' | 'block';
  scores: {
    clarity: number;
    trust: number;
    relevance: number;
    humanTone: number;
    formatting: number;
    cta: number;
  };
  senderTrust: {
    score: number;
    status: 'strong' | 'warning' | 'unknown';
    message: string;
  };
  audienceRead: string;
  subject: string;
  translated: string;
  warnings: string[];
  whyItWorks: string[];
  nextMove: string;
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function numberScore(value: unknown, fallback = 70) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : fallback;
}

function stringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function senderTrust(senderEmail: string, companyWebsite: string) {
  const senderDomain = senderEmail.includes('@') ? senderEmail.split('@').pop()?.toLowerCase() || '' : '';
  let websiteDomain = '';
  try {
    websiteDomain = companyWebsite ? new URL(companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`).hostname.replace(/^www\./, '').toLowerCase() : '';
  } catch {
    websiteDomain = '';
  }

  if (!senderDomain) return { score: 55, status: 'unknown' as const, message: 'Add the sender email so Aridon can check trust alignment before outreach.' };
  if (FREE_MAIL_DOMAINS.has(senderDomain)) {
    return { score: 30, status: 'warning' as const, message: `This is a personal/free-mail address (${senderDomain}). For business outreach, use an authenticated company-domain mailbox.` };
  }
  if (websiteDomain && senderDomain !== websiteDomain && !senderDomain.endsWith(`.${websiteDomain}`)) {
    return { score: 65, status: 'warning' as const, message: `The sender domain (${senderDomain}) does not match the company website domain (${websiteDomain}). Confirm the relationship is intentional.` };
  }
  return { score: 95, status: 'strong' as const, message: `Sender identity is aligned to a business domain (${senderDomain}).` };
}

function fallbackResult(draft: string, trust: ReturnType<typeof senderTrust>): TranslatorResult {
  const trimmed = draft.replace(/\n{3,}/g, '\n\n').trim();
  return {
    overallScore: trust.score < 50 ? 58 : 72,
    sendGate: trust.score < 50 ? 'review' : 'pass',
    scores: { clarity: 72, trust: trust.score, relevance: 70, humanTone: 68, formatting: 72, cta: 65 },
    senderTrust: trust,
    audienceRead: 'Aridon could not run the full AI translation, so this is a structural trust check only.',
    subject: '',
    translated: trimmed,
    warnings: trust.status === 'warning' ? [trust.message] : [],
    whyItWorks: ['Keeps the original facts intact.', 'Flags sender-identity risk before anything leaves the workspace.'],
    nextMove: 'Review the draft and sender identity before sending.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const slug = text(body?.slug, 80);
    const draft = text(body?.draft, 18000);
    const audience = text(body?.audience, 800);
    const goal = text(body?.goal, 800);
    const relationship = text(body?.relationship, 400);
    const senderEmail = text(body?.senderEmail, 320);
    const companyWebsite = text(body?.companyWebsite, 1000);
    const channelRaw = text(body?.channel, 40).toLowerCase();
    const allowedChannels = new Set<Channel>(['email', 'linkedin', 'dm', 'sms', 'proposal', 'report', 'website', 'other']);
    const channel = (allowedChannels.has(channelRaw as Channel) ? channelRaw : 'other') as Channel;

    if (!slug || !draft || !audience || !goal) {
      return NextResponse.json({ error: 'Workspace, draft, audience and desired outcome are required.' }, { status: 400, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const { data: knowledge, error: knowledgeError } = await auth.db
      .from('customer_knowledge')
      .select('title,category,content')
      .eq('tenant_id', membership.tenant.id)
      .order('created_at', { ascending: false })
      .limit(16);
    if (knowledgeError) throw knowledgeError;

    const brandContext = (knowledge || []).map((item) => ({
      title: text(item.title, 180),
      category: text(item.category, 120),
      content: text(item.content, 2600),
    })).filter((item) => item.content).slice(0, 12);

    const trust = senderTrust(senderEmail, companyWebsite);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json(fallbackResult(draft, trust), { headers: NO_STORE });

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.AUDIENCE_TRANSLATOR_MODEL?.trim() || 'gpt-4o-mini',
      temperature: 0.25,
      response_format: { type: 'json_object' },
      max_tokens: 2200,
      messages: [
        {
          role: 'system',
          content: `You are Aridon Audience Translator, the trust-and-conversion layer between deep business intelligence and anything a customer sends externally.\n\nYour job is NOT to show off the analysis. Your job is to make the recipient understand, trust, care, and know what to do next.\n\nNON-NEGOTIABLE RULES:\n- Preserve only facts supported by the supplied draft or company context. Never invent numbers, clients, outcomes, relationships, credentials, guarantees, or research.\n- Write to the named audience, relationship stage, channel, and desired outcome.\n- Translate internal analysis into recipient value. Do not dump diagnostic detail unless the audience needs it.\n- Prefer human, specific language over AI/business jargon. Remove bloated framing, robotic transitions, excessive headings, hype, and self-congratulation.\n- Lead with why this matters to the recipient.\n- Use one primary call to action. Make the next step easy to answer.\n- For cold or early outreach, earn the conversation before asking for a large commitment.\n- For email, default to roughly 80-180 words unless more detail is clearly necessary. For LinkedIn/DM, default to 45-110 words. SMS should be brief. Proposals/reports can be longer but must scan cleanly.\n- Never expose internal scoring or diagnostic commentary inside the translated message.\n- A free-mail sender or sender/domain mismatch is a trust warning, not proof of fraud. Do not invent DNS/authentication status.\n- External sending remains human-approved.\n\nReturn ONLY valid JSON with: overallScore (0-100), sendGate (pass|review|block), scores {clarity,trust,relevance,humanTone,formatting,cta}, audienceRead, subject, translated, warnings (max 5), whyItWorks (max 4), nextMove.\n\nScoring meaning: 90-100 exceptionally clear/trustworthy, 80-89 strong, 70-79 usable but improve, 60-69 weak, below 60 do not send without revision. Use block only for severe ambiguity, unsupported claims, or a message likely to damage trust.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            company: {
              businessName: membership.tenant.business_name,
              industry: membership.tenant.industry,
              tagline: membership.tenant.tagline,
              brandContext,
            },
            communication: { channel, audience, goal, relationship, senderEmail, companyWebsite, draft },
            senderTrustCheck: trust,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw) as Record<string, any>;
    const modelScores = parsed.scores || {};
    const scores = {
      clarity: numberScore(modelScores.clarity),
      trust: Math.min(numberScore(modelScores.trust), trust.status === 'warning' ? 72 : 100),
      relevance: numberScore(modelScores.relevance),
      humanTone: numberScore(modelScores.humanTone),
      formatting: numberScore(modelScores.formatting),
      cta: numberScore(modelScores.cta),
    };
    const average = Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / 6);
    const overallScore = Math.min(numberScore(parsed.overallScore, average), trust.score < 50 ? 79 : 100);
    const warnings = stringArray(parsed.warnings, 5, 500);
    if (trust.status === 'warning' && !warnings.some((warning) => warning.toLowerCase().includes('sender'))) warnings.unshift(trust.message);

    let sendGate: TranslatorResult['sendGate'] = parsed.sendGate === 'block' ? 'block' : parsed.sendGate === 'review' ? 'review' : 'pass';
    if (trust.score < 50 && sendGate === 'pass') sendGate = 'review';
    if (overallScore < 60) sendGate = 'block';
    else if (overallScore < 80 && sendGate === 'pass') sendGate = 'review';

    const result: TranslatorResult = {
      overallScore,
      sendGate,
      scores,
      senderTrust: trust,
      audienceRead: text(parsed.audienceRead, 900) || 'The recipient should immediately understand why this matters and what you are asking them to do next.',
      subject: channel === 'email' ? text(parsed.subject, 180) : '',
      translated: text(parsed.translated, 10000) || draft,
      warnings: warnings.slice(0, 5),
      whyItWorks: stringArray(parsed.whyItWorks, 4, 500),
      nextMove: text(parsed.nextMove, 700) || 'Review the translated version, then send only after owner approval.',
    };

    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error('Audience Translator error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Audience Translator is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}
