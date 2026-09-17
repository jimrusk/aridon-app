import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';
import { publicOrigin, signPhoneToken } from '../../../../../lib/executivePhone';
import { placeAridonVoiceCall } from '../../../../../lib/aridonVoiceGateway';

export const runtime = 'nodejs';
export const maxDuration = 30;

const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 300) {
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
    const objective = clean(body?.objective, 600);
    if (!slug || !targetId) return NextResponse.json({ error: 'Workspace and target are required.' }, { status: 400, headers: NO_STORE });
    if (objective.length < 12) return NextResponse.json({ error: 'Give Eva a short call objective before dialing.' }, { status: 400, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const db = auth.db;
    const target = await db
      .from('customer_call_targets')
      .select('*')
      .eq('tenant_id', membership.tenant.id)
      .eq('id', targetId)
      .single();
    if (target.error) throw target.error;

    if (target.data.do_not_call) {
      return NextResponse.json({ error: 'This number is on the Aridon suppression list.' }, { status: 409, headers: NO_STORE });
    }
    if (target.data.compliance_status !== 'allowed_ai_opt_in') {
      return NextResponse.json({ error: 'Eva AI calling requires an allowed_ai_opt_in compliance status.' }, { status: 409, headers: NO_STORE });
    }
    if (!String(target.data.consent_basis || '').trim()) {
      return NextResponse.json({ error: 'Record the consent or relationship basis before Eva calls.' }, { status: 409, headers: NO_STORE });
    }

    const token = signPhoneToken({
      tenantId: membership.tenant.id,
      userId: auth.user.id,
      slug: membership.tenant.slug,
      executive: 'Eva',
      exp: Date.now() + 60 * 60 * 1000,
      outboundAi: true,
      targetId,
      targetCompany: clean(target.data.company_name, 160),
      targetContact: clean(target.data.contact_name, 160),
      callBrief: objective,
    });

    const origin = publicOrigin(request.nextUrl.origin);
    const voiceUrl = `${origin}/api/executive-call/voice?token=${encodeURIComponent(token)}`;
    const statusUrl = `${origin}/api/customer/call-command/twilio-status?tenant=${encodeURIComponent(membership.tenant.id)}&target=${encodeURIComponent(targetId)}`;

    const call = await placeAridonVoiceCall({
      tenantId: membership.tenant.id,
      db,
      to: String(target.data.phone),
      voiceUrl,
      statusUrl,
    });

    const now = new Date().toISOString();
    await db.from('customer_call_targets').update({ call_status: 'dialing', last_call_at: now }).eq('tenant_id', membership.tenant.id).eq('id', targetId);
    const event = await db.from('customer_call_events').insert({
      tenant_id: membership.tenant.id,
      campaign_id: target.data.campaign_id,
      target_id: targetId,
      provider: call.transport,
      provider_call_sid: call.callSid,
      mode: 'ai_opt_in',
      status: call.status,
      summary: objective,
      started_at: now,
    }).select().single();
    if (event.error) console.error('Eva call event insert error', event.error);

    return NextResponse.json({
      ok: true,
      callSid: call.callSid,
      status: call.status,
      provider: 'aridon',
      carrier: call.transport,
      fromNumber: call.fromNumber,
      message: `Eva is calling ${target.data.contact_name || target.data.company_name} through Aridon Voice Gateway.`,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Eva outbound dial error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Eva could not start the call.' }, { status: 500, headers: NO_STORE });
  }
}
