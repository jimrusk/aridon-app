import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../../../lib/supabase';
import { ARIDON_PUBLIC_ORIGIN, openOAuthState, providerConfigured, quickBooksRedirectUri, saveFinanceSecret } from '../../../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OAuthState = { tenantId: string; slug: string; userId: string; provider: string; issuedAt?: number };

function quickBooksBaseUrl() {
  return String(process.env.INTUIT_ENV || process.env.QUICKBOOKS_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';
}

export async function GET(request: NextRequest) {
  const fallback = `${ARIDON_PUBLIC_ORIGIN}/customer/finance`;
  try {
    if (!providerConfigured('quickbooks')) return NextResponse.redirect(`${fallback}?financeError=${encodeURIComponent('QuickBooks credentials are not configured.')}`);
    const code = request.nextUrl.searchParams.get('code') || '';
    const realmId = request.nextUrl.searchParams.get('realmId') || '';
    const stateValue = request.nextUrl.searchParams.get('state') || '';
    const oauthError = request.nextUrl.searchParams.get('error') || '';
    if (oauthError) throw new Error(`QuickBooks authorization was not completed: ${oauthError}`);
    if (!code || !realmId || !stateValue) throw new Error('QuickBooks callback did not include the required authorization values.');

    const state = openOAuthState<OAuthState>(stateValue);
    if (state.provider !== 'quickbooks' || !state.tenantId || !state.slug || !state.userId) throw new Error('QuickBooks authorization state is invalid.');

    const basic = Buffer.from(`${process.env.INTUIT_CLIENT_ID}:${process.env.INTUIT_CLIENT_SECRET}`).toString('base64');
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: quickBooksRedirectUri() }).toString(),
      cache: 'no-store',
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData?.access_token || !tokenData?.refresh_token) throw new Error(tokenData?.error_description || 'QuickBooks token exchange failed.');

    const expiresAt = Date.now() + Number(tokenData.expires_in || 3600) * 1000;
    const refreshExpiresAt = Date.now() + Number(tokenData.x_refresh_token_expires_in || 8726400) * 1000;
    await saveFinanceSecret(state.tenantId, 'quickbooks', {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      refreshExpiresAt,
      realmId,
    });

    let companyName: string | null = null;
    try {
      const query = encodeURIComponent('select * from CompanyInfo');
      const companyResponse = await fetch(`${quickBooksBaseUrl()}/v3/company/${encodeURIComponent(realmId)}/query?query=${query}&minorversion=75`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
        cache: 'no-store',
      });
      const companyData = await companyResponse.json().catch(() => ({}));
      companyName = companyData?.QueryResponse?.CompanyInfo?.[0]?.CompanyName || null;
    } catch {}

    const db = getServerClient();
    const { error } = await db.from('customer_finance_connections').upsert({
      tenant_id: state.tenantId,
      provider: 'quickbooks',
      label: 'QuickBooks Online',
      status: 'connected',
      external_account_id: realmId,
      company_name: companyName,
      capabilities: ['chart of accounts', 'purchases', 'deposits', 'invoices', 'payments'],
      metadata: { realmId },
      last_error: null,
      created_by: state.userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,provider' });
    if (error) throw error;

    return NextResponse.redirect(`${ARIDON_PUBLIC_ORIGIN}/workspace/${encodeURIComponent(state.slug)}/finance?connected=quickbooks`);
  } catch (error) {
    console.error('QuickBooks callback error', error);
    const message = error instanceof Error ? error.message : 'QuickBooks connection failed.';
    return NextResponse.redirect(`${fallback}?financeError=${encodeURIComponent(message)}`);
  }
}
