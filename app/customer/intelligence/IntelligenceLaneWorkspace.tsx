'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';
import { intelligenceLanes, type IntelligenceLane } from '../../../lib/intelligenceSuite';

type Lead = {
  id: string;
  lane: IntelligenceLane;
  entity_name: string;
  entity_type?: string | null;
  location?: string | null;
  address?: string | null;
  primary_url?: string | null;
  source_urls?: string[] | null;
  score: number;
  confidence: number;
  verification_status: string;
  signal_summary?: string | null;
  why_now?: string | null;
  value_text?: string | null;
  score_breakdown?: Record<string, number> | null;
  signals?: Array<{ name?: string; strength?: number; evidence?: string; source_url?: string }> | null;
  risks?: string[] | null;
  contact_path?: string | null;
  recommended_next_step?: string | null;
  draft_outreach?: string | null;
  stage: string;
  updated_at?: string | null;
};

type WorkspaceData = {
  tenant: { id: string; businessName: string; industry?: string | null };
  profiles: Array<{ id: string; lane: IntelligenceLane; profile: Record<string, unknown> }>;
  leads: Lead[];
  runs: Array<{ id: string; lane: IntelligenceLane; status: string; result_count: number; started_at: string; completed_at?: string | null }>;
};

const routeByLane: Record<IntelligenceLane, string> = {
  business_need: '/customer/aridon-one',
  real_estate: '/customer/aridon-two',
  business_acquisition: '/customer/aridon-three',
};

const laneOrder: IntelligenceLane[] = ['business_need', 'real_estate', 'business_acquisition'];
const stages = ['new', 'reviewing', 'qualified', 'contacting', 'diligence', 'pursuing', 'won', 'lost', 'watching'];

function cloneDefault(lane: IntelligenceLane) {
  return JSON.parse(JSON.stringify(intelligenceLanes[lane].defaultProfile)) as Record<string, unknown>;
}

function asText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function asLines(value: unknown) {
  return Array.isArray(value) ? value.map(String).join('\n') : '';
}

