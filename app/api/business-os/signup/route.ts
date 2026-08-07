import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';

const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    if (text(body?.companyTrap, 50)) {
      return NextResponse.json({ saved: true }, { headers: NO_STORE });
    }

    const ownerName = text(body?.ownerName, 120);
    const businessName = text(body?.businessName, 180);
    const email = text(body?.email, 254).toLowerCase();
    const phone = text(body?.phone, 80);
    const website = text(body?.website, 500);
    const industry = text(body?.industry, 160);
    const teamSize = text(body?.teamSize, 60);
    const bottleneck = text(body?.bottleneck, 4000);
    const capabilities = text(body?.capabilities, 4000);
    const referralCode = text(body?.referralCode, 40).toUpperCase();
    const plan = ['launch', 'growth', 'command'].includes(text(body?.plan, 30).toLowerCase()) ? text(body?.plan, 30).toLowerCase() : 'launch';

    if (!ownerName || !businessName || !industry || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Name, business, industry and a valid email are required.' }, { status: 400, headers: NO_STORE });
    }

    const db = getServerClient();
    let referrerTenantId = '';
    if (referralCode) {
      const { data: referral, error: referralLookupError } = await db
        .from('customer_referral_codes')
        .select('tenant_id')
        .eq('code', referralCode)
        .maybeSingle();
      if (referralLookupError) throw referralLookupError;
      referrerTenantId = referral?.tenant_id || '';
    }

    const notes = [
      'PRIVATE BUSINESS OS SIGNUP',
      `Plan: ${plan}`,
      `Industry: ${industry}`,
      teamSize ? `Team size: ${teamSize}` : '',
      phone ? `Phone: ${phone}` : '',
      website ? `Website: ${website}` : '',
      referralCode && referrerTenantId ? `Customer referral: ${referralCode}` : '',
      bottleneck ? `Biggest owner-time bottleneck: ${bottleneck}` : '',
      capabilities ? `Requested first capabilities: ${capabilities}` : '',
      'Next step: qualify fit, confirm scope, then provision a separate customer tenant/workspace.',
    ].filter(Boolean).join('\n');

    const { data, error } = await db.from('leads').insert({
      name: ownerName,
      company: businessName,
      email,
      notes,
      status: 'new',
    }).select('id').single();

    if (error) throw error;

    if (referrerTenantId) {
      const { error: referralError } = await db.from('customer_referrals').insert({
        referrer_tenant_id: referrerTenantId,
        referral_code: referralCode,
        lead_id: data?.id || null,
        referred_business: businessName,
        referred_name: ownerName,
        referred_email: email,
        status: 'signup',
      });
      if (referralError) console.error('Customer referral attribution error', referralError);
    }

    return NextResponse.json({ saved: true, leadId: data?.id || '' }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Business OS signup error', error);
    return NextResponse.json({ error: 'Your request could not be saved right now. Please try again.' }, { status: 500, headers: NO_STORE });
  }
}
