import { NextRequest, NextResponse } from 'next/server';
import {
  base64UrlMessage,
  decryptToken,
  GMAIL_EMAIL_COOKIE,
  GMAIL_REFRESH_COOKIE,
  refreshGmailAccessToken,
  safeHeader,
} from '../../../../lib/gmail';
import {
  auditExecutiveAction,
  connectedExecutiveActor,
  externalActionsEnabled,
} from '../../../../lib/executiveOps';

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
        { error: 'The owner must approve this email before it can be sent.' },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }

    const actor = connectedExecutiveActor(request);
    if (!(await externalActionsEnabled(request))) {
      await auditExecutiveAction({ actorEmail: actor.email, executive: text(body?.executive, 120), action: 'email_send_blocked_emergency_stop', channel: 'gmail', target: text(body?.to, 254), approved: true });
      return NextResponse.json(
        { error: 'Executive Operations emergency stop is active. Reading and drafting still work, but external sends are disabled.' },
        { status: 423, headers: NO_STORE_HEADERS },
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
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
    const headers = [
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
    ];
    if (connectedEmail) headers.splice(1, 0, `From: ${safeHeader(connectedEmail, 254)}`);

    const normalizedBody = messageBody.replace(/\r?\n/g, '\r\n');
    const rawMessage = `${headers.join('\r\n')}\r\n\r\n${normalizedBody}`;

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

    const sentAt = new Date().toISOString();
    await auditExecutiveAction({
      actorEmail: connectedEmail || actor.email,
      executive: text(body?.executive, 120),
      action: 'email_sent',
      channel: 'gmail',
      target: to,
      approved: true,
      metadata: { subject, messageId: data.id, threadId: data.threadId || '' },
    });

    return NextResponse.json(
      {
        sent: true,
        messageId: data.id,
        threadId: data.threadId || '',
        sentAt,
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
