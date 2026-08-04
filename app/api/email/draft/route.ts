import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const EXECUTIVES = new Set(['Heather', 'Ethos', 'Atlas', 'Eva', 'Scout', 'Ledger', 'Oracle']);

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function fallbackDraft(input: {
  name: string;
  company: string;
  executive: string;
  projectName: string;
  objective: string;
  notes: string;
}) {
  const firstName = input.name.split(/\s+/)[0] || input.name;
  const project = input.projectName || 'Aridon water and power resilience work';
  const objective = input.objective || 'see whether a short working conversation makes sense';
  const context = input.notes
    ? `I wanted to follow up on our earlier outreach regarding ${input.notes.replace(/\s+/g, ' ').slice(0, 260)}.`
    : `I wanted to follow up regarding ${project}.`;

  return {
    subject: `Following up: ${project}`.slice(0, 180),
    body: [
      `Hi ${firstName},`,
      '',
      context,
      '',
      `Aridon is developing practical, monitored water and resilient-power projects for drought-stressed communities and operations across the Southwest. Our preferred next step is a focused, paid feasibility phase that defines the site, performance requirements, partners, schedule, and funding path before deployment claims are made.`,
      '',
      `I would appreciate the opportunity to ${objective}. Would a brief call next week be practical?`,
      '',
      'Best,',
      'Jim Rusk',
      'Founder, Aridon',
    ].join('\n'),
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json.' },
        { status: 415, headers: NO_STORE_HEADERS },
      );
    }

    const body = await request.json();
    const input = {
      name: text(body?.name, 120),
      company: text(body?.company, 160),
      email: text(body?.email, 254),
      notes: text(body?.notes, 4_000),
      projectName: text(body?.projectName, 200),
      objective: text(body?.objective, 1_000),
      executive: EXECUTIVES.has(body?.executive) ? body.executive : 'Heather',
    };

    if (!input.name || !input.email || !/^\S+@\S+\.\S+$/.test(input.email)) {
      return NextResponse.json(
        { error: 'Choose a contact with a valid email address.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const fallback = fallbackDraft(input);
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ...fallback, draftedBy: input.executive, mode: 'template' },
        { headers: NO_STORE_HEADERS },
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.45,
      max_tokens: 850,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You draft concise, credible business follow-up emails for Jim Rusk, founder of Aridon. The internal executive author is ${input.executive}, but the email is always sent and signed by Jim Rusk. Never imply the AI executive is a human sender. Avoid hype, pressure tactics, invented claims, guaranteed output, and unverified funding promises. Lead with a practical next step. Return JSON with exactly two string fields: subject and body. The body must end with: Best,\\nJim Rusk\\nFounder, Aridon.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            recipient: input.name,
            company: input.company,
            priorNotes: input.notes,
            project: input.projectName,
            objective: input.objective,
            AridonPositioning:
              'New Mexico infrastructure company developing monitored atmospheric-water and resilient-power projects for drought-stressed Southwestern communities and operations. Preferred commercial entry is a paid feasibility or site-qualification phase.',
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || '';
    let generated = fallback;
    try {
      const parsed = JSON.parse(content) as { subject?: unknown; body?: unknown };
      const subject = text(parsed.subject, 300);
      const generatedBody = text(parsed.body, 50_000);
      if (subject && generatedBody) generated = { subject, body: generatedBody };
    } catch {
      console.error('Aridon email draft JSON parse failed; using template');
    }

    return NextResponse.json(
      { ...generated, draftedBy: input.executive, mode: 'ai' },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Aridon email draft error', error);
    return NextResponse.json(
      { error: 'Unable to generate the follow-up draft.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
