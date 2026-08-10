import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { normalizeOpportunityPlan, opportunityAccess } from '../../../../lib/opportunityIntelligence';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function stringArray(value: unknown, limit = 30) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function optionalNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

async function gate(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id);
  if (!membership) return { response: NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE }) };
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) };
  return { auth, membership };
}

async function tenantOpportunityPlan(db: ReturnType<typeof import('../../../../lib/supabase').getServerClient>, tenantId: string) {
  const { data, error } = await db.from('customer_tenants').select('opportunity_plan').eq('id', tenantId).single();
  if (error) throw error;
  return normalizeOpportunityPlan(data?.opportunity_plan);
}

export async function GET(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;
    const tenantId = membership.tenant.id;

    const [planResult, profileResult, opportunitiesResult, runsResult] = await Promise.all([
      auth.db.from('customer_tenants').select('opportunity_plan').eq('id', tenantId).single(),
      auth.db.from('customer_opportunity_profiles').select('*').eq('tenant_id', tenantId).maybeSingle(),
      auth.db.from('customer_opportunities').select('*').eq('tenant_id', tenantId).neq('status', 'archived').order('fit_score', { ascending: false }).order('updated_at', { ascending: false }).limit(100),
      auth.db.from('customer_opportunity_runs').select('id,status,result_count,source_urls,error_message,started_at,completed_at').eq('tenant_id', tenantId).order('started_at', { ascending: false }).limit(10),
    ]);
    if (planResult.error) throw planResult.error;
    if (profileResult.error) throw profileResult.error;
    if (opportunitiesResult.error) throw opportunitiesResult.error;
    if (runsResult.error) throw runsResult.error;

    const accessPlan = opportunityAccess(planResult.data?.opportunity_plan);
    return NextResponse.json(
      {
        tenant: { id: tenantId, businessName: membership.tenant.business_name, industry: membership.tenant.industry },
        opportunityPlan: normalizeOpportunityPlan(planResult.data?.opportunity_plan),
        access: accessPlan,
        profile: profileResult.data || null,
        opportunities: opportunitiesResult.data || [],
        runs: runsResult.data || [],
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('Opportunity Intelligence load error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opportunity workspace could not be loaded.' }, { status: 500, headers: NO_STORE });
  }
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
    const payload = {
      tenant_id: membership.tenant.id,
      website: text(body?.website, 500) || null,
      capabilities: text(body?.capabilities, 8000) || null,
      target_markets: stringArray(body?.targetMarkets, 30),
      geographies: stringArray(body?.geographies, 30),
      opportunity_types: stringArray(body?.opportunityTypes, 20),
      keywords: stringArray(body?.keywords, 40),
      exclusions: text(body?.exclusions, 4000) || null,
      minimum_value: optionalNumber(body?.minimumValue),
      maximum_value: optionalNumber(body?.maximumValue),
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    };

    if (!payload.website && !payload.capabilities) {
      return NextResponse.json({ error: 'Add the company website or describe its capabilities.' }, { status: 400, headers: NO_STORE });
    }
    if (!payload.opportunity_types.length) {
      return NextResponse.json({ error: 'Choose at least one opportunity type to monitor.' }, { status: 400, headers: NO_STORE });
    }

    const { data, error } = await auth.db
      .from('customer_opportunity_profiles')
      .upsert(payload, { onConflict: 'tenant_id' })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ profile: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Opportunity Intelligence profile error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opportunity profile could not be saved.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const opportunityId = text(body?.opportunityId, 80);
    const stage = text(body?.stage, 30).toLowerCase();
    const allowedStages = ['new', 'reviewing', 'qualified', 'pursuing', 'submitted', 'won', 'lost', 'watching'];
    if (!opportunityId || !allowedStages.includes(stage)) {
      return NextResponse.json({ error: 'Choose a valid opportunity and pipeline stage.' }, { status: 400, headers: NO_STORE });
    }

    if (stage === 'pursuing') {
      const plan = await tenantOpportunityPlan(auth.db, membership.tenant.id);
      const limits = opportunityAccess(plan);
      const { count, error: countError } = await auth.db
        .from('customer_opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', membership.tenant.id)
        .eq('stage', 'pursuing')
        .neq('id', opportunityId);
      if (countError) throw countError;
      if ((count || 0) >= limits.pursuitLimit) {
        return NextResponse.json(
          { error: `${limits.name} supports ${limits.pursuitLimit} active pursuit${limits.pursuitLimit === 1 ? '' : 's'}. Upgrade or move another pursuit out of the active stage.` },
          { status: 402, headers: NO_STORE },
        );
      }
    }

    const { data, error } = await auth.db
      .from('customer_opportunities')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('tenant_id', membership.tenant.id)
      .eq('id', opportunityId)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ opportunity: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Opportunity Intelligence pipeline update error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opportunity stage could not be updated.' }, { status: 500, headers: NO_STORE });
  }
}
