import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import {
  disconnectDirectIntegration,
  normalizeDirectProvider,
  saveDirectIntegration,
  validVercelDeployHook,
  verifyGitHubToken,
} from '../../../../lib/directIntegrations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const CONTROL_ROLES = new Set(['owner', 'admin']);

function text(value: unknown, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function resolve(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) } as const;
  const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
  if (!membership) return { response: NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE }) } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) } as const;
  return { auth, membership } as const;
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    const resolved = await resolve(request, slug);
    if ('response' in resolved) return resolved.response;
    const { data, error } = await resolved.auth.db.from('customer_direct_integrations')
      .select('id,provider,label,status,metadata,last_verified_at,created_at,updated_at')
      .eq('tenant_id', resolved.membership.tenant.id)
      .order('provider', { ascending: true });
    if (error) throw error;
    return NextResponse.json({
      integrations: data || [],
      role: resolved.membership.role,
      controlRole: CONTROL_ROLES.has(resolved.membership.role),
    }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load direct integrations.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const command = text(body?.command, 40).toLowerCase() || 'connect';
    const resolved = await resolve(request, slug);
    if ('response' in resolved) return resolved.response;
    if (!CONTROL_ROLES.has(resolved.membership.role)) {
      return NextResponse.json({ error: 'Owner or admin access is required to manage direct integrations.' }, { status: 403, headers: NO_STORE });
    }

    const provider = normalizeDirectProvider(body?.provider);
    if (!provider) return NextResponse.json({ error: 'Unsupported direct integration provider.' }, { status: 400, headers: NO_STORE });
    const tenantId = resolved.membership.tenant.id;

    if (command === 'disconnect') {
      await disconnectDirectIntegration({ db: resolved.auth.db, tenantId, provider });
      return NextResponse.json({ disconnected: true, provider }, { headers: NO_STORE });
    }

    if (command !== 'connect') return NextResponse.json({ error: 'Unsupported direct integration command.' }, { status: 400, headers: NO_STORE });
    const secret = text(body?.secret, 6000);
    if (!secret) return NextResponse.json({ error: 'Connection credential is required.' }, { status: 400, headers: NO_STORE });

    if (provider === 'github') {
      const profile = await verifyGitHubToken(secret);
      const defaultRepo = text(body?.defaultRepo, 240);
      const integration = await saveDirectIntegration({
        db: resolved.auth.db,
        tenantId,
        userId: resolved.auth.user.id,
        provider,
        secret,
        label: profile.login,
        metadata: { account: profile.login, name: profile.name, avatarUrl: profile.avatarUrl, defaultRepo },
        verified: true,
      });
      return NextResponse.json({ integration }, { headers: NO_STORE });
    }

    if (!validVercelDeployHook(secret)) {
      return NextResponse.json({ error: 'Use a valid Vercel Deployment Hook URL from api.vercel.com.' }, { status: 400, headers: NO_STORE });
    }
    const projectName = text(body?.projectName, 200);
    const integration = await saveDirectIntegration({
      db: resolved.auth.db,
      tenantId,
      userId: resolved.auth.user.id,
      provider,
      secret,
      label: projectName || 'Vercel deployment hook',
      metadata: { projectName },
      verified: false,
    });
    return NextResponse.json({ integration }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Direct integration command failed.' }, { status: 500, headers: NO_STORE });
  }
}
