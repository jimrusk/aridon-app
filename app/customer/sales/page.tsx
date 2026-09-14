'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type Profile = {
  website?: string | null;
  offer_summary?: string | null;
  ideal_customer_profile?: string | null;
  buyer_roles?: string[];
};

type ScoreBreakdown = {
  icp_fit?: number;
  timing_signal?: number;
  strategic_value?: number;
  evidence_quality?: number;
};

type Lead = {
  id: string;
  company_name: string;
  website?: string | null;
  location?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_title?: string | null;
  recommended_buyer_role?: string | null;
  fit_score?: number | null;
  priority_tier?: string | null;
  score_breakdown?: ScoreBreakdown | null;
  fit_reason?: string | null;
  trigger_event?: string | null;
  buying_signals?: string[] | null;
  evidence_quality?: number | null;
  research_notes?: string | null;
  personalization?: string | null;
  source_urls?: string[] | null;
  status?: string | null;
};

type Campaign = {
  id: string;
  name: string;
  audience_summary?: string | null;
  sequence?: Array<{ step?: number; delay_days?: number; subject?: string; body?: string }>;
};

type Watch = {
  id: string;
  name: string;
  intent?: string | null;
  qualification_threshold?: number | null;
  count_per_run?: number | null;
  cadence?: string | null;
  active?: boolean | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
  last_run_status?: string | null;
};

type SalesData = {
  tenant: { slug: string; business_name: string; industry?: string | null };
  profile: Profile | null;
  leads: Lead[];
  campaigns: Campaign[];
  watches: Watch[];
};

type InstantlyState = {
  connected: boolean;
  campaigns: Array<{ id: string; name: string; status: number }>;
};

const intentOptions = [
  ['customer', 'Customers'],
  ['partner', 'Partners'],
  ['investor', 'Investors'],
  ['acquirer', 'Acquirers'],
] as const;

function splitList(value: string) {
  return value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).slice(0, 16);
}

function tierFor(lead: Lead) {
  if (lead.priority_tier) return lead.priority_tier;
  const score = lead.fit_score || 0;
  return score >= 85 ? 'A' : score >= 70 ? 'B' : 'C';
}

function formatDate(value?: string | null) {
  if (!value) return 'Not yet';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Not yet' : parsed.toLocaleString();
}

