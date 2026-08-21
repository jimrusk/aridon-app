import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function fallback(postText: string) {
  const lower = postText.toLowerCase();
  const signals = ['sales', 'customer', 'customers', 'lead', 'leads', 'estimate', 'follow-up', 'follow up', 'revenue', 'grow', 'growth'];
  const hits = signals.filter((s) => lower.includes(s)).length;
  const fitScore = Math.min(88, 38 + hits * 8);
  return {
    fitScore,
    risk: 'human review',
    reason: 'This looks like a possible business-growth conversation. Confirm the community allows helpful commercial participation before replying.',
    reply: "A good first move is to separate 'need more leads' from 'need better conversion.' Before buying more traffic, look at the last 25 leads or estimates that did not close and check where follow-up stopped. Aridon is built around that kind of revenue-recovery problem. If it helps, I can show you the exact 14-day test we use to find the leak without asking you to rebuild your whole sales process.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const platform = clean(body?.platform, 40) || 'Other';
    const postText = clean(body?.postText, 7000);
    const postUrl = clean(body?.postUrl, 1500);
    if (!postText) return NextResponse.json({ error: 'Post text is required.' }, { status: 400, headers: NO_STORE });

    if (!process.env.OPENAI_API_KEY) return NextResponse.json(fallback(postText), { headers: NO_STORE });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      max_tokens: 650,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are Scout, Aridon's business-development analyst. Evaluate public posts for whether a helpful reply from Aridon Business OS is genuinely relevant. Return JSON with: fitScore number 0-100, reason string, risk string, reply string. The reply must answer the person's problem first, be concise and human, disclose Aridon naturally only if relevant, never invent customer results, never claim guaranteed revenue, never use pressure tactics, and never encourage violating community self-promotion rules. If fit is weak, say so and make the reply non-promotional.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            platform,
            postUrl,
            postText,
            aridonOffer: 'Aridon Business OS helps small businesses with revenue recovery, stale-estimate follow-up, lead conversion, business analysis, AI executive support, website/search visibility and controlled execution. A preferred proof offer is a 14-day test using a real stale-estimate or missed-follow-up list, with consequential actions kept under owner approval.',
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const fitScore = Math.max(0, Math.min(100, Number(parsed.fitScore) || 0));
    return NextResponse.json({
      fitScore,
      reason: clean(parsed.reason, 1200),
      risk: clean(parsed.risk, 300),
      reply: clean(parsed.reply, 3500),
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Outreach radar draft error', error);
    return NextResponse.json({ error: 'Unable to score this post right now.' }, { status: 500, headers: NO_STORE });
  }
}
