import { NextRequest, NextResponse } from 'next/server';
import { AGRIWEBB_READ_SCOPES, AGRIWEBB_STAGING_AUTH, agriWebbClientId, agriWebbRedirectUri, newOauthState } from '../../../../lib/agriwebb';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const clientId = agriWebbClientId();
  if (!clientId) return NextResponse.json({ error: 'AGRIWEBB_CLIENT_ID is not configured.' }, { status: 503 });

  const state = newOauthState();
  const organization = request.nextUrl.searchParams.get('organization') || '';
  const authorize = new URL('/oauth2/authorize', AGRIWEBB_STAGING_AUTH);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', agriWebbRedirectUri());
  authorize.searchParams.set('scope', AGRIWEBB_READ_SCOPES);
  authorize.searchParams.set('state', state);
  if (organization) authorize.searchParams.set('organization', organization);

  const response = NextResponse.redirect(authorize);
  response.cookies.set('agriwebb_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    maxAge: 600,
    path: '/',
  });
  if (organization) {
    response.cookies.set('agriwebb_organization', organization, {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      maxAge: 600,
      path: '/',
    });
  }
  return response;
}
