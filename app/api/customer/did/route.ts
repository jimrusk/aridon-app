import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { didServerStatus, didUseCases } from '../../../../lib/didProvider';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const slug = (request.nextUrl.searchParams.get('slug') || '').trim().slice(0, 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    return NextResponse.json({ businessName: membership.tenant.business_name, status: didServerStatus(), useCases: didUseCases }, { headers: NO_STORE });
  } catch (error) {
    console.error('D-ID status error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load D-ID status.' }, { status: 500, headers: NO_STORE });
  }
}
