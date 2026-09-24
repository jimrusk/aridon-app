'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';

type Msg={who:'eva'|'farmer';text:string};
type Farm={name:string;contact:string;county:string;acres:string;operation:string;products:string;water:string;irrigation:string;soil:string;energy:string;equipment:string;labor:string;yield:string;costs:string;revenue:string;debt:string;programs:string;buyers:string;storage:string;goals:string;problems:string};

const blank:Farm={name:'',contact:'',county:'',acres:'',operation:'',products:'',water:'',irrigation:'',soil:'',energy:'',equipment:'',labor:'',yield:'',costs:'',revenue:'',debt:'',programs:'',buyers:'',storage:'',goals:'',problems:''};
const steps=[
 ['name','First, what do you call your farm or ranch?'],
 ['contact','Great. What is your name and the best phone or email for you?'],
 ['county','Where is the operation? County/state is enough.'],
 ['acres','About how many acres do you operate? A rough number is perfectly fine.'],
 ['operation','What kind of operation is it? Crops, cattle, dairy, mixed, specialty, something else?'],
 ['products','What do you grow or raise now? Include anything you may add soon.'],
 ['water','Tell me about your water. Wells, surface water, hauled water, annual use if you know it, and any shortages.'],
 ['irrigation','How do you irrigate, if at all? Pivot, drip, flood, dryland, other?'],
 ['soil','What do you know about your soil? Tests, organic matter, problem areas, erosion, salinity, or just “not sure.”'],
 ['energy','What powers the operation? Utility, diesel, propane, solar, generators? Any painful bills or outages?'],
 ['equipment','What major equipment do you already have, and what do you wish you had?'],
 ['labor','Who does the work? Family, employees, seasonal crews? Rough counts are enough.'],
 ['yield','What is normal production or yield in a decent year?'],
 ['costs','What are the biggest costs? If you know annual operating cost or cost per acre/head, add it.'],
 ['revenue','About what does the operation bring in during a normal year? You can give a range.'],
 ['debt','Any major farm debt, equipment payments or financing constraints we should plan around?'],
 ['programs','Are you already in USDA/NRCS/FSA, conservation, insurance, grant or other programs?'],
 ['buyers','Who buys from you now? Do you have contracts, recurring customers or products needing a buyer?'],
 ['storage','What storage, cold storage, processing, trucking or pickup capability do you have?'],
 ['problems','What are the three things making farming harder than they should be right now?'],
 ['goals','Last one: if Eva could improve three things over the next 12–24 months, what would you pick?']
] as const;

