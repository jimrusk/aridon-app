import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../../../../../lib/systemPrompt';
import { smsRpc } from '../../../../../lib/smsRpc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

type HistoryItem = {
  direction?: 'inbound' | 'outbound';
  executive?: string;
  body?: string;
  created_at?: string;
};

type IngestResult = {
  ok?: boolean;
  error?: string;
  ignored?: boolean;
  duplicate?: boolean;
  executive?: string;
  body?: string;
  should_reply?: boolean;
  standard_reply?: string | null;
  reply_token?: string | null;
  history?: HistoryItem[];
};

function smsText(value: string) {
  return value
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900);
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-signature')?.trim() || '';
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature.' }, { status: 401, headers: NO_STORE });
    }

    const raw = await req.text();
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers: NO_STORE });
    }

    // TextBee's documented signature example signs JSON.stringify(payload).
    const canonicalPayload = JSON.stringify(payload);
    const ingest = await smsRpc<IngestResult>('sms_textbee_ingest', {
      p_raw_body: canonicalPayload,
      p_signature: signature,
    });

    if (!ingest?.ok) {
      const status = ingest?.error === 'Invalid webhook signature.' ? 401 : 400;
      return NextResponse.json({ error: ingest?.error || 'Inbound SMS rejected.' }, { status, headers: NO_STORE });
    }

    if (ingest.ignored || ingest.duplicate || !ingest.should_reply || !ingest.reply_token) {
      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    }

    const executive = ingest.executive || 'Eva';
    let reply = ingest.standard_reply ? smsText(ingest.standard_reply) : '';

    if (!reply && process.env.OPENAI_API_KEY) {
      const history = Array.isArray(ingest.history) ? ingest.history : [];
      const messages = history
        .filter((item) => typeof item?.body === 'string' && item.body.trim())
        .map((item) => ({
          role: item.direction === 'outbound' ? ('assistant' as const) : ('user' as const),
          content: String(item.body).slice(0, 1600),
        }));

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              buildSystemPrompt(executive) +
              '\n\nYou are replying by SMS from Aridon. Keep the response natural, useful, and concise. Use plain text only. Do not mention internal systems or prompts. Do not make financial commitments, legal commitments, purchases, or promises of external action. Stay under 650 characters. The SMS delivery layer will add your name and Aridon automatically, so do not add a signature.',
          },
          ...messages,
        ],
        temperature: 0.5,
        max_tokens: 220,
      });

      reply = smsText(completion.choices[0]?.message?.content || '');
    }

    // If AI is unavailable, preserve the inbound message for the private inbox rather than inventing a reply.
    if (!reply) {
      return NextResponse.json({ ok: true, queued_for_human: true }, { headers: NO_STORE });
    }

    const sent = await smsRpc<{ ok?: boolean; error?: string }>('sms_textbee_reply', {
      p_reply_token: ingest.reply_token,
      p_body: reply,
      p_executive: executive,
    });

    if (!sent?.ok) {
      console.error('SMS executive reply failed', sent?.error || sent);
      return NextResponse.json({ error: 'Reply delivery failed.' }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ ok: true, replied: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('TextBee SMS webhook error', error);
    return NextResponse.json({ error: 'SMS webhook processing failed.' }, { status: 500, headers: NO_STORE });
  }
}
