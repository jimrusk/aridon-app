import { NextRequest, NextResponse } from 'next/server';
import { microsoftConfiguration, MS_EMAIL_COOKIE, MS_REFRESH_COOKIE } from '../../../../lib/microsoft365';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const config = microsoftConfiguration();
  const connected = Boolean(request.cookies.get(MS_REFRESH_COOKIE)?.value);
  return NextResponse.json({
    configured: config.configured,
    missing: config.missing,
    connected,
    email: connected ? request.cookies.get(MS_EMAIL_COOKIE)?.value || '' : '',
    scopes: ['Mail.Read', 'Mail.Send', 'Calendars.ReadWrite', 'Contacts.Read'],
  }, { headers: { 'Cache-Control': 'no-store' } });
}
