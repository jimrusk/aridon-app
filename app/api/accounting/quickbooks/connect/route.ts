import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions } from '../../../../../lib/gmail';
import { quickBooksAuthorizationUrl, quickBooksConfiguration, QB_RETURN_COOKIE, QB_STATE_COOKIE } from '../../../../../lib/quickbooks';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const config = quickBooksConfiguration();
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/executive-ops/control-center';
  if (!config.configured) return NextResponse.redirect(new URL(`${returnTo}?quickbooks=missing&vars=${encodeURIComponent(config.missing.join(','))}`, request.url));
  const state = randomBytes(24).toString('base64url');
  const response = NextResponse.redirect(quickBooksAuthorizationUrl(request, state));
  response.cookies.set(QB_STATE_COOKIE, state, cookieOptions(10 * 60));
  response.cookies.set(QB_RETURN_COOKIE, returnTo, cookieOptions(10 * 60));
  return response;
}
