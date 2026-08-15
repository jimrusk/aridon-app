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
  facts?: Record<string, string | number | boolean | null> | null;
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

const laneOrder: IntelligenceLane[] = ['business_need', 'real_estate', 'business_acquisition'];
const stages = ['new', 'reviewing', 'qualified', 'contacting', 'diligence', 'pursuing', 'won', 'lost', 'watching'];

function asText(value: unknown) { return typeof value === 'string' ? value : ''; }
function asLines(value: unknown) { return Array.isArray(value) ? value.map(String).join('\n') : ''; }
function lines(value: string) { return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean); }
function cloneDefault(lane: IntelligenceLane) { return JSON.parse(JSON.stringify(intelligenceLanes[lane].defaultProfile)) as Record<string, unknown>; }

export default function IntelligenceSuitePage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [lane, setLane] = useState<IntelligenceLane>('business_need');
  const [profile, setProfile] = useState<Record<string, unknown>>(cloneDefault('business_need'));
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
    const response = await fetch('/api/customer/intelligence', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Intelligence Suite could not be loaded.');
    setData(result as WorkspaceData);
  }, []);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data: sessionData }) => {
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/customer/intelligence');
        return;
      }
      setToken(accessToken);
      try { await loadWorkspace(accessToken); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'Intelligence Suite could not be loaded.'); }
      finally { setLoading(false); }
    });
  }, [loadWorkspace, router]);

  useEffect(() => {
    if (!data) return;
    const saved = data.profiles.find((item) => item.lane === lane)?.profile;
    setProfile(saved ? { ...cloneDefault(lane), ...saved } : cloneDefault(lane));
    setExpanded(null);
  }, [data, lane]);

  const laneConfig = intelligenceLanes[lane];
  const laneLeads = useMemo(() => (data?.leads || []).filter((item) => item.lane === lane), [data, lane]);
  const latestRun = useMemo(() => (data?.runs || []).find((item) => item.lane === lane), [data, lane]);

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
      if (!response.ok) throw new Error(result.error || 'Radar profile could not be saved.');
      if (showMessage) setMessage(`${laneConfig.number} profile saved.`);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Radar profile could not be saved.');
      return false;
    } finally { setSaving(false); }
  }

  async function runScan() {
    if (!token || scanning) return;
    setScanning(true);
    setMessage(`${laneConfig.number} is researching live public sources and checking the evidence trail…`);
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
      setMessage(`${laneConfig.number} scan complete. ${count} source-checked lead${count === 1 ? '' : 's'} saved.`);
      await loadWorkspace(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Live radar scan failed.');
    } finally { setScanning(false); }
  }

  async function updateStage(leadId: string, stage: string) {
    try {
      const response = await api('/api/customer/intelligence', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, stage }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Lead stage could not be changed.');
      setData((current) => current ? { ...current, leads: current.leads.map((item) => item.id === leadId ? { ...item, stage } : item) } : current);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Lead stage could not be changed.'); }
  }

  if (loading) return <main style={loadingStyle}>Opening Aridon Intelligence Suite…</main>;
  if (!data) return <main style={loadingStyle}>{message || 'Intelligence Suite could not be opened.'}</main>;

  const active = laneLeads.filter((item) => ['qualified', 'contacting', 'diligence', 'pursuing'].includes(item.stage)).length;
  const highConfidence = laneLeads.filter((item) => item.confidence >= 75).length;

  return (
    <main style={{ minHeight: '100vh', background: '#07111D', color: '#F5F8FC', padding: '22px 18px 90px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1220, margin: '0 auto' }}>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/customer/start" style={navLink}>Main Room</Link>
          <Link href="/customer/opportunities" style={navLink}>Opportunity Intelligence</Link>
          <Link href="/customer/sales" style={navLink}>Sales</Link>
          <Link href="/customer/intelligence" style={{ ...navLink, borderColor: '#84F4D1', color: '#84F4D1' }}>Intelligence Suite</Link>
        </nav>

        <section style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'end' }}>
          <div>
            <div style={eyebrow}>ARIDON INTELLIGENCE SUITE</div>
            <h1 style={{ fontSize: 'clamp(42px,7vw,72px)', lineHeight: .94, letterSpacing: -2.8, margin: '10px 0 12px' }}>Three radars. One pursuit engine.</h1>
            <p style={subtle}>Find companies that need help, properties showing seller signals, and businesses showing acquisition signals. Every saved lead carries a score, confidence level and public evidence trail.</p>
          </div>
          <button onClick={runScan} disabled={scanning || saving} style={primaryButton}>{scanning ? 'Scanning live sources…' : `Run ${laneConfig.number} Scan`}</button>
        </section>

        {message && <div style={messageBox}>{message}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 22 }}>
          {laneOrder.map((item) => {
            const config = intelligenceLanes[item];
            const selected = item === lane;
            return <button key={item} onClick={() => setLane(item)} style={{ ...laneCard, borderColor: selected ? '#84F4D1' : '#263A53', background: selected ? '#10283A' : '#0C1828' }}>
              <div style={{ fontSize: 12, letterSpacing: 1.4, color: selected ? '#84F4D1' : '#7F93AA', fontWeight: 800 }}>{config.number.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 850, marginTop: 7 }}>{config.name}</div>
              <div style={{ color: '#AAB9CA', lineHeight: 1.45, marginTop: 8 }}>{config.line}</div>
            </button>;
          })}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginTop: 16 }}>
          <Stat label="RADAR" value={laneConfig.number} detail={laneConfig.shortName} />
          <Stat label="SAVED LEADS" value={String(laneLeads.length)} detail={`${highConfidence} high-confidence`} />
          <Stat label="ACTIVE PURSUITS" value={String(active)} detail="Qualified through pursuing" />
          <Stat label="LATEST SCAN" value={latestRun ? String(latestRun.result_count) : '0'} detail={latestRun ? new Date(latestRun.started_at).toLocaleString() : 'No scan yet'} />
        </section>

        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><div style={eyebrow}>{laneConfig.number.toUpperCase()} PROFILE</div><h2 style={{ margin: '5px 0 0', fontSize: 29 }}>{laneConfig.name} targeting</h2></div>
            <button onClick={() => void saveProfile(true)} disabled={saving || scanning} style={secondaryButton}>{saving ? 'Saving…' : 'Save Profile'}</button>
          </div>
          <div style={formGrid}>
            <Field label="Objective"><textarea style={textarea} value={asText(profile.objective)} onChange={(event) => field('objective', event.target.value)} /></Field>
            <Field label="Geographies"><textarea style={textarea} value={asLines(profile.geographies)} onChange={(event) => field('geographies', lines(event.target.value))} placeholder="Denver, CO\nPhoenix, AZ" /></Field>
            {lane === 'business_need' && <>
              <Field label="Your offer"><textarea style={textarea} value={asText(profile.offer)} onChange={(event) => field('offer', event.target.value)} placeholder="What can you sell or fix for the target business?" /></Field>
              <Field label="Ideal customer"><textarea style={textarea} value={asText(profile.idealCustomer)} onChange={(event) => field('idealCustomer', event.target.value)} /></Field>
              <Field label="Industries"><textarea style={textarea} value={asLines(profile.industries)} onChange={(event) => field('industries', lines(event.target.value))} /></Field>
              <Field label="Company size"><input style={input} value={asText(profile.companySize)} onChange={(event) => field('companySize', event.target.value)} placeholder="Example: 10-250 employees" /></Field>
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
            <Field label="Keywords"><textarea style={textarea} value={asLines(profile.keywords)} onChange={(event) => field('keywords', lines(event.target.value))} placeholder="One per line" /></Field>
            <Field label="Exclusions"><textarea style={textarea} value={asText(profile.exclusions)} onChange={(event) => field('exclusions', event.target.value)} placeholder="What should this radar avoid?" /></Field>
          </div>
          {lane === 'real_estate' && <p style={{ ...subtle, marginTop: 14, fontSize: 13 }}>Property Radar uses public records, notices and public listings as signals. A signal is not proof of hardship or willingness to sell, and Aridon does not infer motivation from sensitive personal traits.</p>}
        </section>

        <section style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
            <div><div style={eyebrow}>LIVE PIPELINE</div><h2 style={{ margin: '5px 0 0', fontSize: 32 }}>{laneConfig.scoreLabel}s</h2></div>
            <div style={{ color: '#8FA2B8', fontSize: 13 }}>Scores are deterministic weighted scores. Confidence reflects the public source trail.</div>
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {laneLeads.length === 0 && <div style={{ ...panel, marginTop: 0, textAlign: 'center', color: '#AAB9CA' }}>No saved leads in this radar yet. Set the profile and run a live scan.</div>}
            {laneLeads.map((lead) => {
              const open = expanded === lead.id;
              return <article key={lead.id} style={leadCard}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) auto', gap: 14, alignItems: 'start' }}>
                  <div style={scoreBubble}><strong style={{ fontSize: 25 }}>{lead.score}</strong><span style={{ fontSize: 9, color: '#9BB0C6' }}>SCORE</span></div>
                  <div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><h3 style={{ margin: 0, fontSize: 21 }}>{lead.entity_name}</h3><span style={pill}>{lead.confidence}% confidence</span><span style={pill}>{lead.verification_status.replaceAll('_', ' ')}</span></div>
                    <div style={{ color: '#91A5BA', marginTop: 5 }}>{[lead.entity_type, lead.address || lead.location, lead.value_text].filter(Boolean).join(' · ')}</div>
                    <p style={{ margin: '9px 0 0', color: '#D2DCE8', lineHeight: 1.5 }}>{lead.signal_summary || lead.why_now || 'Source-backed signal saved by the radar.'}</p>
                  </div>
                  <select value={lead.stage} onChange={(event) => void updateStage(lead.id, event.target.value)} style={select}>{stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button onClick={() => setExpanded(open ? null : lead.id)} style={tinyButton}>{open ? 'Close evidence' : 'Open evidence'}</button>
                  {lead.primary_url && <a href={lead.primary_url} target="_blank" rel="noreferrer" style={tinyLink}>Primary source ↗</a>}
                </div>
                {open && <div style={evidenceBox}>
                  <Detail title="Why now" text={lead.why_now} />
                  {lead.score_breakdown && <div><div style={detailTitle}>SCORE BREAKDOWN</div><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 7 }}>{Object.entries(lead.score_breakdown).map(([key, value]) => <span key={key} style={pill}>{key.replaceAll('_', ' ')} {value}</span>)}</div></div>}
                  {!!lead.signals?.length && <div><div style={detailTitle}>SIGNALS</div><div style={{ display: 'grid', gap: 7, marginTop: 7 }}>{lead.signals.map((signal, index) => <div key={`${signal.name}-${index}`} style={{ background: '#0B1726', borderRadius: 10, padding: 10 }}><strong>{signal.name}</strong> <span style={{ color: '#84F4D1' }}>{signal.strength || 0}/100</span><div style={{ color: '#B9C6D4', marginTop: 4, lineHeight: 1.45 }}>{signal.evidence}</div>{signal.source_url && <a href={signal.source_url} target="_blank" rel="noreferrer" style={sourceLink}>Source ↗</a>}</div>)}</div></div>}
                  <Detail title="Contact path" text={lead.contact_path} />
                  <Detail title="Recommended next step" text={lead.recommended_next_step} />
                  {!!lead.risks?.length && <div><div style={detailTitle}>RISKS / CHECKS</div><ul style={{ margin: '7px 0 0', paddingLeft: 20, color: '#C8D3DF' }}>{lead.risks.map((risk, index) => <li key={index} style={{ marginTop: 4 }}>{risk}</li>)}</ul></div>}
                  <Detail title="Draft outreach · human review" text={lead.draft_outreach} />
                  {!!lead.source_urls?.length && <div><div style={detailTitle}>PUBLIC SOURCES</div><div style={{ display: 'grid', gap: 5, marginTop: 7 }}>{lead.source_urls.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" style={sourceLink}>{url}</a>)}</div></div>}
                </div>}
              </article>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div style={{ background: '#0C1828', border: '1px solid #243850', borderRadius: 14, padding: 15 }}><div style={eyebrow}>{label}</div><div style={{ fontSize: 27, fontWeight: 850, marginTop: 5 }}>{value}</div><div style={{ color: '#879BB1', fontSize: 12, marginTop: 4 }}>{detail}</div></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: 'grid', gap: 7 }}><span style={detailTitle}>{label}</span>{children}</label>; }
function Detail({ title, text }: { title: string; text?: string | null }) { return text ? <div><div style={detailTitle}>{title}</div><div style={{ color: '#C6D2DF', lineHeight: 1.55, marginTop: 6, whiteSpace: 'pre-wrap' }}>{text}</div></div> : null; }

const loadingStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#07111D', color: '#F5F8FC', fontFamily: 'Arial, sans-serif' };
const navLink: React.CSSProperties = { color: '#B7C6D5', textDecoration: 'none', border: '1px solid #2B4059', borderRadius: 999, padding: '8px 12px', fontSize: 13 };
const eyebrow: React.CSSProperties = { fontSize: 11, letterSpacing: 1.5, fontWeight: 850, color: '#84F4D1' };
const subtle: React.CSSProperties = { color: '#9EB0C2', lineHeight: 1.55, maxWidth: 760, margin: 0, fontSize: 16 };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 12, background: '#84F4D1', color: '#062019', padding: '14px 18px', fontWeight: 850, cursor: 'pointer', minWidth: 190 };
const secondaryButton: React.CSSProperties = { border: '1px solid #4D6987', borderRadius: 10, background: '#14253A', color: '#EAF1F8', padding: '10px 14px', fontWeight: 750, cursor: 'pointer' };
const tinyButton: React.CSSProperties = { border: '1px solid #35506D', borderRadius: 9, background: '#112238', color: '#D7E2ED', padding: '7px 10px', cursor: 'pointer', fontSize: 12 };
const tinyLink: React.CSSProperties = { ...tinyButton, textDecoration: 'none', display: 'inline-block' };
const sourceLink: React.CSSProperties = { color: '#84F4D1', textDecoration: 'none', wordBreak: 'break-all', fontSize: 12 };
const laneCard: React.CSSProperties = { border: '1px solid #263A53', color: '#F5F8FC', borderRadius: 16, padding: 17, textAlign: 'left', cursor: 'pointer', minHeight: 145 };
const panel: React.CSSProperties = { background: '#0C1828', border: '1px solid #243850', borderRadius: 16, padding: 18, marginTop: 22 };
const formGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 13, marginTop: 18 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #324B67', borderRadius: 9, padding: '11px 12px', background: '#091522', color: '#F5F8FC', outline: 'none' };
const textarea: React.CSSProperties = { ...input, minHeight: 88, resize: 'vertical', fontFamily: 'Arial, sans-serif' };
const messageBox: React.CSSProperties = { marginTop: 16, background: '#102239', border: '1px solid #36516E', borderRadius: 12, padding: 12, color: '#DCE7F2' };
const leadCard: React.CSSProperties = { background: '#0C1828', border: '1px solid #243850', borderRadius: 15, padding: 15 };
const scoreBubble: React.CSSProperties = { width: 58, height: 58, borderRadius: 14, background: '#112C36', border: '1px solid #2F6F69', display: 'grid', placeItems: 'center', alignContent: 'center', color: '#84F4D1' };
const pill: React.CSSProperties = { border: '1px solid #304963', borderRadius: 999, padding: '4px 8px', color: '#AFC1D3', fontSize: 11, textTransform: 'capitalize' };
const select: React.CSSProperties = { background: '#0B1726', color: '#E8EFF6', border: '1px solid #36516E', borderRadius: 9, padding: '8px 9px', textTransform: 'capitalize' };
const evidenceBox: React.CSSProperties = { marginTop: 14, borderTop: '1px solid #263C55', paddingTop: 14, display: 'grid', gap: 16 };
const detailTitle: React.CSSProperties = { fontSize: 10, letterSpacing: 1.2, fontWeight: 850, color: '#8097AE', textTransform: 'uppercase' };
