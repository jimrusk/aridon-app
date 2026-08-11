'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Connector = { connector_key: string; label: string; category: string; status: string; capabilities: string[]; last_sync_at?: string | null };
type Outcome = { id: string; category: string; name: string; baseline_value?: number | null; current_value?: number | null; target_value?: number | null; unit?: string | null; status: string; updated_at?: string | null };

export default function SystemsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: 'Monthly revenue', category: 'revenue', baselineValue: '', currentValue: '', targetValue: '', unit: '$/month' });

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const access = data.session?.access_token || '';
      if (!access) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/systems`)}`); return; }
      setToken(access);
      await load(access);
    });
  }, [params.slug, router]);

  async function load(access = token) {
    const headers = { Authorization: `Bearer ${access}` };
    const [c, o] = await Promise.all([
      fetch(`/api/customer/connectors?slug=${encodeURIComponent(params.slug)}`, { headers, cache: 'no-store' }),
      fetch(`/api/customer/outcomes?slug=${encodeURIComponent(params.slug)}`, { headers, cache: 'no-store' }),
    ]);
    const cd = await c.json().catch(() => ({})); const od = await o.json().catch(() => ({}));
    if (!c.ok || !o.ok) { setError(cd.error || od.error || 'Unable to load systems.'); return; }
    setConnectors(cd.connectors || []); setOutcomes(od.outcomes || []);
  }

  async function setConnector(item: Connector, status: string) {
    const response = await fetch('/api/customer/connectors', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: params.slug, connectorKey: item.connector_key, status }) });
    const data = await response.json().catch(() => ({})); if (!response.ok) { setError(data.error || 'Unable to update connector.'); return; } await load();
  }

  async function addOutcome() {
    const response = await fetch('/api/customer/outcomes', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: params.slug, ...form }) });
    const data = await response.json().catch(() => ({})); if (!response.ok) { setError(data.error || 'Unable to save outcome.'); return; } setForm({ ...form, currentValue: '' }); await load();
  }

  return <main style={page}><div style={shell}>
    <header style={header}><div><div style={eyebrow}>ARIDON · SYSTEM FABRIC</div><h1 style={h1}>Connect. Execute. Measure.</h1><p style={lead}>One control surface for the systems Aridon can reach and the outcomes that prove whether the executive team is creating value.</p></div><div style={{ display:'flex',gap:8,flexWrap:'wrap' }}><Link href={`/workspace/${params.slug}/mission-control`} style={outline}>Mission Control</Link><Link href={`/workspace/${params.slug}/benchmark`} style={mint}>Benchmark Lab</Link></div></header>
    {error && <div style={errorBox}>{error}</div>}
    <section style={grid}><article style={panel}><div style={label}>CONNECTOR FABRIC</div><h2>Business systems</h2>{connectors.map((c) => <div key={c.connector_key} style={row}><div><strong>{c.label}</strong><div style={muted}>{c.category} · {c.capabilities.join(' · ')}</div></div><div style={{ display:'flex',gap:6,alignItems:'center' }}><span style={{ ...pill, background:c.status==='connected'?'#DDF7EA':'#EEE8DE' }}>{c.status}</span><button style={smallButton} onClick={() => void setConnector(c, c.status==='connected'?'available':'connected')}>{c.status==='connected'?'Disconnect':'Mark connected'}</button></div></div>)}</article>
    <article style={panel}><div style={label}>OUTCOME ATTRIBUTION</div><h2>Track what changed</h2><div style={{ display:'grid',gap:8 }}>{['name','category','baselineValue','currentValue','targetValue','unit'].map((key) => <input key={key} value={(form as any)[key]} placeholder={key} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={input} />)}</div><button onClick={() => void addOutcome()} style={primary}>Add measurable outcome</button></article></section>
    <section style={{ ...panel, marginTop:14 }}><div style={label}>OUTCOME LEDGER</div>{outcomes.length===0?<p style={muted}>No outcomes tracked yet.</p>:<div style={{ display:'grid',gap:8 }}>{outcomes.map((o) => <div key={o.id} style={row}><div><strong>{o.name}</strong><div style={muted}>{o.category} · {o.status}</div></div><div style={{ textAlign:'right' }}><strong>{o.current_value ?? '—'} {o.unit || ''}</strong><div style={muted}>baseline {o.baseline_value ?? '—'} → target {o.target_value ?? '—'}</div></div></div>)}</div>}</section>
  </div></main>;
}

const page={minHeight:'100vh',background:'#07101D',color:'#F7FAFC',fontFamily:'Arial, sans-serif',padding:'28px 20px 72px'};
const shell={maxWidth:1180,margin:'0 auto'}; const header={display:'flex',justifyContent:'space-between',gap:20,alignItems:'start',flexWrap:'wrap' as const,marginBottom:24};
const eyebrow={color:'#9EF0CF',fontSize:12,fontWeight:950,letterSpacing:1}; const h1={fontSize:'clamp(44px,7vw,76px)',lineHeight:.96,letterSpacing:-3,margin:'10px 0 14px'}; const lead={color:'#B9C5D6',fontSize:18,lineHeight:1.6,maxWidth:820};
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:14}; const panel={background:'#F6F3EB',color:'#171717',borderRadius:18,padding:20,border:'1px solid #D7D0C3'}; const label={fontSize:11,fontWeight:950,letterSpacing:1};
const row={display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',padding:'12px 0',borderTop:'1px solid #DED7CB',flexWrap:'wrap' as const}; const muted={color:'#6A655D',fontSize:12,lineHeight:1.5}; const pill={padding:'5px 8px',borderRadius:999,fontSize:10,fontWeight:950};
const smallButton={border:'1px solid #BFB7AA',background:'#fff',borderRadius:8,padding:'7px 9px',fontWeight:850,cursor:'pointer'}; const input={border:'1px solid #C9C1B4',borderRadius:9,padding:11,font:'inherit'}; const primary={marginTop:12,background:'#171717',color:'#fff',border:0,borderRadius:10,padding:'12px 15px',fontWeight:950,cursor:'pointer'};
const mint={background:'#9EF0CF',color:'#07130F',padding:'12px 16px',borderRadius:11,textDecoration:'none',fontWeight:950}; const outline={border:'1px solid #52627A',color:'#F7FAFC',padding:'11px 15px',borderRadius:11,textDecoration:'none',fontWeight:900}; const errorBox={background:'#FCE5EA',color:'#7B233A',borderRadius:10,padding:12,marginBottom:14};
