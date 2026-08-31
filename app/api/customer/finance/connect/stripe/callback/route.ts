import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../../../lib/supabase';
import { ARIDON_PUBLIC_ORIGIN, openOAuthState, providerConfigured, saveFinanceSecret } from '../../../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OAuthState = { tenantId: string; slug: string; userId: string; provider: string; issuedAt?: number };

export async function GET(request: NextRequest) {
  const fallback = `${ARIDON_PUBLIC_ORIGIN}/customer/finance`;
  try {
    if (!providerConfigured('stripe-connect')) return NextResponse.redirect(`${fallback}?financeError=${encodeURIComponent('Stripe Connect credentials are not configured.')}`);
    const code = request.nextUrl.searchParams.get('code') || '';
    const stateValue = request.nextUrl.searchParams.get('state') || '';
    const oauthError = request.nextUrl.searchParams.get('error_description') || request.nextUrl.searchParams.get('error') || '';
    if (oauthError) throw new Error(`Stripe authorization was not completed: ${oauthError}`);
    if (!code || !stateValue) throw new Error('Stripe callback did not include the required authorization values.');

    const state = openOAuthState<OAuthState>(stateValue);
    if (state.provider !== 'stripe-connect' || !state.tenantId || !state.slug || !state.userId) throw new Error('Stripe authorization state is invalid.');

    const tokenResponse = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_secret: process.env.STRIPE_SECRET_KEY || '', code, grant_type: 'authorization_code' }).toString(),
      cache: 'no-store',
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData?.access_token || !tokenData?.stripe_user_id) throw new Error(tokenData?.error_description || 'Stripe authorization failed.');

    await saveFinanceSecret(state.tenantId, 'stripe-connect', {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      stripeUserId: tokenData.stripe_user_id,
      livemode: Boolean(tokenData.livemode),
      scope: tokenData.scope || null,
    });

    let businessName: string | null = null;
    try {
      const accountResponse = await fetch('https://api.stripe.com/v1/account', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        cache: 'no-store',
      });
      const account = await accountResponse.json().catch(() => ({}));
      businessName = account?.business_profile?.name || account?.settings?.dashboard?.display_name || null;
    } catch {}

    const db = getServerClient();
    const { error } = await db.from('customer_finance_connections').upsert({
      tenant_id: state.tenantId,
      provider: 'stripe-connect',
      label: 'Stripe Payments',
      status: 'connected',
      external_account_id: tokenData.stripe_user_id,
      company_name: businessName,
      capabilities: ['charges', 'fees', 'refunds', 'payout economics'],
      metadata: { livemode: Boolean(tokenData.livemode) },
      last_error: null,
      created_by: state.userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,provider' });
    if (error) throw error;

    return NextResponse.redirect(`${ARIDON_PUBLIC_ORIGIN}/workspace/${encodeURIComponent(state.slug)}/finance?connected=stripe`);
  } catch (error) {
    console.error('Stripe Connect callback error', error);
    const message = error instanceof Error ? error.message : 'Stripe connection failed.';
    return NextResponse.redirect(`${fallback}?financeError=${encodeURIComponent(message)}`);
  }
}
