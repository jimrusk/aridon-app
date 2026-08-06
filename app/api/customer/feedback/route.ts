import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const slug = text(body?.slug, 80);
    const rating = Math.min(Math.max(Number(body?.rating || 0), 1), 5);
    const likes = text(body?.likes, 5000);
    const problems = text(body?.problems, 5000);
    const missing = text(body?.missing, 5000);
    const recommend = text(body?.recommend, 1000);
    const notes = text(body?.notes, 5000);

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });

    const { data, error } = await auth.db
      .from('customer_feedback')
      .insert({
        tenant_id: membership.tenant.id,
        user_id: auth.user.id,
        rating,
        likes,
        problems,
        missing,
        recommend,
        notes,
      })
      .select('id,created_at')
      .single();
    if (error) throw error;

    return NextResponse.json({ saved: true, feedback: data }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Customer feedback error', error);
    return NextResponse.json({ error: 'Feedback could not be saved right now.' }, { status: 500, headers: NO_STORE });
  }
}
