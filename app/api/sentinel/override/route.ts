import { NextRequest, NextResponse } from 'next/server';
import { getServerClient, getUserScopedClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const ALLOWED_ROLES = new Set(['owner', 'admin', 'security_admin']);
const ALLOWED_ACTIONS = new Set(['set_company_hold', 'clear_company_hold', 'hold_incident', 'resume_incident', 'false_positive']);

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  return authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
}

function clean(value: unknown, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const accessToken = bearerToken(request);
    if (!accessToken) return NextResponse.json({ error: 'A signed-in Aridon session is required.' }, { status: 401, headers: NO_STORE });

    const body = await request.json();
    const tenantId = clean(body?.tenantId, 80);
    const incidentId = clean(body?.incidentId, 80);
    const action = clean(body?.action, 50);
    const reason = clean(body?.reason, 2000);
    if (!tenantId || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'A valid tenantId and override action are required.' }, { status: 400, headers: NO_STORE });
    }
    if (!reason || reason.length < 5) {
      return NextResponse.json({ error: 'Give a short reason for the override so the audit record is meaningful.' }, { status: 400, headers: NO_STORE });
    }

    const userDb = getUserScopedClient(accessToken);
    const { data: membership } = await userDb
      .from('customer_memberships')
      .select('tenant_id,user_id,role')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!membership || !ALLOWED_ROLES.has(String(membership.role))) {
      return NextResponse.json({ error: 'Only a company owner or authorized security administrator can use the Sentinel override.' }, { status: 403, headers: NO_STORE });
    }

    const serverDb = getServerClient();
    const now = new Date();
    const nowIso = now.toISOString();
    let logAction = '';
    let previousState: Record<string, unknown> = {};
    let newState: Record<string, unknown> = {};
    let sentReportsAlready = 0;

    if (action === 'set_company_hold') {
      const holdMinutesRaw = Number(body?.holdMinutes);
      const holdMinutes = Number.isFinite(holdMinutesRaw) ? Math.max(15, Math.min(10080, Math.round(holdMinutesRaw))) : 60;
      const holdUntil = new Date(now.getTime() + holdMinutes * 60_000).toISOString();
      const { data: existing } = await serverDb.from('sentinel_security_policies').select('authority_hold,authority_hold_until,authority_hold_reason').eq('tenant_id', tenantId).maybeSingle();
      previousState = existing || {};
      newState = { authority_hold: true, authority_hold_until: holdUntil, authority_hold_reason: reason };
      const { error } = await serverDb.from('sentinel_security_policies').upsert({
        tenant_id: tenantId,
        authority_hold: true,
        authority_hold_until: holdUntil,
        authority_hold_reason: reason,
        authority_hold_set_by: membership.user_id,
        authority_hold_set_at: nowIso,
        created_by: membership.user_id,
        updated_at: nowIso,
      }, { onConflict: 'tenant_id' });
      if (error) throw error;
      logAction = 'company_hold_enabled';
    }

    if (action === 'clear_company_hold') {
      const { data: existing } = await serverDb.from('sentinel_security_policies').select('authority_hold,authority_hold_until,authority_hold_reason').eq('tenant_id', tenantId).maybeSingle();
      previousState = existing || {};
      newState = { authority_hold: false, authority_hold_until: null, authority_hold_reason: null };
      const { error } = await serverDb.from('sentinel_security_policies').update({
        authority_hold: false,
        authority_hold_until: null,
        authority_hold_reason: null,
        authority_hold_set_by: membership.user_id,
        authority_hold_set_at: nowIso,
        updated_at: nowIso,
      }).eq('tenant_id', tenantId);
      if (error) throw error;
      logAction = 'company_hold_disabled';
    }

    if (action === 'hold_incident' || action === 'resume_incident' || action === 'false_positive') {
      if (!incidentId) return NextResponse.json({ error: 'incidentId is required for this override action.' }, { status: 400, headers: NO_STORE });
      const { data: incident } = await serverDb.from('sentinel_incidents').select('id,tenant_id,status,authority_escalation_status,title').eq('id', incidentId).eq('tenant_id', tenantId).maybeSingle();
      if (!incident) return NextResponse.json({ error: 'Incident not found in this company workspace.' }, { status: 404, headers: NO_STORE });
      previousState = { status: incident.status, authority_escalation_status: incident.authority_escalation_status };

      if (action === 'hold_incident') {
        newState = { status: 'investigating', authority_escalation_status: 'held_by_override' };
        await serverDb.from('sentinel_incidents').update({ ...newState, updated_at: nowIso }).eq('id', incidentId);
        await serverDb.from('sentinel_authority_reports').update({ status: 'held', updated_at: nowIso }).eq('incident_id', incidentId).in('status', ['prepared', 'approval_required', 'dispatching', 'failed']);
        logAction = 'incident_held';
      }

      if (action === 'resume_incident') {
        if (incident.status === 'false_positive') {
          return NextResponse.json({ error: 'A false-positive incident cannot be resumed. Create or reopen an investigation record instead.' }, { status: 409, headers: NO_STORE });
        }
        newState = { status: 'investigating', authority_escalation_status: 'approval_required' };
        await serverDb.from('sentinel_incidents').update({ ...newState, updated_at: nowIso }).eq('id', incidentId);
        await serverDb.from('sentinel_authority_reports').update({ status: 'approval_required', updated_at: nowIso }).eq('incident_id', incidentId).eq('status', 'held');
        logAction = 'incident_resumed';
      }

      if (action === 'false_positive') {
        const { count } = await serverDb.from('sentinel_authority_reports').select('id', { count: 'exact', head: true }).eq('incident_id', incidentId).eq('status', 'sent');
        sentReportsAlready = count || 0;
        newState = { status: 'false_positive', authority_escalation_status: 'cancelled' };
        await serverDb.from('sentinel_incidents').update({ ...newState, updated_at: nowIso }).eq('id', incidentId);
        await serverDb.from('sentinel_authority_reports').update({ status: 'cancelled', updated_at: nowIso }).eq('incident_id', incidentId).neq('status', 'sent');
        logAction = 'false_positive';
      }
    }

    const { error: logError } = await serverDb.from('sentinel_override_events').insert({
      tenant_id: tenantId,
      incident_id: incidentId || null,
      action: logAction,
      reason,
      previous_state: previousState,
      new_state: newState,
      actor_user_id: membership.user_id,
    });
    if (logError) throw logError;

    return NextResponse.json({
      ok: true,
      action,
      newState,
      sentReportsAlready,
      warning: sentReportsAlready > 0 ? 'One or more authority reports were already sent and cannot be recalled automatically.' : null,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Aridon Sentinel override error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to apply Sentinel override.' }, { status: 500, headers: NO_STORE });
  }
}
