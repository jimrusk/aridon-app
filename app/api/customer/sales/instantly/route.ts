import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';
import { disconnectCustomerIntegration, getCustomerIntegrationSecret, saveCustomerIntegration } from '../../../../../lib/customerIntegrations';
import { addInstantlyLead, instantlyAnalytics, listInstantlyCampaigns } from '../../../../../lib/instantly';

export const runtime = 'nodejs';
export const maxDuration = 60;
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function gate(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id);
  if (!membership) return { response: NextResponse.json({ error: 'No customer workspace is attached to this account.' }, { status: 404, headers: NO_STORE }) };
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { response: NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE }) };
  return { auth, membership };
}

function splitName(value: string | null) {
  const parts = (value || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || null, lastName: parts.length > 1 ? parts.slice(1).join(' ') : null };
}

export async function GET(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;
    const integration = await getCustomerIntegrationSecret(auth.db, membership.tenant.id, 'instantly');
    if (!integration) return NextResponse.json({ connected: false, campaigns: [], analytics: null }, { headers: NO_STORE });

    const [campaigns, analytics] = await Promise.all([
      listInstantlyCampaigns(integration.secret),
      instantlyAnalytics(integration.secret).catch(() => null),
    ]);
    return NextResponse.json({
      connected: true,
      campaigns: campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name, status: campaign.status })),
      analytics,
      connectedAt: integration.updatedAt,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Instantly status error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load Instantly.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await gate(request);
    if ('response' in access) return access.response;
    const { auth, membership } = access;
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    const action = text(body?.action, 40);
    const tenantId = membership.tenant.id;

    if (action === 'connect') {
      const apiKey = text(body?.apiKey, 1000);
      if (apiKey.length < 20) return NextResponse.json({ error: 'Enter a valid Instantly API v2 key.' }, { status: 400, headers: NO_STORE });
      const campaigns = await listInstantlyCampaigns(apiKey);
      await saveCustomerIntegration(auth.db, tenantId, auth.user.id, 'instantly', apiKey, { campaign_count_at_connect: campaigns.length });
      await auth.db.from('customer_sales_events').insert({ tenant_id: tenantId, user_id: auth.user.id, event_name: 'instantly_connected', event_data: { campaigns: campaigns.length } });
      return NextResponse.json({ connected: true, campaigns: campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name, status: campaign.status })) }, { headers: NO_STORE });
    }

    if (action === 'disconnect') {
      await disconnectCustomerIntegration(auth.db, tenantId, 'instantly');
      await auth.db.from('customer_sales_events').insert({ tenant_id: tenantId, user_id: auth.user.id, event_name: 'instantly_disconnected', event_data: {} });
      return NextResponse.json({ connected: false }, { headers: NO_STORE });
    }

    if (action === 'push_leads') {
      if (body?.approved !== true) return NextResponse.json({ error: 'Explicit approval is required before contacts can be added to an Instantly campaign.' }, { status: 403, headers: NO_STORE });
      const campaignId = text(body?.campaignId, 100);
      const leadIds = Array.isArray(body?.leadIds) ? body.leadIds.filter((item: unknown): item is string => typeof item === 'string').slice(0, 100) : [];
      if (!campaignId || !leadIds.length) return NextResponse.json({ error: 'Choose an Instantly campaign and at least one prospect.' }, { status: 400, headers: NO_STORE });

      const integration = await getCustomerIntegrationSecret(auth.db, tenantId, 'instantly');
      if (!integration) return NextResponse.json({ error: 'Connect Instantly first.' }, { status: 400, headers: NO_STORE });
      const { data: leads, error: leadError } = await auth.db.from('customer_sales_leads').select('*').eq('tenant_id', tenantId).in('id', leadIds);
      if (leadError) throw leadError;
      const ready = (leads || []).filter((lead) => typeof lead.contact_email === 'string' && /^\S+@\S+\.\S+$/.test(lead.contact_email));
      if (!ready.length) return NextResponse.json({ error: 'None of the selected prospects has a valid business email yet.' }, { status: 400, headers: NO_STORE });

      const { data: suppressions, error: suppressionError } = await auth.db.from('customer_sales_suppressions').select('email,domain').eq('tenant_id', tenantId);
      if (suppressionError) throw suppressionError;
      const blockedEmails = new Set((suppressions || []).map((item) => (item.email || '').toLowerCase()).filter(Boolean));
      const blockedDomains = new Set((suppressions || []).map((item) => (item.domain || '').toLowerCase()).filter(Boolean));

      const pushed: string[] = [];
      const skipped: Array<{ id: string; reason: string }> = [];
      for (const lead of ready) {
        const email = String(lead.contact_email).toLowerCase();
        const domain = email.split('@')[1] || '';
        if (blockedEmails.has(email) || blockedDomains.has(domain)) {
          skipped.push({ id: lead.id, reason: 'suppressed' });
          continue;
        }
        const { firstName, lastName } = splitName(lead.contact_name);
        try {
          const result = await addInstantlyLead(integration.secret, campaignId, {
            email,
            firstName,
            lastName,
            companyName: lead.company_name,
            website: lead.website,
            jobTitle: lead.contact_title || lead.recommended_buyer_role,
            personalization: lead.personalization,
          }) as { id?: string } | null;
          pushed.push(lead.id);
          await auth.db.from('customer_sales_leads').update({
            status: 'queued_in_instantly',
            instantly_campaign_id: campaignId,
            instantly_lead_id: result?.id || lead.instantly_lead_id || null,
            updated_at: new Date().toISOString(),
          }).eq('id', lead.id).eq('tenant_id', tenantId);
        } catch (error) {
          skipped.push({ id: lead.id, reason: error instanceof Error ? error.message : 'Instantly rejected the lead.' });
        }
      }

      await auth.db.from('customer_sales_events').insert({
        tenant_id: tenantId,
        user_id: auth.user.id,
        event_name: 'instantly_leads_approved',
        event_data: { campaign_id: campaignId, pushed: pushed.length, skipped: skipped.length },
      });
      return NextResponse.json({ pushed, skipped }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: 'Choose a valid Instantly action.' }, { status: 400, headers: NO_STORE });
  } catch (error) {
    console.error('Instantly action error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Instantly could not complete this action.' }, { status: 500, headers: NO_STORE });
  }
}
