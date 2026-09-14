import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';

const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function stringArray(value: unknown, limit = 12) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, limit)
    : [];
}

async function gate(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id);
  if (!membership) return { response: NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE }) };
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) };
  return { auth, membership };
}

function nextRun(cadence: string) {
  if (cadence === 'manual') return null;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + (cadence === 'weekly' ? 7 : 1));
  return date.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const action = text(body?.action, 30) || 'save';
    const tenantId = membership.tenant.id;

    if (action === 'delete') {
      const id = text(body?.id, 80);
      if (!id) return NextResponse.json({ error: 'Watch id is required.' }, { status: 400, headers: NO_STORE });
      const { error } = await auth.db.from('customer_sales_watches').delete().eq('id', id).eq('tenant_id', tenantId);
      if (error) throw error;
      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    }

    if (action !== 'save') return NextResponse.json({ error: 'Choose a valid watch action.' }, { status: 400, headers: NO_STORE });

    const cadenceRaw = text(body?.cadence, 20);
    const cadence = ['manual', 'daily', 'weekly'].includes(cadenceRaw) ? cadenceRaw : 'manual';
    const threshold = Math.max(50, Math.min(95, Number(body?.qualificationThreshold) || 75));
    const count = Math.max(3, Math.min(20, Number(body?.countPerRun) || 10));
    const payload = {
      tenant_id: tenantId,
      name: text(body?.name, 160) || `${membership.tenant.business_name} prospect watch`,
      intent: text(body?.intent, 40) || 'customer',
      objective: text(body?.objective, 2000) || null,
      search_focus: text(body?.focus, 3000) || null,
      required_signals: stringArray(body?.requiredSignals, 12),
      exclusions: stringArray(body?.exclusions, 16),
      qualification_threshold: threshold,
      count_per_run: count,
      cadence,
      active: body?.active !== false,
      next_run_at: nextRun(cadence),
      updated_at: new Date().toISOString(),
    };

    const id = text(body?.id, 80);
    let result;
    if (id) {
      result = await auth.db.from('customer_sales_watches').update(payload).eq('id', id).eq('tenant_id', tenantId).select('*').single();
    } else {
      result = await auth.db.from('customer_sales_watches').insert({ ...payload, created_by: auth.user.id }).select('*').single();
    }
    if (result.error) throw result.error;

    await auth.db.from('customer_sales_events').insert({
      tenant_id: tenantId,
      user_id: auth.user.id,
      event_name: 'prospect_watch_saved',
      event_data: { watch_id: result.data.id, cadence, threshold, count },
    });

    return NextResponse.json({ watch: result.data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Scout watch error', error);
    return NextResponse.json({ error: 'Scout could not save this prospecting watch.' }, { status: 500, headers: NO_STORE });
  }
}
