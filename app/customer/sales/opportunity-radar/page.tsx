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
  fit_reason?: string | null;
  trigger_event?: string | null;
  buying_signals?: string[] | null;
  research_notes?: string | null;
  personalization?: string | null;
  source_urls?: string[] | null;
};

type Watch = {
  id: string;
  name: string;
  cadence?: string | null;
  next_run_at?: string | null;
  last_run_status?: string | null;
};

type SalesData = {
  tenant: { slug: string; business_name: string };
  profile: unknown | null;
  leads: Lead[];
  watches: Watch[];
};

type RadarMode = 'growth' | 'ag' | 'all';

const GROWTH_SIGNALS = [
  'need more customers, grow customer base, customer acquisition, acquire new customers, or increase market share',
  'increase sales, grow revenue, improve sales performance, hit sales targets, or build a stronger sales pipeline',
  'better leads, qualified leads, lead generation, lead quality, sales-ready leads, appointment setting, or prospecting need',
  'demand generation, pipeline generation, outbound sales, inbound leads, business development, SDR, BDR, or RevOps initiative',
  'CRM replacement, CRM cleanup, lead routing, pipeline visibility, sales automation, follow-up automation, or missed-lead problem',
  'marketing automation, email marketing, SEO, local SEO, paid advertising, digital marketing, website conversion, or marketing ROI need',
  'low conversion rate, high customer acquisition cost, slow follow-up, lost opportunities, weak pipeline, or sales-process bottleneck',
  'customer retention, churn reduction, repeat business, upsell, cross-sell, loyalty, account growth, or customer-success initiative',
  'new sales leader, VP Sales, CRO, CMO, growth leader, RevOps leader, SDR/BDR hiring, or expansion of a sales team',
  'new location, new market, new territory, new product launch, franchise expansion, ecommerce growth, or geographic expansion',
  'search for sales agency, lead-generation partner, marketing agency, CRM consultant, automation vendor, AI sales tool, or growth partner',
  'AI sales assistant, AI customer service, conversational AI, call automation, sales intelligence, lead scoring, or AI workflow automation',
];

const GROWTH_KEYWORDS = [
  'more customers', 'increase sales', 'grow revenue', 'better leads', 'qualified leads', 'lead generation', 'sales pipeline',
  'customer acquisition', 'grow my business', 'business growth', 'sales automation', 'follow-up automation', 'CRM', 'RevOps',
  'demand generation', 'appointment setting', 'outbound sales', 'inbound leads', 'conversion rate', 'marketing ROI', 'local SEO',
  'paid ads', 'email marketing', 'customer retention', 'reduce churn', 'upsell', 'cross-sell', 'AI sales assistant', 'lead scoring',
];

const GROWTH_INQUIRIES = [
  'how do I get more customers', 'how to increase sales', 'how to generate better leads', 'how to get qualified leads',
  'how to build a sales pipeline', 'best CRM for small business', 'how to automate sales follow-up', 'why are my leads not converting',
  'how to reduce customer acquisition cost', 'how to improve conversion rate', 'how to grow local business sales',
  'how to use AI for sales', 'AI lead generation', 'AI sales automation', 'automate customer follow-up',
];

const AG_SIGNALS = [
  'farm management software, ranch management software, livestock management, herd management, cattle tracking, or digital farm records',
  'grazing management, pasture rotation, stocking rate, range management, forage planning, or grazing records',
  'feed costs, hay costs, grain costs, feed inventory, grain inventory, feed efficiency, or livestock input-cost pressure',
  'irrigation scheduling, water shortage, drought, well problems, water rights, stock water, soil moisture, or agricultural water efficiency',
  'crop planning, crop yield, precision agriculture, soil health, regenerative agriculture, fertilizer costs, or crop-input optimization',
  'farm bookkeeping, ranch bookkeeping, farm accounting, agricultural finance, cash flow, budgeting, receipts, taxes, or profitability tracking',
  'profit per acre, profit per head, ranch profitability, farm profitability, operating margin, input costs, or cost-reduction initiative',
  'USDA grant, NRCS EQIP, CSP, FSA loan, Rural Development, conservation funding, equipment financing, or agricultural grant search',
  'livestock marketing, cattle prices, commodity prices, grain marketing, direct-to-consumer sales, market access, or buyer search',
  'animal health, calving, breeding, veterinary records, traceability, biosecurity, herd records, or livestock compliance',
  'greenhouse, high tunnel, controlled-environment agriculture, vertical farming, greenhouse management, irrigation control, or crop automation',
  'farm labor, ranch labor, H-2A, seasonal labor, farm succession, ranch succession, next-generation transition, or workforce shortage',
];

