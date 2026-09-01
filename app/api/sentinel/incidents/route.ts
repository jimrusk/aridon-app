import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  base64UrlMessage,
  decryptToken,
  GMAIL_EMAIL_COOKIE,
  GMAIL_REFRESH_COOKIE,
  refreshGmailAccessToken,
  safeHeader,
} from '../../../../lib/gmail';
import { getServerClient, getUserScopedClient } from '../../../../lib/supabase';
import {
  buildAuthorityReport,
  containmentPlan,
  DEFAULT_SENTINEL_POLICY,
  isAutomaticEscalationEligible,
  scoreSentinelIncident,
  SENTINEL_AUTHORITIES,
  type SentinelIncidentDraft,
  type SentinelPolicy,
} from '../../../../lib/sentinelSecurity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  return authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
}

function policyFromRow(row: Record<string, unknown> | null): SentinelPolicy {
  if (!row) return DEFAULT_SENTINEL_POLICY;
  return {
    escalationMode: (row.escalation_mode as SentinelPolicy['escalationMode']) || DEFAULT_SENTINEL_POLICY.escalationMode,
    automaticScoreThreshold: Number(row.automatic_score_threshold || 95),
    automaticConfidenceThreshold: Number(row.automatic_confidence_threshold || 90),
    notifyCisa: row.notify_cisa !== false,
    notifyFbi: row.notify_fbi !== false,
    localAuthorityName: typeof row.local_authority_name === 'string' ? row.local_authority_name : undefined,
    localAuthorityEmail: typeof row.local_authority_email === 'string' ? row.local_authority_email : undefined,
    legalContactEmail: typeof row.legal_contact_email === 'string' ? row.legal_contact_email : undefined,
    securityContactEmail: typeof row.security_contact_email === 'string' ? row.security_contact_email : undefined,
    preserveEvidence: row.preserve_evidence !== false,
  };
}

