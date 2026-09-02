import { NextRequest, NextResponse } from 'next/server';
import { normalizePaloAltoEvent } from '../../../../../../lib/sentinelPaloAlto';
import { getUserScopedClient } from '../../../../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  return authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const token = bearerToken(request);
    if (!token) return NextResponse.json({ error: 'A signed-in Aridon session is required.' }, { status: 401, headers: NO_STORE });

    const body = (await request.json()) as { tenantId?: string; event?: unknown; simulation?: boolean };
    if (!body.tenantId || !body.event) {
      return NextResponse.json({ error: 'tenantId and event are required.' }, { status: 400, headers: NO_STORE });
    }

    const userDb = getUserScopedClient(token);
    const { data: membership } = await userDb
      .from('customer_memberships')
      .select('tenant_id,user_id,role')
      .eq('tenant_id', body.tenantId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'You do not have access to this company workspace.' }, { status: 403, headers: NO_STORE });
    }

    const normalized = normalizePaloAltoEvent(body.event, body.tenantId, body.simulation !== false);
    return NextResponse.json({ normalized }, { headers: NO_STORE });
  } catch (error) {
    console.error('Sentinel Palo Alto preview error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to analyze the event.' }, { status: 500, headers: NO_STORE });
  }
}