function lines(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

export default function IntelligenceLaneWorkspace({ lane }: { lane: IntelligenceLane }) {
  const router = useRouter();
  const config = intelligenceLanes[lane];
  const [token, setToken] = useState('');
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown>>(cloneDefault(lane));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const api = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(path, { ...options, headers, cache: 'no-store' });
  }, [token]);

  const loadWorkspace = useCallback(async (accessToken: string) => {
    const response = await fetch('/api/customer/intelligence', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `${config.number} could not be loaded.`);
    const loaded = result as WorkspaceData;
    setData(loaded);
    const saved = loaded.profiles.find((item) => item.lane === lane)?.profile;
    setProfile(saved ? { ...cloneDefault(lane), ...saved } : cloneDefault(lane));
  }, [config.number, lane]);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data: sessionData }) => {
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        router.replace(`/customer/login?next=${encodeURIComponent(routeByLane[lane])}`);
        return;
      }
      setToken(accessToken);
      try {
        await loadWorkspace(accessToken);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : `${config.number} could not be loaded.`);
      } finally {
        setLoading(false);
      }
    });
  }, [config.number, lane, loadWorkspace, router]);

  const leads = useMemo(() => (data?.leads || []).filter((item) => item.lane === lane), [data, lane]);
  const latestRun = useMemo(() => (data?.runs || []).find((item) => item.lane === lane), [data, lane]);
  const active = leads.filter((item) => ['qualified', 'contacting', 'diligence', 'pursuing'].includes(item.stage)).length;
  const highConfidence = leads.filter((item) => item.confidence >= 75).length;

  function field(key: string, value: string | string[]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile(showMessage = true) {
    if (!token) return false;
    setSaving(true);
    try {
      const response = await api('/api/customer/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lane, profile }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Profile could not be saved.');
      if (showMessage) setMessage(`${config.number} profile saved.`);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Profile could not be saved.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function runScan() {
    if (!token || scanning) return;
    setScanning(true);
    setMessage(`${config.number} is scanning live public sources…`);
    try {
      const saved = await saveProfile(false);
      if (!saved) return;
      const response = await api('/api/customer/intelligence/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lane, count: 6 }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Live radar scan failed.');
      const count = Array.isArray(result.leads) ? result.leads.length : 0;
      setMessage(`${config.number} scan complete. ${count} source-checked lead${count === 1 ? '' : 's'} saved.`);
      await loadWorkspace(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Live radar scan failed.');
    } finally {
      setScanning(false);
    }
  }

  async function updateStage(leadId: string, stage: string) {
    try {
      const response = await api('/api/customer/intelligence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, stage }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Lead stage could not be changed.');
      setData((current) => current ? {
        ...current,
        leads: current.leads.map((item) => item.id === leadId ? { ...item, stage } : item),
      } : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lead stage could not be changed.');
    }
  }

  if (loading) return <main style={loadingStyle}>Opening {config.number}…</main>;
  if (!data) return <main style={loadingStyle}>{message || `${config.number} could not be opened.`}</main>;

  return (
    <main style={{ minHeight: '100vh', background: '#07111D', color: '#F5F8FC', padding: '22px 18px 110px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/customer/start" style={navLink}>Main Room</Link>
          <Link href="/customer/sales" style={navLink}>Sales</Link>
          <Link href="/customer/opportunities" style={navLink}>Opportunities</Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 20 }}>
          {laneOrder.map((item) => {
            const itemConfig = intelligenceLanes[item];
            const selected = item === lane;
            return (
              <Link key={item} href={routeByLane[item]} style={{ ...tabStyle, borderColor: selected ? '#84F4D1' : '#2B3D55', background: selected ? '#10283A' : '#0C1828', color: selected ? '#84F4D1' : '#D7E1EC' }}>
                <strong style={{ display: 'block', fontSize: 15 }}>{itemConfig.number}</strong>
                <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: selected ? '#B9F8E5' : '#8FA2B8' }}>{itemConfig.shortName}</span>
              </Link>
            );
          })}
        </section>

        <section style={{ marginTop: 30, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'end' }}>
          <div>
            <div style={eyebrow}>{config.number.toUpperCase()}</div>
            <h1 style={{ fontSize: 'clamp(42px,7vw,72px)', lineHeight: .95, letterSpacing: -2.6, margin: '9px 0 12px' }}>{config.name}</h1>
            <p style={subtle}>{config.line}</p>
          </div>
          <button onClick={runScan} disabled={scanning || saving} style={primaryButton}>{scanning ? 'Scanning live sources…' : `Run ${config.number} Scan`}</button>
        </section>

        {message && <div style={messageBox}>{message}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginTop: 20 }}>
          <Stat label="SAVED LEADS" value={String(leads.length)} detail={`${highConfidence} high-confidence`} />
          <Stat label="ACTIVE" value={String(active)} detail="Qualified through pursuing" />
          <Stat label="LATEST SCAN" value={latestRun ? String(latestRun.result_count) : '0'} detail={latestRun ? new Date(latestRun.started_at).toLocaleString() : 'No scan yet'} />
        </section>

        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={eyebrow}>TARGETING PROFILE</div>
              <h2 style={{ margin: '5px 0 0', fontSize: 28 }}>{config.name} setup</h2>
            </div>
            <button onClick={() => void saveProfile(true)} disabled={saving || scanning} style={secondaryButton}>{saving ? 'Saving…' : 'Save Profile'}</button>
          </div>

          <div style={formGrid}>
            <Field label="Objective"><textarea style={textarea} value={asText(profile.objective)} onChange={(event) => field('objective', event.target.value)} /></Field>
            <Field label="Geographies"><textarea style={textarea} value={asLines(profile.geographies)} onChange={(event) => field('geographies', lines(event.target.value))} placeholder="One area per line" /></Field>

            {lane === 'business_need' && <>
              <Field label="Your offer"><textarea style={textarea} value={asText(profile.offer)} onChange={(event) => field('offer', event.target.value)} /></Field>
              <Field label="Ideal customer"><textarea style={textarea} value={asText(profile.idealCustomer)} onChange={(event) => field('idealCustomer', event.target.value)} /></Field>
              <Field label="Industries"><textarea style={textarea} value={asLines(profile.industries)} onChange={(event) => field('industries', lines(event.target.value))} /></Field>
              <Field label="Company size"><input style={input} value={asText(profile.companySize)} onChange={(event) => field('companySize', event.target.value)} /></Field>
            </>}

            {lane === 'real_estate' && <>
              <Field label="Property types"><textarea style={textarea} value={asLines(profile.propertyTypes)} onChange={(event) => field('propertyTypes', lines(event.target.value))} /></Field>
              <Field label="Price / deal range"><input style={input} value={asText(profile.priceRange)} onChange={(event) => field('priceRange', event.target.value)} placeholder="$150k-$750k" /></Field>
            </>}

            {lane === 'business_acquisition' && <>
              <Field label="Target industries"><textarea style={textarea} value={asLines(profile.targetIndustries)} onChange={(event) => field('targetIndustries', lines(event.target.value))} /></Field>
              <Field label="Revenue range"><input style={input} value={asText(profile.revenueRange)} onChange={(event) => field('revenueRange', event.target.value)} placeholder="$1M-$20M annual revenue" /></Field>
              <Field label="Purchase price range"><input style={input} value={asText(profile.purchasePriceRange)} onChange={(event) => field('purchasePriceRange', event.target.value)} /></Field>
            </>}

            <Field label="Preferred signals"><textarea style={textarea} value={asLines(profile.preferredSignals)} onChange={(event) => field('preferredSignals', lines(event.target.value))} /></Field>
            <Field label="Keywords"><textarea style={textarea} value={asLines(profile.keywords)} onChange={(event) => field('keywords', lines(event.target.value))} /></Field>
            <Field label="Exclusions"><textarea style={textarea} value={asText(profile.exclusions)} onChange={(event) => field('exclusions', event.target.value)} /></Field>
          </div>

          {lane === 'real_estate' && <p style={{ ...subtle, marginTop: 14, fontSize: 13 }}>Property signals come from lawful public sources and are treated as signals, not proof of hardship or willingness to sell.</p>}
        </section>

        <section style={{ marginTop: 28 }}>
          <div style={eyebrow}>LIVE PIPELINE</div>
          <h2 style={{ margin: '5px 0 0', fontSize: 32 }}>{config.scoreLabel}s</h2>

          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {leads.length === 0 && <div style={{ ...panel, marginTop: 0, textAlign: 'center', color: '#AAB9CA' }}>No saved leads yet. Set the profile and run a scan.</div>}
            {leads.map((lead) => {
              const open = expanded === lead.id;
              return (
                <article key={lead.id} style={leadCard}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <strong style={{ fontSize: 20 }}>{lead.entity_name}</strong>
                        <span style={pill}>{lead.verification_status}</span>
                        <span style={pill}>Confidence {lead.confidence}%</span>
                      </div>
                      <div style={{ color: '#8FA2B8', marginTop: 5 }}>{[lead.entity_type, lead.location || lead.address].filter(Boolean).join(' · ')}</div>
                      {lead.signal_summary && <p style={{ color: '#D5DFEA', lineHeight: 1.5, marginBottom: 0 }}>{lead.signal_summary}</p>}
                    </div>
                    <div style={scoreBox}><strong>{lead.score}</strong><span>{config.scoreLabel}</span></div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                    <select value={lead.stage} onChange={(event) => void updateStage(lead.id, event.target.value)} style={select}>{stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select>
                    <button onClick={() => setExpanded(open ? null : lead.id)} style={smallButton}>{open ? 'Hide details' : 'Open details'}</button>
                    {lead.primary_url && <a href={lead.primary_url} target="_blank" rel="noreferrer" style={smallLink}>Primary source ↗</a>}
                  </div>

                  {open && <div style={detailGrid}>
                    <Detail title="Why now" text={lead.why_now} />
                    <Detail title="Next step" text={lead.recommended_next_step} />
                    <Detail title="Contact path" text={lead.contact_path} />
                    <Detail title="Value" text={lead.value_text} />
                    {lead.draft_outreach && <Detail title="Draft outreach" text={lead.draft_outreach} wide />}
                    {!!lead.risks?.length && <Detail title="Risks" text={lead.risks.join('\n')} wide />}
                    {!!lead.signals?.length && <div style={{ ...detailBox, gridColumn: '1 / -1' }}><strong>Signals</strong>{lead.signals.map((signal, index) => <div key={index} style={{ marginTop: 8, color: '#C7D4E2' }}>{signal.name || 'Signal'} · {signal.strength ?? 0}/100{signal.evidence ? ` · ${signal.evidence}` : ''}</div>)}</div>}
                  </div>}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div style={stat}><div style={eyebrow}>{label}</div><div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{value}</div><div style={{ color: '#899DB4', fontSize: 12, marginTop: 5 }}>{detail}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'grid', gap: 7 }}><span style={{ color: '#9CB0C6', fontSize: 12, fontWeight: 800 }}>{label}</span>{children}</label>;
}

function Detail({ title, text, wide = false }: { title: string; text?: string | null; wide?: boolean }) {
  if (!text) return null;
  return <div style={{ ...detailBox, gridColumn: wide ? '1 / -1' : undefined }}><strong>{title}</strong><div style={{ whiteSpace: 'pre-wrap', color: '#C7D4E2', marginTop: 7, lineHeight: 1.5 }}>{text}</div></div>;
}

const loadingStyle = { minHeight: '100vh', background: '#07111D', color: '#F5F8FC', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const navLink = { border: '1px solid #34435D', color: '#DDE7F5', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 800, fontSize: 12, background: '#10192A' };
const tabStyle = { border: '1px solid #2B3D55', borderRadius: 14, padding: '13px 15px', textDecoration: 'none', minWidth: 0 };
const eyebrow = { fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: '#84F4D1' };
const subtle = { color: '#9EB0C3', lineHeight: 1.55, maxWidth: 760, margin: 0 };
const primaryButton = { border: '1px solid #84F4D1', background: '#84F4D1', color: '#07111D', borderRadius: 12, padding: '13px 17px', fontWeight: 900, cursor: 'pointer' };
const secondaryButton = { border: '1px solid #3C5572', background: '#101D2E', color: '#DDE8F4', borderRadius: 10, padding: '10px 14px', fontWeight: 850, cursor: 'pointer' };
const smallButton = { ...secondaryButton, padding: '8px 11px', fontSize: 12 };
const smallLink = { border: '1px solid #3C5572', color: '#9FE8D2', borderRadius: 10, padding: '8px 11px', textDecoration: 'none', fontSize: 12, fontWeight: 800 };
const messageBox = { marginTop: 16, background: '#121E31', border: '1px solid #334765', borderRadius: 12, padding: 12, color: '#D9E4F2' };
const panel = { marginTop: 22, background: '#0C1726', border: '1px solid #263A53', borderRadius: 16, padding: 18 };
const stat = { background: '#0C1726', border: '1px solid #263A53', borderRadius: 14, padding: 15 };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginTop: 18 };
const input = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #334966', borderRadius: 10, padding: '11px 12px', background: '#081321', color: '#F4F8FC' };
const textarea = { ...input, minHeight: 92, resize: 'vertical' as const };
const leadCard = { background: '#0B1725', border: '1px solid #293E57', borderRadius: 15, padding: 16 };
const pill = { border: '1px solid #36506D', borderRadius: 999, padding: '4px 8px', color: '#A9BDD1', fontSize: 11 };
const scoreBox = { minWidth: 104, border: '1px solid #36506D', borderRadius: 13, padding: '10px 12px', textAlign: 'center' as const, background: '#0D1C2D', display: 'grid', gap: 3 };
const select = { border: '1px solid #3C5572', background: '#0A1625', color: '#DDE8F4', borderRadius: 9, padding: '8px 10px' };
const detailGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10, marginTop: 14 };
const detailBox = { background: '#0A1422', border: '1px solid #23374F', borderRadius: 11, padding: 12 };
