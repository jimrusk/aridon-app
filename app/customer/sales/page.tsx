'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type Profile = {
  website?: string | null;
  offer_summary?: string | null;
  ideal_customer_profile?: string | null;
  buyer_roles?: string[];
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
  fit_reason?: string | null;
  trigger_event?: string | null;
  personalization?: string | null;
  status?: string | null;
};

type Campaign = {
  id: string;
  name: string;
  audience_summary?: string | null;
  sequence?: Array<{ step?: number; delay_days?: number; subject?: string; body?: string }>;
};

type SalesData = {
  tenant: { slug: string; business_name: string; industry?: string | null };
  profile: Profile | null;
  leads: Lead[];
  campaigns: Campaign[];
};

type InstantlyState = {
  connected: boolean;
  campaigns: Array<{ id: string; name: string; status: number }>;
};

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
  const [prospect, setProspect] = useState({ count: 10, focus: '' });
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
    if (!salesResponse.ok) { setNotice(salesJson.error || 'Scout could not load your sales page.'); return; }
    setData(salesJson as SalesData);
    if ((salesJson as SalesData).profile && !learn.website) setLearn((current) => ({ ...current, website: (salesJson as SalesData).profile?.website || '' }));
    const instantJson = await instantlyResponse.json().catch(() => ({}));
    if (instantlyResponse.ok) {
      setInstantly(instantJson as InstantlyState);
      const first = (instantJson as InstantlyState).campaigns?.[0];
      if (first && !instantlyCampaign) setInstantlyCampaign(first.id);
    }
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data: sessionData }) => {
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/customer/sales'); return; }
      setToken(accessToken); refresh(accessToken);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function runAgent(action: 'learn' | 'find_prospects' | 'build_sequence', payload: Record<string, unknown>) {
    setBusy(action); setNotice('');
    const response = await authFetch('/api/customer/sales/agent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Scout could not finish that step.');
    else {
      setNotice(action === 'learn' ? 'Scout learned your business. Step 1 is done.' : action === 'find_prospects' ? `Scout found ${result.prospects?.length || 0} possible customers.` : 'Your outreach draft is ready to review.');
      await refresh();
    }
    setBusy('');
  }

  async function saveLead(id: string, patch: Partial<Lead>) {
    const response = await authFetch('/api/customer/sales/data', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Could not update this company.');
    else setData((current) => current ? { ...current, leads: current.leads.map((lead) => lead.id === id ? result.lead : lead) } : current);
  }

  async function connectInstantly(event: FormEvent) {
    event.preventDefault(); setBusy('instantly-connect'); setNotice('');
    const response = await authFetch('/api/customer/sales/instantly', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'connect', apiKey: instantlyKey }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Instantly could not be connected.');
    else { setInstantlyKey(''); setNotice('Instantly connected.'); await refresh(); }
    setBusy('');
  }

  async function pushToInstantly() {
    if (!approved) { setNotice('Please check the approval box first.'); return; }
    setBusy('instantly-push'); setNotice('');
    const response = await authFetch('/api/customer/sales/instantly', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'push_leads', campaignId: instantlyCampaign, leadIds: selected, approved: true }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'The selected contacts could not be added to Instantly.');
    else { setNotice(`${result.pushed?.length || 0} contact(s) added. ${result.skipped?.length || 0} skipped.`); setApproved(false); await refresh(); }
    setBusy('');
  }

  function exportCsv() {
    if (!data?.leads.length) return;
    const rows = [['Company','Website','Location','Contact','Email','Title','Fit Score','Buyer Role','Reason','Trigger','Personalization','Status']];
    for (const lead of data.leads) rows.push([lead.company_name, lead.website || '', lead.location || '', lead.contact_name || '', lead.contact_email || '', lead.contact_title || '', String(lead.fit_score || 0), lead.recommended_buyer_role || '', lead.fit_reason || '', lead.trigger_event || '', lead.personalization || '', lead.status || '']);
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'scout-prospects.csv'; anchor.click(); URL.revokeObjectURL(url);
  }

  const readyLeads = useMemo(() => data?.leads.filter((lead) => lead.contact_email && /^\S+@\S+\.\S+$/.test(lead.contact_email)) || [], [data]);
  const latestCampaign = data?.campaigns?.[0] || null;

  if (!data) return <main style={loadingStyle}>Opening Find Customers…</main>;

  const step1 = Boolean(data.profile);
  const step2 = data.leads.length > 0;
  const step3 = selected.length > 0;
  const step4 = Boolean(latestCampaign);

  return (
    <main style={{ minHeight: '100vh', background: '#070B14', color: '#F7F9FD', padding: '24px 18px 100px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '22px' }}>
          <div><div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: '12px' }}>FIND CUSTOMERS</div><h1 style={{ fontSize: 'clamp(38px,7vw,60px)', lineHeight: 1, margin: '8px 0 6px' }}>Let Scout find companies worth talking to.</h1><p style={{ color: '#AEBAD0', maxWidth: '760px', lineHeight: 1.6 }}>Follow the four steps below. Scout does the research and drafting. You decide who to contact and nothing is sent automatically from this page.</p></div>
          <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><Link href={`/workspace/${data.tenant.slug}`} style={navLink}>Home</Link><Link href="/customer/start" style={navLink}>Start Here</Link><Link href="/customer/assistant" style={navLink}>Ask Eva</Link><Link href="/customer/account" style={navLink}>Account</Link></nav>
        </header>

        {notice && <div style={noticeStyle}>{notice}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '9px', marginBottom: '16px' }} className="progress-grid">
          <Progress done={step1} number="1" label="Teach Scout" /><Progress done={step2} number="2" label="Find companies" /><Progress done={step3} number="3" label="Choose companies" /><Progress done={step4} number="4" label="Draft outreach" />
        </section>

        <section style={panel}>
          <div style={stepLabel}>STEP 1 · TEACH SCOUT ABOUT YOUR BUSINESS</div>
          <h2 style={{ margin: '7px 0 6px' }}>{step1 ? 'Scout already knows the basics. Update them anytime.' : 'Start with your website.'}</h2>
          <p style={muted}>Scout uses this to understand what you sell and who may be a good customer.</p>
          <form onSubmit={(event) => { event.preventDefault(); runAgent('learn', learn); }} style={{ display: 'grid', gap: '10px' }}>
            <input style={input} placeholder="Your company website" value={learn.website} onChange={(e)=>setLearn({...learn,website:e.target.value})}/>
            <textarea style={{...input,resize:'vertical'}} rows={3} placeholder="Optional: What do you sell that the website may not explain clearly?" value={learn.offer} onChange={(e)=>setLearn({...learn,offer:e.target.value})}/>
            <details><summary style={summaryStyle}>Add more targeting details</summary><div style={{ display: 'grid', gap: '9px', marginTop: '10px' }}><input style={input} placeholder="Sales goal, e.g. book meetings with manufacturers" value={learn.goal} onChange={(e)=>setLearn({...learn,goal:e.target.value})}/><input style={input} placeholder="Where do you want customers? e.g. New Mexico and Arizona" value={learn.geography} onChange={(e)=>setLearn({...learn,geography:e.target.value})}/><textarea style={{...input,resize:'vertical'}} rows={2} placeholder="Anyone Scout should avoid?" value={learn.exclusions} onChange={(e)=>setLearn({...learn,exclusions:e.target.value})}/></div></details>
            <button disabled={Boolean(busy)} style={button}>{busy === 'learn' ? 'Scout is learning…' : step1 ? 'Update What Scout Knows' : 'Teach Scout My Business'}</button>
          </form>
          {data.profile && <div style={memoryBox}><strong>Who Scout thinks you should sell to:</strong><div style={{ color: '#C4CFE0', lineHeight: 1.55, marginTop: '6px' }}>{data.profile.ideal_customer_profile || 'Sales profile ready.'}</div></div>}
        </section>

        <section style={{ ...panel, marginTop: '14px' }}>
          <div style={stepLabel}>STEP 2 · FIND POSSIBLE CUSTOMERS</div>
          <h2 style={{ margin: '7px 0 6px' }}>How many companies should Scout research?</h2>
          <p style={muted}>Scout researches real organizations using public information. It does not make up personal names or email addresses.</p>
          <form onSubmit={(event) => { event.preventDefault(); runAgent('find_prospects', prospect); }} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '10px' }} className="find-grid">
            <input type="number" min={3} max={20} style={input} value={prospect.count} onChange={(e)=>setProspect({...prospect,count:Number(e.target.value)})}/>
            <input style={input} placeholder="Optional focus: location, industry or buyer type" value={prospect.focus} onChange={(e)=>setProspect({...prospect,focus:e.target.value})}/>
            <button disabled={Boolean(busy) || !step1} style={{ ...button, opacity: step1 ? 1 : .5 }}>{busy === 'find_prospects' ? 'Researching…' : 'Find Companies'}</button>
          </form>
          {!step1 && <p style={{ color: '#F0C984', fontSize: '13px' }}>Finish Step 1 first so Scout knows what a good customer looks like.</p>}
        </section>

        <section style={{ ...panel, marginTop: '14px' }}>
          <div style={stepLabel}>STEP 3 · CHOOSE WHO IS WORTH CONTACTING</div>
          <h2 style={{ margin: '7px 0 6px' }}>Review Scout’s suggestions.</h2>
          <p style={muted}>Check the companies you want to use for an outreach draft. Add a real business contact and email when you have verified them.</p>
          {data.leads.length === 0 ? <p style={emptyStyle}>No companies yet. Use Step 2 above.</p> : <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>{data.leads.slice(0, 100).map((lead) => (
            <article key={lead.id} style={leadStyle}>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}><input type="checkbox" checked={selected.includes(lead.id)} onChange={(e)=>setSelected(e.target.checked ? [...selected, lead.id] : selected.filter((id)=>id!==lead.id))}/><div><strong style={{ fontSize: '17px' }}>{lead.company_name}</strong><div style={{ color: '#8EA0BB', fontSize: '12px', marginTop: '3px' }}>{lead.location || lead.recommended_buyer_role || 'Possible customer'} · Fit score {lead.fit_score || 0}/100</div></div></label>
              <div style={{ color: '#C4CFE0', lineHeight: 1.5, fontSize: '13px' }}>{lead.fit_reason || lead.trigger_event || 'Scout identified this company as a possible fit.'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} className="contact-grid"><input style={input} placeholder="Verified contact name" defaultValue={lead.contact_name || ''} onBlur={(e)=>saveLead(lead.id,{contact_name:e.target.value})}/><input style={input} placeholder="Verified business email" defaultValue={lead.contact_email || ''} onBlur={(e)=>saveLead(lead.id,{contact_email:e.target.value})}/></div>
              {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: '#9EC7FF', fontSize: '12px' }}>Open company website ↗</a>}
            </article>
          ))}</div>}
          {data.leads.length > 0 && <div style={{ marginTop: '12px', color: '#9DABC3', fontSize: '13px' }}>{selected.length} selected · {readyLeads.length} have a verified-looking business email</div>}
        </section>

        <section style={{ ...panel, marginTop: '14px' }}>
          <div style={stepLabel}>STEP 4 · DRAFT THE OUTREACH</div>
          <h2 style={{ margin: '7px 0 6px' }}>Tell Scout what you want the conversation to achieve.</h2>
          <textarea rows={3} style={{...input,resize:'vertical'}} value={objective} onChange={(e)=>setObjective(e.target.value)}/>
          <button disabled={Boolean(busy) || !selected.length} onClick={()=>runAgent('build_sequence',{leadIds:selected,objective})} style={{ ...button, marginTop: '10px', opacity: selected.length ? 1 : .5 }}>{busy==='build_sequence'?'Writing…':'Create Outreach Draft'}</button>
          {!selected.length && <p style={{ color: '#8EA0BB', fontSize: '13px' }}>Choose at least one company in Step 3 first.</p>}
          {latestCampaign && <div style={{ marginTop: '16px' }}><strong style={{ fontSize: '18px' }}>Draft ready: {latestCampaign.name}</strong><div style={{ color: '#9DABC3', fontSize: '13px', margin: '4px 0 10px' }}>{latestCampaign.audience_summary}</div><div style={{ display: 'grid', gap: '9px' }}>{(latestCampaign.sequence || []).map((step,index)=><div key={index} style={memoryBox}><div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 900 }}>EMAIL {step.step || index + 1} · WAIT {step.delay_days || 0} DAY(S)</div><strong style={{ display: 'block', margin: '5px 0' }}>{step.subject}</strong><div style={{ whiteSpace: 'pre-wrap', color: '#C4CFE0', lineHeight: 1.5, fontSize: '13px' }}>{step.body}</div></div>)}</div></div>}
        </section>

        <section style={{ ...panel, marginTop: '14px' }}>
          <div style={stepLabel}>OPTIONAL</div>
          <details>
            <summary style={{ ...summaryStyle, fontSize: '17px' }}>Connect Instantly for larger email campaigns</summary>
            <p style={muted}>You do not need Instantly to use Scout. Connect it only if you already use Instantly and want approved contacts moved into one of your campaigns.</p>
            {!instantly.connected ? <form onSubmit={connectInstantly} style={{ display: 'grid', gap: '10px', maxWidth: '620px' }}><input type="password" autoComplete="off" style={input} placeholder="Instantly API key" value={instantlyKey} onChange={(e)=>setInstantlyKey(e.target.value)}/><button disabled={Boolean(busy)} style={button}>{busy==='instantly-connect'?'Connecting…':'Connect Instantly'}</button></form> : <div style={{ display: 'grid', gap: '10px', maxWidth: '720px' }}><div style={memoryBox}><strong style={{ color: '#9EF0CF' }}>Instantly connected</strong><div style={{ color: '#9DABC3', fontSize: '12px', marginTop: '4px' }}>{instantly.campaigns.length} campaign(s) available.</div></div><select style={input} value={instantlyCampaign} onChange={(e)=>setInstantlyCampaign(e.target.value)}><option value="">Choose a campaign</option>{instantly.campaigns.map((campaign)=><option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select><label style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', color: '#BEC9DB', fontSize: '13px', lineHeight: 1.45 }}><input type="checkbox" checked={approved} onChange={(e)=>setApproved(e.target.checked)}/><span>I approve adding the selected verified business contacts to this Instantly campaign. I understand the campaign may send according to its own settings.</span></label><button disabled={Boolean(busy)||!selected.length||!instantlyCampaign||!approved} onClick={pushToInstantly} style={{ ...button, opacity: selected.length&&instantlyCampaign&&approved?1:.5 }}>{busy==='instantly-push'?'Adding contacts…':'Approve & Add to Instantly'}</button></div>}
          </details>
        </section>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}><button onClick={exportCsv} disabled={!data.leads.length} style={secondaryButton}>Download Companies as CSV</button><Link href="/customer/assistant" style={secondaryLink}>Ask Eva about my sales plan</Link></div>
      </div>
      <style>{`@media(max-width:760px){.progress-grid{grid-template-columns:repeat(2,1fr) !important}.find-grid,.contact-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Progress({ done, number, label }: { done: boolean; number: string; label: string }) {
  return <div style={{ background: done ? '#153429' : '#111827', border: `1px solid ${done ? '#2A6A54' : '#293552'}`, borderRadius: '12px', padding: '12px' }}><div style={{ color: done ? '#9EF0CF' : '#8293B2', fontWeight: 950 }}>{done ? '✓' : number}</div><div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 850 }}>{label}</div></div>;
}

const loadingStyle = { minHeight: '100vh', background: '#070B14', color: '#F7F9FD', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const panel: React.CSSProperties = { background: '#111827', border: '1px solid #293552', borderRadius: '18px', padding: '20px' };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#0B1020', color: '#F7F9FD', border: '1px solid #354360', borderRadius: '10px', padding: '11px 12px', fontSize: '14px' };
const button: React.CSSProperties = { border: 0, borderRadius: '10px', padding: '11px 14px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, cursor: 'pointer' };
const secondaryButton: React.CSSProperties = { border: '1px solid #354360', borderRadius: '10px', padding: '10px 13px', background: '#18233A', color: '#E8EEF9', fontWeight: 850, cursor: 'pointer' };
const secondaryLink = { ...secondaryButton, textDecoration: 'none' };
const navLink = { border: '1px solid #354360', color: '#E8EEF9', borderRadius: '10px', padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: '13px' };
const stepLabel: React.CSSProperties = { color: '#9EF0CF', fontSize: '12px', fontWeight: 950 };
const muted: React.CSSProperties = { color: '#9DABC3', lineHeight: 1.55, fontSize: '13px' };
const summaryStyle: React.CSSProperties = { cursor: 'pointer', color: '#DDE7F7', fontWeight: 850 };
const noticeStyle: React.CSSProperties = { marginBottom: '16px', background: '#17233A', border: '1px solid #334766', color: '#DDE7F7', padding: '12px 14px', borderRadius: '12px' };
const memoryBox: React.CSSProperties = { background: '#0C1424', border: '1px solid #273654', borderRadius: '12px', padding: '13px', marginTop: '12px' };
const leadStyle: React.CSSProperties = { background: '#0C1424', border: '1px solid #273654', borderRadius: '14px', padding: '14px', display: 'grid', gap: '10px' };
const emptyStyle: React.CSSProperties = { color: '#9DABC3', lineHeight: 1.6 };
