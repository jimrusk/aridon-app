'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type Profile = {
  website?: string | null;
  company_summary?: string | null;
  offer_summary?: string | null;
  ideal_customer_profile?: string | null;
  buyer_roles?: string[];
  trigger_events?: string[];
  messaging_angles?: string[];
  proof_points?: string[];
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
  research_notes?: string | null;
  personalization?: string | null;
  status?: string | null;
};

type Campaign = {
  id: string;
  name: string;
  objective?: string | null;
  audience_summary?: string | null;
  sequence?: Array<{ step?: number; delay_days?: number; subject?: string; body?: string; purpose?: string }>;
  status?: string | null;
  created_at?: string;
};

type SalesData = {
  tenant: { slug: string; business_name: string; industry?: string | null };
  profile: Profile | null;
  leads: Lead[];
  campaigns: Campaign[];
  events: Array<{ id: string; event_name: string; event_data?: Record<string, unknown>; created_at: string }>;
};

type InstantlyState = {
  connected: boolean;
  campaigns: Array<{ id: string; name: string; status: number }>;
  analytics?: Record<string, number> | null;
};

const panel: React.CSSProperties = { background: '#111827', border: '1px solid #293552', borderRadius: '18px', padding: '20px' };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#0B1020', color: '#F7F9FD', border: '1px solid #354360', borderRadius: '10px', padding: '11px 12px', fontSize: '14px' };
const button: React.CSSProperties = { border: 0, borderRadius: '10px', padding: '11px 14px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, cursor: 'pointer' };
const secondary: React.CSSProperties = { ...button, background: '#18233A', color: '#E8EEF9', border: '1px solid #354360' };

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
    if (!salesResponse.ok) {
      setNotice(salesJson.error || 'Scout could not load the sales workspace.');
      return;
    }
    setData(salesJson as SalesData);
    if ((salesJson as SalesData).profile && !learn.website) {
      setLearn((current) => ({ ...current, website: (salesJson as SalesData).profile?.website || '' }));
    }
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
    setBusy(action); setNotice('');
    const response = await authFetch('/api/customer/sales/agent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Scout could not finish that job.');
    else {
      setNotice(action === 'learn' ? 'Scout learned the business and built the ICP.' : action === 'find_prospects' ? `Scout added ${result.prospects?.length || 0} researched prospects.` : 'Scout built the outreach sequence.');
      await refresh();
    }
    setBusy('');
  }

  async function saveLead(id: string, patch: Partial<Lead>) {
    const response = await authFetch('/api/customer/sales/data', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Could not update this prospect.');
    else setData((current) => current ? { ...current, leads: current.leads.map((lead) => lead.id === id ? result.lead : lead) } : current);
  }

  async function connectInstantly(event: FormEvent) {
    event.preventDefault();
    setBusy('instantly-connect'); setNotice('');
    const response = await authFetch('/api/customer/sales/instantly', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'connect', apiKey: instantlyKey }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'Instantly could not be connected.');
    else {
      setInstantlyKey('');
      setNotice('Instantly connected. The API key is encrypted before storage.');
      await refresh();
    }
    setBusy('');
  }

  async function pushToInstantly() {
    if (!approved) { setNotice('Check the approval box first.'); return; }
    setBusy('instantly-push'); setNotice('');
    const response = await authFetch('/api/customer/sales/instantly', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'push_leads', campaignId: instantlyCampaign, leadIds: selected, approved: true }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(result.error || 'The prospects could not be added to Instantly.');
    else {
      setNotice(`${result.pushed?.length || 0} prospect(s) added to the selected Instantly campaign. ${result.skipped?.length || 0} skipped.`);
      setApproved(false);
      await refresh();
    }
    setBusy('');
  }

  function exportCsv() {
    if (!data?.leads.length) return;
    const rows = [['Company','Website','Location','Contact','Email','Title','Fit Score','Buyer Role','Reason','Trigger','Personalization','Status']];
    for (const lead of data.leads) rows.push([
      lead.company_name, lead.website || '', lead.location || '', lead.contact_name || '', lead.contact_email || '', lead.contact_title || '', String(lead.fit_score || 0), lead.recommended_buyer_role || '', lead.fit_reason || '', lead.trigger_event || '', lead.personalization || '', lead.status || '',
    ]);
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'scout-prospects.csv'; anchor.click(); URL.revokeObjectURL(url);
  }

  const readyLeads = useMemo(() => data?.leads.filter((lead) => lead.contact_email && /^\S+@\S+\.\S+$/.test(lead.contact_email)) || [], [data]);
  const latestCampaign = data?.campaigns?.[0] || null;
  const topLeads = data?.leads.filter((lead) => (lead.fit_score || 0) >= 80).length || 0;

  if (!data) return <main style={{ minHeight: '100vh', background: '#070B14', color: '#F7F9FD', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' }}>Scout is opening the sales room…</main>;

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 10% 0%,rgba(158,240,207,.12),transparent 30%),#070B14', color: '#F7F9FD', padding: '28px 18px 100px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1220px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div><div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: '12px', letterSpacing: '1.2px' }}>SCOUT SALES AGENT · {data.tenant.business_name.toUpperCase()}</div><h1 style={{ fontSize: 'clamp(38px,7vw,64px)', lineHeight: 1, margin: '10px 0' }}>Find the right buyers. Earn the next conversation.</h1><p style={{ color: '#AEBAD0', maxWidth: '800px', lineHeight: 1.6 }}>Scout learns the company, builds the ICP, researches organizations, scores prospects, creates outreach sequences, and can hand approved business contacts to Instantly without mixing customer data with another tenant.</p></div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><Link href={`/workspace/${data.tenant.slug}`} style={secondary}>Workspace</Link><Link href="/customer/assistant" style={secondary}>Ask Eva</Link><button onClick={exportCsv} style={secondary}>Export CSV</button></div>
        </header>

        {notice && <div style={{ marginBottom: '16px', background: '#17233A', border: '1px solid #334766', color: '#DDE7F7', padding: '12px 14px', borderRadius: '12px' }}>{notice}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '11px', marginBottom: '16px' }}>
          {[[String(data.leads.length),'Researched prospects'],[String(topLeads),'A-grade prospects'],[String(readyLeads.length),'Contacts ready'],[String(data.campaigns.length),'Draft sequences']].map(([value,label]) => <div key={label} style={panel}><div style={{ fontSize: '34px', fontWeight: 950, color: '#9EF0CF' }}>{value}</div><div style={{ color: '#9DABC3', marginTop: '3px' }}>{label}</div></div>)}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '14px' }}>
          <form style={panel} onSubmit={(event) => { event.preventDefault(); runAgent('learn', learn); }}>
            <div style={eyebrow}>1 · LEARN MY BUSINESS</div><h2 style={{ margin: '8px 0 6px' }}>Give Scout the company world.</h2><p style={muted}>A website is enough to start. Add the offer and goal when you want Scout to sharpen the target.</p>
            <div style={{ display: 'grid', gap: '10px' }}><input style={input} placeholder="Company website" value={learn.website} onChange={(e)=>setLearn({...learn,website:e.target.value})}/><textarea style={{...input,resize:'vertical'}} rows={4} placeholder="What do you sell? What should Scout understand that the website may not say?" value={learn.offer} onChange={(e)=>setLearn({...learn,offer:e.target.value})}/><input style={input} placeholder="Sales goal, e.g. book demos with regional manufacturers" value={learn.goal} onChange={(e)=>setLearn({...learn,goal:e.target.value})}/><input style={input} placeholder="Geography" value={learn.geography} onChange={(e)=>setLearn({...learn,geography:e.target.value})}/><textarea style={{...input,resize:'vertical'}} rows={2} placeholder="Who should Scout exclude?" value={learn.exclusions} onChange={(e)=>setLearn({...learn,exclusions:e.target.value})}/></div>
            <button disabled={Boolean(busy)} style={{...button,marginTop:'12px'}}>{busy === 'learn' ? 'Scout is learning…' : data.profile ? 'Refresh Sales Profile' : 'Learn My Business'}</button>
          </form>

          <form style={panel} onSubmit={(event) => { event.preventDefault(); runAgent('find_prospects', prospect); }}>
            <div style={eyebrow}>2 · FIND BUYERS</div><h2 style={{ margin: '8px 0 6px' }}>Research organizations worth pursuing.</h2><p style={muted}>Scout uses current public research and does not invent personal names or email addresses. Add a verified business contact when you have one.</p>
            {data.profile ? <div style={{ background:'#0C1424',border:'1px solid #273654',borderRadius:'12px',padding:'13px',marginBottom:'12px' }}><strong>ICP:</strong><div style={{color:'#B8C4D8',lineHeight:1.5,marginTop:'5px'}}>{data.profile.ideal_customer_profile || 'Profile ready.'}</div></div> : <div style={{...muted,marginBottom:'12px'}}>Run step 1 first.</div>}
            <div style={{ display:'grid',gridTemplateColumns:'100px 1fr',gap:'10px' }}><input type="number" min={3} max={20} style={input} value={prospect.count} onChange={(e)=>setProspect({...prospect,count:Number(e.target.value)})}/><input style={input} placeholder="Optional focus: industry, region, trigger, buyer type…" value={prospect.focus} onChange={(e)=>setProspect({...prospect,focus:e.target.value})}/></div>
            <button disabled={Boolean(busy) || !data.profile} style={{...button,marginTop:'12px',opacity:data.profile?1:.5}}>{busy === 'find_prospects' ? 'Scout is researching…' : 'Find High-Fit Prospects'}</button>
          </form>
        </section>

        {data.profile && <section style={{...panel,marginTop:'14px'}}><div style={eyebrow}>SCOUT'S SALES MEMORY</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'12px',marginTop:'12px'}}><Memory title="Offer" text={data.profile.offer_summary}/><Memory title="Buyer roles" text={(data.profile.buyer_roles||[]).join(' · ')}/><Memory title="Buying triggers" text={(data.profile.trigger_events||[]).join(' · ')}/><Memory title="Messaging angles" text={(data.profile.messaging_angles||[]).join(' · ')}/></div></section>}

        <section style={{...panel,marginTop:'14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:'12px',alignItems:'center',flexWrap:'wrap'}}><div><div style={eyebrow}>3 · PROSPECT RADAR</div><h2 style={{margin:'7px 0'}}>Ranked companies and organizations</h2></div><div style={{color:'#9DABC3',fontSize:'13px'}}>{selected.length} selected</div></div>
          {data.leads.length === 0 ? <p style={muted}>No prospects yet. Use Find High-Fit Prospects above.</p> : <div style={{display:'grid',gap:'10px'}}>{data.leads.slice(0,100).map((lead)=><article key={lead.id} style={{background:'#0C1424',border:'1px solid #273654',borderRadius:'14px',padding:'14px',display:'grid',gridTemplateColumns:'34px 70px minmax(190px,1fr) minmax(220px,1.2fr)',gap:'10px',alignItems:'start'}} className="lead-row"><input type="checkbox" checked={selected.includes(lead.id)} onChange={(e)=>setSelected(e.target.checked?[...selected,lead.id]:selected.filter((id)=>id!==lead.id))}/><div style={{fontSize:'24px',fontWeight:950,color:(lead.fit_score||0)>=80?'#9EF0CF':'#D9E6FF'}}>{lead.fit_score||0}</div><div><strong>{lead.company_name}</strong><div style={{color:'#8293B2',fontSize:'12px',marginTop:'3px'}}>{lead.location || lead.recommended_buyer_role || 'Research prospect'}</div>{lead.website && <a href={lead.website} target="_blank" rel="noreferrer" style={{color:'#9EC7FF',fontSize:'12px'}}>Website ↗</a>}</div><div><div style={{color:'#B8C4D8',fontSize:'13px',lineHeight:1.45}}>{lead.fit_reason || lead.trigger_event || 'High-fit research candidate.'}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px',marginTop:'8px'}}><input style={{...input,padding:'8px'}} placeholder="Contact name" defaultValue={lead.contact_name || ''} onBlur={(e)=>saveLead(lead.id,{contact_name:e.target.value})}/><input style={{...input,padding:'8px'}} placeholder="Business email" defaultValue={lead.contact_email || ''} onBlur={(e)=>saveLead(lead.id,{contact_email:e.target.value})}/></div></div></article>)}</div>}
        </section>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:'14px',marginTop:'14px'}}>
          <div style={panel}><div style={eyebrow}>4 · BUILD THE SEQUENCE</div><h2 style={{margin:'8px 0'}}>Turn research into relevant outreach.</h2><textarea rows={4} style={{...input,resize:'vertical'}} value={objective} onChange={(e)=>setObjective(e.target.value)}/><button disabled={Boolean(busy)||!selected.length} onClick={()=>runAgent('build_sequence',{leadIds:selected,objective})} style={{...button,marginTop:'12px',opacity:selected.length?1:.5}}>{busy==='build_sequence'?'Scout is writing…':'Build Outreach Sequence'}</button>{latestCampaign && <div style={{marginTop:'14px',display:'grid',gap:'9px'}}><strong>{latestCampaign.name}</strong><div style={{color:'#9DABC3',fontSize:'13px'}}>{latestCampaign.audience_summary}</div>{(latestCampaign.sequence||[]).map((step,index)=><div key={index} style={{background:'#0C1424',border:'1px solid #273654',borderRadius:'12px',padding:'12px'}}><div style={{color:'#9EF0CF',fontSize:'12px',fontWeight:900}}>STEP {step.step || index+1} · {step.delay_days || 0} DAY DELAY</div><strong style={{display:'block',margin:'5px 0'}}>{step.subject}</strong><div style={{whiteSpace:'pre-wrap',color:'#C4CFE0',lineHeight:1.5,fontSize:'13px'}}>{step.body}</div></div>)}</div>}</div>

          <div style={panel}><div style={eyebrow}>5 · OPTIONAL DELIVERY ENGINE</div><h2 style={{margin:'8px 0'}}>Connect Instantly when volume matters.</h2>{!instantly.connected ? <form onSubmit={connectInstantly}><p style={muted}>Use an Instantly API v2 key with the minimum scopes you need. The key is encrypted before storage and is never displayed again.</p><input type="password" autoComplete="off" style={input} placeholder="Instantly API v2 key" value={instantlyKey} onChange={(e)=>setInstantlyKey(e.target.value)}/><button disabled={Boolean(busy)} style={{...button,marginTop:'10px'}}>{busy==='instantly-connect'?'Testing connection…':'Connect Instantly'}</button></form> : <><div style={{background:'#0C1424',border:'1px solid #273654',borderRadius:'12px',padding:'12px',marginBottom:'10px'}}><strong style={{color:'#9EF0CF'}}>● Instantly connected</strong><div style={{color:'#9DABC3',fontSize:'12px',marginTop:'4px'}}>{instantly.campaigns.length} campaign(s) visible through the API.</div></div><select style={input} value={instantlyCampaign} onChange={(e)=>setInstantlyCampaign(e.target.value)}><option value="">Choose campaign</option>{instantly.campaigns.map((campaign)=><option key={campaign.id} value={campaign.id}>{campaign.name} · status {campaign.status}</option>)}</select><label style={{display:'flex',gap:'9px',alignItems:'flex-start',marginTop:'12px',color:'#BEC9DB',fontSize:'13px',lineHeight:1.45}}><input type="checkbox" checked={approved} onChange={(e)=>setApproved(e.target.checked)}/><span>I approve adding the selected verified business contacts to this Instantly campaign. I understand an active campaign may begin outreach according to its own settings.</span></label><button disabled={Boolean(busy)||!selected.length||!instantlyCampaign||!approved} onClick={pushToInstantly} style={{...button,marginTop:'10px',opacity:selected.length&&instantlyCampaign&&approved?1:.5}}>{busy==='instantly-push'?'Adding approved contacts…':'Approve & Add to Instantly'}</button>{instantly.analytics && <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'8px',marginTop:'12px'}}>{[['Sent',instantly.analytics.emails_sent_count],['Replies',instantly.analytics.reply_count],['Meetings',instantly.analytics.total_meeting_booked],['Opportunities',instantly.analytics.total_opportunities]].map(([label,value])=><div key={String(label)} style={{background:'#0C1424',border:'1px solid #273654',borderRadius:'10px',padding:'10px'}}><strong>{String(value ?? 0)}</strong><div style={{color:'#8293B2',fontSize:'11px'}}>{label}</div></div>)}</div>}</>}</div>
        </section>

        <section style={{...panel,marginTop:'14px'}}><div style={eyebrow}>ACTIVITY FEED</div><div style={{display:'grid',gap:'7px',marginTop:'10px'}}>{data.events.length===0?<p style={muted}>Scout activity will appear here.</p>:data.events.slice(0,15).map((event)=><div key={event.id} style={{display:'flex',justifyContent:'space-between',gap:'12px',borderTop:'1px solid #24314B',padding:'9px 0',color:'#C3CDDD'}}><span>{event.event_name.replace(/_/g,' ')}</span><span style={{color:'#7F8DA7',fontSize:'12px'}}>{new Date(event.created_at).toLocaleString()}</span></div>)}</div></section>
      </div>
      <style>{`@media(max-width:760px){.lead-row{grid-template-columns:28px 55px 1fr !important}.lead-row>div:last-child{grid-column:1/-1}.lead-row input{min-width:0}}`}</style>
    </main>
  );
}

function Memory({title,text}:{title:string;text?:string|null}) { return <div style={{background:'#0C1424',border:'1px solid #273654',borderRadius:'12px',padding:'13px'}}><div style={{fontSize:'12px',fontWeight:950,color:'#9EF0CF'}}>{title.toUpperCase()}</div><div style={{color:'#C3CDDD',lineHeight:1.5,marginTop:'5px',fontSize:'13px'}}>{text || 'Not enough evidence yet.'}</div></div>; }
const eyebrow: React.CSSProperties = { color:'#9EF0CF',fontSize:'12px',fontWeight:950,letterSpacing:'1px' };
const muted: React.CSSProperties = { color:'#9DABC3',lineHeight:1.55,fontSize:'13px' };
