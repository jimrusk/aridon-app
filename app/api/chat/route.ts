import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '../../../lib/systemPrompt';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_EXECUTIVES = new Set([
  'Heather',
  'Nova',
  'Ethos',
  'Atlas',
  'Eva',
  'Scout',
  'Ledger',
  'Oracle',
]);

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: { message?: string };
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

function extractText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text as string)
    .join('\n\n')
    .trim();
}

function buildConversation(messages: ChatMessage[]) {
  return messages
    .map((message) => `${message.role === 'user' ? 'USER' : 'ASSISTANT'}: ${message.content}`)
    .join('\n\n');
}

export async function POST(req: NextRequest) {
  let executive = 'Heather';

  try {
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { reply: 'Please send a valid JSON request.' },
        { status: 415, headers: NO_STORE_HEADERS },
      );
    }

    const body = await req.json();
    const messages = cleanMessages(body?.messages);
    executive =
      typeof body?.executive === 'string' && ALLOWED_EXECUTIVES.has(body.executive)
        ? body.executive
        : 'Heather';

    if (!messages) {
      return NextResponse.json(
        { reply: 'The message was empty or too large.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          reply:
            `${executive} is running in demo mode. Add OPENAI_API_KEY in Vercel Environment Variables to activate live AI and web research.`,
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    const model =
      process.env.ARIDON_CHAT_MODEL?.trim() ||
      process.env.ARIDON_ADVISOR_MODEL?.trim() ||
      'gpt-5-mini';

    const webInstructions = `\n\nLIVE WEB RESEARCH:\n- You have access to live web search. Never say you cannot browse or inspect public websites when the web tool can answer the request.\n- When the user provides a URL, company name, asks about a business, competitor, current person, funding program, news item, market, regulation, or other time-sensitive public information, use web search before answering.\n- For a business website, inspect the supplied site and relevant current public sources. Explain what the business does, products/services, target customers, leadership when verifiable, locations/markets, strengths, weaknesses, recent developments, likely decision-makers, and how Aridon could sell to, partner with, or otherwise work with that organization.\n- Clearly distinguish verified facts from reasonable inference. Do not invent executives, contact details, customers, revenue, or partnerships.\n- When useful, finish business research with a short section titled \"What Jim should do next\" containing concrete outreach or partnership actions.\n- Prefer primary sources and current sources for claims that may have changed. Include readable source URLs or source names in the answer when the web results support them.`;

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: `${buildSystemPrompt(executive)}${webInstructions}`,
        tools: [
          {
            type: 'web_search',
            search_context_size: 'medium',
          },
        ],
        input: buildConversation(messages),
        max_output_tokens: 1_800,
      }),
      cache: 'no-store',
    });

    const data = (await response.json()) as ResponsesPayload;
    if (!response.ok) {
      throw new Error(data.error?.message || `OpenAI returned ${response.status}.`);
    }

    const reply = extractText(data);

    return NextResponse.json(
      {
        reply: reply || `${executive} is online, but did not receive a clear response.`,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Aridon chat route error', error);
    return NextResponse.json(
      {
        reply: `${executive} hit a temporary error while answering. Please try again.`,
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