async function sendGmailMessage(request: NextRequest, to: string, subject: string, body: string) {
  const encryptedRefreshToken = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
  if (!encryptedRefreshToken) return { sent: false, error: 'Gmail is not connected for automatic dispatch.' };

  const accessToken = await refreshGmailAccessToken(decryptToken(encryptedRefreshToken));
  const connectedEmail = request.cookies.get(GMAIL_EMAIL_COOKIE)?.value || '';
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
  const headers = [
    `To: ${safeHeader(to, 254)}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ];
  if (connectedEmail) headers.splice(1, 0, `From: ${safeHeader(connectedEmail, 254)}`);

  const rawMessage = `${headers.join('\r\n')}\r\n\r\n${body.replace(/\r?\n/g, '\r\n')}`;
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: base64UrlMessage(rawMessage) }),
    cache: 'no-store',
  });
  const data = (await response.json()) as { id?: string; error?: { message?: string } };
  if (!response.ok || !data.id) return { sent: false, error: data.error?.message || 'Gmail rejected the report.' };
  return { sent: true, messageId: data.id };
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE_HEADERS });
    }

    const accessToken = bearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'A signed-in Aridon session is required.' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const draft = (await request.json()) as SentinelIncidentDraft;
    if (!draft?.tenantId || !draft?.title?.trim() || !draft?.summary?.trim()) {
      return NextResponse.json({ error: 'tenantId, title and summary are required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const userDb = getUserScopedClient(accessToken);
    const [{ data: membership }, { data: tenant }, { data: policyRow }] = await Promise.all([
      userDb.from('customer_memberships').select('tenant_id,user_id,role').eq('tenant_id', draft.tenantId).maybeSingle(),
      userDb.from('customer_tenants').select('id,business_name').eq('id', draft.tenantId).maybeSingle(),
      userDb.from('sentinel_security_policies').select('*').eq('tenant_id', draft.tenantId).maybeSingle(),
    ]);

    if (!membership || !tenant) {
      return NextResponse.json({ error: 'You do not have access to this company workspace.' }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const policy = policyFromRow((policyRow || null) as Record<string, unknown> | null);
    const confidence = Math.max(0, Math.min(100, Math.round(Number(draft.confidence ?? 80))));
    const { riskScore, severity } = scoreSentinelIncident(draft.signals || {});
    const containmentActions = containmentPlan(draft.signals || {});
    const detectedAt = new Date().toISOString();
    const evidenceEnvelope = {
      incidentType: draft.incidentType || 'unauthorized_access',
      actor: draft.actor || {},
      indicators: draft.indicators || [],
      affectedAssets: draft.affectedAssets || [],
      evidence: draft.evidence || {},
      signals: draft.signals || {},
      occurredAt: draft.occurredAt || null,
      detectedAt,
      simulation: Boolean(draft.simulation),
    };
    const evidenceSha256 = createHash('sha256').update(JSON.stringify(evidenceEnvelope)).digest('hex');
    const automaticEligible = isAutomaticEscalationEligible(policy, severity, riskScore, confidence, Boolean(draft.simulation));
    const escalationStatus = draft.simulation
      ? 'not_required'
      : severity === 'high' || severity === 'critical'
        ? automaticEligible ? 'dispatching' : policy.escalationMode === 'prepare_only' ? 'prepared' : 'approval_required'
        : 'not_required';

    const serverDb = getServerClient();
    const { data: incident, error: incidentError } = await serverDb.from('sentinel_incidents').insert({
      tenant_id: draft.tenantId,
      source: draft.simulation ? 'sentinel_simulation' : 'aridon_sentinel',
      title: draft.title.trim().slice(0, 300),
      summary: draft.summary.trim().slice(0, 10_000),
      incident_type: (draft.incidentType || 'unauthorized_access').slice(0, 100),
      severity,
      risk_score: riskScore,
      confidence,
      status: 'detected',
      actor_profile: draft.actor || {},
      indicators: draft.indicators || [],
      affected_assets: draft.affectedAssets || [],
      evidence: policy.preserveEvidence ? evidenceEnvelope : { preservation_disabled_by_policy: true },
      containment_actions: containmentActions,
      evidence_sha256: evidenceSha256,
      authority_escalation_status: escalationStatus,
      occurred_at: draft.occurredAt || null,
      detected_at: detectedAt,
      created_by: membership.user_id,
    }).select('*').single();

    if (incidentError || !incident) throw new Error(incidentError?.message || 'Unable to store the Sentinel incident.');

    if (draft.simulation || (severity !== 'high' && severity !== 'critical')) {
      return NextResponse.json({ incident, authorityReports: [], automaticEligible: false, simulation: Boolean(draft.simulation) }, { headers: NO_STORE_HEADERS });
    }

    const reportText = buildAuthorityReport({
      organizationName: tenant.business_name || 'Aridon customer',
      incidentId: incident.id,
      title: incident.title,
      summary: incident.summary,
      incidentType: incident.incident_type,
      severity,
      riskScore,
      confidence,
      actor: draft.actor || {},
      indicators: draft.indicators || [],
      affectedAssets: draft.affectedAssets || [],
      containmentActions,
      evidenceSha256,
      occurredAt: draft.occurredAt,
      detectedAt,
    });

    const candidates: Array<{ authority: string; destination: string; delivery_method: 'email' | 'portal'; canAutoSend: boolean }> = [];
    if (policy.notifyCisa) candidates.push({ authority: 'CISA', destination: SENTINEL_AUTHORITIES.cisa.email, delivery_method: 'email', canAutoSend: true });
    if (policy.notifyFbi) candidates.push({ authority: 'FBI IC3', destination: SENTINEL_AUTHORITIES.fbi.url, delivery_method: 'portal', canAutoSend: false });
    if (policy.localAuthorityEmail) candidates.push({ authority: policy.localAuthorityName || 'Local law enforcement', destination: policy.localAuthorityEmail, delivery_method: 'email', canAutoSend: true });

    const authorityReports: Array<Record<string, unknown>> = [];
    let sentCount = 0;
    for (const candidate of candidates) {
      let status: 'prepared' | 'approval_required' | 'dispatching' | 'sent' | 'failed' =
        policy.escalationMode === 'prepare_only' ? 'prepared' : 'approval_required';
      let externalReference = '';
      let errorMessage = '';

      if (automaticEligible && candidate.canAutoSend) {
        status = 'dispatching';
        const sent = await sendGmailMessage(
          request,
          candidate.destination,
          `[CRITICAL CYBER INCIDENT] ${tenant.business_name || 'Aridon customer'} - ${incident.title}`,
          reportText,
        );
        status = sent.sent ? 'sent' : 'failed';
        if (sent.sent) {
          sentCount += 1;
          externalReference = sent.messageId || '';
        } else {
          errorMessage = sent.error || 'Automatic dispatch failed.';
        }
      }

      const { data: authorityReport, error: authorityError } = await serverDb.from('sentinel_authority_reports').insert({
        incident_id: incident.id,
        tenant_id: draft.tenantId,
        authority: candidate.authority,
        destination: candidate.destination,
        delivery_method: candidate.delivery_method,
        status,
        report_payload: {
          subject: `[CRITICAL CYBER INCIDENT] ${tenant.business_name || 'Aridon customer'} - ${incident.title}`,
          body: reportText,
          attribution_status: 'suspected_unverified',
          automatic_eligible: automaticEligible,
        },
        external_reference: externalReference || null,
        submitted_at: status === 'sent' ? new Date().toISOString() : null,
        error_message: errorMessage || null,
      }).select('*').single();
      if (!authorityError && authorityReport) authorityReports.push(authorityReport);
    }

    const finalEscalationStatus = sentCount > 0 ? 'reported' : automaticEligible ? 'failed' : escalationStatus;
    await serverDb.from('sentinel_incidents').update({
      authority_escalation_status: finalEscalationStatus,
      status: sentCount > 0 ? 'reported' : 'detected',
      updated_at: new Date().toISOString(),
    }).eq('id', incident.id);

    return NextResponse.json({
      incident: { ...incident, authority_escalation_status: finalEscalationStatus },
      authorityReports,
      automaticEligible,
      automaticDispatchCount: sentCount,
      fbiRequiresHumanCertification: policy.notifyFbi,
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon Sentinel incident error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process Sentinel incident.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
