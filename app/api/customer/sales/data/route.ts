import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';

const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function membershipFor(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id);
  if (!membership) return { response: NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE }) };
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
    return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) };
  }
  return { auth, membership };
}

export async function GET(request: NextRequest) {
  try {
    const gate = await membershipFor(request);
    if ('response' in gate) return gate.response;
    const { auth, membership } = gate;
    const tenantId = membership.tenant.id;

    const [profileResult, leadsResult, campaignsResult, eventsResult, integrationResult] = await Promise.all([
      auth.db.from('customer_sales_profiles').select('*').eq('tenant_id', tenantId).maybeSingle(),
      auth.db.from('customer_sales_leads').select('*').eq('tenant_id', tenantId).order('fit_score', { ascending: false }).order('created_at', { ascending: false }).limit(200),
      auth.db.from('customer_sales_campaigns').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(30),
      auth.db.from('customer_sales_events').select('id,event_name,event_data,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(30),
      auth.db.from('customer_sales_integrations').select('provider,status,metadata,updated_at').eq('tenant_id', tenantId).eq('provider', 'instantly').maybeSingle(),
    ]);

    for (const result of [profileResult, leadsResult, campaignsResult, eventsResult, integrationResult]) {
      if (result.error) throw result.error;
    }

    return NextResponse.json({
      tenant: { slug: membership.tenant.slug, business_name: membership.tenant.business_name, industry: membership.tenant.industry },
      profile: profileResult.data || null,
      leads: leadsResult.data || [],
      campaigns: campaignsResult.data || [],
      events: eventsResult.data || [],
      instantly: integrationResult.data ? { connected: integrationResult.data.status === 'connected', ...integrationResult.data } : { connected: false },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Scout sales data error', error);
    return NextResponse.json({ error: 'Scout could not load the sales workspace.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await membershipFor(request);
    if ('response' in gate) return gate.response;
    const { auth, membership } = gate;
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json();
    const companyName = text(body?.company_name, 180);
    const contactEmail = text(body?.contact_email, 254).toLowerCase();
    if (!companyName) return NextResponse.json({ error: 'Company name is required.' }, { status: 400, headers: NO_STORE });
    if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) return NextResponse.json({ error: 'Enter a valid business email.' }, { status: 400, headers: NO_STORE });

    const payload = {
      tenant_id: membership.tenant.id,
      company_name: companyName,
      website: text(body?.website, 500) || null,
      location: text(body?.location, 180) || null,
      contact_name: text(body?.contact_name, 160) || null,
      contact_email: contactEmail || null,
      contact_title: text(body?.contact_title, 180) || null,
      recommended_buyer_role: text(body?.recommended_buyer_role, 180) || null,
      fit_score: Math.max(0, Math.min(100, Number(body?.fit_score) || 50)),
      fit_reason: text(body?.fit_reason, 2000) || null,
      trigger_event: text(body?.trigger_event, 1500) || null,
      research_notes: text(body?.research_notes, 4000) || null,
      personalization: text(body?.personalization, 2000) || null,
      source_urls: Array.isArray(body?.source_urls) ? body.source_urls.filter((item: unknown) => typeof item === 'string').slice(0, 12) : [],
      source_type: text(body?.source_type, 80) || 'manual',
      status: text(body?.status, 60) || 'researched',
      created_by: auth.user.id,
    };
    const { data, error } = await auth.db.from('customer_sales_leads').insert(payload).select('*').single();
    if (error) throw error;
    await auth.db.from('customer_sales_events').insert({ tenant_id: membership.tenant.id, user_id: auth.user.id, event_name: 'lead_added', event_data: { company: companyName, source: payload.source_type } });
    return NextResponse.json({ lead: data }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Scout add lead error', error);
    return NextResponse.json({ error: 'Scout could not save this prospect.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const gate = await membershipFor(request);
    if ('response' in gate) return gate.response;
    const { auth, membership } = gate;
    const body = await request.json();
    const id = text(body?.id, 80);
    if (!id) return NextResponse.json({ error: 'Lead id is required.' }, { status: 400, headers: NO_STORE });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ('contact_name' in body) patch.contact_name = text(body.contact_name, 160) || null;
    if ('contact_email' in body) {
      const email = text(body.contact_email, 254).toLowerCase();
      if (email && !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter a valid business email.' }, { status: 400, headers: NO_STORE });
      patch.contact_email = email || null;
    }
    if ('contact_title' in body) patch.contact_title = text(body.contact_title, 180) || null;
    if ('status' in body) patch.status = text(body.status, 60) || 'researched';
    if ('personalization' in body) patch.personalization = text(body.personalization, 2000) || null;

    const { data, error } = await auth.db
      .from('customer_sales_leads')
      .update(patch)
      .eq('id', id)
      .eq('tenant_id', membership.tenant.id)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ lead: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Scout update lead error', error);
    return NextResponse.json({ error: 'Scout could not update this prospect.' }, { status: 500, headers: NO_STORE });
  }
}
