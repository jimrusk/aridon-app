import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { runCloudWorker } from '../../../../lib/cloudWorker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const CONTROL_ROLES = new Set(['owner', 'admin']);

function text(value: unknown, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function positiveInt(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(max, Math.round(parsed)));
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    const workerId = text(request.nextUrl.searchParams.get('workerId'), 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    let workersQuery = auth.db
      .from('customer_cloud_workers')
      .select('*')
      .eq('tenant_id', membership.tenant.id)
      .order('created_at', { ascending: false })
      .limit(40);
    if (workerId) workersQuery = workersQuery.eq('id', workerId);

    const [workersResult, identitiesResult] = await Promise.all([
      workersQuery,
      auth.db
        .from('customer_browser_identities')
        .select('id,name,site_name,login_url,home_url,status,last_verified_at,last_used_at,updated_at')
        .eq('tenant_id', membership.tenant.id)
        .order('updated_at', { ascending: false }),
    ]);
    if (workersResult.error) throw workersResult.error;
    if (identitiesResult.error) throw identitiesResult.error;

    const workers = workersResult.data || [];
    const workerIds = workers.map((item) => item.id);
    let events: any[] = [];
    if (workerIds.length) {
      const eventsResult = await auth.db
        .from('customer_cloud_worker_events')
        .select('id,worker_id,event_type,message,payload,created_at')
        .eq('tenant_id', membership.tenant.id)
        .in('worker_id', workerIds)
        .order('created_at', { ascending: false })
        .limit(workerId ? 100 : 80);
      if (eventsResult.error) throw eventsResult.error;
      events = eventsResult.data || [];
    }

    return NextResponse.json({
      workers,
      events,
      browserIdentities: identitiesResult.data || [],
      controlRole: CONTROL_ROLES.has(membership.role),
      role: membership.role,
      browserProviderConfigured: Boolean(process.env.BROWSERBASE_API_KEY?.trim() && process.env.BROWSERBASE_PROJECT_ID?.trim()),
      schedulerConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load Cloud Workers.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const body = await request.json();
    const slug = text(body?.slug, 80);
    const command = text(body?.command, 40).toLowerCase() || 'create';
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    if (command === 'create') {
      const objective = text(body?.objective, 7000);
      const name = text(body?.name, 200) || `Eva Worker · ${objective.slice(0, 70)}`;
      const mode = ['research', 'browser', 'mixed'].includes(text(body?.mode, 30).toLowerCase()) ? text(body?.mode, 30).toLowerCase() : 'research';
      const priority = ['low', 'medium', 'high', 'urgent'].includes(text(body?.priority, 30).toLowerCase()) ? text(body?.priority, 30).toLowerCase() : 'medium';
      const maxCycles = positiveInt(body?.maxCycles, 6, 12);
      const browserIdentityId = text(body?.browserIdentityId, 80) || null;
      if (objective.length < 4) return NextResponse.json({ error: 'Give Eva a clear worker objective.' }, { status: 400, headers: NO_STORE });

      if (browserIdentityId && !['browser', 'mixed'].includes(mode)) {
        return NextResponse.json({ error: 'A persistent browser identity can only be attached to a Browser or Mixed worker.' }, { status: 400, headers: NO_STORE });
      }
      if (browserIdentityId) {
        const { data: identity, error: identityError } = await auth.db
          .from('customer_browser_identities')
          .select('id,status')
          .eq('id', browserIdentityId)
          .eq('tenant_id', membership.tenant.id)
          .maybeSingle();
        if (identityError) throw identityError;
        if (!identity) return NextResponse.json({ error: 'That browser identity does not belong to this workspace.' }, { status: 404, headers: NO_STORE });
        if (identity.status !== 'connected') {
          return NextResponse.json({ error: 'Authenticate that browser identity before assigning it to Eva.' }, { status: 409, headers: NO_STORE });
        }
      }

      const now = new Date().toISOString();
      const { data: worker, error } = await auth.db.from('customer_cloud_workers').insert({
        tenant_id: membership.tenant.id,
        requested_by: auth.user.id,
        executive: 'Eva',
        name,
        objective,
        mode,
        priority,
        status: 'queued',
        provider: ['browser', 'mixed'].includes(mode) ? 'browser-plus-web' : 'openai-web',
        browser_identity_id: browserIdentityId,
        checkpoint: {},
        result: {},
        cycle_count: 0,
        max_cycles: maxCycles,
        next_run_at: now,
        updated_at: now,
      }).select('*').single();
      if (error) throw error;

      await auth.db.from('customer_cloud_worker_events').insert({
        tenant_id: membership.tenant.id,
        worker_id: worker.id,
        event_type: 'created',
        message: browserIdentityId ? 'Eva cloud worker created with a persistent authenticated browser identity.' : 'Eva cloud worker created and queued.',
        payload: { objective, mode, priority, maxCycles, browserIdentityId },
      });

      if (body?.runNow === false) return NextResponse.json({ worker, queued: true }, { status: 201, headers: NO_STORE });

      try {
        const run = await runCloudWorker(worker.id);
        return NextResponse.json({ worker: run.worker, run, queued: false }, { status: 201, headers: NO_STORE });
      } catch (runError) {
        return NextResponse.json({ worker, queued: true, warning: runError instanceof Error ? runError.message : 'Worker was queued but the first cycle did not finish.' }, { status: 201, headers: NO_STORE });
      }
    }

    if (!CONTROL_ROLES.has(membership.role)) {
      return NextResponse.json({ error: 'Owner or admin access is required to control Cloud Workers.' }, { status: 403, headers: NO_STORE });
    }

    const id = text(body?.id, 80);
    if (!id) return NextResponse.json({ error: 'Worker ID is required.' }, { status: 400, headers: NO_STORE });

    const { data: current, error: currentError } = await auth.db
      .from('customer_cloud_workers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', membership.tenant.id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) return NextResponse.json({ error: 'Cloud worker not found.' }, { status: 404, headers: NO_STORE });

    if (command === 'run_now') {
      if (['completed', 'cancelled'].includes(current.status)) {
        return NextResponse.json({ error: `A ${current.status} worker cannot be run again. Create a new worker instead.` }, { status: 409, headers: NO_STORE });
      }
      const run = await runCloudWorker(id);
      return NextResponse.json({ worker: run.worker, run }, { headers: NO_STORE });
    }

    const now = new Date().toISOString();
    let patch: Record<string, unknown> = { updated_at: now };
    if (command === 'pause') patch = { ...patch, status: 'paused', paused_at: now, lease_until: null, next_run_at: null };
    else if (command === 'resume') patch = { ...patch, status: 'queued', paused_at: null, lease_until: null, next_run_at: now, error: null };
    else if (command === 'cancel') patch = { ...patch, status: 'cancelled', lease_until: null, next_run_at: null, completed_at: now };
    else return NextResponse.json({ error: 'Unsupported Cloud Worker command.' }, { status: 400, headers: NO_STORE });

    const { data: worker, error } = await auth.db
      .from('customer_cloud_workers')
      .update(patch)
      .eq('id', id)
      .eq('tenant_id', membership.tenant.id)
      .select('*')
      .single();
    if (error) throw error;

    await auth.db.from('customer_cloud_worker_events').insert({
      tenant_id: membership.tenant.id,
      worker_id: id,
      event_type: command,
      message: `Owner command: ${command}.`,
      payload: { by: auth.user.id },
    });

    return NextResponse.json({ worker }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cloud Worker command failed.' }, { status: 500, headers: NO_STORE });
  }
}
