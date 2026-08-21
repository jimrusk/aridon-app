import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { executives } from '../../../../lib/executives';
import { identityFor } from '../../../../lib/executiveIdentity';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: string | null, max = 100) { return (value || '').trim().slice(0, max); }

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const slug = clean(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });

    const db = auth.db;
    const [memories, reflections] = await Promise.all([
      db.from('customer_executive_memories').select('id,executive_id,memory_type,summary,confidence,source,created_at,last_reinforced_at').eq('tenant_id', membership.tenant.id).order('last_reinforced_at', { ascending: false }).limit(200),
      db.from('customer_executive_reflections').select('id,executive_id,reflection,confidence,created_at').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(100),
    ]);
    if (memories.error) throw memories.error;
    if (reflections.error) throw reflections.error;

    const roster = executives.map((executive) => ({ id: executive.id, name: executive.name, role: executive.role, color: executive.color, identity: identityFor(executive.id) }));
    return NextResponse.json({ businessName: membership.tenant.business_name, roster, memories: memories.data || [], reflections: reflections.data || [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Executive identity GET error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load executive identity.' }, { status: 500, headers: NO_STORE });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = typeof body?.slug === 'string' ? body.slug.trim().slice(0, 80) : '';
    const id = typeof body?.id === 'string' ? body.id.trim().slice(0, 80) : '';
    const kind = body?.kind === 'reflection' ? 'reflection' : 'memory';
    if (!slug || !id) return NextResponse.json({ error: 'Workspace and record id are required.' }, { status: 400, headers: NO_STORE });
    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const table = kind === 'reflection' ? 'customer_executive_reflections' : 'customer_executive_memories';
    const result = await auth.db.from(table).delete().eq('tenant_id', membership.tenant.id).eq('id', id);
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('Executive identity DELETE error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to remove the record.' }, { status: 500, headers: NO_STORE });
  }
}
