'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Producer={name:string;region:string;products:string;volume:number;verified:boolean;harvest:string};
type Demand={buyer:string;type:string;product:string;need:number;frequency:string};

const producers:Producer[]=[
 {name:'Mesa Verde Ranch',region:'Eastern NM',products:'Grass-finished beef',volume:1800,verified:true,harvest:'Oct 12'},
 {name:'High Plains Growers',region:'Curry County',products:'Leafy greens',volume:2400,verified:true,harvest:'Weekly'},
 {name:'Rio Valley Farm',region:'Eastern NM',products:'Carrots, squash, onions',volume:3200,verified:false,harvest:'Oct 5'},
];
const demands:Demand[]=[
 {buyer:'Regional Health Network',type:'Hospital / clinic',product:'Mixed produce',need:5000,frequency:'Weekly'},
 {buyer:'Produce Rx Program',type:'Food is Medicine',product:'Leafy greens',need:1800,frequency:'Weekly'},
 {buyer:'Institutional Kitchen',type:'Meal provider',product:'Grass-finished beef',need:1400,frequency:'Monthly'},
];

export default function FarmToHealthPage(){
 const [tab,setTab]=useState<'network'|'match'|'pilot'>('network');
 const [region,setRegion]=useState('Eastern New Mexico / Ogallala');
 const matches=useMemo(()=>[
  {producer:'High Plains Growers',buyer:'Produce Rx Program',product:'Leafy greens',coverage:'100%',status:'Pilot-ready'},
  {producer:'Mesa Verde Ranch',buyer:'Institutional Kitchen',product:'Grass-finished beef',coverage:'100%',status:'Pilot-ready'},
  {producer:'Rio Valley Farm + network',buyer:'Regional Health Network',product:'Mixed produce',coverage:'64%',status:'Recruit 2–3 farms'},
 ],[]);
 const card={background:'#fff',border:'1px solid #d8dfd5',borderRadius:18,padding:18} as const;
 const pill={display:'inline-block',background:'#e5f0df',color:'#245537',borderRadius:999,padding:'6px 10px',fontSize:12,fontWeight:900} as const;
 return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif'}}>
  <header style={{background:'#123b2a',color:'#fff',padding:'15px 18px'}}><div style={{maxWidth:1200,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center'}}><div><strong>ARIDON AG</strong> · FARM-TO-HEALTH NETWORK</div><div style={{display:'flex',gap:14}}><Link href="/ag" style={{color:'#d8eadb',textDecoration:'none',fontWeight:850}}>Ag OS</Link><Link href="/ag/market-opportunities" style={{color:'#d8eadb',textDecoration:'none',fontWeight:850}}>Markets</Link></div></div></header>
  <section style={{background:'linear-gradient(135deg,#123b2a,#386c45)',color:'#fff',padding:'64px 18px 52px'}}><div style={{maxWidth:1200,margin:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:28,alignItems:'center'}}><div><div style={{color:'#c8e2ac',fontSize:12,fontWeight:950,letterSpacing:1.2}}>SOIL → PRODUCER → HUB → HEALTHCARE → PATIENT</div><h1 style={{fontSize:'clamp(46px,7vw,78px)',lineHeight:.95,letterSpacing:-2.6,margin:'12px 0 18px'}}>Turn better farming into dependable healthcare supply.</h1><p style={{fontSize:19,lineHeight:1.65,color:'#e1eee4'}}>Aggregate regional producers, verify practices and lots, match real institutional demand, coordinate logistics and measure the value that reaches farms and communities.</p></div><div style={{...card,color:'#18251d'}}><div style={pill}>PILOT CONTROL</div><h2>Build the first regional network</h2><label style={{fontWeight:850,fontSize:13}}>Pilot region<input value={region} onChange={e=>setRegion(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:7,padding:12,borderRadius:10,border:'1px solid #b8c5b8'}}/></label><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:16}}>{[['3','producers'],['3','buyers'],['2','ready matches']].map(x=><div key={x[1]} style={{background:'#edf3e9',borderRadius:12,padding:12,textAlign:'center'}}><strong style={{fontSize:25}}>{x[0]}</strong><div style={{fontSize:11}}>{x[1]}</div></div>)}</div></div></div></section>
  <nav style={{maxWidth:1200,margin:'22px auto 0',padding:'0 18px',display:'flex',gap:8,flexWrap:'wrap'}}>{([['network','Supply + demand'],['match','Match engine'],['pilot','Pilot builder']] as const).map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{border:0,borderRadius:999,padding:'11px 14px',fontWeight:900,cursor:'pointer',background:tab===k?'#123b2a':'#fff',color:tab===k?'#fff':'#123b2a'}}>{l}</button>)}</nav>
  <section style={{maxWidth:1200,margin:'auto',padding:'18px 18px 60px'}}>
   {tab==='network'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:18}}><div><h2>Producer supply</h2>{producers.map(p=><article key={p.name} style={{...card,marginBottom:12}}><span style={pill}>{p.verified?'Verified record':'Verification needed'}</span><h3>{p.name}</h3><div>{p.region} · {p.products}</div><p><b>{p.volume.toLocaleString()} lb</b> projected · {p.harvest}</p></article>)}</div><div><h2>Healthcare demand</h2>{demands.map(d=><article key={d.buyer} style={{...card,marginBottom:12}}><span style={pill}>{d.type}</span><h3>{d.buyer}</h3><div>{d.product}</div><p><b>{d.need.toLocaleString()} lb</b> · {d.frequency}</p></article>)}</div></div>}
   {tab==='match'&&<><h2>Buyer-match engine</h2><p style={{color:'#5a675f'}}>Match by product, timing, quantity, verification, geography and logistics readiness. Demo records below are illustrative, not live purchase commitments.</p><div style={{display:'grid',gap:12}}>{matches.map(m=><article key={m.producer+m.buyer} style={{...card,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,alignItems:'center'}}><div><small>PRODUCER</small><strong style={{display:'block'}}>{m.producer}</strong></div><div><small>BUYER</small><strong style={{display:'block'}}>{m.buyer}</strong></div><div><small>PRODUCT</small><strong style={{display:'block'}}>{m.product}</strong></div><div><small>COVERAGE</small><strong style={{display:'block'}}>{m.coverage}</strong></div><span style={pill}>{m.status}</span></article>)}</div></>}
   {tab==='pilot'&&<><h2>{region} pilot builder</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,250px),1fr))',gap:14}}>{[
    ['1. Recruit','Enroll 3–10 complementary farms/ranches and capture projected supply, water constraints and transition needs.'],
    ['2. Verify','Organize practice records, food-safety documents, lot traceability, soil/quality tests and permissioned evidence.'],
    ['3. Contract demand','Recruit hospitals, clinics, Food-is-Medicine programs, schools and meal providers before scaling production.'],
    ['4. Aggregate','Combine producer inventory into buyer-sized orders and coordinate hub, cold storage, processing and pickup.'],
    ['5. Deliver','Schedule routes, maintain lot-level chain of custody and flag shortages early enough to substitute supply.'],
    ['6. Measure','Track producer revenue, fulfilled demand, price realization, food miles, water resilience and program outcomes.'],
   ].map(([t,b])=><article key={t} style={card}><h3>{t}</h3><p style={{lineHeight:1.55,color:'#58665d'}}>{b}</p></article>)}</div><div style={{...card,marginTop:18,background:'#e5f0df'}}><strong>Testing rule</strong><p style={{lineHeight:1.6}}>Start with real producers and prospective buyers, but treat all marketplace matches as decision support until a buyer and producer explicitly approve an agreement. Nutrient-density and health claims require appropriate testing and evidence.</p></div></>}
  </section>
 </main>
}