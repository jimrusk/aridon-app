import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { twilioConfigured } from '../../../../lib/outboundCalling';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 200) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function digits(value: string) { return value.replace(/[^+\d]/g, '').slice(0, 20); }

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const slug = clean(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    const db = auth.db;
    const [campaigns, targets, events] = await Promise.all([
      db.from('customer_call_campaigns').select('*').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(20),
      db.from('customer_call_targets').select('*').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(100),
      db.from('customer_call_events').select('*').eq('tenant_id', membership.tenant.id).order('created_at', { ascending: false }).limit(100),
    ]);
    for (const result of [campaigns, targets, events]) if (result.error) throw result.error;
    return NextResponse.json({ configured: twilioConfigured(), campaigns: campaigns.data || [], targets: targets.data || [], events: events.data || [] }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load Call Command.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    const slug = clean(body?.slug, 80);
    const action = clean(body?.action, 40);
    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    const db = auth.db;
    const tenantId = membership.tenant.id;

    if (action === 'create_campaign') {
      const name = clean(body?.name, 120);
      const mode = body?.mode === 'ai_opt_in' ? 'ai_opt_in' : 'human_assisted';
      const maxCalls = Math.max(1, Math.min(100, Number(body?.maxCallsPerDay) || 20));
      if (!name) return NextResponse.json({ error: 'Campaign name is required.' }, { status: 400, headers: NO_STORE });
      const result = await db.from('customer_call_campaigns').insert({ tenant_id: tenantId, name, mode, max_calls_per_day: maxCalls }).select().single();
      if (result.error) throw result.error;
      return NextResponse.json({ campaign: result.data }, { headers: NO_STORE });
    }

    if (action === 'add_target') {
      const companyName = clean(body?.companyName, 160);
      const phone = digits(clean(body?.phone, 40));
      if (!companyName || phone.length < 8) return NextResponse.json({ error: 'Company name and valid phone are required.' }, { status: 400, headers: NO_STORE });
      const suppression = await db.from('customer_call_suppression').select('id,reason').eq('tenant_id', tenantId).eq('phone', phone).maybeSingle();
      if (suppression.error) throw suppression.error;
      const doNotCall = Boolean(suppression.data);
      const result = await db.from('customer_call_targets').insert({
        tenant_id: tenantId,
        campaign_id: clean(body?.campaignId, 80) || null,
        company_name: companyName,
        contact_name: clean(body?.contactName, 160) || null,
        phone,
        website: clean(body?.website, 500) || null,
        state: clean(body?.state, 40) || null,
        source: clean(body?.source, 100) || 'public_business_contact',
        consent_basis: clean(body?.consentBasis, 500) || null,
        do_not_call: doNotCall,
        compliance_status: doNotCall ? 'blocked' : 'pending',
        compliance_reason: doNotCall ? `Suppressed: ${suppression.data?.reason || 'do not call'}` : null,
        call_status: doNotCall ? 'suppressed' : 'queued',
      }).select().single();
      if (result.error) throw result.error;
      return NextResponse.json({ target: result.data }, { headers: NO_STORE });
    }

    if (action === 'set_compliance') {
      const targetId = clean(body?.targetId, 80);
      const status = ['allowed_human_b2b','allowed_ai_opt_in','blocked','pending'].includes(body?.status) ? body.status : 'pending';
      const reason = clean(body?.reason, 1000);
      if (!targetId) return NextResponse.json({ error: 'Target id is required.' }, { status: 400, headers: NO_STORE });
      const result = await db.from('customer_call_targets').update({ compliance_status: status, compliance_reason: reason || null, call_status: status === 'blocked' ? 'suppressed' : 'queued' }).eq('tenant_id', tenantId).eq('id', targetId).select().single();
      if (result.error) throw result.error;
      return NextResponse.json({ target: result.data }, { headers: NO_STORE });
    }

    if (action === 'suppress') {
      const phone = digits(clean(body?.phone, 40));
      const reason = clean(body?.reason, 300) || 'Entity-specific do not call request';
      if (phone.length < 8) return NextResponse.json({ error: 'Valid phone is required.' }, { status: 400, headers: NO_STORE });
      const result = await db.from('customer_call_suppression').upsert({ tenant_id: tenantId, phone, reason, source: clean(body?.source, 80) || 'manual' }, { onConflict: 'tenant_id,phone' }).select().single();
      if (result.error) throw result.error;
      await db.from('customer_call_targets').update({ do_not_call: true, compliance_status: 'blocked', compliance_reason: reason, call_status: 'suppressed' }).eq('tenant_id', tenantId).eq('phone', phone);
      return NextResponse.json({ suppression: result.data }, { headers: NO_STORE });
    }

    if (action === 'prepare_call') {
      const targetId = clean(body?.targetId, 80);
      const target = await db.from('customer_call_targets').select('*').eq('tenant_id', tenantId).eq('id', targetId).single();
      if (target.error) throw target.error;
      const allowed = target.data.compliance_status === 'allowed_human_b2b' || target.data.compliance_status === 'allowed_ai_opt_in';
      if (!allowed || target.data.do_not_call) return NextResponse.json({ error: 'Ethos compliance gate has not approved this target.' }, { status: 409, headers: NO_STORE });
      if (!twilioConfigured()) return NextResponse.json({ ready: false, blockedBy: 'provider_credentials', message: 'Twilio credentials are not configured yet. The target is approved, but Aridon will not fake a live call.' }, { status: 200, headers: NO_STORE });
      return NextResponse.json({ ready: true, target: target.data, next: 'Provider is configured. Create the outbound call only after a human starts the call or the target has allowed_ai_opt_in status.' }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: 'Unknown Call Command action.' }, { status: 400, headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Call Command could not complete the request.' }, { status: 500, headers: NO_STORE });
  }
}
