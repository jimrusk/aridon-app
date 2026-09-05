'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../lib/supabase';

type Move = {
  id:string; slug:string; priority:'HIGH'|'MEDIUM'|'WATCH'; lane:string; company:string; person?:string|null; title?:string|null; email?:string|null; phone?:string|null; location?:string|null; status:string; reason:string; recommended_next_step:string; fit_score:number; value_text?:string|null; due_text?:string|null; action_state:'open'|'approved'|'watching'|'skipped'|'completed'; relationship_strength:number; reply_status:'unknown'|'awaiting'|'replied'|'bounced'|'closed'; external_thread_id?:string|null; last_outbound_at?:string|null; last_inbound_at?:string|null; updated_at?:string|null;
};
type EventRow={id:string;action_id:string;event_type:string;event_note?:string|null;source_type:string;source_ref?:string|null;created_at:string};

const colors={HIGH:'#FF6B6B',MEDIUM:'#F7C948',WATCH:'#8AA4C8'} as const;

export default function NextActionsPage(){
  const router=useRouter();
  const [token,setToken]=useState('');
  const [moves,setMoves]=useState<Move[]>([]);
  const [events,setEvents]=useState<EventRow[]>([]);
  const [lane,setLane]=useState('All');
  const [selectedId,setSelectedId]=useState<string>('');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');

  const api=useCallback(async(path:string,options:RequestInit={})=>{
    const headers=new Headers(options.headers||{}); headers.set('Authorization',`Bearer ${token}`);
    return fetch(path,{...options,headers,cache:'no-store'});
  },[token]);

  const load=useCallback(async(accessToken:string)=>{
    const response=await fetch('/api/next-actions',{headers:{Authorization:`Bearer ${accessToken}`},cache:'no-store'});
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error||'Next Moves could not be loaded.');
    setMoves(result.actions||[]); setEvents(result.events||[]);
    setSelectedId((current)=>current||(result.actions?.[0]?.id||''));
  },[]);

  useEffect(()=>{
    const db=getBrowserClient();
    db.auth.getSession().then(async({data})=>{
      const accessToken=data.session?.access_token;
      if(!accessToken){router.replace('/customer/login?next=/next-actions');return;}
      setToken(accessToken);
      try{await load(accessToken);}catch(error){setMessage(error instanceof Error?error.message:'Next Moves could not be loaded.');}finally{setLoading(false);}
    });
  },[load,router]);

  const lanes=useMemo(()=>['All',...Array.from(new Set(moves.map(m=>m.lane)))],[moves]);
  const filtered=useMemo(()=>moves.filter(m=>lane==='All'||m.lane===lane).sort((a,b)=>b.fit_score-a.fit_score),[moves,lane]);
  const selected=moves.find(m=>m.id===selectedId)||filtered[0]||null;
  const active=filtered.filter(m=>!['skipped','completed'].includes(m.action_state)).length;
  const selectedEvents=selected?events.filter(e=>e.action_id===selected.id).slice(0,8):[];

  async function patch(m:Move,body:Record<string,unknown>){
    setBusy(m.id); setMessage('');
    try{
      const response=await api('/api/next-actions',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({actionId:m.id,...body})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(result.error||'Update failed.');
      setMoves(current=>current.map(x=>x.id===m.id?result.action:x));
      await load(token);
    }catch(error){setMessage(error instanceof Error?error.message:'Update failed.');}finally{setBusy('');}
  }

  async function syncOpportunities(){
    setBusy('sync'); setMessage('Pulling Opportunity Intelligence into the action queue…');
    try{
      const response=await api('/api/next-actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sync-opportunities'})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(result.error||'Sync failed.');
      await load(token); setMessage(`${result.synced||0} Opportunity Intelligence records synced into Next Moves.`);
    }catch(error){setMessage(error instanceof Error?error.message:'Sync failed.');}finally{setBusy('');}
  }

  if(loading)return <main style={loadingStyle}>Opening Eva's action queue…</main>;

  return <main style={{minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif',padding:'22px 18px 80px'}}>
    <div style={{maxWidth:1240,margin:'0 auto'}}>
      <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><Link href='/' style={{color:'#F8FAFC',fontWeight:950,textDecoration:'none'}}>ARIDON</Link><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href='/dashboard' style={nav}>Workspace</Link><Link href='/customer/opportunities' style={nav}>Opportunity Intelligence</Link><Link href='/next-actions' style={{...nav,borderColor:'#9EF0CF',color:'#9EF0CF'}}>Next Moves</Link></div></nav>

      <section style={{marginTop:42,display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:16,alignItems:'end'}}><div><div style={eyebrow}>EVA · EXECUTIVE ACTION ENGINE</div><h1 style={{fontSize:'clamp(44px,7vw,78px)',lineHeight:.92,letterSpacing:-3,margin:'10px 0 14px'}}>What should happen next?</h1><p style={{color:'#AEBBD0',fontSize:19,lineHeight:1.6,maxWidth:820}}>Now connected to Aridon's database. Approvals persist, relationship history is logged, verified outbound email threads are attached, and Opportunity Intelligence can feed this queue.</p></div><div style={{background:'#0D1728',border:'1px solid #273A59',borderRadius:16,padding:'16px 18px',minWidth:200}}><div style={eyebrow}>ACTIVE MOVES</div><div style={{fontSize:42,fontWeight:950,marginTop:4}}>{active}</div><div style={{color:'#8FA2BF',fontSize:12}}>{moves.filter(x=>x.reply_status==='replied').length} replied · {moves.filter(x=>x.reply_status==='awaiting').length} awaiting</div></div></section>

      {message&&<div style={{marginTop:14,background:'#121E31',border:'1px solid #334765',borderRadius:12,padding:12,color:'#D9E4F2'}}>{message}</div>}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:20}}>{lanes.map(x=><button key={x} onClick={()=>setLane(x)} style={{...chip,background:lane===x?'#9EF0CF':'#101B2D',color:lane===x?'#07130F':'#DCE4EF',borderColor:lane===x?'#9EF0CF':'#2A3A57'}}>{x}</button>)}<button onClick={syncOpportunities} disabled={busy==='sync'} style={{...chip,marginLeft:'auto',background:'#182740',color:'#9EF0CF'}}>{busy==='sync'?'Syncing…':'Sync Opportunity Intelligence'}</button></div>

      <section style={{display:'grid',gridTemplateColumns:'minmax(0,1.35fr) minmax(320px,.65fr)',gap:16,marginTop:18,alignItems:'start'}}>
        <div style={{display:'grid',gap:10}}>{filtered.map((m,i)=><article key={m.id} onClick={()=>setSelectedId(m.id)} style={{background:selected?.id===m.id?'#111F34':'#0C1626',border:`1px solid ${selected?.id===m.id?'#4A658A':'#24344F'}`,borderRadius:18,padding:18,cursor:'pointer',opacity:['skipped','completed'].includes(m.action_state)?0.55:1}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'start'}}><div style={{display:'flex',gap:10,alignItems:'center'}}><div style={{width:34,height:34,borderRadius:10,display:'grid',placeItems:'center',background:'#13243B',fontWeight:950}}>{i+1}</div><div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong style={{fontSize:21}}>{m.company}</strong><span style={{fontSize:11,fontWeight:950,color:colors[m.priority]}}>{m.priority}</span><span style={laneBadge}>{m.lane}</span><span style={{...laneBadge,color:replyColor(m.reply_status)}}>{m.reply_status}</span></div><div style={{color:'#8FA2BF',fontSize:13,marginTop:3}}>{m.status}</div></div></div><div style={{fontSize:28,fontWeight:950,color:'#9EF0CF'}}>{m.fit_score}</div></div>
          <div style={{marginTop:14,padding:'12px 14px',background:'#08111F',borderRadius:12}}><div style={{fontSize:11,fontWeight:950,color:'#9EF0CF',letterSpacing:1}}>NEXT</div><div style={{lineHeight:1.55,marginTop:4}}>{m.recommended_next_step}</div></div>
          <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginTop:12,flexWrap:'wrap'}}><div style={{color:'#8FA2BF',fontSize:12}}>Due: {m.due_text||'Not set'}{m.value_text?` · ${m.value_text}`:''} · {m.action_state}</div><div style={{display:'flex',gap:7}}><button disabled={busy===m.id} onClick={(e)=>{e.stopPropagation();patch(m,{actionState:'approved',eventType:'approved',eventNote:'Jim approved this recommended next move.'})}} style={smallBtn}>Approve</button><button disabled={busy===m.id} onClick={(e)=>{e.stopPropagation();patch(m,{actionState:'watching',eventType:'watching',eventNote:'Moved to watch list.'})}} style={ghostBtn}>Watch</button><button disabled={busy===m.id} onClick={(e)=>{e.stopPropagation();patch(m,{actionState:'skipped',eventType:'skipped',eventNote:'Skipped by owner.'})}} style={ghostBtn}>Skip</button></div></div>
        </article>)}</div>

        <aside style={{position:'sticky',top:18,background:'#F4F1E9',color:'#171717',borderRadius:20,padding:20}}>{selected?<><div style={{fontSize:11,fontWeight:950,letterSpacing:1}}>RELATIONSHIP CARD</div><h2 style={{fontSize:30,margin:'8px 0 4px'}}>{selected.company}</h2>{selected.person&&<div style={{fontWeight:850}}>{selected.person}</div>}{selected.title&&<div style={{color:'#67635C',marginTop:3}}>{selected.title}</div>}<div style={{display:'grid',gap:7,marginTop:16,fontSize:14}}>{selected.email&&<Row a='Email' b={selected.email}/>} {selected.phone&&<Row a='Phone' b={selected.phone}/>} {selected.location&&<Row a='Location' b={selected.location}/>}<Row a='Fit score' b={`${selected.fit_score}/100`}/><Row a='State' b={selected.action_state}/><Row a='Reply' b={selected.reply_status}/>{selected.external_thread_id&&<Row a='Email thread' b={selected.external_thread_id}/>}<Row a='Relationship' b={`${selected.relationship_strength}/100`}/></div><hr style={{border:0,borderTop:'1px solid #D3CDBF',margin:'18px 0'}}/><div style={{fontSize:11,fontWeight:950}}>WHY THIS MATTERS</div><p style={{lineHeight:1.6,color:'#4E4B45'}}>{selected.reason}</p><div style={{fontSize:11,fontWeight:950,marginTop:18}}>EMAIL / REPLY STATUS</div><div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:8}}>{(['awaiting','replied','bounced','closed'] as const).map(r=><button key={r} onClick={()=>patch(selected,{replyStatus:r,eventType:`reply_${r}`,eventNote:`Reply status changed to ${r}.`})} style={{...miniLight,background:selected.reply_status===r?'#171717':'transparent',color:selected.reply_status===r?'#fff':'#171717'}}>{r}</button>)}</div><div style={{fontSize:11,fontWeight:950,marginTop:20}}>RELATIONSHIP HISTORY</div><div style={{display:'grid',gap:7,marginTop:8}}>{selectedEvents.length?selectedEvents.map(e=><div key={e.id} style={{borderTop:'1px solid #D8D1C4',paddingTop:7,fontSize:12}}><strong>{e.event_type.replaceAll('_',' ')}</strong><div style={{color:'#6E685E',marginTop:2}}>{e.event_note||e.source_type} · {new Date(e.created_at).toLocaleString()}</div></div>):<div style={{color:'#777168',fontSize:12}}>No history logged yet.</div>}</div></>:<div>Select a move.</div>}</aside>
      </section>

      <section style={{marginTop:22,background:'#0D1728',border:'1px solid #273A59',borderRadius:18,padding:20}}><div style={eyebrow}>ARIDON ACTION LOOP</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8,marginTop:12}}>{['Discover','Identify','Verify contact','Score fit','Recommend','Approve','Execute','Watch reply','Next move'].map((x,i)=><div key={x} style={{background:'#091321',borderRadius:12,padding:12}}><div style={{color:'#9EF0CF',fontWeight:950,fontSize:11}}>{String(i+1).padStart(2,'0')}</div><div style={{fontWeight:850,marginTop:5}}>{x}</div></div>)}</div></section>
    </div>
  </main>
}

