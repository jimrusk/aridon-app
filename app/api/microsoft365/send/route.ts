import { NextRequest, NextResponse } from 'next/server';
import { graphJson, microsoftAccessToken, MS_EMAIL_COOKIE } from '../../../../lib/microsoft365';
import { auditExecutiveAction, externalActionsEnabled } from '../../../../lib/executiveOps';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body?.approved !== true) return NextResponse.json({ error: 'Owner approval is required before sending.' }, { status: 403, headers: NO_STORE });
    const to = text(body?.to, 254);
    const subject = text(body?.subject, 300);
    const messageBody = text(body?.body, 50000);
    const executive = text(body?.executive, 120);
    if (!/^\S+@\S+\.\S+$/.test(to) || !subject || !messageBody) return NextResponse.json({ error: 'Valid recipient, subject and body are required.' }, { status: 400, headers: NO_STORE });
    if (!(await externalActionsEnabled(request))) return NextResponse.json({ error: 'Executive Operations emergency stop is active. Outlook sends are disabled.' }, { status: 423, headers: NO_STORE });

    const accessToken = await microsoftAccessToken(request);
    await graphJson('/me/sendMail', accessToken, {
      method: 'POST',
      body: JSON.stringify({ message: { subject, body: { contentType: 'Text', content: messageBody }, toRecipients: [{ emailAddress: { address: to } }] }, saveToSentItems: true }),
    });
    const actorEmail = request.cookies.get(MS_EMAIL_COOKIE)?.value || '';
    await auditExecutiveAction({ actorEmail, executive, action: 'email_sent', channel: 'outlook', target: to, approved: true, metadata: { subject } });
    return NextResponse.json({ sent: true, sentAt: new Date().toISOString() }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send Outlook email.' }, { status: 500, headers: NO_STORE });
  }
}
