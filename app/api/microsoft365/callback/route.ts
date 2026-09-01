import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions } from '../../../../lib/gmail';
import { exchangeMicrosoftCode, microsoftProfile, MS_RETURN_COOKIE, MS_STATE_COOKIE, safeReturnPath, setMicrosoftCookies } from '../../../../lib/microsoft365';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const returnTo = safeReturnPath(request.cookies.get(MS_RETURN_COOKIE)?.value, '/executive-ops/control-center');
  const error = request.nextUrl.searchParams.get('error');
  if (error) return NextResponse.redirect(new URL(`${returnTo}?microsoft=denied`, request.url));
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(MS_STATE_COOKIE)?.value;
  if (!code || !state || !storedState || state !== storedState) return NextResponse.redirect(new URL(`${returnTo}?microsoft=state-error`, request.url));
  try {
    const tokens = await exchangeMicrosoftCode(request, code);
    const profile = await microsoftProfile(tokens.accessToken);
    const response = NextResponse.redirect(new URL(`${returnTo}?microsoft=connected`, request.url));
    setMicrosoftCookies(response, tokens.refreshToken, profile.email);
    response.cookies.set(MS_STATE_COOKIE, '', cookieOptions(0));
    return response;
  } catch (oauthError) {
    console.error('Microsoft 365 callback error', oauthError);
    return NextResponse.redirect(new URL(`${returnTo}?microsoft=connect-error`, request.url));
  }
}
