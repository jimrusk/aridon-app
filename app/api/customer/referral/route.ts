import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';
import { appBaseUrl } from '../../../../lib/stripeBilling';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

async function referralCode(db: ReturnType<typeof import('../../../../lib/supabase').getServerClient>, tenantId: string) {
  const { data: existing, error: existingError } = await db
    .from('customer_referral_codes')
    .select('code,created_at')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomBytes(7).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
    const { data, error } = await db
      .from('customer_referral_codes')
      .insert({ tenant_id: tenantId, code })
      .select('code,created_at')
      .single();
    if (!error) return data;
    if (error.code !== '23505') throw error;
  }
  throw new Error('Could not generate a unique referral code.');
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const membership = await customerTenantForUser(auth.user.id);
    if (!membership) return NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE });

    const code = await referralCode(auth.db, membership.tenant.id);
    const { data: referrals, error } = await auth.db
      .from('customer_referrals')
      .select('id,referred_business,referred_email,status,created_at')
      .eq('referrer_tenant_id', membership.tenant.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    return NextResponse.json({
      code: code.code,
      url: `${appBaseUrl(request)}/business-os/signup?ref=${encodeURIComponent(code.code)}`,
      businessName: membership.tenant.business_name,
      referrals: referrals || [],
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer referral error', error);
    return NextResponse.json({ error: 'Unable to create the referral link.' }, { status: 500, headers: NO_STORE });
  }
}
