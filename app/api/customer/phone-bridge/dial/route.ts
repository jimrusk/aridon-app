import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';
import { getOnlinePhoneBridge, queuePhoneBridgeJob } from '../../../../../lib/googleVoiceBridge';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const slug = clean(body?.slug, 80);
    const targetId = clean(body?.targetId, 80);
    const objective = clean(body?.objective, 3000);
    if (!slug || !targetId) return NextResponse.json({ error: 'Workspace and target are required.' }, { status: 400, headers: NO_STORE });
    if (objective.length < 12) return NextResponse.json({ error: 'Give Eva a short call objective before dialing.' }, { status: 400, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const db = auth.db;
    const target = await db.from('customer_call_targets').select('*')
      .eq('tenant_id', membership.tenant.id).eq('id', targetId).single();
    if (target.error) throw target.error;
    if (target.data.do_not_call) return NextResponse.json({ error: 'This number is on the Aridon suppression list.' }, { status: 409, headers: NO_STORE });
    if (target.data.compliance_status !== 'allowed_ai_opt_in') {
      return NextResponse.json({ error: 'Eva AI calling requires an allowed_ai_opt_in compliance status.' }, { status: 409, headers: NO_STORE });
    }
    if (!String(target.data.consent_basis || '').trim()) {
      return NextResponse.json({ error: 'Record the consent or relationship basis before Eva calls.' }, { status: 409, headers: NO_STORE });
    }

    const bridge = await getOnlinePhoneBridge(membership.tenant.id, db);
    if (!bridge) {
      return NextResponse.json({
        error: 'Eva Phone Bridge is offline. Start the paired bridge on the computer signed into Google Voice, then try again.'
      }, { status: 409, headers: NO_STORE });
    }

    const job = await queuePhoneBridgeJob({
      tenantId: membership.tenant.id,
      bridgeId: bridge.id,
      targetId,
      phone: String(target.data.phone),
      contactName: clean(target.data.contact_name, 160) || null,
      companyName: clean(target.data.company_name, 160) || null,
      objective,
      createdBy: auth.user.id,
    }, db);

    const now = new Date().toISOString();
    await db.from('customer_call_targets').update({ call_status: 'queued', last_call_at: now })
      .eq('tenant_id', membership.tenant.id).eq('id', targetId);

    const event = await db.from('customer_call_events').insert({
      tenant_id: membership.tenant.id,
      campaign_id: target.data.campaign_id,
      target_id: targetId,
      provider: 'google_voice_bridge',
      provider_call_sid: job.id,
      mode: 'ai_opt_in',
      status: 'queued',
      summary: objective,
      started_at: now,
    }).select('id').single();
    if (event.error) console.error('Eva Phone Bridge event insert error', event.error);

    const metadata = bridge.metadata && typeof bridge.metadata === 'object' ? bridge.metadata as Record<string, unknown> : {};
    const fromNumber = typeof metadata.googleVoiceNumber === 'string' ? metadata.googleVoiceNumber : '';
    return NextResponse.json({
      ok: true,
      jobId: job.id,
      status: job.state,
      provider: 'google_voice_bridge',
      fromNumber,
      message: `Eva queued the call to ${target.data.contact_name || target.data.company_name}. The paired Google Voice bridge will dial it now.`,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Eva Phone Bridge dial failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Eva could not queue the Google Voice call.' }, { status: 500, headers: NO_STORE });
  }
}