function replyColor(s:Move['reply_status']){return s==='replied'?'#7BE7B0':s==='bounced'?'#FF8A8A':s==='awaiting'?'#F7C948':'#B8C7DA'}
function Row({a,b}:{a:string;b:string}){return <div style={{display:'grid',gridTemplateColumns:'92px 1fr',gap:8}}><span style={{color:'#777168'}}>{a}</span><strong style={{wordBreak:'break-word'}}>{b}</strong></div>}
const loadingStyle={minHeight:'100vh',display:'grid',placeItems:'center',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif'} as const;
const nav={color:'#DCE4EF',textDecoration:'none',fontWeight:850,fontSize:13,border:'1px solid #2A3A57',borderRadius:999,padding:'9px 12px'} as const;
const eyebrow={color:'#9EF0CF',fontWeight:950,fontSize:11,letterSpacing:1.2} as const;
const chip={border:'1px solid #2A3A57',borderRadius:999,padding:'9px 12px',fontWeight:900,cursor:'pointer'} as const;
const laneBadge={fontSize:10,fontWeight:900,color:'#B8C7DA',border:'1px solid #34465F',borderRadius:999,padding:'3px 7px'} as const;
const smallBtn={background:'#9EF0CF',color:'#07130F',border:0,borderRadius:10,padding:'9px 12px',fontWeight:950,cursor:'pointer'} as const;
const ghostBtn={background:'transparent',color:'#DCE4EF',border:'1px solid #40516B',borderRadius:10,padding:'8px 11px',fontWeight:900,cursor:'pointer'} as const;
const miniLight={border:'1px solid #9F988A',borderRadius:999,padding:'6px 9px',fontSize:11,fontWeight:900,cursor:'pointer'} as const;
