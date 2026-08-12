import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../lib/supabase';

export const runtime = 'nodejs';

const allowedStates = new Set(['NM','AZ']);

function clean(value: unknown, max = 1000) {
  return String(value ?? '').trim().slice(0, max);
}

function optionalInt(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(1000000, Math.round(n));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (clean(body.companyTrap, 120)) return NextResponse.json({ ok: true });

    const ownerName = clean(body.ownerName, 120);
    const businessName = clean(body.businessName, 180);
    const email = clean(body.email, 220).toLowerCase();
    const phone = clean(body.phone, 80) || null;
    const website = clean(body.website, 300) || null;
    const state = clean(body.state, 2).toUpperCase();
    const serviceType = clean(body.serviceType, 120);
    const currentTools = clean(body.currentTools, 500) || null;
    const leakToTest = clean(body.leakToTest, 1500);
    const openEstimates = optionalInt(body.openEstimates);
    const dormantCustomers = optionalInt(body.dormantCustomers);

    if (!ownerName || !businessName || !email || !serviceType || !leakToTest || !allowedStates.has(state)) {
      return NextResponse.json({ error: 'Please complete the required fields and choose New Mexico or Arizona.' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please use a valid email address.' }, { status: 400 });

    const db = getServerClient();
    const { error } = await db.from('revenue_recovery_pilot_requests').insert({
      owner_name: ownerName,
      business_name: businessName,
      email,
      phone,
      website,
      state,
      service_type: serviceType,
      open_estimates: openEstimates,
      dormant_customers: dormantCustomers,
      current_tools: currentTools,
      leak_to_test: leakToTest,
      status: 'new',
    });
    if (error) {
      console.error('Revenue Recovery pilot request insert failed', error);
      return NextResponse.json({ error: 'We could not save the request. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Revenue Recovery pilot request error', error);
    return NextResponse.json({ error: 'We could not process the request.' }, { status: 500 });
  }
}
