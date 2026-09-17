'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Lead = {
  id: string;
  company_name: string;
  website?: string | null;
  location?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_title?: string | null;
  recommended_buyer_role?: string | null;
  fit_score?: number | null;
  priority_tier?: string | null;
  fit_reason?: string | null;
  trigger_event?: string | null;
  buying_signals?: string[] | null;
  research_notes?: string | null;
  personalization?: string | null;
  source_urls?: string[] | null;
  status?: string | null;
};

type Watch = {
  id: string;
  name: string;
  cadence?: string | null;
  required_signals?: string[] | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
  last_run_status?: string | null;
};

type SalesData = {
  tenant: { slug: string; business_name: string };
  profile: unknown | null;
  leads: Lead[];
  watches: Watch[];
};

const SECURITY_SIGNALS = [
  'cybersecurity incident, security incident, disclosed cyberattack, or attempted intrusion',
  'data breach, privacy breach, breach notification, unauthorized access, or exposed records',
  'ransomware, cyber extortion, malware, phishing, credential compromise, or account takeover',
  'system intrusion, network compromise, leaked credentials, or suspicious access investigation',
  'security-related outage, disrupted operations, recovery effort, forensic investigation, or incident response',
  'new CISO, CIO, CTO, SOC leader, security engineer, incident-response team, or cyber hiring push',
  'SOC modernization, SIEM, XDR, SOAR, zero-trust, identity, endpoint, or cloud-security modernization',
  'NIST, CMMC, SOC 2, HIPAA, PCI DSS, SEC cyber disclosure, cyber-insurance, audit, or compliance pressure',
  'AI operations, enterprise AI transformation, agentic automation, AI governance, or AI platform initiative',
  'security-operations automation, autonomous monitoring, decision support, orchestration, or response automation',
  'business operating system, digital command center, workflow consolidation, operational intelligence, or platform replacement',
  'security vendor review, managed-security search, technology consolidation, replacement project, procurement, RFP, or pilot',
];

const KEYWORDS = [
  'data breach', 'hacked', 'cyberattack', 'ransomware', 'malware', 'phishing', 'credential compromise',
  'incident response', 'CISO', 'SOC', 'SIEM', 'XDR', 'SOAR', 'zero trust', 'CMMC', 'NIST',
  'AI operating system', 'AIOps', 'agentic automation', 'AI governance', 'digital command center', 'workflow automation',
];

const DEFAULT_FOCUS = "Find organizations with current public cybersecurity, breach-response, security-operations, compliance, AI-transformation, automation, or operational-intelligence signals that could indicate a fit for Aridon's AI operating system. Prioritize utilities, infrastructure, manufacturers, data centers, public-sector organizations, agriculture, water, energy, and other operationally complex organizations.";

const SECURITY_PATTERN = /cyber|security|hack|breach|ransom|malware|phish|credential|unauthorized access|account takeover|intrusion|incident response|ciso|\bsoc\b|siem|xdr|soar|zero[\s-]?trust|cmmc|nist|ai[\s-]?(os|operating system)|agentic|aiops|automation|digital command center|operational intelligence/i;

function formatDate(value?: string | null) {
  if (!value) return 'Not yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not yet' : date.toLocaleString();
}

