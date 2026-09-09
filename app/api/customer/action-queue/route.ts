import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';
import {
  ACTION_ADAPTERS,
  actionAdapterDefinition,
  normalizeActionAdapterKey,
} from '../../../../lib/actionFabric';
import {
  DIRECT_ACTION_ADAPTERS,
  directActionDefinition,
  normalizeDirectActionAdapterKey,
} from '../../../../lib/directActionAdapters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const CONTROL_ROLES = new Set(['owner', 'admin']);

function text(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function objectPayload(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function adapterSpec(value: unknown, actionType?: unknown) {
  const directKey = normalizeDirectActionAdapterKey(value, actionType);
  if (directKey) return { key: directKey, adapter: directActionDefinition(directKey), direct: true } as const;
  const key = normalizeActionAdapterKey(value, actionType);
  return { key, adapter: actionAdapterDefinition(key), direct: false } as const;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });

    const [actionsResult, executionsResult] = await Promise.all([
      auth.db
        .from('customer_action_queue')
        .select('*')
        .eq('tenant_id', membership.tenant.id)
        .order('created_at', { ascending: false })
        .limit(100),
      auth.db
        .from('customer_action_executions')
        .select('id,action_id,adapter_key,attempt_no,status,output,error,started_at,finished_at,created_at')
        .eq('tenant_id', membership.tenant.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    if (actionsResult.error) throw actionsResult.error;
    if (executionsResult.error) throw executionsResult.error;

    return NextResponse.json({
      actions: actionsResult.data || [],
      executions: executionsResult.data || [],
      adapters: [...ACTION_ADAPTERS, ...DIRECT_ACTION_ADAPTERS],
      controlRole: CONTROL_ROLES.has(membership.role),
      role: membership.role,
    }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load action queue.' }, { status: 500, headers: NO_STORE });
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
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });

    const title = text(body?.title, 500);
    const executive = text(body?.executive, 80) || 'Eva';
    const actionType = text(body?.actionType, 80) || 'business_action';
    const spec = adapterSpec(body?.adapterKey, actionType);
    const requestedNoApproval = body?.approvalRequired === false;
    const approvalRequired = spec.adapter.requiresApproval || !CONTROL_ROLES.has(membership.role) || !requestedNoApproval;

    if (!title) return NextResponse.json({ error: 'Action title is required.' }, { status: 400, headers: NO_STORE });

    const idempotencyKey = text(body?.idempotencyKey, 200) || null;
    if (idempotencyKey) {
      const { data: existing, error: existingError } = await auth.db
        .from('customer_action_queue')
        .select('*')
        .eq('tenant_id', membership.tenant.id)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) return NextResponse.json({ action: existing, existing: true }, { headers: NO_STORE });
    }

    const connection = spec.adapter.connection;
    const connectionKey = connection === 'workspace' ? 'workspace-account' : connection === 'none' ? null : connection;
    const now = new Date().toISOString();
    const { data, error } = await auth.db
      .from('customer_action_queue')
      .insert({
        tenant_id: membership.tenant.id,
        requested_by: auth.user.id,
        executive,
        action_type: actionType,
        adapter_key: spec.key,
        title,
        payload: objectPayload(body?.payload),
        rationale: text(body?.rationale, 2500) || null,
        expected_outcome: text(body?.expectedOutcome, 1200) || null,
        risk_level: text(body?.riskLevel, 20) || (spec.adapter.category === 'external' ? 'medium' : 'low'),
        approval_required: approvalRequired,
        status: approvalRequired ? 'proposed' : 'approved',
        approved_by: approvalRequired ? null : auth.user.id,
        approved_at: approvalRequired ? null : now,
        source: text(body?.source, 80) || 'action-center',
        source_ref: text(body?.sourceRef, 200) || null,
        idempotency_key: idempotencyKey,
        connection_key: connectionKey,
        updated_at: now,
      })
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ action: data, adapter: spec.adapter }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create action.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const body = await request.json();
    const slug = text(body?.slug, 80);
    const id = text(body?.id, 80);
    const requestedStatus = text(body?.status, 30).toLowerCase();
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!CONTROL_ROLES.has(membership.role)) {
      return NextResponse.json({ error: 'Owner or admin approval is required to change execution state.' }, { status: 403, headers: NO_STORE });
    }
    if (!id) return NextResponse.json({ error: 'Action ID is required.' }, { status: 400, headers: NO_STORE });

    const { data: current, error: currentError } = await auth.db
      .from('customer_action_queue')
      .select('id,status,adapter_key,action_type,approval_required,approved_at')
      .eq('id', id)
      .eq('tenant_id', membership.tenant.id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) return NextResponse.json({ error: 'Action not found.' }, { status: 404, headers: NO_STORE });
    if (['completed', 'rejected', 'executing'].includes(current.status) && requestedStatus) {
      return NextResponse.json({ error: `Actions in ${current.status} status cannot be changed this way.` }, { status: 409, headers: NO_STORE });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ('adapterKey' in body) patch.adapter_key = adapterSpec(body?.adapterKey, current.action_type).key;
    if ('payload' in body) patch.payload = objectPayload(body?.payload);
    if ('rationale' in body) patch.rationale = text(body?.rationale, 2500) || null;
    if ('expectedOutcome' in body) patch.expected_outcome = text(body?.expectedOutcome, 1200) || null;
    if ('riskLevel' in body) patch.risk_level = text(body?.riskLevel, 20) || 'medium';

    if (requestedStatus) {
      if (!['approved', 'rejected', 'completed'].includes(requestedStatus)) {
        return NextResponse.json({ error: 'Unsupported status.' }, { status: 400, headers: NO_STORE });
      }
      if (requestedStatus === 'completed') {
        const spec = adapterSpec(current.adapter_key, current.action_type);
        if (spec.key !== 'manual') {
          return NextResponse.json({ error: 'Executable actions must run through Action Fabric instead of being marked complete manually.' }, { status: 409, headers: NO_STORE });
        }
        patch.result = { manual: true, completedBy: auth.user.id };
        patch.executed_at = new Date().toISOString();
      }
      patch.status = requestedStatus;
      if (requestedStatus === 'approved') {
        patch.approved_by = auth.user.id;
        patch.approved_at = new Date().toISOString();
        patch.error = null;
      }
      if (requestedStatus === 'rejected') patch.error = null;
    }

    const { data, error } = await auth.db
      .from('customer_action_queue')
      .update(patch)
      .eq('id', id)
      .eq('tenant_id', membership.tenant.id)
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ action: data }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update action.' }, { status: 500, headers: NO_STORE });
  }
}
