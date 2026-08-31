import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../../../lib/customerAuth';
import { cleanFinanceText, providerConfigured, quickBooksRedirectUri, sealOAuthState } from '../../../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!providerConfigured('quickbooks')) return NextResponse.json({ error: 'QuickBooks is built into Finance OS, but Intuit production credentials still need to be added.' }, { status: 503, headers: NO_STORE });

    const state = sealOAuthState({ tenantId: membership.tenant.id, slug: membership.tenant.slug, userId: auth.user.id, provider: 'quickbooks' });
    const params = new URLSearchParams({
      client_id: process.env.INTUIT_CLIENT_ID || '',
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: quickBooksRedirectUri(),
      state,
    });
    return NextResponse.json({ url: `https://appcenter.intuit.com/connect/oauth2?${params.toString()}` }, { headers: NO_STORE });
  } catch (error) {
    console.error('QuickBooks start error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start QuickBooks connection.' }, { status: 500, headers: NO_STORE });
  }
}
