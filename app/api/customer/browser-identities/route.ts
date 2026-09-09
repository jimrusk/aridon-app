import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import {
  browserIdentityConfigured,
  createBrowserContext,
  deleteBrowserContext,
  releaseBrowserSession,
  safeBrowserUrl,
  startIdentityLoginSession,
} from '../../../../lib/browserIdentity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
    return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) } as const;
  }
  return { auth, membership } as const;
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    const resolved = await resolve(request, slug);
    if ('response' in resolved) return resolved.response;

    const { data, error } = await resolved.auth.db
      .from('customer_browser_identities')
      .select('id,name,site_name,login_url,home_url,status,last_session_id,last_verified_at,last_used_at,created_at,updated_at')
      .eq('tenant_id', resolved.membership.tenant.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({
      identities: data || [],
      role: resolved.membership.role,
      controlRole: CONTROL_ROLES.has(resolved.membership.role),
      browserProviderConfigured: browserIdentityConfigured(),
    }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load browser identities.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const command = text(body?.command, 40).toLowerCase() || 'create';
    const resolved = await resolve(request, slug);
    if ('response' in resolved) return resolved.response;
    if (!CONTROL_ROLES.has(resolved.membership.role)) {
      return NextResponse.json({ error: 'Owner or admin access is required to manage persistent browser identities.' }, { status: 403, headers: NO_STORE });
    }

    const tenantId = resolved.membership.tenant.id;
    const now = new Date().toISOString();

    if (command === 'create') {
      if (!browserIdentityConfigured()) {
        return NextResponse.json({ error: 'Browserbase is not configured yet. Add the Browserbase API key and project ID in Vercel first.' }, { status: 409, headers: NO_STORE });
      }
      const name = text(body?.name, 160);
      const siteName = text(body?.siteName, 160);
      const loginUrl = safeBrowserUrl(body?.loginUrl);
      const homeUrl = safeBrowserUrl(body?.homeUrl) || loginUrl;
      if (!name || !loginUrl) {
        return NextResponse.json({ error: 'Identity name and a valid HTTPS login URL are required.' }, { status: 400, headers: NO_STORE });
      }
      const created = await createBrowserContext();
      try {
        const { data, error } = await resolved.auth.db.from('customer_browser_identities').insert({
          tenant_id: tenantId,
          created_by: resolved.auth.user.id,
          name,
          site_name: siteName || null,
          login_url: loginUrl,
          home_url: homeUrl || null,
          context_id: created.contextId,
          status: 'new',
          updated_at: now,
        }).select('id,name,site_name,login_url,home_url,status,last_session_id,last_verified_at,last_used_at,created_at,updated_at').single();
        if (error) throw error;
        return NextResponse.json({ identity: data }, { status: 201, headers: NO_STORE });
      } catch (error) {
        await deleteBrowserContext(created.contextId).catch(() => undefined);
        throw error;
      }
    }

    const id = text(body?.id, 80);
    if (!id) return NextResponse.json({ error: 'Browser identity ID is required.' }, { status: 400, headers: NO_STORE });
    const { data: identity, error: identityError } = await resolved.auth.db
      .from('customer_browser_identities')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (identityError) throw identityError;
    if (!identity) return NextResponse.json({ error: 'Browser identity not found.' }, { status: 404, headers: NO_STORE });

    if (command === 'start_login' || command === 'reauthenticate') {
      if (!browserIdentityConfigured()) return NextResponse.json({ error: 'Browserbase is not configured.' }, { status: 409, headers: NO_STORE });
      if (identity.last_session_id) await releaseBrowserSession(identity.last_session_id).catch(() => undefined);
      const session = await startIdentityLoginSession({
        contextId: identity.context_id,
        loginUrl: identity.login_url || identity.home_url || '',
        tenantId,
        identityId: identity.id,
      });
      const { data: updated, error } = await resolved.auth.db.from('customer_browser_identities').update({
        status: 'login_required',
        last_session_id: session.sessionId,
        updated_at: now,
      }).eq('id', identity.id).eq('tenant_id', tenantId)
        .select('id,name,site_name,login_url,home_url,status,last_session_id,last_verified_at,last_used_at,created_at,updated_at').single();
      if (error) throw error;
      return NextResponse.json({ identity: updated, liveViewUrl: session.liveViewUrl }, { headers: NO_STORE });
    }

    if (command === 'finish_login') {
      if (identity.last_session_id) await releaseBrowserSession(identity.last_session_id).catch(() => undefined);
      const { data: updated, error } = await resolved.auth.db.from('customer_browser_identities').update({
        status: 'connected',
        last_verified_at: now,
        last_session_id: null,
        updated_at: now,
      }).eq('id', identity.id).eq('tenant_id', tenantId)
        .select('id,name,site_name,login_url,home_url,status,last_session_id,last_verified_at,last_used_at,created_at,updated_at').single();
      if (error) throw error;
      return NextResponse.json({ identity: updated, message: 'Authentication state saved. Eva can reuse this identity in future browser workers.' }, { headers: NO_STORE });
    }

    if (command === 'disable') {
      if (identity.last_session_id) await releaseBrowserSession(identity.last_session_id).catch(() => undefined);
      const { data: updated, error } = await resolved.auth.db.from('customer_browser_identities').update({
        status: 'disabled', last_session_id: null, session_lease_until: null, updated_at: now,
      }).eq('id', identity.id).eq('tenant_id', tenantId)
        .select('id,name,site_name,login_url,home_url,status,last_session_id,last_verified_at,last_used_at,created_at,updated_at').single();
      if (error) throw error;
      return NextResponse.json({ identity: updated }, { headers: NO_STORE });
    }

    if (command === 'delete') {
      if (identity.last_session_id) await releaseBrowserSession(identity.last_session_id).catch(() => undefined);
      await deleteBrowserContext(identity.context_id).catch(() => undefined);
      const { error } = await resolved.auth.db.from('customer_browser_identities').delete().eq('id', identity.id).eq('tenant_id', tenantId);
      if (error) throw error;
      return NextResponse.json({ deleted: true }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: 'Unsupported browser identity command.' }, { status: 400, headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Browser identity command failed.' }, { status: 500, headers: NO_STORE });
  }
}
