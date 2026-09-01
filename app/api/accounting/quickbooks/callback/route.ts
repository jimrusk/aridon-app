import { NextRequest, NextResponse } from 'next/server';
import { exchangeQuickBooksCode, QB_RETURN_COOKIE, QB_STATE_COOKIE, safeReturnPath, setQuickBooksCookies } from '../../../../../lib/quickbooks';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const returnTo = safeReturnPath(request.cookies.get(QB_RETURN_COOKIE)?.value, '/executive-ops/control-center');
  const error = request.nextUrl.searchParams.get('error');
  if (error) return NextResponse.redirect(new URL(`${returnTo}?quickbooks=denied`, request.url));
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const realmId = request.nextUrl.searchParams.get('realmId');
  const storedState = request.cookies.get(QB_STATE_COOKIE)?.value;
  if (!code || !state || !storedState || state !== storedState || !realmId) return NextResponse.redirect(new URL(`${returnTo}?quickbooks=state-error`, request.url));
  try {
    const tokens = await exchangeQuickBooksCode(request, code);
    const response = NextResponse.redirect(new URL(`${returnTo}?quickbooks=connected`, request.url));
    setQuickBooksCookies(response, tokens.refreshToken, realmId);
    return response;
  } catch (oauthError) {
    console.error('QuickBooks callback error', oauthError);
    return NextResponse.redirect(new URL(`${returnTo}?quickbooks=connect-error`, request.url));
  }
}
