import { NextResponse } from 'next/server';
import { AGRIWEBB_STAGING_AUTH, agriWebbRedirectUri, requireAgriWebbConfig } from '../../../../../lib/agriwebb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { clientId } = await requireAgriWebbConfig();
    const metadataResponse = await fetch(`${AGRIWEBB_STAGING_AUTH}/.well-known/oauth-authorization-server`, {
      cache: 'no-store',
    });
    return NextResponse.json({
      ok: metadataResponse.ok,
      environment: 'AgriWebb staging',
      credentialConfigured: true,
      clientIdConfigured: Boolean(clientId),
      redirectUri: agriWebbRedirectUri(),
      oauthMetadataReachable: metadataResponse.ok,
      writeScopesEnabled: false,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      environment: 'AgriWebb staging',
      credentialConfigured: false,
      error: error instanceof Error ? error.message : 'AgriWebb staging health check failed.',
    }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
