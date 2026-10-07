import { NextRequest, NextResponse } from 'next/server';
import { askEvaFromChannel, sendWhatsAppMessage } from '../../../../../lib/communicationsHub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) return new NextResponse(challenge, { status: 200 });
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const messages = body?.entry?.flatMap((entry: any) => entry?.changes || []).flatMap((change: any) => change?.value?.messages || []) || [];
  for (const message of messages) {
    if (message?.type !== 'text' || typeof message?.text?.body !== 'string' || !message?.from) continue;
    const result = await askEvaFromChannel({ channel: 'whatsapp', externalChatId: String(message.from), externalUserId: String(message.from), text: message.text.body });
    await sendWhatsAppMessage(String(message.from), result.reply);
  }
  return NextResponse.json({ ok: true });
}
