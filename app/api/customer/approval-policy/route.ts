import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const TITLE = 'Aridon Approval Policy';
const DEFAULT_POLICY = 'Research, analysis, internal planning, and drafting are allowed. External sends, spending, signatures, commitments, consequential claims, and permanent deletion require owner approval.';

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const { data, error } = await resolved.auth.db.from('customer_knowledge').select('id,content').eq('tenant_id', resolved.membership.tenant.id).eq('title', TITLE).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ policy: data?.content || DEFAULT_POLICY }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer approval policy GET error', error);
    return NextResponse.json({ error: 'Unable to load the approval policy.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const policy = text(body?.policy, 5000);
    if (!slug || policy.length < 20) return NextResponse.json({ error: 'Workspace and a clear approval policy are required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const { data: current, error: currentError } = await resolved.auth.db.from('customer_knowledge').select('id').eq('tenant_id', resolved.membership.tenant.id).eq('title', TITLE).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (currentError) throw currentError;

    if (current?.id) {
      const { error } = await resolved.auth.db.from('customer_knowledge').update({ category: 'governance', content: policy }).eq('id', current.id).eq('tenant_id', resolved.membership.tenant.id);
      if (error) throw error;
    } else {
      const { error } = await resolved.auth.db.from('customer_knowledge').insert({ tenant_id: resolved.membership.tenant.id, title: TITLE, category: 'governance', content: policy });
      if (error) throw error;
    }

    await resolved.auth.db.from('customer_usage_events').insert({ tenant_id: resolved.membership.tenant.id, user_id: resolved.auth.user.id, event_name: 'approval_policy_updated', event_data: {} });
    return NextResponse.json({ saved: true, policy }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer approval policy POST error', error);
    return NextResponse.json({ error: 'Unable to save the approval policy.' }, { status: 500, headers: NO_STORE });
  }
}
