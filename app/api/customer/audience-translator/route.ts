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

const COMMON_JARGON = [
  'ecosystem', 'synergy', 'leverage', 'utilize', 'best-in-class', 'world-class', 'cutting-edge',
  'next-generation', 'revolutionary', 'transformative', 'holistic', 'seamless', 'robust', 'scalable',
  'integrated solution', 'operational intelligence', 'value proposition', 'paradigm', 'stakeholder',
  'actionable insights', 'optimize', 'streamline', 'enablement', 'end-to-end', 'AI-powered',
];

type Channel = 'email' | 'linkedin' | 'dm' | 'sms' | 'proposal' | 'report' | 'website' | 'other';

type Variant = {
  label: string;
  subject: string;
  text: string;
  rationale: string;
};

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
    readability: number;
    simplicity: number;
    singleMessage: number;
  };
  senderTrust: {
    score: number;
    status: 'strong' | 'warning' | 'unknown';
    message: string;
  };
  readingLevel: {
    grade: number;
    target: string;
    status: 'on-target' | 'high' | 'low' | 'unknown';
  };
  audienceRead: string;
  messageFocus: string;
  hook: string;
  subject: string;
  translated: string;
  variants: Variant[];
  jargonRemoved: string[];
  warnings: string[];
  whyItWorks: string[];
  testPlan: string;
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

function countSyllables(word: string) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length <= 3) return cleaned ? 1 : 0;
  const stripped = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, '').replace(/^y/, '');
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length || 1);
}

function estimatedReadingGrade(value: string) {
  const words = value.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  if (!words.length) return 0;
  const sentences = Math.max(1, (value.match(/[.!?]+/g) || []).length);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const grade = 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
  return Math.max(1, Math.min(18, Math.round(grade * 10) / 10));
}

function detectedJargon(value: string) {
  const lower = value.toLowerCase();
  return COMMON_JARGON.filter((term) => lower.includes(term.toLowerCase())).slice(0, 8);
}

function readingStatus(grade: number): TranslatorResult['readingLevel']['status'] {
  if (!grade) return 'unknown';
  if (grade > 7.5) return 'high';
  if (grade < 4.5) return 'low';
  return 'on-target';
}

function fallbackResult(draft: string, trust: ReturnType<typeof senderTrust>): TranslatorResult {
  const trimmed = draft.replace(/\n{3,}/g, '\n\n').trim();
  const grade = estimatedReadingGrade(trimmed);
  const jargon = detectedJargon(trimmed);
  const readability = grade <= 7.5 ? 82 : grade <= 10 ? 68 : 55;
  const simplicity = Math.max(45, 90 - jargon.length * 5);
  const scores = {
    clarity: 72,
    trust: trust.score,
    relevance: 70,
    humanTone: 68,
    formatting: 72,
    cta: 65,
    readability,
    simplicity,
    singleMessage: 68,
  };
  const average = Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length);
  return {
    overallScore: trust.score < 50 ? Math.min(69, average) : average,
    sendGate: trust.score < 50 || average < 80 ? 'review' : 'pass',
    scores,
    senderTrust: trust,
    readingLevel: { grade, target: 'Grade 5-7 for most customer-facing copy', status: readingStatus(grade) },
    audienceRead: 'Aridon could not run the full AI translation, so this result uses structural clarity, reading-level and sender-trust checks only.',
    messageFocus: '',
    hook: '',
    subject: '',
    translated: trimmed,
    variants: [],
    jargonRemoved: jargon,
    warnings: [
      ...(trust.status === 'warning' ? [trust.message] : []),
      ...(grade > 7.5 ? [`Reading level is approximately grade ${grade}. Simplify toward grade 5-7 for broad customer communication.`] : []),
    ].slice(0, 5),
    whyItWorks: ['Keeps the original facts intact.', 'Checks reading level and sender identity before anything leaves the workspace.'],
    testPlan: 'AI variants are unavailable until the configured model is available.',
    nextMove: 'Review the draft, reading level and sender identity before sending.',
  };
}

