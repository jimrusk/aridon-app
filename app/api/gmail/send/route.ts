import { NextRequest, NextResponse } from 'next/server';
import {
  base64UrlMessage,
  decryptToken,
  GMAIL_EMAIL_COOKIE,
  GMAIL_REFRESH_COOKIE,
  refreshGmailAccessToken,
  safeHeader,
} from '../../../../lib/gmail';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json.' },
        { status: 415, headers: NO_STORE_HEADERS },
      );
    }

    const body = await request.json();
    if (body?.approved !== true) {
      return NextResponse.json(
        { error: 'Jim must approve this email before it can be sent.' },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }

    const to = safeHeader(text(body?.to, 254), 254);
    const subject = safeHeader(text(body?.subject, 300), 300);
    const messageBody = text(body?.body, 50_000);

    if (!/^\S+@\S+\.\S+$/.test(to) || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'A valid recipient, subject, and message are required.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const encryptedRefreshToken = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
    if (!encryptedRefreshToken) {
      return NextResponse.json(
        { error: 'Gmail is not connected. Connect Gmail before sending.' },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    const accessToken = await refreshGmailAccessToken(decryptToken(encryptedRefreshToken));
    const connectedEmail = request.cookies.get(GMAIL_EMAIL_COOKIE)?.value || '';
    const rawMessage = [
      `To: ${to}`,
      connectedEmail ? `From: ${safeHeader(connectedEmail, 254)}` : '',
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      messageBody,
    ]
      .filter((line) => line !== '')
      .join('\r\n');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64UrlMessage(rawMessage) }),
      cache: 'no-store',
    });

    const data = (await response.json()) as {
      id?: string;
      threadId?: string;
      error?: { message?: string };
    };

    if (!response.ok || !data.id) {
      throw new Error(data.error?.message || 'Gmail rejected the message.');
    }

    return NextResponse.json(
      {
        sent: true,
        messageId: data.id,
        threadId: data.threadId || '',
        sentAt: new Date().toISOString(),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Aridon Gmail send error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send the email.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
