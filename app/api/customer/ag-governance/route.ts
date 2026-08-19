import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

type EntityName = 'goal' | 'supplier' | 'action' | 'report' | 'finance' | 'stakeholder' | 'evidence';

const entityConfig: Record<EntityName, { table: string; fields: string[] }> = {
  goal: {
    table: 'ag_governance_goals',
    fields: ['name', 'category', 'target_year', 'progress', 'status', 'owner', 'metric', 'target_value', 'actual_value', 'unit', 'notes'],
  },
  supplier: {
    table: 'ag_governance_suppliers',
    fields: ['name', 'region', 'crop', 'assurance_score', 'evidence_status', 'audit_status', 'next_action', 'last_reviewed', 'next_due', 'notes'],
  },
  action: {
    table: 'ag_governance_actions',
    fields: ['title', 'source_type', 'source_id', 'priority', 'status', 'owner', 'due_date', 'ai_generated', 'details'],
  },
  report: {
    table: 'ag_governance_reports',
    fields: ['title', 'reporting_period', 'status', 'due_date', 'evidence_complete', 'owner', 'notes'],
  },
  finance: {
    table: 'ag_governance_finance',
    fields: ['goal_id', 'program_name', 'budget', 'actual', 'forecast', 'contract_status', 'renewal_date', 'approver', 'notes'],
  },
  stakeholder: {
    table: 'ag_governance_stakeholders',
    fields: ['name', 'organization', 'stakeholder_type', 'email', 'region', 'status', 'last_contact', 'next_action_date', 'notes'],
  },
  evidence: {
    table: 'ag_governance_evidence',
    fields: ['supplier_id', 'goal_id', 'title', 'evidence_type', 'status', 'source_url', 'reviewer', 'expires_at'],
  },
};

function isEntity(value: unknown): value is EntityName {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(entityConfig, value);
}

function cleanPayload(entity: EntityName, input: unknown) {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const result: Record<string, unknown> = {};
  for (const field of entityConfig[entity].fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) result[field] = source[field];
  }
  return result;
}

