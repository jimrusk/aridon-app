'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ShareLevel = 'private' | 'match-only' | 'community';
type Entry = { id: string; title: string; body: string; tags: string[]; level: ShareLevel; createdAt: string };

const starter: Entry[] = [
  { id: 'demo-1', title: 'Need: lower-cost livestock water resilience', body: 'Looking for practical water-security approaches that can work in remote agricultural settings with limited grid capacity.', tags: ['water','ranching','microgrid'], level: 'community', createdAt: 'Demo' },
  { id: 'demo-2', title: 'Capability: modular solar + battery integration', body: 'Can support remote loads with modular solar, battery storage and controls for resilient infrastructure.', tags: ['energy','microgrid','infrastructure'], level: 'community', createdAt: 'Demo' },
];

export default function ExchangePage(){
  const [entries,setEntries]=useState<Entry[]>(starter);
  const [title,setTitle]=useState('');
  const [body,setBody]=useState('');
  const [tags,setTags]=useState('');
  const [level,setLevel]=useState<ShareLevel>('private');
  const [allowIntro,setAllowIntro]=useState(false);

  useEffect(()=>{try{const raw=localStorage.getItem('aridon-exchange-entries'); if(raw) setEntries([...starter,...JSON.parse(raw)]); const intro=localStorage.getItem('aridon-exchange-intros'); if(intro==='true') setAllowIntro(true);}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem('aridon-exchange-intros',String(allowIntro));}catch{}},[allowIntro]);

  const matches=useMemo(()=>{
    const visible=entries.filter(e=>e.level!=='private');
    const scored: Array<{a:Entry;b:Entry;score:number;shared:string[]}>=[];
    for(let i=0;i<visible.length;i++) for(let j=i+1;j<visible.length;j++){
      const shared=visible[i].tags.filter(t=>visible[j].tags.includes(t));
      if(shared.length) scored.push({a:visible[i],b:visible[j],score:shared.length,shared});
    }
    return scored.sort((x,y)=>y.score-x.score).slice(0,8);
  },[entries]);

  function addEntry(){
    if(title.trim().length<4 || body.trim().length<10) return;
    const entry:Entry={id:crypto.randomUUID(),title:title.trim(),body:body.trim(),tags:tags.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),level,createdAt:new Date().toLocaleString()};
    const userEntries=[...entries.filter(e=>!e.id.startsWith('demo-')),entry];
    setEntries([...starter,...userEntries]);
    try{localStorage.setItem('aridon-exchange-entries',JSON.stringify(userEntries));}catch{}
    setTitle(''); setBody(''); setTags(''); setLevel('private');
  }

  return <main style={page}><div style={shell}>
    <header style={header}><div><div style={eyebrow}>ARIDON KNOWLEDGE EXCHANGE</div><h1 style={h1}>Connect ideas without giving away the vault.</h1><p style={lead}>Share nothing by default. When you choose to contribute, Aridon can look for complementary problems, capabilities and opportunities. A match can be suggested without exposing private details, and introductions stay opt-in.</p></div><div style={headerActions}><Link href="/boardroom" style={secondary}>Boardroom</Link><Link href="/" style={secondary}>Home</Link></div></header>

    <section style={grid}>
      <article style={panel}><div style={label}>ADD A SIGNAL</div><h2>What do you know, need, offer or want to solve?</h2>
        <input style={input} placeholder="Short title" value={title} onChange={e=>setTitle(e.target.value)}/>
        <textarea style={textarea} rows={6} placeholder="Describe the problem, idea, capability or opportunity. Do not include trade secrets, passwords, private financial data or anything you are not authorized to share." value={body} onChange={e=>setBody(e.target.value)}/>
        <input style={input} placeholder="Tags, comma separated: water, farming, logistics, funding" value={tags} onChange={e=>setTags(e.target.value)}/>
        <div style={{display:'grid',gap:8,marginTop:12}}>
          <Choice active={level==='private'} onClick={()=>setLevel('private')} title="Private" text="Stored only for you. Not used for community matching."/>
          <Choice active={level==='match-only'} onClick={()=>setLevel('match-only')} title="Match only" text="Aridon may use the signal to find a fit, but the full content stays hidden until you approve an introduction."/>
          <Choice active={level==='community'} onClick={()=>setLevel('community')} title="Community" text="Visible inside the Exchange to participating members."/>
        </div>
        <button style={primary} onClick={addEntry}>Save Signal</button>
      </article>

      <aside style={panel}><div style={label}>CONSENT CENTER</div><h2>Your information, your switch.</h2><p style={muted}>The default is private. Sharing must be an affirmative choice for each signal.</p>
        <label style={toggleRow}><input type="checkbox" checked={allowIntro} onChange={e=>setAllowIntro(e.target.checked)}/><span><strong>Allow introduction requests</strong><small style={small}>Aridon may tell you a compatible participant exists and ask whether you want to connect. Contact details are not released automatically.</small></span></label>
        <div style={guardrail}><strong>Never auto-share:</strong><br/>Passwords, API keys, banking data, personal health information, legal-confidential material, customer data without permission, or trade secrets marked private.</div>
      </aside>
    </section>

    <section style={{marginTop:18}}><div style={sectionHead}><div><div style={label}>YOUR SIGNALS</div><h2 style={{margin:'7px 0'}}>Private by default. Share deliberately.</h2></div><span style={badge}>{entries.filter(e=>!e.id.startsWith('demo-')).length} saved</span></div>
      <div style={cards}>{entries.map(e=><article key={e.id} style={panel}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong>{e.title}</strong><span style={levelBadge(e.level)}>{e.level}</span></div><p style={muted}>{e.body}</p><div style={tagRow}>{e.tags.map(t=><span key={t} style={tag}>#{t}</span>)}</div><small style={small}>{e.createdAt}</small></article>)}</div>
    </section>

    <section style={{marginTop:18}}><div style={label}>MATCH ENGINE</div><h2>Connections Aridon can see.</h2><p style={muted}>This MVP only matches signals explicitly set to Match only or Community. Private entries are excluded.</p>
      {matches.length===0?<div style={empty}>No opt-in matches yet. Add two shareable signals with overlapping tags to light up the network.</div>:<div style={cards}>{matches.map((m,i)=><article key={i} style={matchCard}><div style={label}>POSSIBLE FIT · {m.shared.join(' + ')}</div><h3>{m.a.title}</h3><div style={arrow}>↕</div><h3>{m.b.title}</h3><p style={muted}>Aridon found shared context without changing either participant's sharing level.</p><button style={{...primary,marginTop:8,opacity:allowIntro?1:.45}} disabled={!allowIntro}>{allowIntro?'Request Mutual Introduction':'Enable introductions first'}</button></article>)}</div>}
    </section>
  </div></main>
}

function Choice({active,onClick,title,text}:{active:boolean;onClick:()=>void;title:string;text:string}){return <button onClick={onClick} style={{...choice,borderColor:active?'#9EF0CF':'#31415E',background:active?'#10271F':'#08111F'}}><strong>{active?'✓ ':''}{title}</strong><small style={small}>{text}</small></button>}
const page={minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif',padding:'30px 18px 90px'} as const;
const shell={maxWidth:1180,margin:'0 auto'} as const;
const header={display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:24,flexWrap:'wrap'} as const;
const headerActions={display:'flex',gap:9,flexWrap:'wrap'} as const;
const eyebrow={color:'#9EF0CF',fontWeight:950,fontSize:12,letterSpacing:1.1} as const;
const h1={fontSize:'clamp(44px,7vw,76px)',lineHeight:.95,margin:'10px 0 18px',letterSpacing:-2} as const;
const lead={maxWidth:820,color:'#BDC7D8',fontSize:18,lineHeight:1.65} as const;
const grid={display:'grid',gridTemplateColumns:'minmax(0,1.45fr) minmax(280px,.7fr)',gap:14,marginTop:24} as const;
const cards={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:12} as const;
const panel={background:'#0D1728',border:'1px solid #263754',borderRadius:18,padding:20} as const;
const matchCard={...panel,borderColor:'#2E6959',background:'#0E201C'} as const;
const label={color:'#9EF0CF',fontWeight:950,fontSize:11,letterSpacing:.9} as const;
const muted={color:'#AEB9CB',lineHeight:1.6} as const;
const small={display:'block',color:'#91A0B5',lineHeight:1.5,marginTop:4} as const;
const input={width:'100%',boxSizing:'border-box',background:'#08111F',border:'1px solid #31415E',borderRadius:12,color:'#F8FAFC',padding:13,font:'inherit',marginTop:10} as const;
const textarea={...input,resize:'vertical'} as const;
const choice={width:'100%',textAlign:'left',border:'1px solid',borderRadius:12,color:'#F8FAFC',padding:'12px 13px',cursor:'pointer',display:'grid',gap:3} as const;
const primary={border:0,background:'#9EF0CF',color:'#07130F',borderRadius:11,padding:'13px 16px',fontWeight:950,cursor:'pointer',width:'100%',marginTop:14} as const;
const secondary={border:'1px solid #3A4A67',color:'#EDF1F7',borderRadius:10,padding:'10px 13px',textDecoration:'none',fontWeight:850} as const;
const toggleRow={display:'flex',gap:10,alignItems:'flex-start',background:'#08111F',border:'1px solid #31415E',borderRadius:12,padding:13,marginTop:14} as const;
const guardrail={background:'#211915',border:'1px solid #65442E',color:'#E9C8AF',borderRadius:12,padding:13,lineHeight:1.55,marginTop:14} as const;
const sectionHead={display:'flex',justifyContent:'space-between',alignItems:'end',gap:10,flexWrap:'wrap'} as const;
const badge={background:'#132B26',border:'1px solid #2E6959',color:'#9EF0CF',borderRadius:999,padding:'7px 10px',fontWeight:850,fontSize:12} as const;
const tagRow={display:'flex',gap:6,flexWrap:'wrap',margin:'10px 0'} as const;
const tag={background:'#142239',color:'#BFD0EA',borderRadius:999,padding:'5px 8px',fontSize:11,fontWeight:800} as const;
const arrow={color:'#9EF0CF',fontSize:24,fontWeight:900} as const;
const empty={border:'1px dashed #30415F',borderRadius:16,padding:24,color:'#AEB9CB'} as const;
function levelBadge(level:ShareLevel){return {background:level==='private'?'#211F2D':level==='match-only'?'#10271F':'#142239',color:level==='private'?'#D4CAE8':level==='match-only'?'#9EF0CF':'#BDD2F2',borderRadius:999,padding:'5px 8px',fontSize:11,fontWeight:900,textTransform:'uppercase'} as const}
