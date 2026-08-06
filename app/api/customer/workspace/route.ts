import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    }

    const slug = request.nextUrl.searchParams.get('slug')?.trim() || '';
    if (!slug) {
      return NextResponse.json({ error: 'Workspace slug is required.' }, { status: 400, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) {
      return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    }

    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json(
        {
          error: 'This workspace needs an active subscription or beta access.',
          billingRequired: true,
          tenant: membership.tenant,
        },
        { status: 402, headers: NO_STORE },
      );
    }

    const db = auth.db;
    const [projectsResult, tasksResult, knowledgeResult] = await Promise.all([
      db.from('customer_projects').select('id,name,description,status,created_at').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(20),
      db.from('customer_tasks').select('id,title,owner,priority,status,created_at').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(30),
      db.from('customer_knowledge').select('id,title,category,created_at').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(20),
    ]);

    if (projectsResult.error) throw projectsResult.error;
    if (tasksResult.error) throw tasksResult.error;
    if (knowledgeResult.error) throw knowledgeResult.error;

    return NextResponse.json(
      {
        email: auth.user.email || '',
        role: membership.role,
        tenant: membership.tenant,
        projects: projectsResult.data || [],
        tasks: tasksResult.data || [],
        knowledge: knowledgeResult.data || [],
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('Customer workspace error', error);
    return NextResponse.json({ error: 'Unable to load this customer workspace.' }, { status: 500, headers: NO_STORE });
  }
}
