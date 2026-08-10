'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';
import { opportunityPlans, opportunityTypeOptions, type OpportunityPlan } from '../../../lib/opportunityIntelligence';

type Opportunity = {
  id: string;
  title: string;
  opportunity_type?: string | null;
  issuer?: string | null;
  location?: string | null;
  source_url?: string | null;
  source_urls?: string[] | null;
  deadline_text?: string | null;
  value_text?: string | null;
  fit_score: number;
  verification_status: string;
  eligibility?: string | null;
  fit_reason?: string | null;
  why_now?: string | null;
  requirements?: string[] | null;
  risks?: string[] | null;
  partner_strategy?: string | null;
  decision_maker_path?: string | null;
  recommended_next_step?: string | null;
  draft_outreach?: string | null;
  stage: string;
  updated_at?: string | null;
};

type WorkspaceData = {
  tenant: { id: string; businessName: string; industry?: string | null };
  opportunityPlan: OpportunityPlan | null;
  access: { id: string; name: string; price: string; scanLimit: number; pursuitLimit: number };
  profile: Record<string, unknown> | null;
  opportunities: Opportunity[];
  runs: Array<{ id: string; status: string; result_count: number; started_at: string; completed_at?: string | null }>;
};

type ProfileForm = {
  website: string;
  capabilities: string;
  targetMarkets: string;
  geographies: string;
  opportunityTypes: string[];
  keywords: string;
  exclusions: string;
  minimumValue: string;
  maximumValue: string;
};

const emptyProfile: ProfileForm = {
  website: '', capabilities: '', targetMarkets: '', geographies: '', opportunityTypes: ['Federal grants', 'Government contracts'], keywords: '', exclusions: '', minimumValue: '', maximumValue: '',
};

