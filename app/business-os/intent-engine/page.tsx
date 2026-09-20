'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Lead = { source:string; campaign:string; company:string; problem:string; urgency:number; engagement:number; fit:number; value:number };
const samples: Lead[] = [
 {source:'LinkedIn',campaign:'AI Operations Video',company:'Regional service company',problem:'Leads are not followed up consistently',urgency:9,engagement:8,fit:9,value:8},
 {source:'Google',campaign:'Revenue Recovery Search',company:'Multi-location contractor',problem:'Old estimates and missed calls are leaking revenue',urgency:8,engagement:9,fit:10,value:9},
 {source:'Meta',campaign:'Business OS Carousel',company:'Owner-led SMB',problem:'Sales and operations live in disconnected tools',urgency:6,engagement:7,fit:8,value:7},
];

export default function IntentEnginePage(){
 const [lead,setLead]=useState(samples[0]);
 const [stage,setStage]=useState(0);
 const score=useMemo(()=>Math.round((lead.urgency*.3+lead.engagement*.2+lead.fit*.3+lead.value*.2)*10),[lead]);
 const qualified=score>=75;
 const cta=score>=90?'Book a Revenue Recovery Review':score>=75?'Analyze My Business':score>=55?'See the 3-Minute Business OS Demo':'Get the Executive Brief';
 const nurture=score>=75?'Case study + proof + direct Eva follow-up':'Problem education + proof + retargeting';
 const next=qualified?'Eva conversation → demo/strategy call → owner-approved close':'Nurture → retarget → rescore when engagement changes';
 const stages=['Traffic','Intent','Nurture','Qualified','Engager CTA','Conversation','Revenue'];
 return <main style={{minHeight:'100vh',background:'#071018',color:'#F6FAF8',fontFamily:'Arial,sans-serif'}}>
  <section style={{maxWidth:1200,margin:'0 auto',padding:'24px 20px 60px'}}>
   <nav style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center'}}>
    <Link href="/business-os/growth-command" style={{color:'#fff',fontWeight:950,textDecoration:'none'}}>ARIDON · GROWTH COMMAND</Link>
    <Link href="/business-os/revenue-engine" style={outline}>Revenue Engine</Link>
   </nav>
   <div style={{paddingTop:52,maxWidth:920}}><div style={eyebrow}>ARIDON INTENT ENGINE · V1</div><h1 style={{fontSize:'clamp(46px,7vw,82px)',lineHeight:.94,letterSpacing:-3,margin:'14px 0 20px'}}>Turn attention into qualified conversations.</h1><p style={{fontSize:20,lineHeight:1.6,color:'#B9C9C4'}}>Traffic enters once. Eva scores intent, selects the next message and CTA, routes qualified buyers toward sales, and keeps non-buyers in a measurable recovery loop.</p></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8,marginTop:28}}>{stages.map((s,i)=><button key={s} onClick={()=>setStage(i)} style={{border:stage===i?'1px solid #9EF0CF':'1px solid #29404A',background:stage===i?'#12302C':'#0C1822',color:'#fff',padding:'14px 10px',borderRadius:13,fontWeight:900,cursor:'pointer'}}><div style={{fontSize:10,color:'#9EF0CF'}}>0{i+1}</div>{s}</button>)}</div>
  </section>
  <section style={{background:'#F3F0E8',color:'#171717',padding:'64px 20px'}}><div className="intent-grid" style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'.8fr 1.2fr',gap:16}}>
   <div><div style={lightEyebrow}>LIVE QUALIFICATION TEST</div><h2 style={title}>Feed Eva a prospect signal.</h2>
    <label style={label}>TEST LEAD<select value={samples.indexOf(lead)} onChange={e=>setLead(samples[Number(e.target.value)])} style={input}>{samples.map((x,i)=><option key={i} value={i}>{x.source} · {x.company}</option>)}</select></label>
    <Field n="Urgency" value={lead.urgency} change={v=>setLead({...lead,urgency:v})}/><Field n="Engagement" value={lead.engagement} change={v=>setLead({...lead,engagement:v})}/><Field n="Aridon fit" value={lead.fit} change={v=>setLead({...lead,fit:v})}/><Field n="Potential value" value={lead.value} change={v=>setLead({...lead,value:v})}/>
   </div>
   <div style={{background:'#fff',border:'1px solid #D5CFC4',borderRadius:20,padding:22}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'start'}}><div><div style={lightEyebrow}>EVA INTENT DECISION</div><h3 style={{fontSize:28,margin:'7px 0'}}>{lead.company}</h3><div style={{color:'#666'}}>{lead.source} · {lead.campaign}</div></div><div style={{width:92,height:92,borderRadius:99,background:'#071A18',color:'#fff',display:'grid',placeItems:'center',border:'8px solid #9EF0CF'}}><div style={{textAlign:'center'}}><b style={{fontSize:30}}>{score}</b><div style={{fontSize:9,color:'#9EF0CF'}}>INTENT</div></div></div></div>
    <Row k="Problem signal" v={lead.problem}/><Row k="Qualification" v={qualified?'QUALIFIED LEAD':'NURTURE / RESCORE'}/><Row k="Adaptive CTA" v={cta}/><Row k="Nurture path" v={nurture}/><Row k="Sales route" v={next}/>
    <div style={{marginTop:16,padding:16,borderRadius:14,background:'#071A18',color:'#fff'}}><div style={eyebrow}>FEEDBACK LOOP</div><p style={{lineHeight:1.55,color:'#D1DDD8'}}>Record source → ad → engagement → qualification → meeting → proposal → revenue. Feed wins, losses and objections back into scoring so Aridon learns which combinations create revenue, not just clicks.</p></div>
   </div>
  </div></section>
  <section style={{padding:'64px 20px'}}><div style={{maxWidth:1100,margin:'0 auto'}}><div style={eyebrow}>OPERATING LOOP</div><h2 style={{...title,color:'#fff'}}>Acquire. Qualify. Convert. Recover. Learn.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}>{['Carousel + video + static ads','Eva intent scoring','Long + short-form nurture','Adaptive CTA by intent','Conversation + demo','Revenue Recovery + attribution'].map((x,i)=><div key={x} style={{border:'1px solid #29404A',borderRadius:15,padding:16,background:'#0C1822'}}><b style={{color:'#9EF0CF'}}>0{i+1}</b><div style={{marginTop:7,fontWeight:900}}>{x}</div></div>)}</div><p style={{color:'#8FA29B',fontSize:12,lineHeight:1.5,marginTop:18}}>Research, scoring, drafting and routing may run automatically. Ad spend, external sends, contracts and other consequential actions remain behind owner approval.</p></div></section>
  <style>{`@media(max-width:820px){.intent-grid{grid-template-columns:1fr!important}}`}</style>
 </main>
}
function Field({n,value,change}:{n:string,value:number,change:(v:number)=>void}){return <label style={label}>{n.toUpperCase()} · {value}/10<input type="range" min="1" max="10" value={value} onChange={e=>change(Number(e.target.value))} style={{width:'100%'}}/></label>}
function Row({k,v}:{k:string,v:string}){return <div style={{borderTop:'1px solid #E8E2D9',padding:'13px 0'}}><div style={{fontSize:10,fontWeight:950,color:'#39745F'}}>{k.toUpperCase()}</div><div style={{marginTop:5,lineHeight:1.5,fontWeight:700}}>{v}</div></div>}
const eyebrow={fontSize:12,fontWeight:950,color:'#9EF0CF',letterSpacing:1};
const lightEyebrow={fontSize:12,fontWeight:950,color:'#28634F',letterSpacing:1};
const title={fontSize:'clamp(36px,5vw,56px)',lineHeight:1,letterSpacing:-2,margin:'10px 0 18px'};
const label={display:'grid',gap:8,margin:'14px 0',fontSize:11,fontWeight:950} as const;
const input={border:'1px solid #CCC5B9',borderRadius:10,padding:12,background:'#fff'} as const;
const outline={border:'1px solid #52627A',color:'#fff',padding:'11px 15px',borderRadius:11,textDecoration:'none',fontWeight:900};
