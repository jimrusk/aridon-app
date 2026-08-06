import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const db = getServerClient();
    const { data, error } = await db
      .from('customer_feedback')
      .select('id,tenant_id,rating,likes,problems,missing,recommend,notes,created_at,customer_tenants(business_name,slug,plan,subscription_status)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json(data || [], { headers: NO_STORE });
  } catch (error) {
    console.error('Customer feedback review error', error);
    return NextResponse.json({ error: 'Unable to load customer feedback.' }, { status: 500, headers: NO_STORE });
  }
}
