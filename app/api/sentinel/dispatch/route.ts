import { NextRequest, NextResponse } from 'next/server';
import {
  base64UrlMessage,
  decryptToken,
  GMAIL_EMAIL_COOKIE,
  GMAIL_REFRESH_COOKIE,
  refreshGmailAccessToken,
  safeHeader,
} from '../../../../lib/gmail';
import { getServerClient, getUserScopedClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  return authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
}

function companyHoldActive(policy: Record<string, unknown> | null) {
  if (!policy?.authority_hold) return false;
  const until = typeof policy.authority_hold_until === 'string' ? Date.parse(policy.authority_hold_until) : Number.NaN;
  return !Number.isFinite(until) || until > Date.now();
}

async function sendGmailMessage(request: NextRequest, to: string, subject: string, body: string) {
  const encryptedRefreshToken = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
  if (!encryptedRefreshToken) throw new Error('Gmail is not connected. Connect Gmail before sending an authority report.');

  const accessToken = await refreshGmailAccessToken(decryptToken(encryptedRefreshToken));
  const connectedEmail = request.cookies.get(GMAIL_EMAIL_COOKIE)?.value || '';
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
  const headers = [
    `To: ${safeHeader(to, 254)}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ];
  if (connectedEmail) headers.splice(1, 0, `From: ${safeHeader(connectedEmail, 254)}`);

  const rawMessage = `${headers.join('\r\n')}\r\n\r\n${body.replace(/\r?\n/g, '\r\n')}`;
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: base64UrlMessage(rawMessage) }),
    cache: 'no-store',
  });
  const data = (await response.json()) as { id?: string; error?: { message?: string } };
  if (!response.ok || !data.id) throw new Error(data.error?.message || 'Gmail rejected the authority report.');
  return data.id;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = bearerToken(request);
    if (!accessToken) return NextResponse.json({ error: 'A signed-in Aridon session is required.' }, { status: 401, headers: NO_STORE_HEADERS });
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE_HEADERS });
    }

    const body = await request.json();
    if (body?.approved !== true || typeof body?.reportId !== 'string') {
      return NextResponse.json({ error: 'Explicit approval and a reportId are required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const userDb = getUserScopedClient(accessToken);
    const { data: report, error } = await userDb.from('sentinel_authority_reports').select('*').eq('id', body.reportId).maybeSingle();
    if (error || !report) return NextResponse.json({ error: 'Authority report not found or not accessible.' }, { status: 404, headers: NO_STORE_HEADERS });

    if (report.status === 'sent') {
      return NextResponse.json({ error: 'This authority report was already sent.' }, { status: 409, headers: NO_STORE_HEADERS });
    }
    if (report.status === 'cancelled') {
      return NextResponse.json({ error: 'This report was cancelled by a company override or false-positive finding.' }, { status: 409, headers: NO_STORE_HEADERS });
    }

    const [{ data: policy }, { data: incident }] = await Promise.all([
      userDb.from('sentinel_security_policies').select('authority_hold,authority_hold_until,authority_hold_reason').eq('tenant_id', report.tenant_id).maybeSingle(),
      userDb.from('sentinel_incidents').select('status,authority_escalation_status').eq('id', report.incident_id).maybeSingle(),
    ]);

    if (companyHoldActive((policy || null) as Record<string, unknown> | null)) {
      return NextResponse.json({
        error: `Authority reporting is currently paused by the company security override${policy?.authority_hold_reason ? `: ${policy.authority_hold_reason}` : '.'}`,
        held: true,
      }, { status: 409, headers: NO_STORE_HEADERS });
    }

    if (report.status === 'held' || incident?.authority_escalation_status === 'held_by_override') {
      return NextResponse.json({ error: 'This incident is on review hold. Resume it before sending any authority report.', held: true }, { status: 409, headers: NO_STORE_HEADERS });
    }
    if (incident?.status === 'false_positive' || incident?.authority_escalation_status === 'cancelled') {
      return NextResponse.json({ error: 'This incident is marked false positive/cancelled and cannot be sent.' }, { status: 409, headers: NO_STORE_HEADERS });
    }

    const payload = (report.report_payload || {}) as { subject?: string; body?: string };
    if (report.delivery_method === 'portal') {
      return NextResponse.json({
        sent: false,
        requiresPortal: true,
        portalUrl: report.destination,
        preparedSubject: payload.subject || '',
        preparedBody: payload.body || '',
        note: 'This authority requires the person filing the report to review and certify the information in its official portal.',
      }, { headers: NO_STORE_HEADERS });
    }

    if (report.delivery_method !== 'email' || !/^\S+@\S+\.\S+$/.test(report.destination)) {
      return NextResponse.json({ error: 'This report does not have a supported direct-send destination.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const messageId = await sendGmailMessage(request, report.destination, payload.subject || 'Aridon Sentinel cyber incident report', payload.body || '');
    const now = new Date().toISOString();
    const serverDb = getServerClient();
    await serverDb.from('sentinel_authority_reports').update({ status: 'sent', submitted_at: now, external_reference: messageId, error_message: null, updated_at: now }).eq('id', report.id);
    await serverDb.from('sentinel_incidents').update({ authority_escalation_status: 'reported', status: 'reported', updated_at: now }).eq('id', report.incident_id);

    return NextResponse.json({ sent: true, messageId, sentAt: now, authority: report.authority, destination: report.destination }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon Sentinel dispatch error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to dispatch the authority report.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
