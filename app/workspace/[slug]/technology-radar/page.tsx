'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Item = { id: string; category: string; name: string; summary: string; recommendation: 'use'|'integrate'|'beat'|'watch'|'ignore'; impact_score: number; confidence: number; rationale: string; source_urls: string[]; scanned_at: string };
type Payload = { businessName: string; items: Item[] };

const labels: Record<string,string> = { use: 'USE IT', integrate: 'INTEGRATE IT', beat: 'BEAT IT', watch: 'WATCH IT', ignore: 'IGNORE IT' };

export default function TechnologyRadarPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [data, setData] = useState<Payload | null>(null);
  const [focus, setFocus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load(access: string) {
    const response = await fetch(`/api/customer/technology-radar?slug=${encodeURIComponent(params.slug)}`, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to load radar.');
    setData(payload);
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data: sessionData }) => {
      const access = sessionData.session?.access_token || '';
      if (!access) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/technology-radar`)}`); return; }
      setToken(access);
      try { await load(access); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load radar.'); }
    });
  }, [params.slug, router]);

  const grouped = useMemo(() => {
    const result: Record<string,Item[]> = { use: [], integrate: [], beat: [], watch: [], ignore: [] };
    for (const item of data?.items || []) (result[item.recommendation] ||= []).push(item);
    return result;
  }, [data]);

  async function scan() {
    if (!token || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/customer/technology-radar', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: params.slug, focus: focus.trim() }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Radar scan failed.');
      await load(token);
    } catch (err) { setError(err instanceof Error ? err.message : 'Radar scan failed.'); }
    finally { setBusy(false); }
  }

  return <main style={page}><div style={shell}>
    <header style={header}>
      <div><div style={eyebrow}>ATLAS · TECHNOLOGY RADAR</div><h1 style={h1}>See the next advantage before it becomes obvious.</h1><p style={lead}>Atlas continuously evaluates emerging AI, models, agents, automation, creative systems, infrastructure, security, business software, standards and physical AI. Every signal gets one decision: Use it, Integrate it, Beat it, Watch it, or Ignore it.</p></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href={`/workspace/${params.slug}/mission-control`} style={outlineButton}>Mission Control</Link><Link href={`/workspace/${params.slug}/executive-suite`} style={mintButton}>Executive Suite</Link></div>
    </header>

    <section style={scanPanel}><div><div style={sectionLabel}>LIVE SCAN</div><h2 style={h2}>Ask Atlas what changed</h2><p style={muted}>Leave focus blank for a broad technology sweep, or point Atlas at something like “AI video,” “agent infrastructure,” “voice,” “cybersecurity,” or “tools that could replace part of Aridon.”</p></div><div><input value={focus} onChange={(e)=>setFocus(e.target.value)} placeholder="Optional scan focus" style={input}/><button onClick={()=>void scan()} disabled={busy||!token} style={primaryButton}>{busy?'Atlas is scanning…':'Run Technology Radar'}</button></div></section>

    {error && <div style={errorBox}>{error}</div>}

    <section style={decisionGrid}>{(['use','integrate','beat','watch','ignore'] as const).map(decision => <article key={decision} style={column}><div style={decisionHead}><span>{labels[decision]}</span><strong>{grouped[decision]?.length || 0}</strong></div><div style={{display:'grid',gap:10}}>{(grouped[decision]||[]).slice(0,12).map(item => <div key={item.id} style={card}><div style={cardTop}><strong>{item.name}</strong><span>{item.impact_score}/100</span></div><div style={category}>{item.category}</div><p>{item.summary}</p><p style={rationale}>{item.rationale}</p><div style={cardFoot}><span>{Math.round(item.confidence*100)}% confidence</span><span>{new Date(item.scanned_at).toLocaleDateString()}</span></div>{item.source_urls?.length ? <div style={sources}>{item.source_urls.slice(0,3).map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer">Source {i+1}</a>)}</div>:null}</div>)}</div></article>)}</section>
  </div></main>;
}

const page={minHeight:'100vh',background:'#07101D',color:'#F7FAFC',fontFamily:'Arial, sans-serif',padding:'28px 20px 72px'};
const shell={maxWidth:1300,margin:'0 auto'};
const header={display:'flex',justifyContent:'space-between',gap:20,alignItems:'start',flexWrap:'wrap' as const,marginBottom:24};
const eyebrow={color:'#9EF0CF',fontSize:12,fontWeight:950,letterSpacing:1};
const h1={fontSize:'clamp(42px,6vw,72px)',lineHeight:.96,letterSpacing:-3,margin:'10px 0 14px',maxWidth:900};
const h2={fontSize:28,margin:'8px 0 10px'};
const lead={color:'#B9C5D6',fontSize:18,lineHeight:1.6,maxWidth:900,margin:0};
const scanPanel={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16,background:'#F6F3EB',color:'#171717',borderRadius:18,padding:20,marginBottom:14};
const sectionLabel={fontSize:11,fontWeight:950,letterSpacing:1};
const muted={color:'#69635B',lineHeight:1.6};
const input={width:'100%',boxSizing:'border-box' as const,border:'1px solid #C9C1B4',borderRadius:11,padding:12,font:'inherit'};
const primaryButton={marginTop:9,background:'#171717',color:'#fff',border:0,borderRadius:11,padding:'13px 17px',fontWeight:950,cursor:'pointer'};
const decisionGrid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:10,alignItems:'start'};
const column={background:'#101B2B',border:'1px solid #26364D',borderRadius:16,padding:12};
const decisionHead={display:'flex',justifyContent:'space-between',gap:10,color:'#9EF0CF',fontSize:12,fontWeight:950,marginBottom:10};
const card={background:'#F6F3EB',color:'#171717',borderRadius:12,padding:13};
const cardTop={display:'flex',justifyContent:'space-between',gap:10};
const category={fontSize:11,fontWeight:900,color:'#52605C',marginTop:5,textTransform:'uppercase' as const};
const rationale={fontSize:13,color:'#5F5952',lineHeight:1.55};
const cardFoot={display:'flex',justifyContent:'space-between',gap:8,fontSize:10,color:'#756E65'};
const sources={display:'flex',gap:8,flexWrap:'wrap' as const,marginTop:8,fontSize:11};
const errorBox={background:'#FCE5EA',color:'#7B233A',borderRadius:10,padding:12,marginBottom:12};
const mintButton={background:'#9EF0CF',color:'#07130F',padding:'12px 16px',borderRadius:11,textDecoration:'none',fontWeight:950};
const outlineButton={border:'1px solid #52627A',color:'#F7FAFC',padding:'11px 15px',borderRadius:11,textDecoration:'none',fontWeight:900};
