'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '../../../../lib/supabase';

type Policy = {
  authority_hold?: boolean;
  authority_hold_until?: string | null;
  authority_hold_reason?: string | null;
};

type Incident = {
  id: string;
  title: string;
  severity: string;
  risk_score: number;
  confidence: number;
  status: string;
  authority_escalation_status: string;
  detected_at: string;
};

type OverrideEvent = {
  id: string;
  action: string;
  reason: string;
  incident_id: string | null;
  created_at: string;
};

const card: React.CSSProperties = { background: '#fff', border: '1px solid #d8e1dc', borderRadius: 18, padding: 20, boxShadow: '0 8px 30px rgba(16,33,28,.06)' };
const button: React.CSSProperties = { border: 0, borderRadius: 10, padding: '10px 13px', fontWeight: 900, cursor: 'pointer' };
const input: React.CSSProperties = { width: '100%', padding: '11px 12px', border: '1px solid #cbd7d1', borderRadius: 10, fontSize: 14, background: '#fff' };

export default function SentinelOverridePage() {
  const supabase = useMemo(() => getBrowserClient(), []);
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [policy, setPolicy] = useState<Policy>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<OverrideEvent[]>([]);
  const [reason, setReason] = useState('Possible false positive. Pause external reporting while the security team verifies the evidence.');
  const [holdMinutes, setHoldMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const holdActive = Boolean(policy.authority_hold && (!policy.authority_hold_until || Date.parse(policy.authority_hold_until) > Date.now()));

  const refresh = useCallback(async (id?: string) => {
    const tenant = id || tenantId;
    if (!tenant) return;
    const [{ data: policyData }, { data: incidentData }, { data: eventData }] = await Promise.all([
      supabase.from('sentinel_security_policies').select('authority_hold,authority_hold_until,authority_hold_reason').eq('tenant_id', tenant).maybeSingle(),
      supabase.from('sentinel_incidents').select('id,title,severity,risk_score,confidence,status,authority_escalation_status,detected_at').eq('tenant_id', tenant).order('detected_at', { ascending: false }).limit(25),
      supabase.from('sentinel_override_events').select('id,action,reason,incident_id,created_at').eq('tenant_id', tenant).order('created_at', { ascending: false }).limit(25),
    ]);
    setPolicy((policyData as Policy | null) || {});
    setIncidents((incidentData as Incident[] | null) || []);
    setEvents((eventData as OverrideEvent[] | null) || []);
  }, [supabase, tenantId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session?.user) {
        setMessage('Sign in to a company workspace to use the Sentinel override.');
        setLoading(false);
        return;
      }
      const { data: membership } = await supabase.from('customer_memberships').select('tenant_id,role').eq('user_id', data.session.user.id).limit(1).maybeSingle();
      if (!membership?.tenant_id) {
        setMessage('No company workspace is attached to this account.');
        setLoading(false);
        return;
      }
      const id = membership.tenant_id as string;
      setTenantId(id);
      const { data: tenant } = await supabase.from('customer_tenants').select('business_name').eq('id', id).maybeSingle();
      setTenantName((tenant?.business_name as string) || 'Company workspace');
      await refresh(id);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [refresh, supabase]);

  async function applyOverride(action: string, incidentId?: string) {
    if (!tenantId) return;
    if (reason.trim().length < 5) {
      setMessage('Enter a short reason first. Every override must have an audit explanation.');
      return;
    }
    setBusy(`${action}:${incidentId || ''}`);
    setMessage('');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setBusy('');
      setMessage('Your session expired. Sign in again.');
      return;
    }
    const response = await fetch('/api/sentinel/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tenantId, incidentId, action, reason, holdMinutes }),
    });
    const result = await response.json();
    setBusy('');
    if (!response.ok) {
      setMessage(result.error || 'Override failed.');
      return;
    }
    setMessage(result.warning || 'Override applied and written to the Sentinel audit ledger.');
    await refresh();
  }

  if (loading) return <main style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>Loading Sentinel Override…</main>;

  return (
    <main style={{ minHeight: '100vh', background: '#f3f7f5', color: '#10211c', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: holdActive ? '#3b160f' : '#091713', color: '#fff', padding: '42px 20px 34px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: holdActive ? '#ffd8bd' : '#9EF0CF', fontWeight: 950, fontSize: 12, letterSpacing: 1.5 }}>SENTINEL COMPANY OVERRIDE</div>
          <h1 style={{ fontSize: 'clamp(30px,5vw,54px)', margin: '8px 0 12px' }}>{holdActive ? 'External reporting is PAUSED' : 'False-positive safety switch'}</h1>
          <p style={{ maxWidth: 850, lineHeight: 1.55, color: '#d5e2dd', fontSize: 18 }}>Containment and evidence preservation keep running. The override pauses outside authority reporting so the company can verify a suspicious finding before anything leaves the organization.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/business-os/sentinel" style={{ ...button, background: '#9EF0CF', color: '#10211c', textDecoration: 'none' }}>← Sentinel Enterprise</Link>
            <span style={{ border: '1px solid #587269', padding: '10px 13px', borderRadius: 10, fontWeight: 900 }}>{tenantName}</span>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 60px' }}>
        {message && <div style={{ ...card, marginBottom: 16, background: '#fffdf5', borderColor: '#e6cf95', fontWeight: 800 }}>{message}</div>}

        <div style={{ ...card, borderColor: holdActive ? '#d69a72' : '#d8e1dc', marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>Company-wide authority hold</h2>
          <p style={{ color: '#5e6e68', lineHeight: 1.5 }}>This is the emergency brake. It blocks automatic and manual outside reporting while active. It does not delete evidence, stop containment, or hide the event from the audit history.</p>
          {holdActive && <div style={{ padding: 12, borderRadius: 10, background: '#fff3e8', marginBottom: 14 }}><strong>HOLD ACTIVE</strong><br/>Until: {policy.authority_hold_until ? new Date(policy.authority_hold_until).toLocaleString() : 'cleared manually'}<br/>Reason: {policy.authority_hold_reason || 'No reason recorded'}</div>}
          <label style={{ display: 'block', fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Reason for override</label>
          <textarea style={{ ...input, minHeight: 88, resize: 'vertical' }} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end', marginTop: 12 }}>
            <div style={{ minWidth: 220 }}><label style={{ display: 'block', fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Hold duration</label><select style={input} value={holdMinutes} onChange={(e) => setHoldMinutes(Number(e.target.value))}><option value={15}>15 minutes</option><option value={60}>1 hour</option><option value={240}>4 hours</option><option value={1440}>24 hours</option><option value={10080}>7 days</option></select></div>
            {!holdActive ? <button style={{ ...button, background: '#8a2f1f', color: '#fff' }} disabled={Boolean(busy)} onClick={() => applyOverride('set_company_hold')}>{busy ? 'Applying…' : 'PAUSE external reporting'}</button> : <button style={{ ...button, background: '#174d3b', color: '#fff' }} disabled={Boolean(busy)} onClick={() => applyOverride('clear_company_hold')}>{busy ? 'Clearing…' : 'Clear company hold'}</button>}
          </div>
        </div>

        <div style={{ ...card, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>Incident-by-incident review</h2>
          <p style={{ color: '#5e6e68' }}>Use a hold when the evidence needs review. Use “False positive” only after the company has determined the incident was not a real breach. Reports already sent cannot be recalled automatically.</p>
          {incidents.length === 0 ? <p>No incidents recorded.</p> : <div style={{ display: 'grid', gap: 10 }}>{incidents.map((incident) => {
            const held = incident.authority_escalation_status === 'held_by_override';
            const falsePositive = incident.status === 'false_positive';
            return <div key={incident.id} style={{ border: '1px solid #dce5e0', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div><strong>{incident.title}</strong><div style={{ color: '#687872', fontSize: 13 }}>{incident.severity.toUpperCase()} · risk {incident.risk_score}/100 · confidence {incident.confidence}% · {incident.status} · {incident.authority_escalation_status}</div></div>
                <div style={{ fontSize: 12, color: '#72817c' }}>{new Date(incident.detected_at).toLocaleString()}</div>
              </div>
              {!falsePositive && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 11 }}>
                {!held ? <button style={{ ...button, background: '#f0e4c3', color: '#4a3b13' }} disabled={Boolean(busy)} onClick={() => applyOverride('hold_incident', incident.id)}>Hold for review</button> : <button style={{ ...button, background: '#dff5e9', color: '#174d3b' }} disabled={Boolean(busy)} onClick={() => applyOverride('resume_incident', incident.id)}>Resume as approval-required</button>}
                <button style={{ ...button, background: '#f6d8d2', color: '#7a2317' }} disabled={Boolean(busy)} onClick={() => applyOverride('false_positive', incident.id)}>Mark false positive</button>
              </div>}
            </div>;
          })}</div>}
        </div>

        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Override audit ledger</h2>
          <p style={{ color: '#5e6e68' }}>Every pause, release, incident hold, resume, and false-positive decision is retained. The override cannot silently erase the original incident.</p>
          {events.length === 0 ? <p>No override activity recorded.</p> : <div style={{ display: 'grid', gap: 8 }}>{events.map((event) => <div key={event.id} style={{ borderBottom: '1px solid #edf2ef', paddingBottom: 9 }}><strong>{event.action.replaceAll('_', ' ')}</strong> · {new Date(event.created_at).toLocaleString()}<div style={{ color: '#62726c', fontSize: 13 }}>{event.reason}</div></div>)}</div>}
        </div>
      </section>
    </main>
  );
}