function parseVariants(value: unknown, channel: Channel): Variant[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      label: text(record.label, 60) || (index === 0 ? 'A · Direct' : 'B · Human'),
      subject: channel === 'email' ? text(record.subject, 180) : '',
      text: text(record.text, 10000),
      rationale: text(record.rationale, 500),
    };
  }).filter((item) => item.text).slice(0, 2);
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
    const audienceMode = text(body?.audienceMode, 120) || 'general customer';
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
      temperature: 0.35,
      response_format: { type: 'json_object' },
      max_tokens: 3600,
      messages: [
        {
          role: 'system',
          content: `You are Aridon Clarity + Conversion Engine, the trust-and-conversion layer between deep business intelligence and anything a customer sends externally.

Your job is not to show off the analysis. Your job is to make the recipient understand, trust, care, remember the main point, and know what to do next.

NON-NEGOTIABLE RULES:
- Preserve only facts supported by the supplied draft or company context. Never invent numbers, clients, outcomes, relationships, credentials, guarantees, research, urgency, scarcity, or endorsements.
- Write to the named audience, audience mode, relationship stage, channel, and desired outcome.
- Translate internal analysis into recipient value. Do not dump diagnostic detail unless the audience genuinely needs it.
- Prefer plain, human, specific language. Remove bloated framing, robotic transitions, excessive headings, hype, consultant-speak and unnecessary acronyms.
- For broad customer-facing communication, target approximately U.S. grade 5-7 readability. Technical, legal, engineering, lender, investor or government audiences may require higher reading levels when precision would otherwise be lost. Never dumb down required technical terms.
- Use common words when they preserve meaning: use instead of utilize, help instead of enablement, plan instead of strategic framework, connected system instead of ecosystem when accurate.
- Apply the one-message rule: identify one primary promise or point. Supporting details must reinforce it, not compete with it.
- Lead with why this matters to the recipient.
- Use one primary call to action. Make the next step easy to answer.
- For cold or early outreach, earn the conversation before asking for a large commitment.
- For email, default to roughly 80-180 words unless more detail is clearly necessary. For LinkedIn/DM, default to 45-110 words. SMS should be brief. Proposals/reports can be longer but must scan cleanly.
- Generate a short Double-Take Hook: familiar enough to understand instantly, unexpected enough to earn attention, but never clickbait or misleading.
- Produce two genuinely different A/B variants when practical: A should be direct/benefit-first; B should be warmer, curiosity-led or story-led. Do not merely swap a few words.
- Never expose internal scoring or diagnostic commentary inside the translated message.
- A free-mail sender or sender/domain mismatch is a trust warning, not proof of fraud. Do not invent DNS/authentication status.
- External sending remains human-approved.

Return ONLY valid JSON with:
overallScore (0-100), sendGate (pass|review|block),
scores {clarity,trust,relevance,humanTone,formatting,cta,readability,simplicity,singleMessage},
readingLevel {grade,target,status}, audienceRead, messageFocus, hook, subject, translated,
variants [{label,subject,text,rationale}] with max 2,
jargonRemoved (max 8), warnings (max 5), whyItWorks (max 4), testPlan, nextMove.

Scoring meaning: 90-100 exceptionally clear/trustworthy, 80-89 strong, 70-79 usable but improve, 60-69 weak, below 60 do not send without revision. Use block only for severe ambiguity, unsupported claims, or a message likely to damage trust.`,
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
            communication: { channel, audience, audienceMode, goal, relationship, senderEmail, companyWebsite, draft },
            senderTrustCheck: trust,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw) as Record<string, any>;
    const modelScores = parsed.scores || {};
    const translated = text(parsed.translated, 10000) || draft;
    const calculatedGrade = estimatedReadingGrade(translated);
    const reportedGrade = Number(parsed?.readingLevel?.grade);
    const grade = Number.isFinite(reportedGrade) ? Math.max(1, Math.min(18, Math.round(reportedGrade * 10) / 10)) : calculatedGrade;
    const scores = {
      clarity: numberScore(modelScores.clarity),
      trust: Math.min(numberScore(modelScores.trust), trust.status === 'warning' ? 72 : 100),
      relevance: numberScore(modelScores.relevance),
      humanTone: numberScore(modelScores.humanTone),
      formatting: numberScore(modelScores.formatting),
      cta: numberScore(modelScores.cta),
      readability: numberScore(modelScores.readability, grade <= 7.5 ? 85 : 68),
      simplicity: numberScore(modelScores.simplicity),
      singleMessage: numberScore(modelScores.singleMessage),
    };
    const average = Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length);
    const overallScore = Math.min(numberScore(parsed.overallScore, average), trust.score < 50 ? 79 : 100);
    const warnings = stringArray(parsed.warnings, 5, 500);
    if (trust.status === 'warning' && !warnings.some((warning) => warning.toLowerCase().includes('sender'))) warnings.unshift(trust.message);
    if (grade > 8.5 && audienceMode !== 'technical / engineering' && !warnings.some((warning) => warning.toLowerCase().includes('reading'))) {
      warnings.push(`Reading level is approximately grade ${grade}. Consider simplifying toward grade 5-7 for broad customer communication.`);
    }

    let sendGate: TranslatorResult['sendGate'] = parsed.sendGate === 'block' ? 'block' : parsed.sendGate === 'review' ? 'review' : 'pass';
    if (trust.score < 50 && sendGate === 'pass') sendGate = 'review';
    if (overallScore < 60) sendGate = 'block';
    else if (overallScore < 80 && sendGate === 'pass') sendGate = 'review';

    const modelJargon = stringArray(parsed.jargonRemoved, 8, 120);
    const jargonRemoved = Array.from(new Set([...modelJargon, ...detectedJargon(draft)])).slice(0, 8);

    const result: TranslatorResult = {
      overallScore,
      sendGate,
      scores,
      senderTrust: trust,
      readingLevel: {
        grade,
        target: text(parsed?.readingLevel?.target, 160) || 'Grade 5-7 for most customer-facing copy',
        status: readingStatus(grade),
      },
      audienceRead: text(parsed.audienceRead, 900) || 'The recipient should immediately understand why this matters and what you are asking them to do next.',
      messageFocus: text(parsed.messageFocus, 500),
      hook: text(parsed.hook, 300),
      subject: channel === 'email' ? text(parsed.subject, 180) : '',
      translated,
      variants: parseVariants(parsed.variants, channel),
      jargonRemoved,
      warnings: warnings.slice(0, 5),
      whyItWorks: stringArray(parsed.whyItWorks, 4, 500),
      testPlan: text(parsed.testPlan, 700) || 'Test the direct version against the alternate version using one conversion goal and keep the winner.',
      nextMove: text(parsed.nextMove, 700) || 'Review the translated version, then send only after owner approval.',
    };

    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error('Audience Translator error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Audience Translator is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}