const AG_KEYWORDS = [
  'farm management software', 'ranch management software', 'livestock management', 'herd management', 'cattle tracking',
  'grazing management', 'pasture rotation', 'feed costs', 'hay costs', 'grain inventory', 'irrigation scheduling', 'water shortage',
  'drought', 'soil moisture', 'crop yield', 'precision ag', 'regenerative agriculture', 'farm bookkeeping', 'farm accounting',
  'profit per acre', 'profit per head', 'USDA grants', 'NRCS EQIP', 'FSA loans', 'equipment financing', 'livestock marketing',
  'animal health records', 'calving records', 'greenhouse management', 'farm labor', 'ranch succession', 'ag automation',
];

const AG_INQUIRIES = [
  'best farm management software', 'best ranch management software', 'how to track cattle', 'how to manage grazing rotation',
  'how to reduce feed costs', 'how to improve ranch profitability', 'how to improve profit per acre', 'how to track farm expenses',
  'how to automate farm records', 'how to manage irrigation during drought', 'how to reduce agricultural water use',
  'USDA grants for farmers', 'NRCS EQIP funding', 'FSA farm loans', 'farm equipment financing', 'how to market cattle',
  'how to manage greenhouse operations', 'farm succession planning', 'ranch succession planning', 'AI for agriculture',
];

const MODE_CONFIG: Record<RadarMode, { label: string; title: string; focus: string; signals: string[]; keywords: string[]; inquiries: string[]; pattern: RegExp; watch: string }> = {
  growth: {
    label: '📈 Revenue & Growth',
    title: 'Find businesses actively trying to win more customers and make more sales.',
    focus: "Find businesses showing current public evidence that they want more customers, more sales, better leads, stronger conversion, improved retention, sales automation, CRM improvement, marketing performance, or AI-assisted growth. Prioritize organizations with an active decision window such as hiring, expansion, a new product, a vendor search, a sales-process problem, or a growth initiative that Aridon's AI Business OS could help solve.",
    signals: GROWTH_SIGNALS,
    keywords: GROWTH_KEYWORDS,
    inquiries: GROWTH_INQUIRIES,
    pattern: /customer acquisition|more customers|increase sales|sales growth|revenue growth|qualified leads|better leads|lead generation|sales pipeline|demand gen|revops|crm|sales automation|follow-up|conversion|marketing roi|retention|churn|business development|sdr|bdr|growth/i,
    watch: 'Revenue + Growth Intent Radar',
  },
  ag: {
    label: '🌾 Farm & Ranch',
    title: 'Find farmers, ranchers and ag organizations asking for better ways to run the operation.',
    focus: "Find farms, ranches, livestock operations, growers, greenhouses, agricultural cooperatives, ag retailers, processors, and rural organizations showing current public evidence of operational need. Look for farm or ranch management, livestock records, grazing, feed costs, water and irrigation, drought, crop planning, bookkeeping, profitability, financing, grants, labor, succession, market access, greenhouse operations, or agricultural automation needs that Aridon for Ag could help solve.",
    signals: AG_SIGNALS,
    keywords: AG_KEYWORDS,
    inquiries: AG_INQUIRIES,
    pattern: /farm|ranch|cattle|livestock|herd|graz|pasture|feed cost|hay cost|grain|irrigat|drought|soil|crop|precision ag|regenerative|agricultur|usda|nrcs|fsa|greenhouse|profit per acre|profit per head|calving|farm accounting|ranch accounting/i,
    watch: 'Farm + Ranch Intent Radar',
  },
  all: {
    label: '⚡ All Commercial Need',
    title: 'Sweep both business-growth and farm/ranch buying signals in one pass.',
    focus: "Find organizations with current public evidence of a commercial need that Aridon can solve. Search both business growth intent such as more customers, more sales, better leads, CRM, follow-up and automation, and agricultural intent such as farm/ranch management, livestock, grazing, water, feed costs, bookkeeping, profitability, grants, greenhouse operations and ag automation. Favor recent, evidence-backed decision windows over generic interest.",
    signals: [...GROWTH_SIGNALS.slice(0, 6), ...AG_SIGNALS.slice(0, 6)],
    keywords: [...GROWTH_KEYWORDS.slice(0, 14), ...AG_KEYWORDS.slice(0, 14)],
    inquiries: [...GROWTH_INQUIRIES.slice(0, 7), ...AG_INQUIRIES.slice(0, 7)],
    pattern: /customer|sales|revenue|lead|pipeline|crm|growth|conversion|retention|farm|ranch|cattle|livestock|graz|irrigat|drought|crop|agricultur|usda|nrcs|greenhouse/i,
    watch: 'Commercial Need Radar',
  },
};

