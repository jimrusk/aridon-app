import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const BRAND_TITLE = 'Aridon Brand Brain';

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

function extractOutputText(data: any) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data?.output || [])
    .flatMap((item: any) => item.content || [])
    .filter((item: any) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item: any) => item.text)
    .join('\n')
    .trim();
}

function fallbackPlan(input: { topic: string; audience: string; offer: string; cta: string; duration: number }) {
  const sceneSeconds = Math.max(2, Math.floor(input.duration / 5));
  return {
    title: input.topic || 'Business growth video',
    hook: `Still trying to solve ${input.topic || 'this business problem'} the hard way?`,
    caption: `${input.topic || 'A practical business idea'} in under ${input.duration} seconds.`,
    hashtags: ['#smallbusiness', '#businessgrowth', '#Aridon'],
    scenes: [
      { headline: 'The problem', body: input.topic || 'A real business problem is costing time and revenue.', seconds: sceneSeconds },
      { headline: 'Start here', body: 'Define the customer, the bottleneck, and the next action before adding more tools.', seconds: sceneSeconds },
      { headline: 'Make it measurable', body: 'Track leads, follow-up, conversion, and what actually creates revenue.', seconds: sceneSeconds },
      { headline: 'Automate carefully', body: 'Use AI for research, drafting, prioritization, and repetitive work while keeping important actions under human approval.', seconds: sceneSeconds },
      { headline: input.offer || 'Aridon Business OS', body: input.cta || 'See how Aridon can help your business move from ideas to execution.', seconds: sceneSeconds },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const topic = text(body?.topic, 1200);
    const audience = text(body?.audience, 1200);
    const offer = text(body?.offer, 1200);
    const cta = text(body?.cta, 500);
    const tone = text(body?.tone, 120) || 'credible, practical, clear';
    const duration = Math.min(45, Math.max(10, Number(body?.duration) || 20));

    if (!slug || !topic) return NextResponse.json({ error: 'Workspace and video topic are required.' }, { status: 400, headers: NO_STORE });

    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const tenant = resolved.membership.tenant;
    const { data: brandRow } = await resolved.auth.db
      .from('customer_knowledge')
      .select('content')
      .eq('tenant_id', tenant.id)
      .eq('title', BRAND_TITLE)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const fallback = fallbackPlan({ topic, audience, offer, cta, duration });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ...fallback, mode: 'template' }, { headers: NO_STORE });

    const schema = {
      type: 'object', additionalProperties: false,
      required: ['title', 'hook', 'caption', 'hashtags', 'scenes'],
      properties: {
        title: { type: 'string' },
        hook: { type: 'string' },
        caption: { type: 'string' },
        hashtags: { type: 'array', minItems: 2, maxItems: 8, items: { type: 'string' } },
        scenes: {
          type: 'array', minItems: 4, maxItems: 7,
          items: {
            type: 'object', additionalProperties: false,
            required: ['headline', 'body', 'seconds'],
            properties: {
              headline: { type: 'string' },
              body: { type: 'string' },
              seconds: { type: 'number' },
            },
          },
        },
      },
    };

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_CREATOR_MODEL || 'gpt-4o-mini',
        input: [
          { role: 'system', content: [{ type: 'input_text', text: 'You are Aridon Video Studio. Build concise short-form business videos for small and mid-sized companies. Write for spoken/social pacing even though the first renderer is text-led. Do not invent customer results, guarantees, testimonials, prices, certifications, or performance claims. Make every scene useful on its own. Keep headlines short and bodies under 22 words. Total scene seconds should approximately match the requested duration.' }] },
          { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ business: tenant.business_name, brand: brandRow?.content || '', topic, audience, offer, cta, tone, duration }) }] },
        ],
        text: { format: { type: 'json_schema', name: 'video_plan', strict: true, schema } },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Video Studio OpenAI error', data);
      return NextResponse.json({ ...fallback, mode: 'template' }, { headers: NO_STORE });
    }

    const raw = extractOutputText(data);
    const parsed = JSON.parse(raw || '{}');
    return NextResponse.json({ ...parsed, mode: 'ai' }, { headers: NO_STORE });
  } catch (error) {
    console.error('Video Studio error', error);
    return NextResponse.json({ error: 'Unable to build the video plan.' }, { status: 500, headers: NO_STORE });
  }
}
