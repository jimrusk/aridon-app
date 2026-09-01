import { NextRequest, NextResponse } from 'next/server';
import { quickBooksConfiguration, QB_REALM_COOKIE, QB_REFRESH_COOKIE } from '../../../../../lib/quickbooks';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const config = quickBooksConfiguration();
  const connected = Boolean(request.cookies.get(QB_REFRESH_COOKIE)?.value && request.cookies.get(QB_REALM_COOKIE)?.value);
  return NextResponse.json({ configured: config.configured, missing: config.missing, connected, environment: config.environment, realmId: connected ? request.cookies.get(QB_REALM_COOKIE)?.value || '' : '', mode: 'read-only-in-aridon' }, { headers: { 'Cache-Control': 'no-store' } });
}
