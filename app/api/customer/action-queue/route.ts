import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
function text(value: unknown, max = 500) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const slug = text(new URL(request.url).searchParams.get('slug'), 80); const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const { data, error } = await auth.db.from('customer_action_queue').select('*').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw error; return NextResponse.json({ actions: data || [] }, { headers: NO_STORE });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load action queue.' }, { status: 500, headers: NO_STORE }); }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json(); const slug = text(body?.slug, 80); const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const title = text(body?.title, 240); const executive = text(body?.executive, 80) || 'Eva'; const actionType = text(body?.actionType, 80) || 'business_action';
    if (!title) return NextResponse.json({ error: 'Action title is required.' }, { status: 400, headers: NO_STORE });
    const { data, error } = await auth.db.from('customer_action_queue').insert({ tenant_id: membership.tenant.id, requested_by: auth.user.id, executive, action_type: actionType, title, payload: typeof body?.payload === 'object' && body.payload ? body.payload : {}, rationale: text(body?.rationale, 2500) || null, expected_outcome: text(body?.expectedOutcome, 1200) || null, risk_level: text(body?.riskLevel, 20) || 'medium', approval_required: body?.approvalRequired !== false, status: body?.approvalRequired === false ? 'approved' : 'proposed' }).select('*').single();
    if (error) throw error; return NextResponse.json({ action: data }, { headers: NO_STORE });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create action.' }, { status: 500, headers: NO_STORE }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json(); const slug = text(body?.slug, 80); const id = text(body?.id, 80); const status = text(body?.status, 30); const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!['approved','rejected','completed','failed'].includes(status)) return NextResponse.json({ error: 'Unsupported status.' }, { status: 400, headers: NO_STORE });
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'approved') { patch.approved_by = auth.user.id; patch.approved_at = new Date().toISOString(); }
    if (status === 'completed' || status === 'failed') patch.executed_at = new Date().toISOString();
    const { data, error } = await auth.db.from('customer_action_queue').update(patch).eq('id', id).eq('tenant_id', membership.tenant.id).select('*').single();
    if (error) throw error; return NextResponse.json({ action: data }, { headers: NO_STORE });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update action.' }, { status: 500, headers: NO_STORE }); }
}
