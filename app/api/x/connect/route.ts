import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions, safeReturnPath } from '../../../../lib/gmail';
import {
  buildXAuthorizationUrl,
  newOAuthState,
  newPkcePair,
  X_RETURN_COOKIE,
  X_STATE_COOKIE,
  X_VERIFIER_COOKIE,
  xConfiguration,
} from '../../../../lib/x';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const configuration = xConfiguration();
  const returnTo = safeReturnPath(request.nextUrl.searchParams.get('return'), '/relationship-brain');
  if (!configuration.configured) {
    const target = new URL(returnTo, request.url);
    target.searchParams.set('x', 'not-configured');
    target.searchParams.set('missing', configuration.missing.join(','));
    return NextResponse.redirect(target);
  }

  const state = newOAuthState();
  const { verifier, challenge } = newPkcePair();
  const response = NextResponse.redirect(buildXAuthorizationUrl(request, state, challenge));
  response.cookies.set(X_STATE_COOKIE, state, cookieOptions(600));
  response.cookies.set(X_VERIFIER_COOKIE, verifier, cookieOptions(600));
  response.cookies.set(X_RETURN_COOKIE, returnTo, cookieOptions(600));
  return response;
}
