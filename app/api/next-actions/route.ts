import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const allowedStates = new Set(['open','approved','watching','skipped','completed']);
const allowedReplies = new Set(['unknown','awaiting','replied','bounced','closed']);

async function gate(request: NextRequest) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const membership = await customerTenantForUser(auth.user.id, 'aridon', auth.token);
  if (!membership || membership.tenant.slug !== 'aridon') return { response: NextResponse.json({ error: 'Aridon owner workspace required.' }, { status: 403, headers: NO_STORE }) };
  return { auth, membership };
}

export async function GET(request: NextRequest) {
  try {
    const access = await gate(request); if ('response' in access) return access.response;
    const { auth, membership } = access;
    const tenantId = membership.tenant.id;
    const [actionsResult, eventsResult] = await Promise.all([
      auth.db.from('aridon_next_actions').select('*').eq('tenant_id', tenantId).order('fit_score', { ascending: false }).order('updated_at', { ascending: false }),
      auth.db.from('aridon_next_action_events').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(200),
    ]);
    if (actionsResult.error) throw actionsResult.error;
    if (eventsResult.error) throw eventsResult.error;
    return NextResponse.json({ actions: actionsResult.data || [], events: eventsResult.data || [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Next actions load error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Next actions could not be loaded.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await gate(request); if ('response' in access) return access.response;
    const { auth, membership } = access;
    const body = await request.json().catch(() => ({}));
    const actionId = typeof body.actionId === 'string' ? body.actionId : '';
    if (!actionId) return NextResponse.json({ error: 'Action id required.' }, { status: 400, headers: NO_STORE });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: auth.user.id };
    if (typeof body.actionState === 'string' && allowedStates.has(body.actionState)) update.action_state = body.actionState;
    if (typeof body.replyStatus === 'string' && allowedReplies.has(body.replyStatus)) {
      update.reply_status = body.replyStatus;
      if (body.replyStatus === 'replied') update.last_inbound_at = new Date().toISOString();
    }
    if (typeof body.nextStep === 'string' && body.nextStep.trim()) update.recommended_next_step = body.nextStep.trim().slice(0, 5000);
    if (typeof body.status === 'string') update.status = body.status.trim().slice(0, 2000);
    if (typeof body.person === 'string') update.person = body.person.trim().slice(0, 300) || null;
    if (typeof body.title === 'string') update.title = body.title.trim().slice(0, 500) || null;
    if (typeof body.email === 'string') update.email = body.email.trim().slice(0, 500) || null;
    if (typeof body.phone === 'string') update.phone = body.phone.trim().slice(0, 100) || null;
    if (Number.isFinite(Number(body.relationshipStrength))) update.relationship_strength = Math.max(0, Math.min(100, Number(body.relationshipStrength)));

    const { data, error } = await auth.db.from('aridon_next_actions').update(update).eq('tenant_id', membership.tenant.id).eq('id', actionId).select('*').single();
    if (error) throw error;

    const eventType = typeof body.eventType === 'string' ? body.eventType.slice(0, 100) : 'action_updated';
    const eventNote = typeof body.eventNote === 'string' ? body.eventNote.slice(0, 4000) : null;
    const { error: eventError } = await auth.db.from('aridon_next_action_events').insert({
      tenant_id: membership.tenant.id,
      action_id: actionId,
      event_type: eventType,
      event_note: eventNote,
      source_type: 'aridon',
      actor_user_id: auth.user.id,
    });
    if (eventError) throw eventError;
    return NextResponse.json({ action: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Next actions update error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Next action could not be updated.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await gate(request); if ('response' in access) return access.response;
    const { auth, membership } = access;
    const body = await request.json().catch(() => ({}));
    if (body?.action !== 'sync-opportunities') return NextResponse.json({ error: 'Unsupported action.' }, { status: 400, headers: NO_STORE });

    const { data: opportunities, error } = await auth.db.from('customer_opportunities').select('*').eq('tenant_id', membership.tenant.id).neq('status', 'archived').order('fit_score', { ascending: false }).limit(100);
    if (error) throw error;
    let synced = 0;
    for (const opportunity of opportunities || []) {
      const slug = `opp-${opportunity.id}`;
      const payload = {
        tenant_id: membership.tenant.id,
        slug,
        priority: opportunity.fit_score >= 85 ? 'HIGH' : opportunity.fit_score >= 65 ? 'MEDIUM' : 'WATCH',
        lane: opportunity.opportunity_type || 'Opportunity',
        company: opportunity.issuer || opportunity.title,
        status: opportunity.stage ? `Opportunity Intelligence · ${opportunity.stage}` : 'Opportunity Intelligence',
        reason: opportunity.fit_reason || opportunity.why_now || 'Source-backed opportunity surfaced by Aridon Opportunity Intelligence.',
        recommended_next_step: opportunity.recommended_next_step || 'Review the source trail and choose the next pursuit action.',
        fit_score: opportunity.fit_score || 0,
        value_text: opportunity.value_text || null,
        due_text: opportunity.deadline_text || null,
        source_type: 'opportunity_intelligence',
        source_ref: opportunity.id,
        updated_by: auth.user.id,
        updated_at: new Date().toISOString(),
      };
      const { error: upsertError } = await auth.db.from('aridon_next_actions').upsert(payload, { onConflict: 'tenant_id,slug' });
      if (upsertError) throw upsertError;
      synced += 1;
    }
    return NextResponse.json({ synced }, { headers: NO_STORE });
  } catch (error) {
    console.error('Next actions opportunity sync error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opportunity pipeline could not be synced.' }, { status: 500, headers: NO_STORE });
  }
}
