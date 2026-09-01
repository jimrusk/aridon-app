import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const EXECUTIVES = new Set([
  'Heather',
  'Nova',
  'Scout',
  'Atlas',
  'Oracle',
  'Ethos',
  'Ledger',
  'Sierra Bennett',
  'Maya Torres',
  'Claire Morgan',
  'Eva',
]);

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function extractEmail(value: string) {
  const angle = value.match(/<([^>]+@[^>]+)>/);
  if (angle?.[1]) return angle[1].trim();
  const plain = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return plain?.[0] || '';
}

function fallbackReply(input: {
  from: string;
  subject: string;
  body: string;
  objective: string;
}) {
  const recipient = input.from.replace(/<[^>]+>/g, '').replace(/["']/g, '').trim().split(/\s+/)[0] || 'there';
  const objective = input.objective || 'respond clearly, answer the important point, and move the conversation to the next practical step';
  return {
    to: extractEmail(input.from),
    subject: input.subject.toLowerCase().startsWith('re:') ? input.subject : `Re: ${input.subject}`,
    body: [
      `Hi ${recipient},`,
      '',
      'Thank you for the note. I appreciate you getting back to me.',
      '',
      `I want to ${objective}.`,
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
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE_HEADERS });
    }

    const body = await request.json();
    const input = {
      from: text(body?.from, 500),
      subject: text(body?.subject, 500),
      message: text(body?.message, 50_000),
      objective: text(body?.objective, 2_000),
      executive: EXECUTIVES.has(body?.executive) ? body.executive : 'Eva',
    };

    const fallback = fallbackReply({ from: input.from, subject: input.subject || '(No subject)', body: input.message, objective: input.objective });
    if (!fallback.to) {
      return NextResponse.json({ error: 'The sender email address could not be identified.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ...fallback, draftedBy: input.executive, mode: 'template' }, { headers: NO_STORE_HEADERS });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are ${input.executive}, one of Aridon's internal AI executives. Draft a concise business email reply for Jim Rusk to review and send. You are not the human sender and must never pretend to be. Preserve commitments already made, do not invent facts, dates, pricing, authority, partnerships, approvals, or attachments. If the incoming message asks a question that cannot be answered from the provided text, acknowledge it and propose the smallest useful next step instead of guessing. Return JSON with exactly: to, subject, body. The body must end with Best,\\nJim Rusk\\nFounder, Aridon.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            incomingFrom: input.from,
            incomingSubject: input.subject,
            incomingMessage: input.message,
            replyObjective: input.objective || 'answer the important point and move the conversation to a practical next step',
          }),
        },
      ],
    });

    let result = fallback;
    try {
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}') as { to?: unknown; subject?: unknown; body?: unknown };
      const to = text(parsed.to, 254) || fallback.to;
      const subject = text(parsed.subject, 500) || fallback.subject;
      const replyBody = text(parsed.body, 50_000) || fallback.body;
      if (/^\S+@\S+\.\S+$/.test(to)) result = { to, subject, body: replyBody };
    } catch {
      console.error('Aridon reply draft JSON parse failed; using template');
    }

    return NextResponse.json({ ...result, draftedBy: input.executive, mode: 'ai' }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon executive reply draft error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to draft the reply.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
