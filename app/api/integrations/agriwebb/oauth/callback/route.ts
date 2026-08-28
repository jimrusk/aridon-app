import { NextRequest, NextResponse } from 'next/server';
import { AGRIWEBB_STAGING_API, AGRIWEBB_STAGING_AUTH, agriWebbRedirectUri, requireAgriWebbConfig, sealTokenPayload } from '../../../../../../lib/agriwebb';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const error = request.nextUrl.searchParams.get('error');
    if (error) {
      const description = request.nextUrl.searchParams.get('error_description') || error;
      return NextResponse.json({ ok: false, error, description }, { status: 400 });
    }

    const code = request.nextUrl.searchParams.get('code') || '';
    const state = request.nextUrl.searchParams.get('state') || '';
    const expectedState = request.cookies.get('agriwebb_oauth_state')?.value || '';
    if (!code || !state || !expectedState || state !== expectedState) {
      return NextResponse.json({ ok: false, error: 'Invalid AgriWebb OAuth callback state.' }, { status: 400 });
    }

    const { clientId, clientSecret } = await requireAgriWebbConfig();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: agriWebbRedirectUri(),
      client_id: clientId,
    });
    const tokenResponse = await fetch(`${AGRIWEBB_STAGING_AUTH}/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      cache: 'no-store',
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token?.access_token) {
      return NextResponse.json({ ok: false, error: 'AgriWebb token exchange failed.', detail: token }, { status: 502 });
    }

    const statusResponse = await fetch(`${AGRIWEBB_STAGING_API}/v2/marketplace/callback`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'integration-status', data: {} }),
      cache: 'no-store',
    });
    const status = await statusResponse.json().catch(() => ({}));

    const response = statusResponse.ok && status?.data?.redirectURL
      ? NextResponse.redirect(status.data.redirectURL)
      : NextResponse.redirect(new URL('/ag?agriwebb=connected', request.url));

    response.cookies.set('agriwebb_staging_token', sealTokenPayload({
      access_token: token.access_token,
      refresh_token: token.refresh_token || null,
      token_type: token.token_type || 'Bearer',
      expires_at: Date.now() + Number(token.expires_in || 3600) * 1000,
      allowedFarmIds: status?.data?.allowedFarmIds || [],
      organization: request.cookies.get('agriwebb_organization')?.value || null,
    }), {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    response.cookies.delete('agriwebb_oauth_state');
    response.cookies.delete('agriwebb_organization');
    return response;
  } catch (error) {
    console.error('AgriWebb staging OAuth callback failed.', error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'AgriWebb staging OAuth callback failed.' }, { status: 500 });
  }
}
