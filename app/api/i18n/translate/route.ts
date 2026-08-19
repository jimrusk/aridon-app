import { NextRequest, NextResponse } from 'next/server';
import { getAridonLocale, isAridonLocale } from '../../../../lib/aridonLocales';

export const runtime = 'nodejs';
export const maxDuration = 60;

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const MAX_ITEMS = 100;
const MAX_ITEM_LENGTH = 1_200;
const MAX_TOTAL_CHARACTERS = 15_000;

function extractText(data: any) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data?.output || [])
    .flatMap((item: any) => item?.content || [])
    .filter((item: any) => item?.type === 'output_text' && typeof item?.text === 'string')
    .map((item: any) => item.text)
    .join('\n')
    .trim();
}

function cleanJson(text: string) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'JSON required.' }, { status: 415, headers: NO_STORE_HEADERS });
    }

    const body = await req.json();
    const locale = body?.locale;
    if (!isAridonLocale(locale)) {
      return NextResponse.json({ error: 'Unsupported language.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    if (!Array.isArray(body?.strings) || body.strings.length === 0 || body.strings.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Invalid translation batch.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const strings: string[] = [];
    let total = 0;
    for (const value of body.strings) {
      if (typeof value !== 'string') {
        return NextResponse.json({ error: 'Translation values must be strings.' }, { status: 400, headers: NO_STORE_HEADERS });
      }
      const cleaned = value.trim();
      if (!cleaned || cleaned.length > MAX_ITEM_LENGTH) {
        return NextResponse.json({ error: 'Translation value is empty or too long.' }, { status: 400, headers: NO_STORE_HEADERS });
      }
      total += cleaned.length;
      if (total > MAX_TOTAL_CHARACTERS) {
        return NextResponse.json({ error: 'Translation batch is too large.' }, { status: 400, headers: NO_STORE_HEADERS });
      }
      strings.push(cleaned);
    }

    if (locale === 'en') {
      return NextResponse.json({ translations: strings, locale, mode: 'native' }, { headers: NO_STORE_HEADERS });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { translations: strings, locale, mode: 'unavailable', warning: 'OPENAI_API_KEY is not configured.' },
        { headers: NO_STORE_HEADERS },
      );
    }

    const target = getAridonLocale(locale);
    const model = process.env.ARIDON_TRANSLATION_MODEL?.trim() || process.env.ARIDON_CHAT_MODEL?.trim() || 'gpt-5-mini';

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        instructions: [
          `Translate product-interface text from English into ${target.label} (${target.nativeLabel}), for users in or around ${target.city}.`,
          'Return ONLY a valid JSON array of strings, one translated string for each input string, in the exact same order and with the exact same array length.',
          'Use natural, professional business language rather than literal machine translation.',
          'Preserve product and company names exactly when they are proper nouns: Aridon, Aridon Ag, Aridon Business OS, Aridon Enterprise, OpenAI, AWG-1000, Iron Grid Electric & Water, Southwest Water Security Alliance, Eva, Heather, Nova, Ethos, Atlas, Scout, Ledger, Oracle.',
          'Preserve phone numbers, email addresses, URLs, currency values, percentages, model numbers, units, acronyms, code, field names that are obviously technical identifiers, and placeholders such as {name}, {{value}}, %s, and ${value}.',
          'Do not add explanations, footnotes, quotation commentary, markdown, or extra text.',
          'Keep button labels concise. Keep legal/financial caveats precise. Do not strengthen claims or guarantees while translating.',
        ].join('\n'),
        input: JSON.stringify(strings),
        max_output_tokens: Math.min(8_000, Math.max(1_500, total * 2)),
      }),
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI returned ${response.status}.`);

    const raw = cleanJson(extractText(data));
    const translations = JSON.parse(raw);
    if (!Array.isArray(translations) || translations.length !== strings.length || translations.some((item) => typeof item !== 'string')) {
      throw new Error('Translation response did not preserve the requested array shape.');
    }

    return NextResponse.json({ translations, locale, mode: 'openai' }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon translation route error', error);
    return NextResponse.json({ error: 'Translation is temporarily unavailable.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
