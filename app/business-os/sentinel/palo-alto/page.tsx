'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '../../../../lib/supabase';

type FabricResult = {
  source: string;
  sourceLabel: string;
  draft: Record<string, unknown> & { title?: string; summary?: string; incidentType?: string; confidence?: number; simulation?: boolean };
  fabric: {
    riskScore: number;
    severity: string;
    blastRadiusScore: number;
    blastRadius: string;
    priorityActions: string[];
    continuityActions: string[];
    humanDecision: string;
    evidenceNotes: string[];
  };
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #d7e2dd',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 10px 34px rgba(10,30,23,.06)',
};

const button: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: '11px 15px',
  fontWeight: 900,
  cursor: 'pointer',
};

const SAMPLE_EVENT = JSON.stringify({
  source: 'Prisma AIRS',
  title: 'AI agent attempted unauthorized customer-data export',
  description: 'An AI agent used a newly elevated role to request a bulk export from an unfamiliar device. The tool call was blocked for review.',
  category: 'ai_agent_security',
  confidence: 0.97,
  timestamp: new Date().toISOString(),
  actor: {
    name: 'sales-research-agent',
    sourceIp: '203.0.113.42',
    device: 'unmanaged-agent-runtime',
  },
  affectedAssets: [
    { type: 'ai_agent', name: 'sales-research-agent' },
    { type: 'database', name: 'customer-records' },
  ],
  indicators: [
    { type: 'behavior', value: 'bulk export' },
    { type: 'behavior', value: 'privilege escalation' },
    { type: 'device', value: 'new device' },
  ],
  evidence: {
    attemptedRecords: 18000,
    toolCall: 'export_customer_records',
  },
}, null, 2);

