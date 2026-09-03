import { NextRequest, NextResponse } from 'next/server';
import {
  cookieOptions,
  encryptToken,
  exchangeAuthorizationCode,
  fetchGoogleEmail,
  GMAIL_EMAIL_COOKIE,
  GMAIL_REFRESH_COOKIE,
  GMAIL_RETURN_COOKIE,
  GMAIL_STATE_COOKIE,
  safeReturnPath,
} from '../../../../lib/gmail';
import { getServerClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';

function redirectWithResult(request: NextRequest, result: string, reason?: string) {
  const returnTo = safeReturnPath(request.cookies.get(GMAIL_RETURN_COOKIE)?.value, '/email');
  const target = new URL(returnTo, request.url);
  target.searchParams.set('gmail', result);
  if (reason) target.searchParams.set('reason', reason);
  return target;
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  if (error) return NextResponse.redirect(redirectWithResult(request, 'denied', error));

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(GMAIL_STATE_COOKIE)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(redirectWithResult(request, 'state-error'));
  }

  try {
    const tokens = await exchangeAuthorizationCode(request, code);
    const email = await fetchGoogleEmail(tokens.accessToken);
    const encryptedRefreshToken = encryptToken(tokens.refreshToken);
    const response = NextResponse.redirect(redirectWithResult(request, 'connected'));

    response.cookies.set(GMAIL_REFRESH_COOKIE, encryptedRefreshToken, cookieOptions());
    response.cookies.set(GMAIL_EMAIL_COOKIE, email, cookieOptions());
    response.cookies.set(GMAIL_STATE_COOKIE, '', cookieOptions(0));
    response.cookies.set(GMAIL_RETURN_COOKIE, '', cookieOptions(0));

    // Keep a server-only encrypted refresh token so scheduled Relationship Brain
    // jobs can build and send the executive brief even when the browser is closed.
    try {
      const db = getServerClient();
      await db.from('executive_integration_tokens').upsert({
        provider: 'google-workspace',
        account_label: email,
        encrypted_refresh_token: encryptedRefreshToken,
        encrypted_access_token: null,
        metadata: { source: 'gmail-oauth' },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'provider' });
      await db.from('relationship_settings').upsert({
        id: 1,
        brief_recipient: email,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (storageError) {
      console.error('Aridon could not persist the server-side Google integration token', storageError);
    }

    return response;
  } catch (oauthError) {
    console.error('Aridon Google Workspace callback error', oauthError);
    return NextResponse.redirect(redirectWithResult(request, 'connect-error'));
  }
}
