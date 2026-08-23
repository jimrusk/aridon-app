import { NextRequest, NextResponse } from 'next/server';
import { routeModel } from '../../../../lib/modelRouter';

export const runtime = 'nodejs';
export const maxDuration = 60;

function configured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_WEBHOOK_SECRET?.trim());
}

async function sendTelegram(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000) }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok || !data?.ok) throw new Error(data?.description || `Telegram returned ${response.status}.`);
}

export async function GET() {
  return NextResponse.json({ channel: 'telegram', configured: configured(), mode: 'optional interface adapter' }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (!configured()) return NextResponse.json({ error: 'Telegram is not configured.' }, { status: 503 });
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || '';
  const suppliedSecret = request.headers.get('x-telegram-bot-api-secret-token') || '';
  if (!expectedSecret || suppliedSecret !== expectedSecret) return NextResponse.json({ error: 'Invalid Telegram webhook secret.' }, { status: 401 });

  const update = await request.json();
  const message = update?.message || update?.edited_message;
  const chatId = message?.chat?.id;
  const messageText = typeof message?.text === 'string' ? message.text.trim() : '';
  if (!chatId || !messageText) return NextResponse.json({ ok: true });

  try {
    const result = await routeModel(
      [{ role: 'user', content: messageText }],
      'You are Aridon responding through Telegram. Give a concise, useful answer. Preserve human approval for consequential actions and never claim an action was executed unless a connected tool actually executed it.',
    );
    await sendTelegram(chatId, result.text);
    return NextResponse.json({ ok: true, routedBy: result.routing.provider });
  } catch (error) {
    console.error('Aridon Telegram channel error', error);
    return NextResponse.json({ error: 'Aridon could not answer this Telegram update.' }, { status: 500 });
  }
}