export default function SecurityRadarPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [data, setData] = useState<SalesData | null>(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [threshold, setThreshold] = useState(78);
  const [focus, setFocus] = useState(DEFAULT_FOCUS);
  const [extraKeywords, setExtraKeywords] = useState('');
  const [cadence, setCadence] = useState('daily');

  async function authFetch(url: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers, cache: 'no-store' });
  }

  async function refresh(accessToken = token) {
    if (!accessToken) return;
    const response = await fetch('/api/customer/sales/data', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (response.status === 401 || response.status === 403) {
      await getBrowserClient().auth.signOut();
      router.replace('/customer/login?next=/customer/sales/security-radar');
      return;
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(result.error || 'Security Radar could not load.');
      return;
    }
    setData(result as SalesData);
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data: sessionData }) => {
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/customer/sales/security-radar');
        return;
      }
      setToken(accessToken);
      refresh(accessToken);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function requestedSignals() {
    const extras = extraKeywords.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
    if (!extras.length) return SECURITY_SIGNALS;
    return [...SECURITY_SIGNALS.slice(0, 6), ...extras].slice(0, 12);
  }

  async function runRadar(event?: FormEvent) {
    event?.preventDefault();
    setBusy('radar');
    setNotice('');
    const response = await authFetch('/api/customer/sales/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'find_prospects',
        count,
        focus,
        intent: 'customer',
        qualificationThreshold: threshold,
        requiredSignals: requestedSignals(),
        exclusions: [],
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Security Radar could not finish this scan.');
    else {
      setNotice(`Security Radar saved ${result.prospects?.length || 0} qualified organization(s).`);
      await refresh();
    }
    setBusy('');
  }

  async function saveWatch() {
    setBusy('watch');
    setNotice('');
    const response = await authFetch('/api/customer/sales/watch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
        name: 'Security + AI OS Radar',
        cadence,
        intent: 'customer',
        objective: "Find organizations with a documented defensive cybersecurity, recovery, compliance, automation, or AI-operations modernization need that may fit Aridon's AI operating system.",
        focus,
        qualificationThreshold: threshold,
        countPerRun: count,
        requiredSignals: requestedSignals(),
        exclusions: [],
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Could not save the Security Radar watch.');
    else {
      setNotice(`Security + AI OS Radar saved as a ${cadence} watch.`);
      await refresh();
    }
    setBusy('');
  }

  async function enrichSelected() {
    if (!selected.length) return;
    setBusy('enrich');
    setNotice('');
    const response = await authFetch('/api/customer/sales/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds: selected.slice(0, 8) }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Contact enrichment could not finish.');
    else {
      setNotice(`Scout enriched ${result.enriched || 0} prospect contact(s) using public business sources.`);
      await refresh();
    }
    setBusy('');
  }

  const securityLeads = useMemo(() => {
    return (data?.leads || []).filter((lead) => {
      const haystack = [lead.trigger_event, lead.fit_reason, lead.research_notes, ...(lead.buying_signals || [])].filter(Boolean).join(' ');
      return (lead.fit_score || 0) >= threshold && SECURITY_PATTERN.test(haystack);
    });
  }, [data, threshold]);

  const securityWatch = useMemo(() => (data?.watches || []).find((watch) => /security|cyber|ai os/i.test(watch.name)), [data]);

  if (!data) return <main style={loadingStyle}>Opening Security + AI OS Radar…</main>;

  return (
    <main style={{ minHeight: '100vh', background: '#050812', color: '#F7F9FD', padding: '24px 18px 100px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ maxWidth: 820 }}>
            <div style={eyebrow}>ARIDON · SECURITY + AI OS PROSPECT RADAR</div>
            <h1 style={{ fontSize: 'clamp(38px,7vw,66px)', lineHeight: .98, margin: '8px 0 8px' }}>Find the smoke signal before the sales call.</h1>
            <p style={muted}>Scout watches public evidence for defensive cybersecurity pressure and AI-operations modernization, then scores which organizations may actually need Aridon now.</p>
          </div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={`/workspace/${data.tenant.slug}`} style={navLink}>Home</Link>
            <Link href="/customer/sales" style={navLink}>Scout Sales</Link>
            <Link href="/customer/assistant" style={navLink}>Ask Eva</Link>
          </nav>
        </header>

        {notice && <div style={noticeStyle}>{notice}</div>}

        <section style={{ ...panel, borderColor: '#37526D' }}>
          <div style={eyebrow}>KEYWORD INTELLIGENCE</div>
          <h2 style={{ margin: '7px 0 5px' }}>Security, breach, recovery and AI-OS signals are baked in.</h2>
          <p style={muted}>The radar uses these as discovery vocabulary, not as exploit targets. It searches public sources only and does not probe systems, hunt credentials, or collect private breach data.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
            {KEYWORDS.map((keyword) => <span key={keyword} style={chip}>{keyword}</span>)}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={eyebrow}>RUN A LIVE SCAN</div>
          <form onSubmit={runRadar} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            <textarea rows={4} style={{ ...input, resize: 'vertical' }} value={focus} onChange={(event) => setFocus(event.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '120px 150px 1fr', gap: 10 }} className="radar-grid">
              <label style={fieldLabel}>Results<input type="number" min={3} max={20} style={input} value={count} onChange={(event) => setCount(Number(event.target.value))} /></label>
              <label style={fieldLabel}>Minimum score<input type="number" min={50} max={95} style={input} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></label>
              <label style={fieldLabel}>Extra keywords<textarea rows={2} style={{ ...input, resize: 'vertical' }} placeholder="e.g. cyber insurance, OT security, AI governance" value={extraKeywords} onChange={(event) => setExtraKeywords(event.target.value)} /></label>
            </div>
            <button disabled={Boolean(busy) || !data.profile} style={{ ...primaryButton, opacity: data.profile ? 1 : .5 }}>{busy === 'radar' ? 'Scanning public signals…' : 'Run Security + AI OS Scan'}</button>
            {!data.profile && <p style={{ ...muted, margin: 0 }}>Teach Scout about the business on the main Sales page first.</p>}
          </form>

          <div style={{ ...watchBox, marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px 180px', gap: 10, alignItems: 'end' }} className="radar-grid">
              <div><strong>Persistent Radar</strong><div style={{ ...muted, marginTop: 4 }}>Save these signals and let Scout repeat the public-web search automatically.</div></div>
              <label style={fieldLabel}>Cadence<select style={input} value={cadence} onChange={(event) => setCadence(event.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
              <button type="button" onClick={saveWatch} disabled={Boolean(busy) || !data.profile} style={secondaryButton}>{busy === 'watch' ? 'Saving…' : 'Save Radar Watch'}</button>
            </div>
            {securityWatch && <div style={{ color: '#91A6C2', fontSize: 12, marginTop: 8 }}>Existing watch: {securityWatch.cadence || 'manual'} · next {formatDate(securityWatch.next_run_at)} · {securityWatch.last_run_status || 'waiting for run'}</div>}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><div style={eyebrow}>QUALIFIED SIGNALS</div><h2 style={{ margin: '6px 0 0' }}>{securityLeads.length} security / AI-OS prospect(s) at {threshold}+</h2></div>
            <button type="button" onClick={enrichSelected} disabled={Boolean(busy) || !selected.length} style={{ ...primaryButton, opacity: selected.length ? 1 : .5 }}>{busy === 'enrich' ? 'Finding public contacts…' : `Enrich ${selected.length || ''} Selected Contact${selected.length === 1 ? '' : 's'}`}</button>
          </div>
          <p style={muted}>Contact enrichment verifies public business identities and published business contact details. It never fabricates email patterns.</p>

          {securityLeads.length === 0 ? <div style={emptyBox}>No saved prospects match the current security filter yet. Run the radar above.</div> : <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {securityLeads.slice(0, 80).map((lead) => {
              const sources = (lead.source_urls || []).filter((url) => /^https?:\/\//i.test(url)).slice(0, 4);
              return <article key={lead.id} style={leadCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={selected.includes(lead.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, lead.id] : selected.filter((id) => id !== lead.id))} />
                    <div><strong style={{ fontSize: 18 }}>{lead.company_name}</strong><div style={{ color: '#8FA2BD', fontSize: 12, marginTop: 3 }}>{lead.location || 'Location not stated'} · {lead.recommended_buyer_role || 'decision-maker research needed'}</div></div>
                  </label>
                  <div style={scorePill}>{lead.fit_score || 0}/100</div>
                </div>
                {lead.trigger_event && <div style={whyNow}><strong>Why now:</strong> {lead.trigger_event}</div>}
                {(lead.buying_signals || []).length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(lead.buying_signals || []).map((signal, index) => <span key={index} style={signalChip}>{signal}</span>)}</div>}
                {lead.personalization && <div style={opening}><strong>Opening angle:</strong> {lead.personalization}</div>}

                <div style={contactBox}>
                  <strong>Public business contact</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8, marginTop: 7 }} className="contact-grid">
                    <Value label="Name" value={lead.contact_name} />
                    <Value label="Title" value={lead.contact_title} />
                    <Value label="Email" value={lead.contact_email} />
                    <Value label="Phone" value={lead.contact_phone} />
                  </div>
                </div>

                {sources.length > 0 && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{sources.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" style={sourceLink}>Evidence {index + 1} ↗</a>)}</div>}
                {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" style={sourceLink}>Company website ↗</a>}
              </article>;
            })}
          </div>}
        </section>
      </div>
      <style>{`@media(max-width:760px){.radar-grid,.contact-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Value({ label, value }: { label: string; value?: string | null }) {
  return <div style={{ background: '#0A111F', border: '1px solid #24354D', borderRadius: 9, padding: '8px 9px', overflowWrap: 'anywhere' }}><div style={{ color: '#7186A5', fontSize: 10, fontWeight: 900 }}>{label.toUpperCase()}</div><div style={{ marginTop: 3, fontSize: 12, color: value ? '#E5EDF8' : '#75859B' }}>{value || 'Not publicly verified'}</div></div>;
}

const loadingStyle: CSSProperties = { minHeight: '100vh', background: '#050812', color: '#F7F9FD', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const panel: CSSProperties = { background: '#0E1625', border: '1px solid #293A53', borderRadius: 18, padding: 20 };
const eyebrow: CSSProperties = { color: '#8DE7D2', fontSize: 12, fontWeight: 950, letterSpacing: '.08em' };
const muted: CSSProperties = { color: '#9AABC2', lineHeight: 1.55, fontSize: 13 };
const input: CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#080E19', color: '#F7F9FD', border: '1px solid #344761', borderRadius: 10, padding: '11px 12px', fontSize: 14 };
const fieldLabel: CSSProperties = { display: 'grid', gap: 5, color: '#A9B8CB', fontSize: 12, fontWeight: 850 };
const primaryButton: CSSProperties = { border: 0, borderRadius: 10, padding: '11px 14px', background: '#8DE7D2', color: '#06110E', fontWeight: 950, cursor: 'pointer' };
const secondaryButton: CSSProperties = { border: '1px solid #3B506D', borderRadius: 10, padding: '10px 13px', background: '#16243A', color: '#E7EEF8', fontWeight: 900, cursor: 'pointer' };
const navLink: CSSProperties = { border: '1px solid #344761', color: '#E6EDF7', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 };
const noticeStyle: CSSProperties = { background: '#12243A', border: '1px solid #33536D', color: '#DCEAF5', borderRadius: 12, padding: '12px 14px', marginBottom: 14 };
const chip: CSSProperties = { border: '1px solid #35536A', background: '#102331', color: '#BDE8DF', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 800 };
const watchBox: CSSProperties = { background: '#0A111F', border: '1px solid #2A3B54', borderRadius: 13, padding: 13 };
const emptyBox: CSSProperties = { background: '#090F1B', border: '1px dashed #33455E', borderRadius: 12, padding: 18, color: '#8699B4', marginTop: 12 };
const leadCard: CSSProperties = { background: '#090F1B', border: '1px solid #283A52', borderRadius: 14, padding: 14, display: 'grid', gap: 10 };
const scorePill: CSSProperties = { background: '#17372F', color: '#98F0D8', borderRadius: 999, padding: '7px 10px', fontWeight: 950, height: 'fit-content' };
const whyNow: CSSProperties = { background: '#241E14', borderLeft: '3px solid #E9B968', borderRadius: 7, padding: '9px 11px', color: '#EAD6AF', lineHeight: 1.5, fontSize: 13 };
const signalChip: CSSProperties = { border: '1px solid #344762', background: '#111E31', color: '#CAD7E8', borderRadius: 999, padding: '5px 8px', fontSize: 11 };
const opening: CSSProperties = { background: '#0D261F', border: '1px solid #285849', color: '#C9EEE3', borderRadius: 10, padding: '10px 12px', lineHeight: 1.5, fontSize: 13 };
const contactBox: CSSProperties = { background: '#101A2A', border: '1px solid #293D58', borderRadius: 11, padding: 11 };
const sourceLink: CSSProperties = { color: '#99C9FF', fontSize: 12, textDecoration: 'none' };
