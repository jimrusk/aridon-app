'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Boxes, CalendarDays, ClipboardList, Megaphone, PackageCheck, Printer, Truck, Users, WandSparkles } from 'lucide-react';

type GrainRow = { id:string; grain:string; qty:string; unit:string; location:string; owner:string; notes:string };
type Pickup = { id:string; business:string; contact:string; grain:string; qty:string; pickupDate:string; status:string };
type Workshop = { title:string; date:string; time:string; location:string; audience:string; goal:string; sponsorAsk:string };

const starterWorkshop: Workshop = {
  title:'Small Farm Resilience Workshop',
  date:'', time:'', location:'', audience:'Small farms and ranches',
  goal:'Help producers organize records, find funding, improve water/feed decisions, and leave with one clear next action.',
  sponsorAsk:'Sponsor lunch, printing, producer travel, or workshop space.'
};

export default function S3PilotPage(){
  const [grains,setGrains]=useState<GrainRow[]>([]);
  const [pickups,setPickups]=useState<Pickup[]>([]);
  const [workshop,setWorkshop]=useState<Workshop>(starterWorkshop);
  const [team,setTeam]=useState([{name:'Ranch Owner',role:'Owner / final approval'},{name:'Partner',role:'Can add inventory, notes, tasks and pickup updates'}]);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    try {
      const raw=localStorage.getItem('aridon-s3-pilot');
      if(raw){ const d=JSON.parse(raw); setGrains(d.grains||[]); setPickups(d.pickups||[]); setWorkshop(d.workshop||starterWorkshop); setTeam(d.team||[]); }
    } catch {}
    setLoaded(true);
  },[]);
  useEffect(()=>{ if(loaded) localStorage.setItem('aridon-s3-pilot',JSON.stringify({grains,pickups,workshop,team})); },[grains,pickups,workshop,team,loaded]);

  const grainTotal=useMemo(()=>grains.reduce((n,g)=>n+(Number(g.qty)||0),0),[grains]);
  const script=`Thanks for being here. Today is about making farm and ranch decisions easier, not adding another complicated system. We are going to organize what you already know, identify the one or two things costing you time or money, look at funding and resource options, and make sure you leave with a next action you can actually use. If something needs an expert, lender, buyer, sponsor or service provider, Aridon can help organize the request without sharing private information until you approve it.`;
  const outreach=`Hi — I’m inviting a small group of local producers to a practical workshop focused on farm records, funding, water/feed decisions and finding the right next resource. It is designed for small farms and ranches and is meant to be useful, not salesy. If you know a producer who could use help getting organized or finding support, I’d appreciate an introduction.`;
  const sponsor=`We are building a hands-on workshop for small farms and ranches that helps producers organize records, identify funding, strengthen water/feed decisions and leave with a concrete action plan. We are looking for sponsors who can support lunch, venue, printing, producer travel or technical expertise. Sponsors are recognized on the one-page flyer and workshop materials, but producer recommendations remain independent.`;

  const addGrain=()=>setGrains([...grains,{id:crypto.randomUUID(),grain:'Corn',qty:'',unit:'bushels',location:'',owner:'',notes:''}]);
  const addPickup=()=>setPickups([...pickups,{id:crypto.randomUUID(),business:'',contact:'',grain:'',qty:'',pickupDate:'',status:'Requested'}]);

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#17241c',fontFamily:'Arial,sans-serif',paddingBottom:60}}>
    <header style={{background:'#163d2a',color:'#fff',padding:'16px 18px',position:'sticky',top:0,zIndex:10}}><div style={{maxWidth:1160,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><div style={{color:'#c5e2aa',fontSize:12,fontWeight:950,letterSpacing:1}}>ARIDON AG · OFFICIAL PILOT #1</div><strong style={{fontSize:22}}>S3 Legacy Ranch Pilot Workspace</strong></div><div style={{display:'flex',gap:12}}><Link href="/ag/app" style={{color:'#fff',fontWeight:900,textDecoration:'none'}}>Ag workspace</Link><button onClick={()=>window.print()} style={{border:0,borderRadius:10,padding:'9px 12px',fontWeight:900}}><Printer size={15} style={{verticalAlign:'middle',marginRight:6}}/>Print flyer</button></div></div></header>

    <section style={{maxWidth:1160,margin:'auto',padding:'24px 16px'}}>
      <div style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:20,padding:22}}><div style={{color:'#356943',fontSize:12,fontWeight:950}}>PILOT PURPOSE</div><h1 style={{fontSize:'clamp(34px,5vw,54px)',margin:'8px 0 12px'}}>One ranch system that the whole team can actually use.</h1><p style={{fontSize:17,lineHeight:1.55,color:'#59665d',maxWidth:900}}>Track grain, coordinate business pickups, let trusted family/partners add updates, build workshops, schedule them, prepare what to say, find sponsors, reach small farms and create a one-page workshop flyer — all in one place.</p></div>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,marginTop:16}}>
        <article style={card}><Boxes size={25}/><h3>Grain inventory</h3><div style={{fontSize:32,fontWeight:950}}>{grainTotal.toLocaleString()}</div><div style={{color:'#667169'}}>Total quantity entered across inventory rows</div><button onClick={addGrain} style={btn}>+ Add grain</button></article>
        <article style={card}><Truck size={25}/><h3>Business pickup board</h3><div style={{fontSize:32,fontWeight:950}}>{pickups.length}</div><div style={{color:'#667169'}}>Pickup requests / scheduled collections</div><button onClick={addPickup} style={btn}>+ Add pickup</button></article>
        <article style={card}><Users size={25}/><h3>Shared ranch team</h3><p style={{color:'#667169'}}>Owner keeps final approval. Trusted helpers can add inventory, notes, tasks and pickup updates.</p></article>
      </section>

      <section style={{...panel,marginTop:16}}><div style={eyebrow}>GRAIN INVENTORY</div><h2>What is on hand, where it is, and who owns the update.</h2>{grains.length===0&&<p style={muted}>No grain entered yet. Add the first row.</p>}<div style={{display:'grid',gap:10}}>{grains.map((g,i)=><div key={g.id} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8,background:'#f8f7f2',padding:12,borderRadius:12}}>{(['grain','qty','unit','location','owner','notes'] as const).map(k=><input key={k} value={g[k]} placeholder={k} onChange={e=>{const n=[...grains]; n[i]={...n[i],[k]:e.target.value}; setGrains(n)}} style={input}/>)}</div>)}</div></section>

      <section style={{...panel,marginTop:16}}><div style={eyebrow}>PICKUP REQUESTS</div><h2>Let a buyer, mill, feed business or transporter schedule a grain pickup.</h2><p style={muted}>For the pilot, the ranch team records the request here. Next production step is a secure external pickup link for approved businesses.</p>{pickups.map((p,i)=><div key={p.id} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(135px,1fr))',gap:8,background:'#f8f7f2',padding:12,borderRadius:12,marginBottom:8}}>{(['business','contact','grain','qty','pickupDate','status'] as const).map(k=><input key={k} value={p[k]} placeholder={k} onChange={e=>{const n=[...pickups];n[i]={...n[i],[k]:e.target.value};setPickups(n)}} style={input}/>)}</div>)}</section>

      <section style={{...panel,marginTop:16}}><div style={eyebrow}>WORKSHOP BUILDER</div><h2>Design the workshop, schedule it, and know what to say.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:8}}>{(Object.keys(workshop) as (keyof Workshop)[]).map(k=><label key={k} style={{fontSize:12,fontWeight:900}}>{k}<input value={workshop[k]} onChange={e=>setWorkshop({...workshop,[k]:e.target.value})} style={{...input,width:'100%',marginTop:4}}/></label>)}</div><div style={{marginTop:14,background:'#edf2e9',padding:16,borderRadius:14}}><strong>Suggested opening script</strong><p style={{lineHeight:1.6,marginBottom:0}}>{script}</p></div></section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12,marginTop:16}}><article style={card}><Megaphone/><h3>Small-farm outreach</h3><p style={{lineHeight:1.55}}>{outreach}</p></article><article style={card}><PackageCheck/><h3>Sponsor outreach</h3><p style={{lineHeight:1.55}}>{sponsor}</p><div style={{fontSize:13,color:'#667169'}}>Sponsor targets: local banks/ag lenders, feed stores, equipment dealers, Farm Bureau, rural electric co-ops, veterinarians, extension, conservation districts, seed/fertilizer suppliers, insurance agencies and regional food buyers.</div></article></section>

      <section id="flyer" style={{...panel,marginTop:16,border:'3px solid #163d2a'}}><div style={{display:'flex',alignItems:'center',gap:10,color:'#356943',fontWeight:950}}><WandSparkles size={22}/> ONE-PAGE FLYER</div><h2 style={{fontSize:38,margin:'8px 0'}}>{workshop.title || 'Small Farm Resilience Workshop'}</h2><div style={{fontSize:18,fontWeight:900}}>{workshop.date || 'Date TBD'} · {workshop.time || 'Time TBD'} · {workshop.location || 'Location TBD'}</div><p style={{fontSize:17,lineHeight:1.6}}>{workshop.goal}</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8}}>{['Organize farm records','Find grants & loans','Improve water/feed decisions','Build one next-action plan'].map(x=><div key={x} style={{background:'#edf2e9',padding:12,borderRadius:10,fontWeight:900}}>{x}</div>)}</div><p><strong>For:</strong> {workshop.audience}</p><p><strong>Sponsor opportunity:</strong> {workshop.sponsorAsk}</p><div style={{fontSize:13,color:'#667169'}}>Powered by S3 Legacy Ranch + Aridon Ag · Pilot workspace</div></section>

      <section style={{...panel,marginTop:16}}><div style={eyebrow}>TEAM ACCESS DESIGN</div><h2>Owner-controlled collaboration.</h2><ul style={{lineHeight:1.7}}><li><strong>Owner:</strong> final approval, sharing, funding submissions, sponsor commitments.</li><li><strong>Trusted partner / boyfriend:</strong> add and edit inventory, workshop notes, tasks and pickup details.</li><li><strong>Business pickup user:</strong> limited pickup request/status access only — no ranch financials or unrelated data.</li><li><strong>Workshop helper:</strong> attendee list, sponsor tasks, flyer and schedule only.</li></ul><p style={muted}>This page currently saves pilot data in the browser. Production pilot hardening should move these records into authenticated shared storage with role-based permissions and audit history.</p></section>
    </section>
  </main>
}

const card:React.CSSProperties={background:'#fff',border:'1px solid #d7dfd4',borderRadius:17,padding:18};
const panel:React.CSSProperties={background:'#fff',border:'1px solid #d7dfd4',borderRadius:18,padding:20};
const btn:React.CSSProperties={marginTop:12,border:0,borderRadius:10,padding:'10px 12px',background:'#163d2a',color:'#fff',fontWeight:900};
const input:React.CSSProperties={border:'1px solid #cfd8cc',borderRadius:9,padding:'9px 10px',background:'#fff'};
const muted:React.CSSProperties={color:'#667169',lineHeight:1.5};
const eyebrow:React.CSSProperties={color:'#356943',fontSize:12,fontWeight:950,letterSpacing:.7};
