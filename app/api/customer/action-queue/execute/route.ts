import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../lib/customerAuth';
import {
  ActionFabricBlockedError,
  executeActionAdapter,
  normalizeActionAdapterKey,
  type ActionFabricRecord,
} from '../../../../../lib/actionFabric';
import {
  directActionDefinition,
  executeDirectActionAdapter,
  normalizeDirectActionAdapterKey,
} from '../../../../../lib/directActionAdapters';
import { externalActionsEnabled } from '../../../../../lib/executiveOps';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const CONTROL_ROLES = new Set(['owner', 'admin']);

function text(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  let executionId = '';
  let actionId = '';
  let tenantId = '';
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const body = await request.json();
    const slug = text(body?.slug, 80);
    actionId = text(body?.id, 80);
    if (!slug || !actionId) {
      return NextResponse.json({ error: 'Workspace and action ID are required.' }, { status: 400, headers: NO_STORE });
    }

    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!CONTROL_ROLES.has(membership.role)) {
      return NextResponse.json({ error: 'Owner or admin approval is required to execute actions.' }, { status: 403, headers: NO_STORE });
    }
    tenantId = membership.tenant.id;

    const { data: rawAction, error: actionError } = await auth.db
      .from('customer_action_queue')
      .select('id,tenant_id,executive,action_type,title,payload,rationale,expected_outcome,risk_level,approval_required,status,approved_by,approved_at,adapter_key,attempt_count,result,error')
      .eq('id', actionId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (actionError) throw actionError;
    if (!rawAction) return NextResponse.json({ error: 'Action not found.' }, { status: 404, headers: NO_STORE });

    const action = rawAction as ActionFabricRecord;
    if (action.status === 'completed') {
      return NextResponse.json({ action, alreadyCompleted: true }, { headers: NO_STORE });
    }
    if (action.status === 'rejected') {
      return NextResponse.json({ error: 'Rejected actions cannot be executed.' }, { status: 409, headers: NO_STORE });
    }
    if (action.status === 'executing') {
      return NextResponse.json({ error: 'This action is already executing.' }, { status: 409, headers: NO_STORE });
    }

    const approved = !action.approval_required || Boolean(action.approved_at) || action.status === 'approved';
    if (!approved) {
      return NextResponse.json({ error: 'Approve this action before execution.' }, { status: 403, headers: NO_STORE });
    }

    const directKey = normalizeDirectActionAdapterKey(action.adapter_key, action.action_type);
    const adapterKey = directKey || normalizeActionAdapterKey(action.adapter_key, action.action_type);
    if (directKey && directActionDefinition(directKey).category === 'external' && !(await externalActionsEnabled(request))) {
      throw new ActionFabricBlockedError('Executive Operations emergency stop is active. External actions remain blocked.', 423, 'emergency_stop');
    }

    const attemptNo = Math.max(1, Number(action.attempt_count || 0) + 1);
    const startedAt = new Date().toISOString();

    const claimableStatuses = ['approved', 'failed', 'blocked'];
    const { data: claimed, error: claimError } = await auth.db
      .from('customer_action_queue')
      .update({
        status: 'executing',
        adapter_key: adapterKey,
        attempt_count: attemptNo,
        last_attempt_at: startedAt,
        error: null,
        updated_at: startedAt,
      })
      .eq('id', actionId)
      .eq('tenant_id', tenantId)
      .in('status', claimableStatuses)
      .select('id')
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) {
      return NextResponse.json({ error: 'The action changed before execution could start. Reload and try again.' }, { status: 409, headers: NO_STORE });
    }

    const inputSnapshot = {
      title: action.title,
      executive: action.executive,
      actionType: action.action_type,
      adapterKey,
      payload: action.payload || {},
      expectedOutcome: action.expected_outcome || null,
      approvalRequired: action.approval_required,
      approvedAt: action.approved_at || null,
    };

    const { data: execution, error: executionError } = await auth.db
      .from('customer_action_executions')
      .insert({
        tenant_id: tenantId,
        action_id: actionId,
        requested_by: auth.user.id,
        adapter_key: adapterKey,
        attempt_no: attemptNo,
        status: 'running',
        input_snapshot: inputSnapshot,
        started_at: startedAt,
      })
      .select('id,action_id,adapter_key,attempt_no,status,started_at,created_at')
      .single();
    if (executionError) throw executionError;
    executionId = execution.id;

    const executingAction = { ...action, adapter_key: adapterKey, attempt_count: attemptNo, status: 'executing' };
    const result = directKey
      ? await executeDirectActionAdapter({ db: auth.db, key: directKey, action: executingAction })
      : await executeActionAdapter({ request, db: auth.db, action: executingAction });

    const finishedAt = new Date().toISOString();
    const [executionUpdate, actionUpdate] = await Promise.all([
      auth.db
        .from('customer_action_executions')
        .update({ status: 'completed', output: result, error: null, finished_at: finishedAt })
        .eq('id', executionId)
        .eq('tenant_id', tenantId),
      auth.db
        .from('customer_action_queue')
        .update({ status: 'completed', result, error: null, executed_at: finishedAt, updated_at: finishedAt })
        .eq('id', actionId)
        .eq('tenant_id', tenantId)
        .select('*')
        .single(),
    ]);
    if (executionUpdate.error) throw executionUpdate.error;
    if (actionUpdate.error) throw actionUpdate.error;

    return NextResponse.json({
      executed: true,
      action: actionUpdate.data,
      execution: { ...execution, status: 'completed', output: result, finished_at: finishedAt },
    }, { headers: NO_STORE });
  } catch (error) {
    const blocked = error instanceof ActionFabricBlockedError;
    const status = blocked ? error.status : 500;
    const code = blocked ? error.code : 'execution_failed';
    const message = error instanceof Error ? error.message : 'Action execution failed.';
    const finishedAt = new Date().toISOString();
    const actionStatus = blocked ? 'blocked' : 'failed';

    try {
      const auth = await authenticatedCustomer(request);
      if (auth.ok && tenantId && actionId) {
        const updates: PromiseLike<unknown>[] = [];
        if (executionId) {
          updates.push(
            auth.db
              .from('customer_action_executions')
              .update({ status: actionStatus, error: message.slice(0, 4000), finished_at: finishedAt })
              .eq('id', executionId)
              .eq('tenant_id', tenantId),
          );
        }
        updates.push(
          auth.db
            .from('customer_action_queue')
            .update({ status: actionStatus, error: message.slice(0, 4000), updated_at: finishedAt })
            .eq('id', actionId)
            .eq('tenant_id', tenantId),
        );
        await Promise.all(updates);
      }
    } catch (recordError) {
      console.error('Action Fabric failure recording error', recordError);
    }

    console.error('Action Fabric execution error', error);
    return NextResponse.json({ error: message, code, status: actionStatus }, { status, headers: NO_STORE });
  }
}
