import { NextRequest, NextResponse } from 'next/server';
import { askEvaFromChannel, constantTimeSecretMatch, sendSignalMessage } from '../../../../../lib/communicationsHub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!constantTimeSecretMatch(request.headers.get('x-aridon-signal-secret'), process.env.SIGNAL_WEBHOOK_SECRET)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const sender = String(body?.source ?? body?.sender ?? '');
  const text = typeof body?.message === 'string' ? body.message.trim() : typeof body?.text === 'string' ? body.text.trim() : '';
  if (!sender || !text) return NextResponse.json({ ok: true });
  const result = await askEvaFromChannel({ channel: 'signal', externalChatId: sender, externalUserId: sender, text });
  await sendSignalMessage(sender, result.reply);
  return NextResponse.json({ ok: true });
}
