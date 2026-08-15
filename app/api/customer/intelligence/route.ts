import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { intelligenceLanes, normalizeIntelligenceLane } from '../../../../lib/intelligenceSuite';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const STAGES = new Set(['new', 'reviewing', 'qualified', 'contacting', 'diligence', 'pursuing', 'won', 'lost', 'watching']);
const STATUSES = new Set(['open', 'closed', 'archived']);

async function gate(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id);
  if (!membership) return { response: NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE }) };
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) };
  return { auth, membership };
}

function cleanProfile(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(raw).slice(0, 40)) {
    const safeKey = key.trim().slice(0, 80);
    if (!safeKey) continue;
    if (typeof item === 'string') cleaned[safeKey] = item.trim().slice(0, 8000);
    else if (typeof item === 'number' && Number.isFinite(item)) cleaned[safeKey] = item;
    else if (typeof item === 'boolean' || item === null) cleaned[safeKey] = item;
    else if (Array.isArray(item)) cleaned[safeKey] = item.slice(0, 60).map((entry) => typeof entry === 'string' ? entry.trim().slice(0, 1000) : entry).filter((entry) => ['string', 'number', 'boolean'].includes(typeof entry));
  }
  return cleaned;
}

export async function GET(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;
    const tenantId = membership.tenant.id;

    const [profilesResult, leadsResult, runsResult] = await Promise.all([
      auth.db.from('customer_intelligence_profiles').select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false }),
      auth.db.from('customer_intelligence_leads').select('*').eq('tenant_id', tenantId).neq('status', 'archived').order('score', { ascending: false }).order('updated_at', { ascending: false }).limit(250),
      auth.db.from('customer_intelligence_runs').select('id,lane,status,result_count,source_urls,error_message,started_at,completed_at').eq('tenant_id', tenantId).order('started_at', { ascending: false }).limit(30),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    if (leadsResult.error) throw leadsResult.error;
    if (runsResult.error) throw runsResult.error;

    return NextResponse.json({
      tenant: { id: tenantId, businessName: membership.tenant.business_name, industry: membership.tenant.industry },
      lanes: intelligenceLanes,
      profiles: profilesResult.data || [],
      leads: leadsResult.data || [],
      runs: runsResult.data || [],
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Intelligence Suite load error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Intelligence Suite could not be loaded.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;
    const body = await request.json().catch(() => ({}));
    const lane = normalizeIntelligenceLane(body?.lane);
    if (!lane) return NextResponse.json({ error: 'Choose a valid Aridon intelligence lane.' }, { status: 400, headers: NO_STORE });
    const profile = cleanProfile(body?.profile);
    const now = new Date().toISOString();
    const { data, error } = await auth.db.from('customer_intelligence_profiles').upsert({
      tenant_id: membership.tenant.id,
      lane,
      profile,
      created_by: auth.user.id,
      updated_at: now,
    }, { onConflict: 'tenant_id,lane' }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ profile: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Intelligence Suite profile error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Radar profile could not be saved.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;
    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
    if (!leadId) return NextResponse.json({ error: 'A lead ID is required.' }, { status: 400, headers: NO_STORE });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body?.stage === 'string') {
      if (!STAGES.has(body.stage)) return NextResponse.json({ error: 'Invalid lead stage.' }, { status: 400, headers: NO_STORE });
      update.stage = body.stage;
    }
    if (typeof body?.status === 'string') {
      if (!STATUSES.has(body.status)) return NextResponse.json({ error: 'Invalid lead status.' }, { status: 400, headers: NO_STORE });
      update.status = body.status;
    }
    if (Object.keys(update).length === 1) return NextResponse.json({ error: 'No lead changes were supplied.' }, { status: 400, headers: NO_STORE });

    const { data, error } = await auth.db.from('customer_intelligence_leads').update(update).eq('id', leadId).eq('tenant_id', membership.tenant.id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Lead not found.' }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ lead: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Intelligence Suite lead update error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Lead could not be updated.' }, { status: 500, headers: NO_STORE });
  }
}
