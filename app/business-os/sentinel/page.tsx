'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '../../../lib/supabase';
import { SENTINEL_AUTHORITIES } from '../../../lib/sentinelSecurity';

type PolicyRow = {
  id?: string;
  tenant_id: string;
  escalation_mode: 'prepare_only' | 'approval_required' | 'automatic_critical';
  automatic_score_threshold: number;
  automatic_confidence_threshold: number;
  notify_cisa: boolean;
  notify_fbi: boolean;
  local_authority_name: string | null;
  local_authority_email: string | null;
  legal_contact_email: string | null;
  security_contact_email: string | null;
  preserve_evidence: boolean;
  evidence_retention_days: number;
};

type IncidentRow = {
  id: string;
  title: string;
  severity: string;
  risk_score: number;
  confidence: number;
  status: string;
  source: string;
  authority_escalation_status: string;
  detected_at: string;
};

type ReportRow = {
  id: string;
  incident_id: string;
  authority: string;
  destination: string;
  delivery_method: string;
  status: string;
  report_payload: { subject?: string; body?: string } | null;
  submitted_at: string | null;
};

const defaultPolicy = (tenantId: string): PolicyRow => ({
  tenant_id: tenantId,
  escalation_mode: 'approval_required',
  automatic_score_threshold: 95,
  automatic_confidence_threshold: 90,
  notify_cisa: true,
  notify_fbi: true,
  local_authority_name: '',
  local_authority_email: '',
  legal_contact_email: '',
  security_contact_email: '',
  preserve_evidence: true,
  evidence_retention_days: 2555,
});

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #d8e1dc',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 8px 30px rgba(16,33,28,.06)',
};

const label: React.CSSProperties = { display: 'block', fontWeight: 800, fontSize: 12, marginBottom: 6, color: '#2c4039' };
const input: React.CSSProperties = { width: '100%', padding: '11px 12px', border: '1px solid #cbd7d1', borderRadius: 10, fontSize: 14, background: '#fff' };
const button: React.CSSProperties = { border: 0, borderRadius: 10, padding: '11px 15px', fontWeight: 900, cursor: 'pointer' };