export default function CustomerOpportunitiesPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [upgrading, setUpgrading] = useState<OpportunityPlan | ''>('');
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const api = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(path, { ...options, headers, cache: 'no-store' });
  }, [token]);

  const loadWorkspace = useCallback(async (accessToken: string) => {
    const response = await fetch('/api/customer/opportunities', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Opportunity workspace could not be loaded.');
    const loaded = result as WorkspaceData;
    setData(loaded);
    const p = loaded.profile || {};
    setProfile({
      website: String(p.website || ''),
      capabilities: String(p.capabilities || ''),
      targetMarkets: Array.isArray(p.target_markets) ? p.target_markets.join('\n') : '',
      geographies: Array.isArray(p.geographies) ? p.geographies.join('\n') : '',
      opportunityTypes: Array.isArray(p.opportunity_types) && p.opportunity_types.length ? p.opportunity_types.map(String) : emptyProfile.opportunityTypes,
      keywords: Array.isArray(p.keywords) ? p.keywords.join(', ') : '',
      exclusions: String(p.exclusions || ''),
      minimumValue: p.minimum_value === null || p.minimum_value === undefined ? '' : String(p.minimum_value),
      maximumValue: p.maximum_value === null || p.maximum_value === undefined ? '' : String(p.maximum_value),
    });
  }, []);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data: sessionData }) => {
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/customer/opportunities');
        return;
      }
      setToken(accessToken);
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        if (params.get('upgraded') === '1' && sessionId) {
          const confirmation = await fetch('/api/customer/opportunity-checkout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'confirm', sessionId }),
          });
          const confirmData = await confirmation.json().catch(() => ({}));
          if (!confirmation.ok) throw new Error(confirmData.error || 'Payment completed, but the workspace upgrade still needs to sync.');
          setMessage(`Upgrade confirmed. ${String(confirmData.opportunityPlan || 'Opportunity Intelligence')} is active.`);
          window.history.replaceState({}, '', '/customer/opportunities');
        }
        await loadWorkspace(accessToken);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Opportunity workspace could not be loaded.');
      } finally {
        setLoading(false);
      }
    });
  }, [loadWorkspace, router]);

  function lines(value: string) {
    return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  }

  async function saveProfile(event?: FormEvent) {
    event?.preventDefault();
    if (!token) return false;
    setSaving(true);
    setMessage('');
    try {
      const response = await api('/api/customer/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: profile.website,
          capabilities: profile.capabilities,
          targetMarkets: lines(profile.targetMarkets),
          geographies: lines(profile.geographies),
          opportunityTypes: profile.opportunityTypes,
          keywords: lines(profile.keywords),
          exclusions: profile.exclusions,
          minimumValue: profile.minimumValue,
          maximumValue: profile.maximumValue,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Profile could not be saved.');
      setMessage('Opportunity profile saved.');
      await loadWorkspace(token);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Profile could not be saved.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function runScan() {
    if (!token) return;
    setScanning(true);
    setMessage('Researching current opportunities and checking the source trail…');
    try {
      if (!data?.profile) {
        const saved = await saveProfile();
        if (!saved) return;
      }
      const response = await api('/api/customer/opportunities/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: data?.access.scanLimit || 3 }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Live opportunity scan failed.');
      setMessage(`Scan complete. ${Array.isArray(result.opportunities) ? result.opportunities.length : 0} opportunities were saved to the pipeline.`);
      await loadWorkspace(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Live opportunity scan failed.');
    } finally {
      setScanning(false);
    }
  }

  async function updateStage(opportunityId: string, stage: string) {
    try {
      const response = await api('/api/customer/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, stage }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Stage could not be changed.');
      setData((current) => current ? { ...current, opportunities: current.opportunities.map((item) => item.id === opportunityId ? { ...item, stage } : item) } : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Stage could not be changed.');
    }
  }

  async function upgrade(plan: OpportunityPlan) {
    if (!token) return;
    setUpgrading(plan);
    setMessage('');
    try {
      const response = await api('/api/customer/opportunity-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', plan }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || 'Upgrade checkout could not be opened.');
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upgrade checkout could not be opened.');
      setUpgrading('');
    }
  }

  function toggleType(value: string) {
    setProfile((current) => ({ ...current, opportunityTypes: current.opportunityTypes.includes(value) ? current.opportunityTypes.filter((item) => item !== value) : [...current.opportunityTypes, value] }));
  }

  if (loading) return <main style={loadingStyle}>Opening Opportunity Intelligence…</main>;
  if (!data) return <main style={loadingStyle}><div>{message || 'Opportunity Intelligence could not be opened.'}</div></main>;

  const pursuing = data.opportunities.filter((item) => item.stage === 'pursuing').length;
  const verified = data.opportunities.filter((item) => item.verification_status === 'source_backed').length;

  return (
    <main style={{ minHeight: '100vh', background: '#08101D', color: '#F7FAFC', padding: '24px 18px 90px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/customer/start" style={navLink}>Start</Link>
          <Link href="/customer/assistant" style={navLink}>Ask Eva</Link>
          <Link href="/customer/sales" style={navLink}>Sales</Link>
          <Link href="/customer/opportunities" style={{ ...navLink, borderColor: '#9EF0CF', color: '#9EF0CF' }}>Opportunities</Link>
          <Link href="/customer/account" style={navLink}>Account</Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'end', marginTop: 34 }}>
          <div><div style={eyebrow}>OPPORTUNITY INTELLIGENCE</div><h1 style={{ fontSize: 'clamp(42px,7vw,70px)', lineHeight: .96, letterSpacing: -2.5, margin: '9px 0 12px' }}>{data.tenant.businessName} pursuit command center</h1><p style={subtle}>Find current opportunities, check the evidence, score the fit and keep the next action moving.</p></div>
          <button onClick={runScan} disabled={scanning || saving} style={primaryButton}>{scanning ? 'Scanning live sources…' : `Run Live Scan · up to ${data.access.scanLimit}`}</button>
        </section>

        {message && <div style={{ marginTop: 16, background: '#121E31', border: '1px solid #334765', borderRadius: 12, padding: 12, color: '#D9E4F2' }}>{message}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginTop: 20 }}>
          <Stat label="ACCESS" value={data.access.name} detail={data.opportunityPlan ? data.access.price : 'Demo mode'} />
          <Stat label="SAVED OPPORTUNITIES" value={String(data.opportunities.length)} detail={`${verified} source-backed`} />
          <Stat label="ACTIVE PURSUITS" value={`${pursuing} / ${data.access.pursuitLimit}`} detail="Human-selected pursuits" />
          <Stat label="LATEST SCAN" value={data.runs[0] ? String(data.runs[0].result_count) : '0'} detail={data.runs[0] ? new Date(data.runs[0].started_at).toLocaleString() : 'No scans yet'} />
        </section>

        {!data.opportunityPlan && (
          <section style={{ marginTop: 18, background: '#F4EBCB', color: '#332C13', borderRadius: 17, padding: 18 }}>
            <strong style={{ fontSize: 20 }}>Demo access is live.</strong>
            <p style={{ lineHeight: 1.6 }}>You can save a profile, run a limited source-backed scan and keep one active pursuit. Upgrade when the company wants a wider scan and more simultaneous pursuits.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(Object.keys(opportunityPlans) as OpportunityPlan[]).map((plan) => <button key={plan} onClick={() => upgrade(plan)} disabled={Boolean(upgrading)} style={darkButton}>{upgrading === plan ? 'Opening Stripe…' : `${opportunityPlans[plan].name} · ${opportunityPlans[plan].price}`}</button>)}</div>
          </section>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(320px,.78fr) minmax(0,1.22fr)', gap: 16, marginTop: 22, alignItems: 'start' }}>
          <form onSubmit={saveProfile} style={panel}>
            <div style={eyebrow}>SEARCH PROFILE</div>
            <h2 style={panelTitle}>Teach the engine what is worth chasing.</h2>
            <Field label="Company website"><input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="https://company.com" style={inputStyle} /></Field>
            <Field label="Capabilities / what the company can deliver"><textarea value={profile.capabilities} onChange={(e) => setProfile({ ...profile, capabilities: e.target.value })} rows={6} placeholder="Products, services, certifications, capacity, differentiators. Use factual claims only." style={inputStyle} /></Field>
            <Field label="Target markets · one per line"><textarea value={profile.targetMarkets} onChange={(e) => setProfile({ ...profile, targetMarkets: e.target.value })} rows={4} placeholder={'Utilities\nManufacturing\nMunicipal government'} style={inputStyle} /></Field>
            <Field label="Geographies · one per line"><textarea value={profile.geographies} onChange={(e) => setProfile({ ...profile, geographies: e.target.value })} rows={3} placeholder={'New Mexico\nSouthwest U.S.\nNationwide federal'} style={inputStyle} /></Field>
            <Field label="Opportunity types">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 7 }}>{opportunityTypeOptions.map((type) => <label key={type} style={checkLabel}><input type="checkbox" checked={profile.opportunityTypes.includes(type)} onChange={() => toggleType(type)} /> {type}</label>)}</div>
            </Field>
            <Field label="Keywords · comma-separated"><input value={profile.keywords} onChange={(e) => setProfile({ ...profile, keywords: e.target.value })} placeholder="resilience, infrastructure, water, AI, construction" style={inputStyle} /></Field>
            <Field label="Exclusions / automatic no-go rules"><textarea value={profile.exclusions} onChange={(e) => setProfile({ ...profile, exclusions: e.target.value })} rows={3} placeholder="Wrong geography, closed deadlines, required credentials we do not hold…" style={inputStyle} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><Field label="Minimum value"><input type="number" min="0" value={profile.minimumValue} onChange={(e) => setProfile({ ...profile, minimumValue: e.target.value })} placeholder="0" style={inputStyle} /></Field><Field label="Maximum value"><input type="number" min="0" value={profile.maximumValue} onChange={(e) => setProfile({ ...profile, maximumValue: e.target.value })} placeholder="No maximum" style={inputStyle} /></Field></div>
            <button disabled={saving} style={primaryButton}>{saving ? 'Saving…' : 'Save Opportunity Profile'}</button>
          </form>

          <section style={{ display: 'grid', gap: 11 }}>
            <div style={{ ...panel, background: '#0E1828' }}><div style={eyebrow}>PIPELINE</div><h2 style={panelTitle}>Best opportunities first.</h2><p style={subtle}>A high score is not a promise of winning. It is a prioritization signal backed by fit, timing, eligibility and the research trail.</p></div>
            {data.opportunities.length === 0 && <div style={panel}><strong>No saved opportunities yet.</strong><p style={subtle}>Save the company profile and run the first live scan.</p></div>}
            {data.opportunities.map((item) => {
              const isOpen = expanded === item.id;
              return (
                <article key={item.id} style={panel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}><Badge text={`${item.fit_score} / 100`} strong /><Badge text={verificationLabel(item.verification_status)} verified={item.verification_status === 'source_backed'} /><Badge text={item.opportunity_type || 'Opportunity'} /></div><h3 style={{ fontSize: 25, lineHeight: 1.15, margin: '4px 0' }}>{item.title}</h3><div style={{ color: '#9EACC0', fontSize: 13 }}>{[item.issuer, item.location, item.deadline_text, item.value_text].filter(Boolean).join(' · ')}</div></div>
                    <select value={item.stage} onChange={(event) => updateStage(item.id, event.target.value)} style={{ ...inputStyle, width: 140 }}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="qualified">Qualified</option><option value="pursuing">Pursuing</option><option value="submitted">Submitted</option><option value="won">Won</option><option value="lost">Lost</option><option value="watching">Watching</option></select>
                  </div>
                  <p style={{ ...subtle, color: '#D6DEEA' }}><strong>Why it fits:</strong> {item.fit_reason || 'Fit analysis not available.'}</p>
                  <p style={{ ...subtle, color: '#D6DEEA' }}><strong>Next move:</strong> {item.recommended_next_step || 'Review the source and qualify the pursuit.'}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer" style={outlineButton}>Open Primary Source</a>}<button onClick={() => setExpanded(isOpen ? null : item.id)} style={outlineButton}>{isOpen ? 'Hide Pursuit Detail' : 'Open Pursuit Detail'}</button></div>

                  {isOpen && <div style={{ marginTop: 14, borderTop: '1px solid #2C3A52', paddingTop: 14, display: 'grid', gap: 12 }}>
                    <Detail title="Eligibility" text={item.eligibility} />
                    <Detail title="Why now" text={item.why_now} />
                    <ListDetail title="Requirements" items={item.requirements} />
                    <ListDetail title="Risks / open questions" items={item.risks} />
                    <Detail title="Partner strategy" text={item.partner_strategy} />
                    <Detail title="Decision-maker path" text={item.decision_maker_path} />
                    <Detail title="Draft outreach · human review required" text={item.draft_outreach} pre />
                    {item.source_urls && item.source_urls.length > 1 && <div><strong style={detailLabel}>Source trail</strong><div style={{ display: 'grid', gap: 5, marginTop: 7 }}>{item.source_urls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" style={{ color: '#9EF0CF', wordBreak: 'break-all', fontSize: 12 }}>{url}</a>)}</div></div>}
                  </div>}
                </article>
              );
            })}
          </section>
        </section>
      </div>
    </main>
  );
}

function verificationLabel(status: string) {
  if (status === 'source_backed') return 'SOURCE-BACKED';
  if (status === 'partially_verified') return 'PARTIAL SOURCE MATCH';
  return 'UNVERIFIED';
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div style={{ background: '#101A2A', border: '1px solid #293A56', borderRadius: 15, padding: 16 }}><div style={{ color: '#8192AA', fontSize: 10, fontWeight: 950, letterSpacing: 1 }}>{label}</div><div style={{ fontSize: 27, fontWeight: 950, marginTop: 5 }}>{value}</div><div style={{ color: '#9EACC0', fontSize: 12, marginTop: 3 }}>{detail}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: 'grid', gap: 6, color: '#DDE6F2', fontSize: 12, fontWeight: 850 }}>{label}{children}</label>; }
function Badge({ text, strong, verified }: { text: string; strong?: boolean; verified?: boolean }) { return <span style={{ borderRadius: 999, padding: '5px 8px', fontSize: 10, fontWeight: 950, background: verified ? '#143D31' : strong ? '#9EF0CF' : '#1A2638', color: strong ? '#07130F' : verified ? '#9EF0CF' : '#C6D1DF', border: verified ? '1px solid #397A63' : '1px solid #34435A' }}>{text}</span>; }
function Detail({ title, text, pre }: { title: string; text?: string | null; pre?: boolean }) { if (!text) return null; return <div><strong style={detailLabel}>{title}</strong><div style={{ color: '#CFD8E5', lineHeight: 1.6, marginTop: 5, whiteSpace: pre ? 'pre-wrap' : 'normal' }}>{text}</div></div>; }
function ListDetail({ title, items }: { title: string; items?: string[] | null }) { if (!items?.length) return null; return <div><strong style={detailLabel}>{title}</strong><ul style={{ color: '#CFD8E5', lineHeight: 1.6, margin: '6px 0 0', paddingLeft: 20 }}>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }

const eyebrow = { color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: 1.1 };
const subtle = { color: '#AEBBCD', lineHeight: 1.6, margin: '8px 0' };
const panel = { background: '#111B2B', border: '1px solid #2A3A54', borderRadius: 17, padding: 19 };
const panelTitle = { fontSize: 28, lineHeight: 1.1, margin: '8px 0 14px' };
const navLink = { border: '1px solid #34435D', color: '#E8EEF7', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#08101D', color: '#F7FAFC', border: '1px solid #344761', borderRadius: 9, padding: '10px 11px', fontSize: 13 };
const checkLabel = { background: '#0B1423', border: '1px solid #2B3C55', borderRadius: 9, padding: '8px 9px', color: '#CBD6E4', fontSize: 11, fontWeight: 700 };
const primaryButton = { border: 0, borderRadius: 11, background: '#9EF0CF', color: '#07130F', padding: '12px 14px', fontWeight: 950, cursor: 'pointer' };
const darkButton = { border: 0, borderRadius: 10, background: '#171717', color: '#fff', padding: '10px 12px', fontWeight: 900, cursor: 'pointer' };
const outlineButton = { border: '1px solid #3B4D69', borderRadius: 9, background: 'transparent', color: '#DCE6F2', padding: '8px 10px', textDecoration: 'none', fontWeight: 850, fontSize: 12, cursor: 'pointer' };
const detailLabel = { color: '#9EF0CF', fontSize: 11, letterSpacing: .6, textTransform: 'uppercase' as const };
const loadingStyle = { minHeight: '100vh', background: '#08101D', color: '#F7FAFC', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Arial, sans-serif' };