function formatDate(value?: string | null) {
  if (!value) return 'Not yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not yet' : date.toLocaleString();
}

export default function OpportunityRadarPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [data, setData] = useState<SalesData | null>(null);
  const [mode, setMode] = useState<RadarMode>('growth');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [threshold, setThreshold] = useState(75);
  const [focus, setFocus] = useState(MODE_CONFIG.growth.focus);
  const [extraKeywords, setExtraKeywords] = useState('');
  const [cadence, setCadence] = useState('daily');

  const config = MODE_CONFIG[mode];

  async function authFetch(url: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers, cache: 'no-store' });
  }

  async function refresh(accessToken = token) {
    if (!accessToken) return;
    const response = await fetch('/api/customer/sales/data', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    if (response.status === 401 || response.status === 403) {
      await getBrowserClient().auth.signOut();
      router.replace('/customer/login?next=/customer/sales/opportunity-radar');
      return;
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Opportunity Radar could not load.');
    else setData(result as SalesData);
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data: sessionData }) => {
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/customer/sales/opportunity-radar');
        return;
      }
      setToken(accessToken);
      refresh(accessToken);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function switchMode(next: RadarMode) {
    setMode(next);
    setFocus(MODE_CONFIG[next].focus);
    setSelected([]);
    setExtraKeywords('');
  }

  function requestedSignals() {
    const extras = extraKeywords.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
    if (!extras.length) return config.signals.slice(0, 12);
    return [...config.signals.slice(0, 6), ...extras].slice(0, 12);
  }

  async function runRadar(event?: FormEvent) {
    event?.preventDefault();
    setBusy('radar');
    setNotice('');
    const response = await authFetch('/api/customer/sales/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'find_prospects', count, focus, intent: 'customer', qualificationThreshold: threshold, requiredSignals: requestedSignals(), exclusions: [] }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Opportunity Radar could not finish this scan.');
    else {
      setNotice(`${config.label} Radar saved ${result.prospects?.length || 0} qualified prospect(s).`);
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
        action: 'save', name: config.watch, cadence, intent: 'customer',
        objective: mode === 'ag'
          ? 'Find current farm, ranch and agricultural operating needs that may fit Aridon for Ag.'
          : mode === 'growth'
            ? 'Find businesses actively trying to win more customers, increase sales, improve lead quality or automate revenue operations.'
            : 'Find current evidence-backed commercial needs across business growth and agriculture.',
        focus, qualificationThreshold: threshold, countPerRun: count, requiredSignals: requestedSignals(), exclusions: [],
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Could not save this Radar watch.');
    else {
      setNotice(`${config.watch} saved as a ${cadence} watch.`);
      await refresh();
    }
    setBusy('');
  }

  async function enrichSelected() {
    if (!selected.length) return;
    setBusy('enrich');
    setNotice('');
    const response = await authFetch('/api/customer/sales/enrich', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadIds: selected.slice(0, 8) }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Contact enrichment could not finish.');
    else {
      setNotice(`Scout enriched ${result.enriched || 0} prospect contact(s) from public business sources.`);
      await refresh();
    }
    setBusy('');
  }

  const matchingLeads = useMemo(() => (data?.leads || []).filter((lead) => {
    const haystack = [lead.trigger_event, lead.fit_reason, lead.research_notes, ...(lead.buying_signals || [])].filter(Boolean).join(' ');
    return (lead.fit_score || 0) >= threshold && config.pattern.test(haystack);
  }), [data, threshold, config]);

  const watch = useMemo(() => (data?.watches || []).find((item) => item.name === config.watch), [data, config.watch]);

  if (!data) return <main style={loadingStyle}>Opening Growth + Farm/Ranch Radar…</main>;

  return (
    <main style={{ minHeight: '100vh', background: '#07100B', color: '#F7F9FD', padding: '24px 18px 110px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ maxWidth: 840 }}>
            <div style={eyebrow}>ARIDON · COMMERCIAL NEED RADAR</div>
            <h1 style={{ fontSize: 'clamp(38px,7vw,66px)', lineHeight: .98, margin: '8px 0' }}>Listen for the words buyers use before they buy.</h1>
            <p style={muted}>Scout hunts public evidence of business-growth intent and farm/ranch operating need, scores the timing, and turns the strongest signals into qualified prospects.</p>
          </div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={`/workspace/${data.tenant.slug}`} style={navLink}>Home</Link>
            <Link href="/customer/sales" style={navLink}>Scout Sales</Link>
            <Link href="/customer/sales/security-radar" style={navLink}>Security Radar</Link>
          </nav>
        </header>

        {notice && <div style={noticeStyle}>{notice}</div>}

        <section style={panel}>
          <div style={eyebrow}>CHOOSE THE BUYER LANGUAGE</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {(Object.keys(MODE_CONFIG) as RadarMode[]).map((item) => (
              <button key={item} type="button" onClick={() => switchMode(item)} style={{ ...modeButton, background: mode === item ? '#A9F1C8' : '#14231B', color: mode === item ? '#07110B' : '#DDEBE3' }}>{MODE_CONFIG[item].label}</button>
            ))}
          </div>
          <h2 style={{ margin: '16px 0 5px' }}>{config.title}</h2>
          <p style={muted}>These are discovery terms and inquiry patterns. Scout still requires public evidence of a real organization and a credible current need before saving a prospect.</p>

          <div style={{ marginTop: 14 }}><strong style={miniHeading}>KEYWORDS</strong><div style={chipWrap}>{config.keywords.map((item) => <span key={item} style={chip}>{item}</span>)}</div></div>
          <div style={{ marginTop: 14 }}><strong style={miniHeading}>SEARCH / INQUIRY PHRASES</strong><div style={chipWrap}>{config.inquiries.map((item) => <span key={item} style={inquiryChip}>{item}</span>)}</div></div>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={eyebrow}>RUN A LIVE INTENT SCAN</div>
          <form onSubmit={runRadar} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            <textarea rows={5} style={{ ...input, resize: 'vertical' }} value={focus} onChange={(event) => setFocus(event.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '120px 150px 1fr', gap: 10 }} className="radar-grid">
              <label style={fieldLabel}>Results<input type="number" min={3} max={20} style={input} value={count} onChange={(event) => setCount(Number(event.target.value))} /></label>
              <label style={fieldLabel}>Minimum score<input type="number" min={50} max={95} style={input} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></label>
              <label style={fieldLabel}>Extra words / inquiries<textarea rows={2} style={{ ...input, resize: 'vertical' }} placeholder={mode === 'ag' ? 'e.g. cattle records, stock water, reduce hay cost' : 'e.g. need more appointments, improve closing rate, get local customers'} value={extraKeywords} onChange={(event) => setExtraKeywords(event.target.value)} /></label>
            </div>
            <button disabled={Boolean(busy) || !data.profile} style={{ ...primaryButton, opacity: data.profile ? 1 : .5 }}>{busy === 'radar' ? 'Scanning buyer signals…' : `Run ${config.label} Scan`}</button>
            {!data.profile && <p style={{ ...muted, margin: 0 }}>Teach Scout about the business on the main Sales page first.</p>}
          </form>

          <div style={{ ...watchBox, marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px 180px', gap: 10, alignItems: 'end' }} className="radar-grid">
              <div><strong>Persistent Intent Watch</strong><div style={{ ...muted, marginTop: 4 }}>Keep searching for new organizations using this buyer-language pack.</div></div>
              <label style={fieldLabel}>Cadence<select style={input} value={cadence} onChange={(event) => setCadence(event.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
              <button type="button" onClick={saveWatch} disabled={Boolean(busy) || !data.profile} style={secondaryButton}>{busy === 'watch' ? 'Saving…' : 'Save Intent Watch'}</button>
            </div>
            {watch && <div style={{ color: '#9FB2A6', fontSize: 12, marginTop: 8 }}>Existing watch: {watch.cadence || 'manual'} · next {formatDate(watch.next_run_at)} · {watch.last_run_status || 'waiting for run'}</div>}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><div style={eyebrow}>MATCHED PROSPECTS</div><h2 style={{ margin: '6px 0 0' }}>{matchingLeads.length} prospect(s) matching this intent pack at {threshold}+</h2></div>
            <button type="button" onClick={enrichSelected} disabled={Boolean(busy) || !selected.length} style={{ ...primaryButton, opacity: selected.length ? 1 : .5 }}>{busy === 'enrich' ? 'Finding public contacts…' : `Enrich ${selected.length || ''} Selected`}</button>
          </div>
          <p style={muted}>Enrichment searches only public business sources for a relevant decision-maker and published business contact information.</p>

          {matchingLeads.length === 0 ? <div style={emptyBox}>No saved prospects match this intent pack yet. Run the scan above.</div> : <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {matchingLeads.slice(0, 80).map((lead) => {
              const sources = (lead.source_urls || []).filter((url) => /^https?:\/\//i.test(url)).slice(0, 3);
              return <article key={lead.id} style={leadCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}><input type="checkbox" checked={selected.includes(lead.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, lead.id] : selected.filter((id) => id !== lead.id))} /><span><strong style={{ fontSize: 18 }}>{lead.company_name}</strong><span style={{ display: 'block', color: '#91A69A', fontSize: 12, marginTop: 3 }}>{lead.location || 'Location not stated'} · {lead.recommended_buyer_role || 'buyer role to research'}</span></span></label>
                  <strong style={{ color: '#A9F1C8', fontSize: 20 }}>{lead.fit_score || 0}/100</strong>
                </div>
                {lead.trigger_event && <div style={whyNow}><strong>Why now:</strong> {lead.trigger_event}</div>}
                {(lead.buying_signals || []).length > 0 && <div style={chipWrap}>{(lead.buying_signals || []).map((signal, index) => <span key={index} style={signalChip}>{signal}</span>)}</div>}
                {lead.personalization && <div style={openingBox}><strong>Opening angle:</strong> {lead.personalization}</div>}
                {(lead.contact_name || lead.contact_email || lead.contact_phone) && <div style={contactBox}><strong>Public contact found</strong><div style={{ marginTop: 4 }}>{lead.contact_name || 'Name not verified'}{lead.contact_title ? ` · ${lead.contact_title}` : ''}</div><div style={{ color: '#B8CBBF', fontSize: 12, marginTop: 3 }}>{lead.contact_email || 'No public business email'}{lead.contact_phone ? ` · ${lead.contact_phone}` : ''}</div></div>}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{lead.website && <a href={lead.website} target="_blank" rel="noreferrer" style={sourceLink}>Company ↗</a>}{sources.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" style={sourceLink}>Evidence {index + 1} ↗</a>)}</div>
              </article>;
            })}
          </div>}
        </section>
      </div>
      <style>{`@media(max-width:760px){.radar-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

const loadingStyle: CSSProperties = { minHeight: '100vh', background: '#07100B', color: '#F7F9FD', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const panel: CSSProperties = { background: '#101B15', border: '1px solid #2B4938', borderRadius: 18, padding: 20 };
const eyebrow: CSSProperties = { color: '#A9F1C8', fontSize: 12, fontWeight: 950, letterSpacing: '.07em' };
const muted: CSSProperties = { color: '#9EB2A5', lineHeight: 1.55, fontSize: 13 };
const navLink: CSSProperties = { border: '1px solid #355444', color: '#E6F2EA', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 };
const modeButton: CSSProperties = { border: '1px solid #3B604A', borderRadius: 999, padding: '9px 13px', fontWeight: 900, cursor: 'pointer' };
const input: CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#08100C', color: '#F7F9FD', border: '1px solid #355444', borderRadius: 10, padding: '11px 12px', fontSize: 14 };
const fieldLabel: CSSProperties = { display: 'grid', gap: 5, color: '#B4C7BA', fontSize: 12, fontWeight: 850 };
const primaryButton: CSSProperties = { border: 0, borderRadius: 10, padding: '11px 14px', background: '#A9F1C8', color: '#07110B', fontWeight: 950, cursor: 'pointer' };
const secondaryButton: CSSProperties = { border: '1px solid #42644F', borderRadius: 10, padding: '10px 13px', background: '#18281F', color: '#ECF5EF', fontWeight: 850, cursor: 'pointer' };
const noticeStyle: CSSProperties = { marginBottom: 14, background: '#14251B', border: '1px solid #3D604B', color: '#E2F0E7', padding: '12px 14px', borderRadius: 12 };
const watchBox: CSSProperties = { background: '#0A130E', border: '1px solid #294433', borderRadius: 12, padding: 13 };
const miniHeading: CSSProperties = { color: '#B8EACB', fontSize: 11, letterSpacing: '.06em' };
const chipWrap: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 };
const chip: CSSProperties = { border: '1px solid #365744', background: '#17271E', color: '#D7EADF', borderRadius: 999, padding: '6px 9px', fontSize: 11 };
const inquiryChip: CSSProperties = { border: '1px solid #556044', background: '#242919', color: '#E6E8CB', borderRadius: 999, padding: '6px 9px', fontSize: 11 };
const signalChip: CSSProperties = { border: '1px solid #3B5A49', background: '#14231B', color: '#CBE0D2', borderRadius: 999, padding: '5px 8px', fontSize: 11 };
const leadCard: CSSProperties = { background: '#0A130E', border: '1px solid #294433', borderRadius: 14, padding: 14, display: 'grid', gap: 10 };
const whyNow: CSSProperties = { background: '#202718', borderLeft: '3px solid #D6D27F', padding: '9px 11px', color: '#E8E4B7', borderRadius: 6, lineHeight: 1.5, fontSize: 13 };
const openingBox: CSSProperties = { background: '#0E2A1C', border: '1px solid #2D6247', borderRadius: 10, padding: '10px 12px', color: '#CFF0DC', lineHeight: 1.5, fontSize: 13 };
const contactBox: CSSProperties = { background: '#151E18', border: '1px solid #3B5644', borderRadius: 10, padding: '10px 12px', color: '#DCE9E0', lineHeight: 1.45, fontSize: 13 };
const sourceLink: CSSProperties = { color: '#A9D5FF', fontSize: 12, textDecoration: 'none' };
const emptyBox: CSSProperties = { marginTop: 12, padding: 15, border: '1px dashed #385341', borderRadius: 12, color: '#98AC9F' };