export default function PaloAltoSentinelLabPage() {
  const supabase = useMemo(() => getBrowserClient(), []);
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [eventText, setEventText] = useState(SAMPLE_EVENT);
  const [result, setResult] = useState<FabricResult | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session?.user) {
        setMessage('Sign in to an Aridon company workspace to use the Palo Alto integration lab.');
        setLoading(false);
        return;
      }
      const { data: membership } = await supabase
        .from('customer_memberships')
        .select('tenant_id')
        .eq('user_id', data.session.user.id)
        .limit(1)
        .maybeSingle();
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
      setLoading(false);
    })();
    return () => { active = false; };
  }, [supabase]);

  async function accessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  }

  async function analyze() {
    setMessage('');
    setResult(null);
    if (!tenantId) return setMessage('A company workspace is required.');
    let event: unknown;
    try {
      event = JSON.parse(eventText);
    } catch {
      return setMessage('The event payload is not valid JSON.');
    }

    setAnalyzing(true);
    const token = await accessToken();
    if (!token) {
      setAnalyzing(false);
      return setMessage('Your session expired. Sign in again.');
    }

    const response = await fetch('/api/sentinel/integrations/palo-alto/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tenantId, event, simulation: true }),
    });
    const data = await response.json();
    setAnalyzing(false);
    if (!response.ok) return setMessage(data.error || 'Unable to analyze this event.');
    setResult(data.normalized as FabricResult);
    setMessage('Event normalized into the Sentinel Adaptive Containment Fabric. Simulation lock remains on.');
  }

  async function createIncident() {
    if (!result || !tenantId) return;
    setCreating(true);
    setMessage('');
    const token = await accessToken();
    if (!token) {
      setCreating(false);
      return setMessage('Your session expired. Sign in again.');
    }

    const response = await fetch('/api/sentinel/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...result.draft, tenantId, simulation: true }),
    });
    const data = await response.json();
    setCreating(false);
    if (!response.ok) return setMessage(data.error || 'Unable to create the Sentinel incident.');
    setMessage(`Safe Sentinel incident created at risk ${data.incident?.risk_score ?? result.fabric.riskScore}/100. External reporting is locked off for simulations.`);
  }

  if (loading) {
    return <main style={{ minHeight: '70vh', padding: 40, background: '#f3f7f5', fontFamily: 'Arial, sans-serif' }}>Loading Sentinel Response Fabric…</main>;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f3f7f5', color: '#10211c', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07130f', color: '#fff', padding: '42px 20px 36px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, letterSpacing: 1.6, fontSize: 12 }}>ARIDON SENTINEL RESPONSE FABRIC</div>
          <h1 style={{ fontSize: 'clamp(34px,5vw,60px)', lineHeight: 1.02, margin: '10px 0 14px' }}>Palo Alto Integration Lab</h1>
          <p style={{ maxWidth: 850, color: '#cfe0d9', fontSize: 18, lineHeight: 1.55, margin: 0 }}>Normalize alerts from Prisma AIRS, Cortex XSIAM, Cortex XSOAR and CyberArk into one containment, evidence, continuity and human-decision workflow.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/business-os/sentinel" style={{ color: '#10211c', background: '#9EF0CF', borderRadius: 10, padding: '10px 14px', fontWeight: 900, textDecoration: 'none' }}>← Sentinel Command Center</Link>
            <span style={{ border: '1px solid #36544a', borderRadius: 10, padding: '10px 14px', fontWeight: 800 }}>{tenantName || 'No workspace connected'}</span>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 60px' }}>
        {message && <div style={{ ...card, marginBottom: 16, background: '#f8fffb', borderColor: '#8abca8', fontWeight: 800 }}>{message}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 20 }}>
          {[
            ['Prisma AIRS', 'AI agent and AI runtime alerts become agent quarantine, evidence and delegated-access decisions.'],
            ['Cortex XSIAM', 'Detection lineage and telemetry become a company-level blast-radius and containment decision.'],
            ['Cortex XSOAR', 'Existing playbooks remain execution tools while Sentinel adds continuity, approval and escalation policy.'],
            ['CyberArk', 'Privileged identity events become targeted session suspension, credential rotation and access-scope decisions.'],
          ].map(([title, text]) => <div key={title} style={card}><div style={{ fontWeight: 950, fontSize: 18, marginBottom: 7 }}>{title}</div><div style={{ color: '#576861', lineHeight: 1.5, fontSize: 14 }}>{text}</div></div>)}
        </div>

        <div style={{ ...card, marginBottom: 20, background: '#10211c', color: '#fff', borderColor: '#10211c' }}>
          <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.4 }}>WORKFLOW</div>
          <div style={{ marginTop: 10, fontSize: 18, lineHeight: 1.7, fontWeight: 850 }}>Palo Alto detects → Sentinel measures blast radius → smallest-safe containment → evidence preservation → business continuity check → authorized human decision → controlled escalation.</div>
          <p style={{ color: '#bcd0c7', marginBottom: 0, lineHeight: 1.55 }}>This lab currently exercises the adapter and Sentinel incident pipeline with simulation lock enabled. Live vendor credentials and production webhook authorization are not configured here yet.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(320px,.95fr)', gap: 18, alignItems: 'start' }}>
          <div style={card}>
            <h2 style={{ marginTop: 0 }}>1. Paste or edit a Palo Alto ecosystem event</h2>
            <p style={{ color: '#5d6e68', lineHeight: 1.5 }}>The sample models a blocked rogue-agent export. You can replace it with a safe alert payload from your own test environment.</p>
            <textarea
              value={eventText}
              onChange={(event) => setEventText(event.target.value)}
              spellCheck={false}
              style={{ width: '100%', minHeight: 430, border: '1px solid #cbd7d1', borderRadius: 12, padding: 14, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.45, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <button onClick={analyze} disabled={analyzing || !tenantId} style={{ ...button, background: '#10211c', color: '#fff', opacity: analyzing || !tenantId ? .55 : 1 }}>{analyzing ? 'Analyzing…' : 'Analyze safe event'}</button>
              <button onClick={() => { setEventText(SAMPLE_EVENT); setResult(null); setMessage('Sample event restored.'); }} style={{ ...button, background: '#e8f2ed', color: '#10211c' }}>Restore sample</button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            <div style={card}>
              <h2 style={{ marginTop: 0 }}>2. Adaptive Containment Fabric</h2>
              {!result ? <p style={{ color: '#65756f', lineHeight: 1.55 }}>Analyze an event to generate the risk score, blast-radius estimate, targeted containment sequence and business-continuity guardrails.</p> : <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: '#edf6f1', borderRadius: 12, padding: 14 }}><small style={{ color: '#61726b', fontWeight: 800 }}>RISK</small><div style={{ fontSize: 30, fontWeight: 950 }}>{result.fabric.riskScore}/100</div><div style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: 12 }}>{result.fabric.severity}</div></div>
                  <div style={{ background: '#edf6f1', borderRadius: 12, padding: 14 }}><small style={{ color: '#61726b', fontWeight: 800 }}>BLAST RADIUS</small><div style={{ fontSize: 30, fontWeight: 950 }}>{result.fabric.blastRadiusScore}/100</div><div style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: 12 }}>{result.fabric.blastRadius}</div></div>
                </div>
                <div style={{ fontWeight: 900, marginBottom: 5 }}>Source: {result.sourceLabel}</div>
                <div style={{ color: '#576861', fontSize: 14, lineHeight: 1.5 }}>{result.fabric.humanDecision}</div>
              </>}
            </div>

            {result && <div style={card}>
              <h3 style={{ marginTop: 0 }}>Priority containment</h3>
              <ol style={{ paddingLeft: 20, color: '#4f615a', lineHeight: 1.55 }}>
                {result.fabric.priorityActions.slice(0, 7).map((action) => <li key={action} style={{ marginBottom: 7 }}>{action}</li>)}
              </ol>
              <h3>Business continuity</h3>
              <ul style={{ paddingLeft: 20, color: '#4f615a', lineHeight: 1.55 }}>
                {result.fabric.continuityActions.map((action) => <li key={action} style={{ marginBottom: 7 }}>{action}</li>)}
              </ul>
              <button onClick={createIncident} disabled={creating} style={{ ...button, width: '100%', background: '#9EF0CF', color: '#10211c', opacity: creating ? .55 : 1 }}>{creating ? 'Creating incident…' : 'Create safe Sentinel incident'}</button>
            </div>}
          </div>
        </div>

        <div style={{ ...card, marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>What is built now, and what remains for a live Palo Alto pilot</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
            <div><strong>Built now</strong><ul style={{ color: '#586962', lineHeight: 1.7, paddingLeft: 20 }}><li>Prisma AIRS / Cortex / CyberArk payload normalizer</li><li>Adaptive blast-radius scoring</li><li>Targeted containment sequencing</li><li>Business-continuity guardrails</li><li>Evidence preservation handoff</li><li>Safe Sentinel incident creation</li></ul></div>
            <div><strong>Needed for production vendor connectivity</strong><ul style={{ color: '#586962', lineHeight: 1.7, paddingLeft: 20 }}><li>Customer-authorized Palo Alto API credentials</li><li>Signed webhook / machine-auth configuration</li><li>Tenant-specific product mappings and field validation</li><li>Approved action permissions for each containment connector</li><li>Joint pilot test plan and rollback rules</li><li>Production rate limits, replay protection and connector monitoring</li></ul></div>
          </div>
        </div>
      </section>
    </main>
  );
}