async function context(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) } as const;
  if (!slug) return { error: NextResponse.json({ error: 'Workspace slug is required.' }, { status: 400, headers: NO_STORE }) } as const;

  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE }) } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
    return { error: NextResponse.json({ error: 'This workspace needs active access.', billingRequired: true }, { status: 402, headers: NO_STORE }) } as const;
  }
  return { auth, membership } as const;
}

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')?.trim() || '';
    const resolved = await context(request, slug);
    if ('error' in resolved) return resolved.error;

    const { auth, membership } = resolved;
    const tenantId = membership.tenant.id;
    const db = auth.db;

    const [goals, suppliers, actions, reports, finance, stakeholders, evidence] = await Promise.all([
      db.from('ag_governance_goals').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: true }),
      db.from('ag_governance_suppliers').select('*').eq('tenant_id', tenantId).order('assurance_score', { ascending: true }),
      db.from('ag_governance_actions').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      db.from('ag_governance_reports').select('*').eq('tenant_id', tenantId).order('due_date', { ascending: true, nullsFirst: false }),
      db.from('ag_governance_finance').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: true }),
      db.from('ag_governance_stakeholders').select('*').eq('tenant_id', tenantId).order('name', { ascending: true }),
      db.from('ag_governance_evidence').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    ]);

    for (const result of [goals, suppliers, actions, reports, finance, stakeholders, evidence]) {
      if (result.error) throw result.error;
    }

    return NextResponse.json({
      tenant: membership.tenant,
      role: membership.role,
      goals: goals.data || [],
      suppliers: suppliers.data || [],
      actions: actions.data || [],
      reports: reports.data || [],
      finance: finance.data || [],
      stakeholders: stakeholders.data || [],
      evidence: evidence.data || [],
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Ag governance GET error', error);
    return NextResponse.json({ error: 'Unable to load agriculture governance data.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    const resolved = await context(request, slug);
    if ('error' in resolved) return resolved.error;

    const { auth, membership } = resolved;
    const tenantId = membership.tenant.id;

    if (body.entity === 'starter') {
      const existing = await auth.db.from('ag_governance_goals').select('id').eq('tenant_id', tenantId).limit(1);
      if (existing.error) throw existing.error;
      if (existing.data?.length) return NextResponse.json({ ok: true, seeded: false }, { headers: NO_STORE });

      const currentYear = new Date().getFullYear();
      const starterGoals = [
        { tenant_id: tenantId, name: 'Sustainable Sourcing', category: 'sustainable_sourcing', target_year: 2030, progress: 0, status: 'planning', metric: 'Verified sourcing coverage', unit: '%' },
        { tenant_id: tenantId, name: 'Regenerate, Restore & Protect', category: 'regenerate_restore_protect', target_year: 2030, progress: 0, status: 'planning', metric: 'Verified acres', unit: 'acres' },
        { tenant_id: tenantId, name: 'Producer Livelihoods', category: 'livelihoods', target_year: 2030, progress: 0, status: 'planning', metric: 'Participating producers', unit: 'producers' },
      ];
      const starterActions = [
        { tenant_id: tenantId, title: 'Assign accountable owners to each agriculture goal', priority: 'high', status: 'open', ai_generated: true, details: 'Set one accountable program owner and the reporting cadence for each enterprise goal.' },
        { tenant_id: tenantId, title: 'Import supplier and producer assurance roster', priority: 'high', status: 'open', ai_generated: true, details: 'Load the current directly sourced crop supplier list, regions and assurance status.' },
        { tenant_id: tenantId, title: 'Define evidence requirements for annual goal delivery', priority: 'medium', status: 'open', ai_generated: true, details: 'Map each reported metric to its required source record, reviewer and approval step.' },
      ];
      const starterReports = [
        { tenant_id: tenantId, title: `${currentYear} Positive Agriculture Goal Delivery`, reporting_period: `${currentYear}`, status: 'planning', evidence_complete: 0 },
      ];

      const [goalInsert, actionInsert, reportInsert] = await Promise.all([
        auth.db.from('ag_governance_goals').insert(starterGoals),
        auth.db.from('ag_governance_actions').insert(starterActions),
        auth.db.from('ag_governance_reports').insert(starterReports),
      ]);
      if (goalInsert.error) throw goalInsert.error;
      if (actionInsert.error) throw actionInsert.error;
      if (reportInsert.error) throw reportInsert.error;
      return NextResponse.json({ ok: true, seeded: true }, { status: 201, headers: NO_STORE });
    }

    if (!isEntity(body.entity)) return NextResponse.json({ error: 'A valid entity is required.' }, { status: 400, headers: NO_STORE });
    const entity = body.entity;
    const data = cleanPayload(entity, body.data);
    const result = await auth.db.from(entityConfig[entity].table).insert({ ...data, tenant_id: tenantId }).select('*').single();
    if (result.error) throw result.error;
    return NextResponse.json({ item: result.data }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Ag governance POST error', error);
    return NextResponse.json({ error: 'Unable to save agriculture governance data.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    const resolved = await context(request, slug);
    if ('error' in resolved) return resolved.error;

    if (!isEntity(body.entity) || typeof body.id !== 'string' || !body.id) {
      return NextResponse.json({ error: 'Entity and item id are required.' }, { status: 400, headers: NO_STORE });
    }

    const { auth, membership } = resolved;
    const entity = body.entity;
    const data = cleanPayload(entity, body.data);
    data.updated_at = new Date().toISOString();

    const result = await auth.db
      .from(entityConfig[entity].table)
      .update(data)
      .eq('id', body.id)
      .eq('tenant_id', membership.tenant.id)
      .select('*')
      .single();
    if (result.error) throw result.error;
    return NextResponse.json({ item: result.data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Ag governance PATCH error', error);
    return NextResponse.json({ error: 'Unable to update agriculture governance data.' }, { status: 500, headers: NO_STORE });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')?.trim() || '';
    const entityValue = request.nextUrl.searchParams.get('entity');
    const id = request.nextUrl.searchParams.get('id')?.trim() || '';
    const resolved = await context(request, slug);
    if ('error' in resolved) return resolved.error;
    if (!isEntity(entityValue) || !id) return NextResponse.json({ error: 'Entity and item id are required.' }, { status: 400, headers: NO_STORE });

    const result = await resolved.auth.db
      .from(entityConfig[entityValue].table)
      .delete()
      .eq('id', id)
      .eq('tenant_id', resolved.membership.tenant.id);
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('Ag governance DELETE error', error);
    return NextResponse.json({ error: 'Unable to delete agriculture governance data.' }, { status: 500, headers: NO_STORE });
  }
}
