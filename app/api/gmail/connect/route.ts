import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildGoogleAuthorizationUrl,
  cookieOptions,
  gmailConfiguration,
  GMAIL_RETURN_COOKIE,
  GMAIL_STATE_COOKIE,
  safeReturnPath,
} from '../../../../lib/gmail';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const returnTo = safeReturnPath(request.nextUrl.searchParams.get('returnTo'), '/email');
  const configuration = gmailConfiguration();
  if (!configuration.configured) {
    const target = new URL(returnTo, request.url);
    target.searchParams.set('gmail', 'missing');
    target.searchParams.set('vars', configuration.missing.join(','));
    return NextResponse.redirect(target);
  }

  const state = randomBytes(24).toString('base64url');
  const response = NextResponse.redirect(buildGoogleAuthorizationUrl(request, state));
  response.cookies.set(GMAIL_STATE_COOKIE, state, cookieOptions(10 * 60));
  response.cookies.set(GMAIL_RETURN_COOKIE, returnTo, cookieOptions(10 * 60));
  return response;
}
