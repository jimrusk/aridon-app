import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { phoneBridgeHash, phoneBridgePairingCode, phoneBridgeConnectionStatus } from '../../../../lib/googleVoiceBridge';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function membershipFor(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) } as const;
  const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
  if (!membership) return { response: NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE }) } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
    return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) } as const;
  }
  return { auth, membership } as const;
}

export async function GET(request: NextRequest) {
  try {
    const slug = clean(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const access = await membershipFor(request, slug);
    if ('response' in access) return access.response;

    const { auth, membership } = access;
    const [connection, bridgesResult, jobsResult] = await Promise.all([
      phoneBridgeConnectionStatus(membership.tenant.id, auth.db),
      auth.db
        .from('customer_phone_bridges')
        .select('id,name,status,last_seen_at,metadata,created_at,updated_at')
        .eq('tenant_id', membership.tenant.id)
        .order('created_at', { ascending: false })
        .limit(10),
      auth.db
        .from('customer_phone_jobs')
        .select('id,direction,phone,contact_name,company_name,objective,state,error,summary,created_at,started_at,ended_at')
        .eq('tenant_id', membership.tenant.id)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (bridgesResult.error) throw bridgesResult.error;
    if (jobsResult.error) throw jobsResult.error;

    return NextResponse.json({ connection, bridges: bridgesResult.data || [], jobs: jobsResult.data || [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Phone Bridge GET failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load Eva Phone Bridge.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json();
    const slug = clean(body?.slug, 80);
    const action = clean(body?.action, 40);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const access = await membershipFor(request, slug);
    if ('response' in access) return access.response;
    const { auth, membership } = access;

    if (action === 'create_pairing') {
      const code = phoneBridgePairingCode();
      const now = Date.now();
      const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();
      const name = clean(body?.name, 120) || 'Eva Phone Bridge';

      const inserted = await auth.db.from('customer_phone_bridges').insert({
        tenant_id: membership.tenant.id,
        name,
        status: 'pairing',
        pairing_code_hash: phoneBridgeHash(code),
        pairing_expires_at: expiresAt,
        auth_token_hash: null,
        last_seen_at: null,
        metadata: {},
        created_by: auth.user.id,
        updated_at: new Date(now).toISOString(),
      }).select('id,name,status,pairing_expires_at').single();
      if (inserted.error) throw inserted.error;

      return NextResponse.json({
        ok: true,
        bridgeId: inserted.data.id,
        pairingCode: code,
        expiresAt,
        message: 'Pairing code created. Enter it in the Eva Phone Bridge on the computer that stays signed into Google Voice.',
      }, { headers: NO_STORE });
    }

    if (action === 'disconnect') {
      const bridgeId = clean(body?.bridgeId, 80);
      if (!bridgeId) return NextResponse.json({ error: 'Bridge id is required.' }, { status: 400, headers: NO_STORE });
      const result = await auth.db.from('customer_phone_bridges').update({
        status: 'revoked',
        auth_token_hash: null,
        pairing_code_hash: null,
        pairing_expires_at: null,
        updated_at: new Date().toISOString(),
      }).eq('tenant_id', membership.tenant.id).eq('id', bridgeId).select('id,status').single();
      if (result.error) throw result.error;
      return NextResponse.json({ ok: true, bridge: result.data }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: 'Unknown Phone Bridge action.' }, { status: 400, headers: NO_STORE });
  } catch (error) {
    console.error('Phone Bridge POST failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Eva Phone Bridge could not complete the request.' }, { status: 500, headers: NO_STORE });
  }
}
