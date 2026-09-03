import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions, encryptToken, safeReturnPath } from '../../../../lib/gmail';
import { getServerClient } from '../../../../lib/supabase';
import {
  exchangeXAuthorizationCode,
  X_RETURN_COOKIE,
  X_STATE_COOKIE,
  X_VERIFIER_COOKIE,
  xJson,
} from '../../../../lib/x';

export const runtime = 'nodejs';

type XMeResponse = { data?: { id?: string; name?: string; username?: string } };

function redirectTarget(request: NextRequest, result: string, reason?: string) {
  const returnTo = safeReturnPath(request.cookies.get(X_RETURN_COOKIE)?.value, '/relationship-brain');
  const target = new URL(returnTo, request.url);
  target.searchParams.set('x', result);
  if (reason) target.searchParams.set('reason', reason.slice(0, 240));
  return target;
}

export async function GET(request: NextRequest) {
  const oauthError = request.nextUrl.searchParams.get('error');
  if (oauthError) return NextResponse.redirect(redirectTarget(request, 'denied', oauthError));

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(X_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(X_VERIFIER_COOKIE)?.value;
  if (!code || !state || !storedState || !verifier || state !== storedState) {
    return NextResponse.redirect(redirectTarget(request, 'state-error'));
  }

  try {
    const tokens = await exchangeXAuthorizationCode(request, code, verifier);
    const me = await xJson<XMeResponse>('/users/me?user.fields=id,name,username', tokens.accessToken);
    const user = me.data;
    if (!user?.id) throw new Error('X did not return the connected account.');

    const db = getServerClient();
    await db.from('executive_integration_tokens').upsert({
      provider: 'x',
      account_label: user.username ? `@${user.username}` : user.name || user.id,
      encrypted_refresh_token: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
      encrypted_access_token: encryptToken(tokens.accessToken),
      metadata: {
        userId: user.id,
        name: user.name || '',
        username: user.username || '',
        scope: tokens.scope,
        expiresIn: tokens.expiresIn,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'provider' });
    await db.from('relationship_settings').upsert({
      id: 1,
      x_sync_enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    const response = NextResponse.redirect(redirectTarget(request, 'connected'));
    response.cookies.set(X_STATE_COOKIE, '', cookieOptions(0));
    response.cookies.set(X_VERIFIER_COOKIE, '', cookieOptions(0));
    response.cookies.set(X_RETURN_COOKIE, '', cookieOptions(0));
    return response;
  } catch (error) {
    console.error('Aridon X OAuth callback error', error);
    return NextResponse.redirect(redirectTarget(request, 'connect-error', error instanceof Error ? error.message : 'Unknown X connector error'));
  }
}
