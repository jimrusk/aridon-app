import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../../../lib/systemPrompt';

const ALLOWED_EXECUTIVES = new Set([
  'Heather',
  'Ethos',
  'Atlas',
  'Val',
  'Eva',
  'Scout',
  'Ledger',
  'Oracle',
]);

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function cleanMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) {
    return null;
  }

  let totalCharacters = 0;
  const messages: ChatMessage[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') return null;

    const role = 'role' in item ? item.role : undefined;
    const content = 'content' in item ? item.content : undefined;

    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      return null;
    }

    const cleaned = content.trim();
    if (!cleaned || cleaned.length > 8_000) return null;

    totalCharacters += cleaned.length;
    if (totalCharacters > 40_000) return null;

    messages.push({ role, content: cleaned });
  }

  return messages;
}

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { reply: 'Please send a valid JSON request.' },
        { status: 415, headers: NO_STORE_HEADERS },
      );
    }

    const body = await req.json();
    const messages = cleanMessages(body?.messages);
    const executive =
      typeof body?.executive === 'string' && ALLOWED_EXECUTIVES.has(body.executive)
        ? body.executive
        : 'Heather';

    if (!messages) {
      return NextResponse.json(
        { reply: 'The message was empty or too large.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          reply:
            'Heather is running in demo mode. Add OPENAI_API_KEY in Vercel Environment Variables to activate live AI responses.',
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(executive) },
        ...messages,
      ],
      temperature: 0.6,
      max_tokens: 900,
    });

    return NextResponse.json(
      {
        reply:
          completion.choices[0]?.message?.content ||
          'I am online, but I did not receive a clear response.',
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Aridon chat route error', error);
    return NextResponse.json(
      { reply: 'Heather hit a temporary error. Please try again.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
