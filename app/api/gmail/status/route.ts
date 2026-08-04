import { NextRequest, NextResponse } from 'next/server';
import {
  gmailConfiguration,
  GMAIL_EMAIL_COOKIE,
  GMAIL_REFRESH_COOKIE,
} from '../../../../lib/gmail';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const configuration = gmailConfiguration();
  const connected = Boolean(request.cookies.get(GMAIL_REFRESH_COOKIE)?.value);
  const email = request.cookies.get(GMAIL_EMAIL_COOKIE)?.value || '';

  return NextResponse.json(
    {
      configured: configuration.configured,
      missing: configuration.missing,
      connected,
      email: connected ? email : '',
      approvalRequired: true,
      mode: 'gmail-send-only',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