export default function SentinelEnterprisePage() {
  const supabase = useMemo(() => getBrowserClient(), []);
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [userId, setUserId] = useState('');
  const [policy, setPolicy] = useState<PolicyRow | null>(null);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');

  const refreshData = useCallback(async (resolvedTenantId?: string) => {
    const id = resolvedTenantId || tenantId;
    if (!id) return;
    const [{ data: policyData }, { data: incidentData }, { data: reportData }] = await Promise.all([
      supabase.from('sentinel_security_policies').select('*').eq('tenant_id', id).maybeSingle(),
      supabase.from('sentinel_incidents').select('id,title,severity,risk_score,confidence,status,source,authority_escalation_status,detected_at').eq('tenant_id', id).order('detected_at', { ascending: false }).limit(20),
      supabase.from('sentinel_authority_reports').select('id,incident_id,authority,destination,delivery_method,status,report_payload,submitted_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(30),
    ]);
    setPolicy((policyData as PolicyRow | null) || defaultPolicy(id));
    setIncidents((incidentData as IncidentRow[] | null) || []);
    setReports((reportData as ReportRow[] | null) || []);
  }, [supabase, tenantId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!active) return;
      if (!session?.user) {
        setMessage('Sign in to an Aridon company workspace to configure Sentinel Enterprise.');
        setLoading(false);
        return;
      }
      setUserId(session.user.id);
      const { data: membership } = await supabase.from('customer_memberships').select('tenant_id,role').eq('user_id', session.user.id).limit(1).maybeSingle();
      if (!membership?.tenant_id) {
        setMessage('No company workspace is attached to this account yet.');
        setLoading(false);
        return;
      }
      const id = membership.tenant_id as string;
      setTenantId(id);
      const { data: tenant } = await supabase.from('customer_tenants').select('business_name').eq('id', id).maybeSingle();
      if (!active) return;
      setTenantName((tenant?.business_name as string) || 'Company workspace');
      await refreshData(id);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [refreshData, supabase]);

  async function savePolicy() {
    if (!policy || !tenantId) return;
    setSaving(true);
    setMessage('');
    const payload = {
      ...policy,
      tenant_id: tenantId,
      local_authority_name: policy.local_authority_name || null,
      local_authority_email: policy.local_authority_email || null,
      legal_contact_email: policy.legal_contact_email || null,
      security_contact_email: policy.security_contact_email || null,
      created_by: userId || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('sentinel_security_policies').upsert(payload, { onConflict: 'tenant_id' });
    setSaving(false);
    if (error) {
      setMessage(`Could not save Sentinel policy: ${error.message}`);
      return;
    }
    setMessage('Sentinel Enterprise policy saved.');
    await refreshData();
  }

  async function runSafeSimulation() {
    if (!tenantId) return;
    setTesting(true);
    setMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setTesting(false);
      setMessage('Your session expired. Sign in again before running the simulation.');
      return;
    }

    const response = await fetch('/api/sentinel/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tenantId,
        title: 'SAFE SIMULATION - suspected mass data exfiltration',
        summary: 'Sentinel simulation: unfamiliar source, privilege escalation, abnormal database access and attempted bulk export. This simulation is permanently blocked from contacting authorities.',
        incidentType: 'data_exfiltration',
        confidence: 98,
        simulation: true,
        actor: {
          ip: '203.0.113.42',
          deviceId: 'simulation-device',
          observedIdentity: 'simulation-only',
          country: 'Simulation',
        },
        indicators: [{ type: 'simulation', value: 'bulk-export-pattern' }],
        affectedAssets: [{ type: 'database', name: 'customer-records-simulation' }],
        evidence: { simulation: true, recordsRequested: 18000, newApiTokenAttempt: true },
        signals: {
          unauthorizedAccess: true,
          privilegeEscalation: true,
          dataExfiltration: true,
          massRecordAccess: true,
          commandAndControl: true,
          impossibleTravel: true,
          newDevice: true,
        },
      }),
    });
    const result = await response.json();
    setTesting(false);
    if (!response.ok) {
      setMessage(result.error || 'Simulation failed.');
      return;
    }
    setMessage(`Safe simulation detected at ${result.incident?.risk_score || 0}/100. Authority dispatch was disabled by simulation lock.`);
    await refreshData();
  }

  async function dispatchReport(report: ReportRow) {
    setMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return setMessage('Your session expired. Sign in again.');

    const response = await fetch('/api/sentinel/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reportId: report.id, approved: true }),
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error || 'Authority dispatch failed.');
    if (result.requiresPortal) {
      window.open(result.portalUrl, '_blank', 'noopener,noreferrer');
      setMessage('The FBI/IC3 filing page was opened. Sentinel has prepared the incident details, but the official filing must be reviewed and certified by the filer.');
    } else {
      setMessage(`Report sent to ${result.authority}.`);
      await refreshData();
    }
  }

  if (loading) {
    return <main style={{ minHeight: '70vh', padding: 40, fontFamily: 'Arial, sans-serif', background: '#f3f7f5' }}>Loading Sentinel Enterprise…</main>;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f3f7f5', color: '#10211c', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#091713', color: '#fff', padding: '44px 20px 34px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.6, color: '#9EF0CF', marginBottom: 10 }}>ARIDON SENTINEL ENTERPRISE</div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,58px)', lineHeight: 1.02, margin: '0 0 14px' }}>Stop the breach. Preserve the evidence. Escalate the real threat.</h1>
          <p style={{ maxWidth: 820, margin: 0, color: '#cfe0d9', fontSize: 18, lineHeight: 1.55 }}>Zero-trust monitoring, behavioral risk scoring, automatic containment, evidence chain-of-custody and controlled authority reporting for companies of any size.</p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/business-os" style={{ color: '#10211c', background: '#9EF0CF', borderRadius: 10, padding: '10px 14px', fontWeight: 900, textDecoration: 'none' }}>← Business OS</Link>
            <span style={{ border: '1px solid #36544a', borderRadius: 10, padding: '10px 14px', fontWeight: 800 }}>{tenantName || 'No workspace connected'}</span>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 60px' }}>
        {message && <div style={{ ...card, marginBottom: 18, borderColor: '#8abca8', background: '#f8fffb', fontWeight: 800 }}>{message}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            ['Zero Trust', 'Every user, device, app and AI agent gets only the access it needs.'],
            ['Behavior Engine', 'Correlates weak signals into one incident instead of a pile of disconnected alerts.'],
            ['Auto Containment', 'Revoke sessions, freeze exports, isolate workloads and rotate credentials.'],
            ['Authority Bridge', 'Builds a defensible evidence packet and routes serious incidents to approved channels.'],
          ].map(([title, text]) => <div key={title} style={card}><div style={{ fontSize: 18, fontWeight: 950, marginBottom: 7 }}>{title}</div><div style={{ color: '#52635d', lineHeight: 1.5, fontSize: 14 }}>{text}</div></div>)}
        </div>

        {policy && <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(300px,.75fr)', gap: 18, alignItems: 'start' }}>
          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Authority escalation policy</h2>
            <p style={{ color: '#5d6e68', lineHeight: 1.5 }}>Automatic reporting is deliberately gated by severity and evidence confidence. A test simulation can never contact an outside agency.</p>

            <div style={{ marginTop: 18 }}>
              <label style={label}>Escalation mode</label>
              <select style={input} value={policy.escalation_mode} onChange={(e) => setPolicy({ ...policy, escalation_mode: e.target.value as PolicyRow['escalation_mode'] })}>
                <option value="prepare_only">Prepare evidence only</option>
                <option value="approval_required">Require human approval before sending</option>
                <option value="automatic_critical">Automatically send pre-authorized CRITICAL reports</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 14 }}>
              <div><label style={label}>Auto-send risk threshold</label><input style={input} type="number" min={80} max={100} value={policy.automatic_score_threshold} onChange={(e) => setPolicy({ ...policy, automatic_score_threshold: Number(e.target.value) })} /></div>
              <div><label style={label}>Evidence confidence threshold</label><input style={input} type="number" min={80} max={100} value={policy.automatic_confidence_threshold} onChange={(e) => setPolicy({ ...policy, automatic_confidence_threshold: Number(e.target.value) })} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 16 }}>
              <label style={{ ...card, padding: 14, display: 'flex', gap: 10, alignItems: 'center', boxShadow: 'none' }}><input type="checkbox" checked={policy.notify_cisa} onChange={(e) => setPolicy({ ...policy, notify_cisa: e.target.checked })} /><span><strong>CISA</strong><br/><small>{SENTINEL_AUTHORITIES.cisa.email}</small></span></label>
              <label style={{ ...card, padding: 14, display: 'flex', gap: 10, alignItems: 'center', boxShadow: 'none' }}><input type="checkbox" checked={policy.notify_fbi} onChange={(e) => setPolicy({ ...policy, notify_fbi: e.target.checked })} /><span><strong>FBI / IC3</strong><br/><small>Prepared for certified portal filing</small></span></label>
              <label style={{ ...card, padding: 14, display: 'flex', gap: 10, alignItems: 'center', boxShadow: 'none' }}><input type="checkbox" checked={policy.preserve_evidence} onChange={(e) => setPolicy({ ...policy, preserve_evidence: e.target.checked })} /><span><strong>Preserve evidence</strong><br/><small>Hash incident evidence for chain-of-custody</small></span></label>
            </div>

            <h3 style={{ marginTop: 24 }}>Company emergency contacts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              <div><label style={label}>Local authority / agency name</label><input style={input} value={policy.local_authority_name || ''} onChange={(e) => setPolicy({ ...policy, local_authority_name: e.target.value })} placeholder="Local FBI field office, police cyber unit…" /></div>
              <div><label style={label}>Local authority email</label><input style={input} type="email" value={policy.local_authority_email || ''} onChange={(e) => setPolicy({ ...policy, local_authority_email: e.target.value })} placeholder="Verified agency email" /></div>
              <div><label style={label}>Security contact email</label><input style={input} type="email" value={policy.security_contact_email || ''} onChange={(e) => setPolicy({ ...policy, security_contact_email: e.target.value })} placeholder="security@company.com" /></div>
              <div><label style={label}>Legal/privacy contact email</label><input style={input} type="email" value={policy.legal_contact_email || ''} onChange={(e) => setPolicy({ ...policy, legal_contact_email: e.target.value })} placeholder="legal@company.com" /></div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
              <button style={{ ...button, background: '#10211c', color: '#fff' }} disabled={saving} onClick={savePolicy}>{saving ? 'Saving…' : 'Save Sentinel policy'}</button>
              <button style={{ ...button, background: '#dff7ed', color: '#10211c' }} disabled={testing} onClick={runSafeSimulation}>{testing ? 'Running safe simulation…' : 'Run safe breach simulation'}</button>
            </div>
          </div>

          <aside style={{ display: 'grid', gap: 14 }}>
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#577069' }}>AUTOMATIC CRITICAL MODE</div>
              <div style={{ fontSize: 28, fontWeight: 950, margin: '7px 0' }}>{policy.escalation_mode === 'automatic_critical' ? 'ARMED' : 'OFF'}</div>
              <p style={{ marginBottom: 0, color: '#5b6d67', lineHeight: 1.5 }}>Requires CRITICAL severity, risk ≥ {policy.automatic_score_threshold}, confidence ≥ {policy.automatic_confidence_threshold}, and a real incident. CISA/local email dispatch also requires a connected Gmail account.</p>
            </div>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Built-in authority paths</h3>
              <p style={{ marginBottom: 8 }}><strong>CISA:</strong> {SENTINEL_AUTHORITIES.cisa.email}<br/>{SENTINEL_AUTHORITIES.cisa.phone}</p>
              <p style={{ marginBottom: 0 }}><strong>FBI:</strong> IC3 complaint package + field-office route</p>
            </div>
            <div style={{ ...card, background: '#fffaf0', borderColor: '#ead8ad' }}>
              <strong>Attribution guardrail</strong>
              <p style={{ marginBottom: 0, color: '#6f6041', lineHeight: 1.5 }}>Sentinel reports observed IPs, accounts, devices and indicators as suspected technical activity. It does not tell authorities that a named person is guilty unless that identity has been independently verified.</p>
            </div>
          </aside>
        </div>}

        <div style={{ ...card, marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>Incident command feed</h2>
          {incidents.length === 0 ? <p style={{ color: '#667670' }}>No Sentinel incidents recorded yet.</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}><thead><tr>{['Incident','Severity','Risk','Confidence','Status','Authority','Detected'].map((x) => <th key={x} style={{ textAlign: 'left', fontSize: 11, color: '#60716b', padding: '8px 10px', borderBottom: '1px solid #dce5e0' }}>{x}</th>)}</tr></thead><tbody>{incidents.map((incident) => <tr key={incident.id}><td style={{ padding: 10, borderBottom: '1px solid #edf2ef' }}><strong>{incident.title}</strong>{incident.source === 'sentinel_simulation' && <div style={{ fontSize: 11, color: '#6d7d77' }}>SAFE SIMULATION</div>}</td><td style={{ padding: 10, fontWeight: 900 }}>{incident.severity.toUpperCase()}</td><td style={{ padding: 10 }}>{incident.risk_score}/100</td><td style={{ padding: 10 }}>{incident.confidence}%</td><td style={{ padding: 10 }}>{incident.status}</td><td style={{ padding: 10 }}>{incident.authority_escalation_status}</td><td style={{ padding: 10, whiteSpace: 'nowrap' }}>{new Date(incident.detected_at).toLocaleString()}</td></tr>)}</tbody></table></div>}
        </div>

        <div style={{ ...card, marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>Authority report queue</h2>
          {reports.length === 0 ? <p style={{ color: '#667670' }}>No authority reports are waiting.</p> : <div style={{ display: 'grid', gap: 10 }}>{reports.map((report) => <div key={report.id} style={{ border: '1px solid #dce5e0', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div><strong>{report.authority}</strong><div style={{ color: '#697a74', fontSize: 13 }}>{report.status} · {report.delivery_method} · {report.destination}</div></div><div>{report.status !== 'sent' && <button style={{ ...button, background: '#10211c', color: '#fff' }} onClick={() => dispatchReport(report)}>{report.delivery_method === 'portal' ? 'Open certified filing' : 'Approve & send now'}</button>}{report.status === 'sent' && <strong style={{ color: '#236c51' }}>SENT ✓</strong>}</div></div>)}</div>}
        </div>
      </section>
    </main>
  );
}
