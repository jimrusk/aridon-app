import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
function text(value: unknown, max = 160) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function num(value: unknown) { const n = Number(value); return Number.isFinite(n) ? n : null; }

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const slug = text(new URL(request.url).searchParams.get('slug'), 80); const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const { data, error } = await auth.db.from('customer_outcomes').select('*').eq('tenant_id', membership.tenant.id).order('updated_at', { ascending: false });
    if (error) throw error; return NextResponse.json({ outcomes: data || [] }, { headers: NO_STORE });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load outcomes.' }, { status: 500, headers: NO_STORE }); }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json(); const slug = text(body?.slug, 80); const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const name = text(body?.name); const category = text(body?.category, 80); if (!name || !category) return NextResponse.json({ error: 'Name and category are required.' }, { status: 400, headers: NO_STORE });
    const payload = { tenant_id: membership.tenant.id, name, category, source: text(body?.source, 120) || null, baseline_value: num(body?.baselineValue), current_value: num(body?.currentValue), target_value: num(body?.targetValue), unit: text(body?.unit, 40) || null, status: text(body?.status, 40) || 'tracking', attribution: typeof body?.attribution === 'object' && body.attribution ? body.attribution : {}, notes: text(body?.notes, 3000) || null, updated_at: new Date().toISOString() };
    const { data, error } = await auth.db.from('customer_outcomes').insert(payload).select('*').single(); if (error) throw error;
    return NextResponse.json({ outcome: data }, { headers: NO_STORE });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save outcome.' }, { status: 500, headers: NO_STORE }); }
}
