import { NextRequest, NextResponse } from 'next/server';
import {
  cookieOptions,
  encryptToken,
  exchangeAuthorizationCode,
  fetchGoogleEmail,
  GMAIL_EMAIL_COOKIE,
  GMAIL_REFRESH_COOKIE,
  GMAIL_STATE_COOKIE,
} from '../../../../lib/gmail';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(new URL(`/email?gmail=denied&reason=${encodeURIComponent(error)}`, request.url));
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(GMAIL_STATE_COOKIE)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/email?gmail=state-error', request.url));
  }

  try {
    const tokens = await exchangeAuthorizationCode(request, code);
    const email = await fetchGoogleEmail(tokens.accessToken);
    const response = NextResponse.redirect(new URL('/email?gmail=connected', request.url));

    response.cookies.set(GMAIL_REFRESH_COOKIE, encryptToken(tokens.refreshToken), cookieOptions());
    response.cookies.set(GMAIL_EMAIL_COOKIE, email, cookieOptions());
    response.cookies.set(GMAIL_STATE_COOKIE, '', cookieOptions(0));
    return response;
  } catch (oauthError) {
    console.error('Aridon Gmail callback error', oauthError);
    return NextResponse.redirect(new URL('/email?gmail=connect-error', request.url));
  }
}