export default function FarmerStart(){
 const [farm,setFarm]=useState<Farm>(blank);
 const [i,setI]=useState(0);
 const [answer,setAnswer]=useState('');
 const [done,setDone]=useState(false);
 const [msgs,setMsgs]=useState<Msg[]>([{who:'eva',text:"Hi! I’m Eva. I’ll build your farm snapshot with you. No spreadsheets, no perfect numbers, and no farm jargon test. If you don’t know something, say “not sure” and we’ll keep rolling. 🌱"}]);
 const [saved,setSaved]=useState(false);
 const field=steps[i]?.[0];
 const ask=steps[i]?.[1];
 const pct=Math.round((i/steps.length)*100);
 const submit=()=>{if(!answer.trim()||!field)return; const val=answer.trim(); setFarm(f=>({...f,[field]:val})); const next=i+1; setMsgs(m=>[...m,{who:'farmer',text:val},{who:'eva',text:next<steps.length?steps[next][1]:"That’s it. I’ve got enough to build your starting farm snapshot. Review it below, fix anything you want, then save it for the pilot team."}]); setAnswer(''); setI(next); if(next>=steps.length)setDone(true);};
 const summary=useMemo(()=>[
  ['Operation',farm.operation],['Products',farm.products],['Acres',farm.acres],['Water',farm.water],['Irrigation',farm.irrigation],['Soil',farm.soil],['Energy',farm.energy],['Production',farm.yield],['Costs',farm.costs],['Revenue',farm.revenue],['Programs',farm.programs],['Buyers',farm.buyers],['Top problems',farm.problems],['Goals',farm.goals]
 ],[farm]);
 const download=()=>{const payload={version:'Aridon Ag Farm Baseline v1',created:new Date().toISOString(),farm}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=(farm.name||'farm').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-aridon-baseline.json';a.click();URL.revokeObjectURL(url);setSaved(true);};
 return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#183126',fontFamily:'Arial,sans-serif'}}>
  <header style={{background:'#123b2a',color:'white',padding:'14px 18px'}}><div style={{maxWidth:900,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><strong>ARIDON AG · FARMER START</strong><Link href="/ag" style={{color:'#d9efce',textDecoration:'none',fontWeight:800}}>Ag OS</Link></div></header>
  <section style={{maxWidth:900,margin:'auto',padding:'34px 16px 70px'}}>
   <div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:13,fontWeight:900,color:'#477052'}}>YOUR FARM, ONE CONVERSATION AT A TIME</div><h1 style={{fontSize:'clamp(38px,7vw,66px)',lineHeight:1,margin:'8px 0'}}>Talk to Eva about your farm.</h1><p style={{fontSize:18,color:'#596a60',lineHeight:1.55}}>Usually 10–15 minutes. Estimates are welcome. Skip the paperwork pile and tell Eva what you know.</p></div>
   <div style={{height:8,background:'#dbe1d8',borderRadius:99,overflow:'hidden',marginBottom:18}}><div style={{width:(done?100:pct)+'%',height:'100%',background:'#477052',transition:'width .3s'}}/></div>
   <div style={{background:'white',border:'1px solid #d7ded4',borderRadius:22,padding:18,boxShadow:'0 10px 30px rgba(30,50,35,.08)'}}>
    <div style={{maxHeight:420,overflowY:'auto',padding:4}}>{msgs.slice(-8).map((m,n)=><div key={n} style={{display:'flex',justifyContent:m.who==='farmer'?'flex-end':'flex-start',margin:'10px 0'}}><div style={{maxWidth:'82%',background:m.who==='farmer'?'#123b2a':'#edf3e9',color:m.who==='farmer'?'white':'#183126',padding:'12px 14px',borderRadius:16,lineHeight:1.5}}>{m.text}</div></div>)}</div>
    {!done&&<><div style={{fontWeight:900,margin:'16px 0 7px'}}>{ask}</div><textarea value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();}}} placeholder="Just answer in your own words…" style={{width:'100%',boxSizing:'border-box',minHeight:90,border:'1px solid #b9c6ba',borderRadius:14,padding:13,fontSize:16}}/><div style={{display:'flex',justifyContent:'space-between',gap:10,marginTop:10}}><button onClick={()=>setAnswer('Not sure')} style={{border:0,background:'#eee9dc',padding:'11px 14px',borderRadius:12,fontWeight:800}}>Not sure</button><button onClick={submit} style={{border:0,background:'#123b2a',color:'white',padding:'11px 18px',borderRadius:12,fontWeight:900}}>Tell Eva →</button></div></>}
   </div>
   {done&&<section style={{marginTop:22}}><div style={{background:'#e6f0df',borderRadius:18,padding:18}}><h2 style={{marginTop:0}}>Your starting snapshot</h2><p>This is the baseline we can compare against after a pilot. Nothing here is a certification or an audit. It is your starting picture.</p></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:10,marginTop:12}}>{summary.filter(x=>x[1]).map(([k,v])=><div key={k} style={{background:'white',border:'1px solid #d7ded4',borderRadius:14,padding:14}}><small style={{fontWeight:900,color:'#617166'}}>{k.toUpperCase()}</small><div style={{marginTop:5,lineHeight:1.45}}>{v}</div></div>)}</div><div style={{background:'white',border:'1px solid #d7ded4',borderRadius:18,padding:18,marginTop:12}}><h3>Next, Eva and the pilot team can turn this into:</h3><p style={{lineHeight:1.6}}>a water baseline · farm economics · funding readiness · transition priorities · equipment needs · buyer opportunities · measurable before/after targets</p><button onClick={download} style={{border:0,background:'#123b2a',color:'white',padding:'13px 18px',borderRadius:12,fontWeight:900}}>Save my farm baseline</button>{saved&&<p><b>Saved.</b> Keep the file. It can be shared with the Aridon pilot team when you choose.</p>}</div></section>}
  </section>
 </main>
}