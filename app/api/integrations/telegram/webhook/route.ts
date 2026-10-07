import { NextRequest, NextResponse } from 'next/server';
import { askEvaFromChannel, constantTimeSecretMatch, sendTelegramMessage } from '../../../../../lib/communicationsHub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  if (!constantTimeSecretMatch(secret, process.env.TELEGRAM_WEBHOOK_SECRET)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const update = await request.json();
  const message = update?.message ?? update?.edited_message;
  const text = typeof message?.text === 'string' ? message.text.trim() : '';
  const chatId = message?.chat?.id != null ? String(message.chat.id) : '';
  if (!text || !chatId) return NextResponse.json({ ok: true });

  const result = await askEvaFromChannel({
    channel: 'telegram', externalChatId: chatId,
    externalUserId: message?.from?.id != null ? String(message.from.id) : undefined,
    senderName: [message?.from?.first_name, message?.from?.last_name].filter(Boolean).join(' '),
    text,
  });
  await sendTelegramMessage(chatId, result.reply.slice(0, 4000));
  return NextResponse.json({ ok: true });
}
