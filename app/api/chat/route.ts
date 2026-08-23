import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '../../../lib/systemPrompt';
import { getProviderCatalog, routeModel, type AridonChatMessage } from '../../../lib/modelRouter';

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

function cleanMessages(value: unknown): AridonChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) return null;

  let totalCharacters = 0;
  const messages: AridonChatMessage[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const role = 'role' in item ? item.role : undefined;
    const content = 'content' in item ? item.content : undefined;

    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const cleaned = content.trim();
    if (!cleaned || cleaned.length > 8_000) return null;

    totalCharacters += cleaned.length;
    if (totalCharacters > 40_000) return null;
    messages.push({ role, content: cleaned });
  }

  return messages;
}

const auditInstructions = `\n\nARIDON OPERATING RULES:\n- Preserve the selected executive's role, voice, and company context even when another AI provider is selected behind the scenes.\n- Never make the user choose an AI model unless they explicitly ask to override routing. Aridon owns routing.\n- For a business website, company, competitor, acquisition target, market, regulation, grant, funding program, current public figure, or other time-sensitive public topic, treat current research as required when the selected provider supports it.\n- When a business website is supplied, default to a full-company growth audit rather than a narrow website critique. Cover positioning, revenue model, conversion, ecommerce, SEO/local search, reviews/social, product/service mix, pricing/bundles, recurring revenue, customer segments, physical expansion where relevant, competitors, operational constraints visible from public evidence, partnerships/distribution, and a practical 30/90-day roadmap.\n- Clearly separate verified facts, reasonable inference, and unknowns. Never invent revenue, customers, store counts, executives, contacts, partnerships, or private operational facts.\n- Rank recommendations by likely impact, cost/effort, and speed. End full-company audits with a section titled \"Top Growth Moves\".\n- Do not turn every answer into an Aridon sales pitch. Solve the user's actual problem first.`;

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

    const providers = getProviderCatalog();
    const enabledProviders = providers.filter((provider) => provider.enabled);
    if (!enabledProviders.length) {
      return NextResponse.json(
        {
          reply: `${executive} is running in demo mode. Configure at least one supported AI provider key in Vercel to activate Aridon Smart Routing.`,
          routing: {
            mode: 'demo',
            enabledProviders: [],
          },
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    const result = await routeModel(
      messages,
      `${buildSystemPrompt(executive)}${auditInstructions}`,
    );

    return NextResponse.json(
      {
        reply: result.text || `${executive} is online, but did not receive a clear response.`,
        routing: {
          mode: 'smart',
          ...result.routing,
          enabledProviders: enabledProviders.map((provider) => ({
            provider: provider.provider,
            label: provider.label,
            model: provider.model,
            specialty: provider.specialty,
          })),
        },
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Aridon smart-routing chat error', error);
    return NextResponse.json(
      {
        reply: `${executive} hit a temporary error while answering. Aridon tried the available model routes; please try again.`,
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
