import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const text = (value: unknown, max = 4000) => typeof value === 'string' ? value.trim().slice(0, max) : '';

function cleanCriteria(value: unknown) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const number = (key: string) => Math.max(0, Number(source[key]) || 0);
  return {
    industries: text(source.industries, 1000),
    geographies: text(source.geographies, 1000),
    min_revenue: number('min_revenue'),
    max_revenue: number('max_revenue'),
    min_ebitda: number('min_ebitda'),
    max_price: number('max_price'),
    max_multiple: number('max_multiple'),
    min_recurring_revenue_pct: Math.min(100, number('min_recurring_revenue_pct')),
    max_top_customer_pct: Math.min(100, number('max_top_customer_pct')),
    max_owner_dependency_pct: Math.min(100, number('max_owner_dependency_pct')),
    max_capex_pct: Math.min(100, number('max_capex_pct')),
    required_seller_finance_pct: Math.min(100, number('required_seller_finance_pct')),
    preferred_traits: text(source.preferred_traits, 4000),
    exclusion_traits: text(source.exclusion_traits, 4000),
  };
}

export async function GET() {
  try {
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_theses').select('*').eq('active', true).order('updated_at', { ascending: false }).limit(10);
    if (error) throw error;
    return NextResponse.json(data ?? [], { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition thesis GET error', error);
    return NextResponse.json({ error: 'Unable to load acquisition thesis.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json();
    const name = text(body?.name, 180) || 'Primary Acquisition Thesis';
    const criteria = cleanCriteria(body?.criteria);
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_theses').insert({ name, active: body?.active !== false, criteria, updated_at: new Date().toISOString() }).select('*').single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition thesis POST error', error);
    return NextResponse.json({ error: 'Unable to save acquisition thesis.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = text(body?.id, 80);
    if (!id) return NextResponse.json({ error: 'Thesis ID is required.' }, { status: 400, headers: NO_STORE });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ('name' in body) patch.name = text(body.name, 180) || 'Acquisition Thesis';
    if ('active' in body) patch.active = body.active === true;
    if ('criteria' in body) patch.criteria = cleanCriteria(body.criteria);
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_theses').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition thesis PATCH error', error);
    return NextResponse.json({ error: 'Unable to update acquisition thesis.' }, { status: 500, headers: NO_STORE });
  }
}