export default function ScoutSalesPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [data, setData] = useState<SalesData | null>(null);
  const [instantly, setInstantly] = useState<InstantlyState>({ connected: false, campaigns: [] });
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [instantlyKey, setInstantlyKey] = useState('');
  const [instantlyCampaign, setInstantlyCampaign] = useState('');
  const [approved, setApproved] = useState(false);
  const [learn, setLearn] = useState({ website: '', offer: '', goal: '', geography: '', exclusions: '' });
  const [prospect, setProspect] = useState({
    count: 10,
    focus: '',
    intent: 'customer',
    qualificationThreshold: 75,
    requiredSignals: '',
    exclusions: '',
  });
  const [watch, setWatch] = useState({ name: '', cadence: 'manual' });
  const [objective, setObjective] = useState('Start a relevant conversation and earn a qualified meeting.');

  async function authFetch(url: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers, cache: 'no-store' });
  }

  async function refresh(accessToken = token) {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [salesResponse, instantlyResponse] = await Promise.all([
      fetch('/api/customer/sales/data', { headers, cache: 'no-store' }),
      fetch('/api/customer/sales/instantly', { headers, cache: 'no-store' }),
    ]);
    if (salesResponse.status === 401 || salesResponse.status === 403) {
      await getBrowserClient().auth.signOut();
      router.replace('/customer/login');
      return;
    }
    const salesJson = await salesResponse.json().catch(() => ({}));
    if (!salesResponse.ok) {
      setNotice(salesJson.error || 'Scout could not load your prospecting workspace.');
      return;
    }
    setData(salesJson as SalesData);
    if ((salesJson as SalesData).profile && !learn.website) {
      setLearn((current) => ({ ...current, website: (salesJson as SalesData).profile?.website || '' }));
    }
    const instantlyJson = await instantlyResponse.json().catch(() => ({}));
    if (instantlyResponse.ok) {
      setInstantly(instantlyJson as InstantlyState);
      const first = (instantlyJson as InstantlyState).campaigns?.[0];
      if (first && !instantlyCampaign) setInstantlyCampaign(first.id);
    }
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data: sessionData }) => {
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/customer/sales');
        return;
      }
      setToken(accessToken);
      refresh(accessToken);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function runAgent(action: 'learn' | 'find_prospects' | 'build_sequence', payload: Record<string, unknown>) {
    setBusy(action);
    setNotice('');
    const response = await authFetch('/api/customer/sales/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Scout could not finish that step.');
    else {
      if (action === 'learn') setNotice('Scout refreshed the business profile and targeting memory.');
      if (action === 'find_prospects') setNotice(`Scout saved ${result.prospects?.length || 0} qualified prospect(s) at or above your score threshold.`);
      if (action === 'build_sequence') setNotice('The outreach draft is ready for your review.');
      await refresh();
    }
    setBusy('');
  }

  async function findProspects(event: FormEvent) {
    event.preventDefault();
    await runAgent('find_prospects', {
      count: prospect.count,
      focus: prospect.focus,
      intent: prospect.intent,
      qualificationThreshold: prospect.qualificationThreshold,
      requiredSignals: splitList(prospect.requiredSignals),
      exclusions: splitList(prospect.exclusions),
    });
  }

  async function saveWatch() {
    setBusy('watch');
    setNotice('');
    const response = await authFetch('/api/customer/sales/watch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
        name: watch.name || `${prospect.intent} prospect watch`,
        cadence: watch.cadence,
        intent: prospect.intent,
        objective,
        focus: prospect.focus,
        qualificationThreshold: prospect.qualificationThreshold,
        countPerRun: prospect.count,
        requiredSignals: splitList(prospect.requiredSignals),
        exclusions: splitList(prospect.exclusions),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Scout could not save the watch.');
    else {
      setNotice(watch.cadence === 'manual' ? 'Target profile saved for reuse.' : `Prospecting watch saved. Scout will research it ${watch.cadence}.`);
      setWatch((current) => ({ ...current, name: '' }));
      await refresh();
    }
    setBusy('');
  }

  async function deleteWatch(id: string) {
    setBusy(`delete-${id}`);
    const response = await authFetch('/api/customer/sales/watch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setNotice(result.error || 'Could not remove that watch.');
    } else {
      setNotice('Prospecting watch removed.');
      await refresh();
    }
    setBusy('');
  }

  async function saveLead(id: string, patch: Partial<Lead>) {
    const response = await authFetch('/api/customer/sales/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Could not update this prospect.');
    else setData((current) => current ? { ...current, leads: current.leads.map((lead) => lead.id === id ? result.lead : lead) } : current);
  }

  async function connectInstantly(event: FormEvent) {
    event.preventDefault();
    setBusy('instantly-connect');
    setNotice('');
    const response = await authFetch('/api/customer/sales/instantly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'connect', apiKey: instantlyKey }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Instantly could not be connected.');
    else {
      setInstantlyKey('');
      setNotice('Instantly connected.');
      await refresh();
    }
    setBusy('');
  }

  async function pushToInstantly() {
    if (!approved) {
      setNotice('Please check the approval box first.');
      return;
    }
    setBusy('instantly-push');
    setNotice('');
    const response = await authFetch('/api/customer/sales/instantly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'push_leads', campaignId: instantlyCampaign, leadIds: selected, approved: true }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'The selected contacts could not be added to Instantly.');
    else {
      setNotice(`${result.pushed?.length || 0} contact(s) added. ${result.skipped?.length || 0} skipped.`);
      setApproved(false);
      await refresh();
    }
    setBusy('');
  }

  function exportCsv() {
    if (!data?.leads.length) return;
    const rows = [['Company','Website','Location','Priority','Fit Score','ICP Fit','Timing','Strategic Value','Evidence','Buyer Role','Why Now','Buying Signals','Opening Angle','Contact','Email','Status']];
    for (const lead of data.leads) {
      rows.push([
        lead.company_name,
        lead.website || '',
        lead.location || '',
        tierFor(lead),
        String(lead.fit_score || 0),
        String(lead.score_breakdown?.icp_fit || 0),
        String(lead.score_breakdown?.timing_signal || 0),
        String(lead.score_breakdown?.strategic_value || 0),
        String(lead.score_breakdown?.evidence_quality || 0),
        lead.recommended_buyer_role || '',
        lead.trigger_event || '',
        (lead.buying_signals || []).join(' | '),
        lead.personalization || '',
        lead.contact_name || '',
        lead.contact_email || '',
        lead.status || '',
      ]);
    }
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'scout-qualified-prospects.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const readyLeads = useMemo(() => data?.leads.filter((lead) => lead.contact_email && /^\S+@\S+\.\S+$/.test(lead.contact_email)) || [], [data]);
  const visibleLeads = useMemo(() => (data?.leads || []).filter((lead) => (lead.fit_score || 0) >= prospect.qualificationThreshold), [data, prospect.qualificationThreshold]);
  const latestCampaign = data?.campaigns?.[0] || null;

  if (!data) return <main style={loadingStyle}>Opening Scout Prospecting Agent…</main>;

  const step1 = Boolean(data.profile);
  const step2 = data.leads.length > 0;
  const step3 = selected.length > 0;
  const step4 = Boolean(latestCampaign);

  return (
    <main style={{ minHeight: '100vh', background: '#070B14', color: '#F7F9FD', padding: '24px 18px 100px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '22px' }}>
          <div>
            <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: '12px', letterSpacing: '.08em' }}>SCOUT · EVIDENCE-FIRST PROSPECTING</div>
            <h1 style={{ fontSize: 'clamp(38px,7vw,62px)', lineHeight: 1, margin: '8px 0 6px' }}>Find the right organizations, not a giant stale list.</h1>
            <p style={{ color: '#AEBAD0', maxWidth: '820px', lineHeight: 1.6 }}>Scout researches the live web, scores fit and timing, explains why each prospect matters, saves the evidence, and drafts an opening angle. Nothing is sent without your approval.</p>
          </div>
          <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href={`/workspace/${data.tenant.slug}`} style={navLink}>Home</Link>
            <Link href="/customer/start" style={navLink}>Start Here</Link>
            <Link href="/customer/assistant" style={navLink}>Ask Eva</Link>
            <Link href="/customer/account" style={navLink}>Account</Link>
          </nav>
        </header>

        {notice && <div style={noticeStyle}>{notice}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '9px', marginBottom: '16px' }} className="progress-grid">
          <Progress done={step1} number="1" label="Teach Scout" />
          <Progress done={step2} number="2" label="Research + score" />
          <Progress done={step3} number="3" label="Approve prospects" />
          <Progress done={step4} number="4" label="Draft outreach" />
        </section>

        <section style={panel}>
          <div style={stepLabel}>STEP 1 · BUSINESS MEMORY</div>
          <h2 style={{ margin: '7px 0 6px' }}>{step1 ? 'Scout knows the business. Refresh the profile whenever the offer changes.' : 'Teach Scout what the business sells.'}</h2>
          <p style={muted}>Scout builds a durable ideal-customer profile, buyer roles, trigger events, disqualifiers, proof points and messaging angles.</p>
          <form onSubmit={(event) => { event.preventDefault(); runAgent('learn', learn); }} style={{ display: 'grid', gap: '10px' }}>
            <input style={input} placeholder="Company website" value={learn.website} onChange={(e) => setLearn({ ...learn, website: e.target.value })} />
            <textarea style={{ ...input, resize: 'vertical' }} rows={3} placeholder="What do you sell that the website may not explain clearly?" value={learn.offer} onChange={(e) => setLearn({ ...learn, offer: e.target.value })} />
            <details>
              <summary style={summaryStyle}>More targeting context</summary>
              <div style={{ display: 'grid', gap: '9px', marginTop: '10px' }}>
                <input style={input} placeholder="Sales goal" value={learn.goal} onChange={(e) => setLearn({ ...learn, goal: e.target.value })} />
                <input style={input} placeholder="Target geography" value={learn.geography} onChange={(e) => setLearn({ ...learn, geography: e.target.value })} />
                <textarea style={{ ...input, resize: 'vertical' }} rows={2} placeholder="Companies, sectors or situations Scout should avoid" value={learn.exclusions} onChange={(e) => setLearn({ ...learn, exclusions: e.target.value })} />
              </div>
            </details>
            <button disabled={Boolean(busy)} style={button}>{busy === 'learn' ? 'Scout is learning…' : step1 ? 'Refresh Scout Memory' : 'Teach Scout My Business'}</button>
          </form>
          {data.profile && <div style={memoryBox}><strong>Current ideal-customer profile</strong><div style={{ color: '#C4CFE0', lineHeight: 1.55, marginTop: '6px' }}>{data.profile.ideal_customer_profile || 'Sales profile ready.'}</div></div>}
        </section>

        <section style={{ ...panel, marginTop: '14px' }}>
          <div style={stepLabel}>STEP 2 · LIVE PROSPECT RESEARCH</div>
          <h2 style={{ margin: '7px 0 6px' }}>Tell Scout what kind of opportunity to hunt.</h2>
          <p style={muted}>Each prospect is scored on ICP fit, timing signal, strategic value and evidence quality. Scout rejects anything below your qualification threshold.</p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
            {intentOptions.map(([value, label]) => (
              <button key={value} type="button" onClick={() => setProspect({ ...prospect, intent: value })} style={{ ...chipButton, background: prospect.intent === value ? '#9EF0CF' : '#152039', color: prospect.intent === value ? '#07130F' : '#DDE7F7' }}>{label}</button>
            ))}
          </div>

          <form onSubmit={findProspects} style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 180px 1fr', gap: '10px' }} className="find-grid">
              <label style={fieldLabel}>Results<input type="number" min={3} max={20} style={input} value={prospect.count} onChange={(e) => setProspect({ ...prospect, count: Number(e.target.value) })} /></label>
              <label style={fieldLabel}>Minimum score<input type="number" min={50} max={95} style={input} value={prospect.qualificationThreshold} onChange={(e) => setProspect({ ...prospect, qualificationThreshold: Number(e.target.value) })} /></label>
              <label style={fieldLabel}>Search focus<input style={input} placeholder="Industry, geography, buyer type, acquisition pattern…" value={prospect.focus} onChange={(e) => setProspect({ ...prospect, focus: e.target.value })} /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }} className="contact-grid">
              <label style={fieldLabel}>Required signals<textarea rows={3} style={{ ...input, resize: 'vertical' }} placeholder="One per line: recent acquisition, hiring AI leadership, expanding into SMB…" value={prospect.requiredSignals} onChange={(e) => setProspect({ ...prospect, requiredSignals: e.target.value })} /></label>
              <label style={fieldLabel}>Exclusions<textarea rows={3} style={{ ...input, resize: 'vertical' }} placeholder="One per line: direct competitors, existing partners, specific companies…" value={prospect.exclusions} onChange={(e) => setProspect({ ...prospect, exclusions: e.target.value })} /></label>
            </div>
            <button disabled={Boolean(busy) || !step1} style={{ ...button, opacity: step1 ? 1 : .5 }}>{busy === 'find_prospects' ? 'Scout is researching the live web…' : `Find Qualified ${intentOptions.find(([value]) => value === prospect.intent)?.[1] || 'Prospects'}`}</button>
          </form>

          <div style={{ ...memoryBox, marginTop: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px', gap: '10px' }} className="find-grid">
              <label style={fieldLabel}>Save this target profile<input style={input} placeholder="e.g. Aridon strategic acquirers" value={watch.name} onChange={(e) => setWatch({ ...watch, name: e.target.value })} /></label>
              <label style={fieldLabel}>Repeat<select style={input} value={watch.cadence} onChange={(e) => setWatch({ ...watch, cadence: e.target.value })}><option value="manual">Manual</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
              <button type="button" disabled={Boolean(busy) || !step1} onClick={saveWatch} style={{ ...secondaryButton, alignSelf: 'end' }}>{busy === 'watch' ? 'Saving…' : 'Save Prospect Watch'}</button>
            </div>
            <p style={{ ...muted, marginBottom: 0 }}>Recurring watches only research and save new prospects. They never send outreach automatically.</p>
          </div>

          {(data.watches || []).length > 0 && <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
            {(data.watches || []).map((item) => <div key={item.id} style={watchRow}>
              <div><strong>{item.name}</strong><div style={{ color: '#8798B4', fontSize: '12px', marginTop: '3px' }}>{item.intent || 'customer'} · {item.cadence || 'manual'} · threshold {item.qualification_threshold || 75} · next {formatDate(item.next_run_at)}</div></div>
              <div style={{ color: '#A9B8CD', fontSize: '12px' }}>{item.last_run_status || 'Waiting for first run'}</div>
              <button type="button" onClick={() => deleteWatch(item.id)} disabled={Boolean(busy)} style={tinyButton}>{busy === `delete-${item.id}` ? 'Removing…' : 'Remove'}</button>
            </div>)}
          </div>}
        </section>

        <section style={{ ...panel, marginTop: '14px' }}>
          <div style={stepLabel}>STEP 3 · QUALIFIED PROSPECT CRM</div>
          <h2 style={{ margin: '7px 0 6px' }}>Scout explains the score before you decide.</h2>
          <p style={muted}>{visibleLeads.length} prospect(s) currently meet your {prospect.qualificationThreshold}+ score filter. Verify a real contact before outreach.</p>

          {visibleLeads.length === 0 ? <p style={emptyStyle}>No prospects meet this threshold yet. Run Scout above or lower the display threshold.</p> : <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
            {visibleLeads.slice(0, 100).map((lead) => {
              const score = lead.fit_score || 0;
              const sources = (lead.source_urls || []).filter((url) => /^https?:\/\//i.test(url)).slice(0, 3);
              return <article key={lead.id} style={leadStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={selected.includes(lead.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, lead.id] : selected.filter((id) => id !== lead.id))} />
                    <div><strong style={{ fontSize: '18px' }}>{lead.company_name}</strong><div style={{ color: '#8EA0BB', fontSize: '12px', marginTop: '3px' }}>{lead.location || 'Location not stated'} · target role: {lead.recommended_buyer_role || 'research further'}</div></div>
                  </label>
                  <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}><span style={tierBadge}>{tierFor(lead)}</span><strong style={{ color: '#9EF0CF', fontSize: '20px' }}>{score}/100</strong></div>
                </div>

                <div style={scoreGrid}>
                  <MiniScore label="ICP fit" value={lead.score_breakdown?.icp_fit} />
                  <MiniScore label="Timing" value={lead.score_breakdown?.timing_signal} />
                  <MiniScore label="Strategic" value={lead.score_breakdown?.strategic_value} />
                  <MiniScore label="Evidence" value={lead.score_breakdown?.evidence_quality} />
                </div>

                {lead.fit_reason && <div style={{ color: '#D4DEEC', lineHeight: 1.55, fontSize: '13px' }}><strong>Why it fits:</strong> {lead.fit_reason}</div>}
                {lead.trigger_event && <div style={whyNow}><strong>Why now:</strong> {lead.trigger_event}</div>}
                {(lead.buying_signals || []).length > 0 && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{(lead.buying_signals || []).map((signal, index) => <span key={index} style={signalBadge}>{signal}</span>)}</div>}
                {lead.personalization && <div style={openingBox}><strong>Opening angle:</strong> {lead.personalization}</div>}
                {sources.length > 0 && <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{sources.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" style={sourceLink}>Evidence {index + 1} ↗</a>)}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }} className="contact-grid">
                  <input style={input} placeholder="Verified contact name" defaultValue={lead.contact_name || ''} onBlur={(e) => saveLead(lead.id, { contact_name: e.target.value })} />
                  <input style={input} placeholder="Verified business email" defaultValue={lead.contact_email || ''} onBlur={(e) => saveLead(lead.id, { contact_email: e.target.value })} />
                  <input style={input} placeholder="Verified title" defaultValue={lead.contact_title || ''} onBlur={(e) => saveLead(lead.id, { contact_title: e.target.value })} />
                </div>
                {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" style={sourceLink}>Company website ↗</a>}
              </article>;
            })}
          </div>}
          {data.leads.length > 0 && <div style={{ marginTop: '12px', color: '#9DABC3', fontSize: '13px' }}>{selected.length} selected · {readyLeads.length} have a verified-looking business email · {data.leads.length} total saved prospects</div>}
        </section>

        <section style={{ ...panel, marginTop: '14px' }}>
          <div style={stepLabel}>STEP 4 · HUMAN-APPROVED OUTREACH</div>
          <h2 style={{ margin: '7px 0 6px' }}>Scout drafts. You decide whether anything leaves Aridon.</h2>
          <textarea rows={3} style={{ ...input, resize: 'vertical' }} value={objective} onChange={(e) => setObjective(e.target.value)} />
          <button disabled={Boolean(busy) || !selected.length} onClick={() => runAgent('build_sequence', { leadIds: selected, objective })} style={{ ...button, marginTop: '10px', opacity: selected.length ? 1 : .5 }}>{busy === 'build_sequence' ? 'Writing…' : 'Create Outreach Draft'}</button>
          {!selected.length && <p style={{ color: '#8EA0BB', fontSize: '13px' }}>Choose at least one prospect in Step 3 first.</p>}
          {latestCampaign && <div style={{ marginTop: '16px' }}>
            <strong style={{ fontSize: '18px' }}>Draft ready: {latestCampaign.name}</strong>
            <div style={{ color: '#9DABC3', fontSize: '13px', margin: '4px 0 10px' }}>{latestCampaign.audience_summary}</div>
            <div style={{ display: 'grid', gap: '9px' }}>{(latestCampaign.sequence || []).map((step, index) => <div key={index} style={memoryBox}><div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 900 }}>EMAIL {step.step || index + 1} · WAIT {step.delay_days || 0} DAY(S)</div><strong style={{ display: 'block', margin: '5px 0' }}>{step.subject}</strong><div style={{ whiteSpace: 'pre-wrap', color: '#C4CFE0', lineHeight: 1.5, fontSize: '13px' }}>{step.body}</div></div>)}</div>
          </div>}
        </section>

        <section style={{ ...panel, marginTop: '14px' }}>
          <div style={stepLabel}>OPTIONAL DELIVERY</div>
          <details>
            <summary style={{ ...summaryStyle, fontSize: '17px' }}>Connect Instantly for approved email campaigns</summary>
            <p style={muted}>Scout works without Instantly. Connect it only if you want selected, verified contacts moved into an existing campaign after explicit approval.</p>
            {!instantly.connected ? <form onSubmit={connectInstantly} style={{ display: 'grid', gap: '10px', maxWidth: '620px' }}><input type="password" autoComplete="off" style={input} placeholder="Instantly API key" value={instantlyKey} onChange={(e) => setInstantlyKey(e.target.value)} /><button disabled={Boolean(busy)} style={button}>{busy === 'instantly-connect' ? 'Connecting…' : 'Connect Instantly'}</button></form> : <div style={{ display: 'grid', gap: '10px', maxWidth: '720px' }}>
              <div style={memoryBox}><strong style={{ color: '#9EF0CF' }}>Instantly connected</strong><div style={{ color: '#9DABC3', fontSize: '12px', marginTop: '4px' }}>{instantly.campaigns.length} campaign(s) available.</div></div>
              <select style={input} value={instantlyCampaign} onChange={(e) => setInstantlyCampaign(e.target.value)}><option value="">Choose a campaign</option>{instantly.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select>
              <label style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', color: '#BEC9DB', fontSize: '13px', lineHeight: 1.45 }}><input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} /><span>I approve adding the selected verified business contacts to this Instantly campaign. I understand the campaign may send according to its own settings.</span></label>
              <button disabled={Boolean(busy) || !selected.length || !instantlyCampaign || !approved} onClick={pushToInstantly} style={{ ...button, opacity: selected.length && instantlyCampaign && approved ? 1 : .5 }}>{busy === 'instantly-push' ? 'Adding contacts…' : 'Approve & Add to Instantly'}</button>
            </div>}
          </details>
        </section>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
          <button onClick={exportCsv} disabled={!data.leads.length} style={secondaryButton}>Download Qualified Prospects CSV</button>
          <Link href="/customer/assistant" style={secondaryLink}>Ask Eva what to pursue first</Link>
        </div>
      </div>
      <style>{`@media(max-width:760px){.progress-grid{grid-template-columns:repeat(2,1fr) !important}.find-grid,.contact-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Progress({ done, number, label }: { done: boolean; number: string; label: string }) {
  return <div style={{ background: done ? '#153429' : '#111827', border: `1px solid ${done ? '#2A6A54' : '#293552'}`, borderRadius: '12px', padding: '12px' }}><div style={{ color: done ? '#9EF0CF' : '#8293B2', fontWeight: 950 }}>{done ? '✓' : number}</div><div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 850 }}>{label}</div></div>;
}

function MiniScore({ label, value }: { label: string; value?: number | null }) {
  return <div style={{ background: '#111C30', border: '1px solid #263856', borderRadius: '10px', padding: '8px 10px' }}><div style={{ color: '#7F91AE', fontSize: '10px', fontWeight: 900 }}>{label.toUpperCase()}</div><strong style={{ display: 'block', marginTop: '3px' }}>{value || 0}/25</strong></div>;
}

const loadingStyle: CSSProperties = { minHeight: '100vh', background: '#070B14', color: '#F7F9FD', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const panel: CSSProperties = { background: '#111827', border: '1px solid #293552', borderRadius: '18px', padding: '20px' };
const input: CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#0B1020', color: '#F7F9FD', border: '1px solid #354360', borderRadius: '10px', padding: '11px 12px', fontSize: '14px' };
const button: CSSProperties = { border: 0, borderRadius: '10px', padding: '11px 14px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, cursor: 'pointer' };
const secondaryButton: CSSProperties = { border: '1px solid #354360', borderRadius: '10px', padding: '10px 13px', background: '#18233A', color: '#E8EEF9', fontWeight: 850, cursor: 'pointer' };
const secondaryLink = { ...secondaryButton, textDecoration: 'none' };
const navLink = { border: '1px solid #354360', color: '#E8EEF9', borderRadius: '10px', padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: '13px' };
const stepLabel: CSSProperties = { color: '#9EF0CF', fontSize: '12px', fontWeight: 950 };
const muted: CSSProperties = { color: '#9DABC3', lineHeight: 1.55, fontSize: '13px' };
const summaryStyle: CSSProperties = { cursor: 'pointer', color: '#DDE7F7', fontWeight: 850 };
const noticeStyle: CSSProperties = { marginBottom: '16px', background: '#17233A', border: '1px solid #334766', color: '#DDE7F7', padding: '12px 14px', borderRadius: '12px' };
const memoryBox: CSSProperties = { background: '#0C1424', border: '1px solid #273654', borderRadius: '12px', padding: '13px', marginTop: '12px' };
const leadStyle: CSSProperties = { background: '#0C1424', border: '1px solid #273654', borderRadius: '14px', padding: '14px', display: 'grid', gap: '10px' };
const emptyStyle: CSSProperties = { color: '#9DABC3', lineHeight: 1.6 };
const chipButton: CSSProperties = { border: '1px solid #354360', borderRadius: '999px', padding: '8px 12px', fontWeight: 900, cursor: 'pointer' };
const fieldLabel: CSSProperties = { display: 'grid', gap: '5px', color: '#AEBAD0', fontSize: '12px', fontWeight: 850 };
const tierBadge: CSSProperties = { display: 'inline-grid', placeItems: 'center', minWidth: '30px', height: '30px', borderRadius: '999px', background: '#203A33', color: '#9EF0CF', fontWeight: 950 };
const signalBadge: CSSProperties = { border: '1px solid #354360', background: '#121E34', color: '#C7D4E8', borderRadius: '999px', padding: '5px 8px', fontSize: '11px' };
const whyNow: CSSProperties = { background: '#1A2234', borderLeft: '3px solid #F0C984', padding: '9px 11px', color: '#E5D9B5', borderRadius: '6px', lineHeight: 1.5, fontSize: '13px' };
const openingBox: CSSProperties = { background: '#10251F', border: '1px solid #285545', borderRadius: '10px', padding: '10px 12px', color: '#CDEEE1', lineHeight: 1.5, fontSize: '13px' };
const sourceLink: CSSProperties = { color: '#9EC7FF', fontSize: '12px', textDecoration: 'none' };
const scoreGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '7px' };
const watchRow: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center', background: '#0C1424', border: '1px solid #273654', borderRadius: '12px', padding: '11px 12px' };
const tinyButton: CSSProperties = { border: '1px solid #3A4761', background: '#141E31', color: '#C9D3E2', borderRadius: '8px', padding: '7px 9px', cursor: 'pointer', fontSize: '11px', fontWeight: 850 };
