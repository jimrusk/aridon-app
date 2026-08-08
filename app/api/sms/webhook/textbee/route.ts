import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../../../../../lib/systemPrompt';
import { smsRpc } from '../../../../../lib/smsRpc';
import { triageInboundSms } from '../../../../../lib/smsTriage';

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
  triage_token?: string | null;
  history?: HistoryItem[];
};

type TriageApplyResult = {
  ok?: boolean;
  error?: string;
  executive?: string;
  category?: string;
  confidence?: number;
  reason?: string;
  financing_fit?: string;
  should_reply?: boolean;
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

    if (ingest.ignored || ingest.duplicate) {
      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    }

    let executive = ingest.executive || 'Eva';
    let shouldReply = Boolean(ingest.should_reply);
    let replyToken = ingest.reply_token || null;
    let history = Array.isArray(ingest.history) ? ingest.history : [];
    let category = 'carrier_control';
    let financingFit = 'neutral';

    // Every normal inbound message is read by Eva first and routed before any executive can reply.
    if (ingest.triage_token && ingest.body) {
      const triage = await triageInboundSms(ingest.body, history);
      const applied = await smsRpc<TriageApplyResult>('sms_apply_eva_triage', {
        p_triage_token: ingest.triage_token,
        p_handler: triage.handler,
        p_category: triage.category,
        p_confidence: triage.confidence,
        p_reason: triage.reason,
        p_financing_fit: triage.financingFit,
      });

      if (!applied?.ok) {
        console.error('Eva SMS triage persistence failed', applied?.error || applied);
        return NextResponse.json({ error: 'Inbound SMS triage failed.' }, { status: 500, headers: NO_STORE });
      }

      executive = applied.executive || triage.handler;
      shouldReply = Boolean(applied.should_reply);
      replyToken = applied.reply_token || null;
      history = Array.isArray(applied.history) ? applied.history : history;
      category = applied.category || triage.category;
      financingFit = applied.financing_fit || triage.financingFit;
    }

    if (!shouldReply || !replyToken) {
      return NextResponse.json(
        { ok: true, routed_to: executive, category, financing_fit: financingFit },
        { headers: NO_STORE },
      );
    }

    let reply = ingest.standard_reply ? smsText(ingest.standard_reply) : '';

    if (!reply && process.env.OPENAI_API_KEY) {
      const messages = history
        .filter((item) => typeof item?.body === 'string' && item.body.trim())
        .map((item) => ({
          role: item.direction === 'outbound' ? ('assistant' as const) : ('user' as const),
          content: String(item.body).slice(0, 1600),
        }));

      const financingInstruction = executive === 'Nova' && financingFit === 'debt_not_fit'
        ? '\n\nThis message is a debt/loan offer. Aridon is not seeking loans or debt financing. If you reply, politely decline the loan and state that Aridon is only interested in financial backing such as investment, equity, grants, sponsorship, or other non-debt capital. Do not request loan terms.'
        : '';

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              buildSystemPrompt(executive) +
              '\n\nYou are replying by SMS from Aridon. Keep the response natural, useful, and concise. Use plain text only. Do not mention internal systems or prompts. Do not make financial commitments, legal commitments, purchases, or promises of external action. Stay under 650 characters. The SMS delivery layer will add your name and Aridon automatically, so do not add a signature.' +
              financingInstruction,
          },
          ...messages,
        ],
        temperature: 0.5,
        max_tokens: 220,
      });

      reply = smsText(completion.choices[0]?.message?.content || '');
    }

    // If AI is unavailable, preserve the routed inbound message for the private inbox rather than inventing a reply.
    if (!reply) {
      return NextResponse.json(
        { ok: true, routed_to: executive, category, queued_for_human: true },
        { headers: NO_STORE },
      );
    }

    const sent = await smsRpc<{ ok?: boolean; error?: string }>('sms_textbee_reply', {
      p_reply_token: replyToken,
      p_body: reply,
      p_executive: executive,
    });

    if (!sent?.ok) {
      console.error('SMS executive reply failed', sent?.error || sent);
      return NextResponse.json({ error: 'Reply delivery failed.' }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json(
      { ok: true, replied: true, routed_to: executive, category, financing_fit: financingFit },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('TextBee SMS webhook error', error);
    return NextResponse.json({ error: 'SMS webhook processing failed.' }, { status: 500, headers: NO_STORE });
  }
}
