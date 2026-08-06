import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id);
    if (!membership) {
      return NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE });
    }

    return NextResponse.json(
      {
        email: auth.user.email || '',
        role: membership.role,
        tenant: membership.tenant,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('Customer me error', error);
    return NextResponse.json({ error: 'Unable to load the customer account.' }, { status: 500, headers: NO_STORE });
  }
}
