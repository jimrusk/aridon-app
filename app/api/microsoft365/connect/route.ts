import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions } from '../../../../lib/gmail';
import { microsoftAuthorizationUrl, microsoftConfiguration, MS_RETURN_COOKIE, MS_STATE_COOKIE } from '../../../../lib/microsoft365';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const config = microsoftConfiguration();
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/executive-ops/control-center';
  if (!config.configured) {
    return NextResponse.redirect(new URL(`${returnTo}?microsoft=missing&vars=${encodeURIComponent(config.missing.join(','))}`, request.url));
  }
  const state = randomBytes(24).toString('base64url');
  const response = NextResponse.redirect(microsoftAuthorizationUrl(request, state));
  response.cookies.set(MS_STATE_COOKIE, state, cookieOptions(10 * 60));
  response.cookies.set(MS_RETURN_COOKIE, returnTo, cookieOptions(10 * 60));
  return response;
}
