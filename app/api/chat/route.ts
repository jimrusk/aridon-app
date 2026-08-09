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

    const webInstructions = `\n\nLIVE WEB RESEARCH AND FULL-COMPANY GROWTH AUDIT:\n- You have access to live web search. Never say you cannot browse or inspect public websites when the web tool can answer the request.\n- When the user provides a URL, company name, asks about a business, competitor, current person, funding program, news item, market, regulation, or other time-sensitive public information, use web search before answering.\n- When the user provides a business website or asks you to look at a company, DEFAULT TO A FULL-COMPANY GROWTH AUDIT, not a short executive summary. Treat the website as the front door into researching the whole business.\n- Research the supplied website plus relevant current public sources such as company pages, store/location pages, product pages, reviews when useful, social profiles, marketplace listings, news, industry sources, and competitors.\n- Analyze the business across these dimensions when relevant:\n  1. What the company sells, who it serves, how it appears to make money, and its positioning.\n  2. Website quality, ecommerce, conversion path, calls to action, checkout/booking flow, SEO, local search, content, email capture, loyalty, reviews, social presence, marketplaces, and other online sales channels.\n  3. Physical retail/store presence, merchandising, customer experience, local marketing, store traffic opportunities, events, signage, cross-selling, pickup/delivery, store expansion, pop-ups, kiosks, wholesale, and new-location potential when applicable.\n  4. Product/service mix, pricing architecture, bundles, subscriptions, memberships, upsells, cross-sells, private label, new product opportunities, and recurring revenue possibilities.\n  5. Customer segments, geographic reach, underserved audiences, adjacent markets, B2B opportunities, partnerships, distribution, wholesale, licensing, franchising, or strategic alliances when appropriate.\n  6. Competitive position: what strong competitors do better online, in-store, in product, pricing, customer experience, brand, distribution, and growth.\n  7. Operational constraints visible from public evidence: capacity, fulfillment, staffing, locations, supply chain, technology, reputation, or other issues that could limit expansion. Do not invent nonpublic financials or operational facts.\n  8. Concrete ONLINE expansion opportunities ranked by impact, cost/effort, and speed.\n  9. Concrete IN-STORE / PHYSICAL expansion opportunities ranked by impact, cost/effort, and speed when the business has or could plausibly support a physical presence.\n  10. A practical growth roadmap: immediate quick wins, 30-day actions, 90-day actions, and longer-term expansion bets.\n- The primary goal is to help the TARGET BUSINESS grow as a whole company. Do not turn every analysis into an Aridon sales pitch. Add an Aridon partnership or service angle only when it is genuinely relevant and useful.\n- For recommendations, explain WHY the opportunity fits this company and what evidence supports it. Where numbers are unavailable, use ranges or explicitly labeled estimates only when helpful.\n- Clearly distinguish verified facts from reasonable inference and unknowns. Do not invent executives, contact details, customers, revenue, store counts, partnerships, or financial performance.\n- Prefer primary sources and current sources for claims that may have changed. Include readable source URLs or source names in the answer when web results support them.\n- For a full-company audit, favor a detailed operator-style answer over a brief executive summary. End with a prioritized section titled \"Top Growth Moves\" and list the highest-value actions first.`;

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
        max_output_tokens: 3_000,
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
