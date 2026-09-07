'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Beaker, BrainCircuit, CheckCircle2, FlaskConical, Gauge, Landmark, Leaf, MapPin, ScanLine, ShieldCheck, Sparkles, Sprout, TrendingDown, TrendingUp, TriangleAlert, Waves } from 'lucide-react';

type Sample = {
  id: string;
  field: string;
  zone: string;
  acres: number;
  crop: string;
  nitrogen: 'Low' | 'Medium' | 'High';
  phosphorus: 'Low' | 'Medium' | 'High';
  moisture: number;
  confidence: number;
  trend: 'Improving' | 'Stable' | 'Declining';
  action: string;
};

const samples: Sample[] = [
  { id:'SS-260907-01', field:'North Pivot', zone:'A-3', acres:42, crop:'Alfalfa', nitrogen:'Medium', phosphorus:'Low', moisture:18, confidence:88, trend:'Improving', action:'Confirm phosphorus with a lab sample before the next fertilizer pass.' },
  { id:'SS-260907-02', field:'River Bottom', zone:'B-1', acres:27, crop:'Corn', nitrogen:'Low', phosphorus:'Medium', moisture:23, confidence:91, trend:'Stable', action:'Flag for nitrogen review and compare against yield history before variable-rate application.' },
  { id:'SS-260907-03', field:'West 80', zone:'C-5', acres:80, crop:'Winter wheat', nitrogen:'High', phosphorus:'Medium', moisture:14, confidence:84, trend:'Improving', action:'Avoid unnecessary nitrogen until tissue or lab evidence indicates need.' },
];

const badge = (value:string) => {
  const low = value === 'Low' || value === 'Declining';
  const high = value === 'High' || value === 'Improving';
  return {background: low ? '#fff4dc' : high ? '#e6f2df' : '#eef0ea', color: low ? '#825d15' : high ? '#235f35' : '#58635b'};
};

export default function SoilScanPage(){
  const [selected,setSelected]=useState<Sample>(samples[0]);
  const [running,setRunning]=useState(false);
  const [lastScan,setLastScan]=useState('Ready');
  const [verified,setVerified]=useState(false);

  const score=useMemo(()=>{
    let n=72;
    if(selected.trend==='Improving') n+=8;
    if(selected.confidence>=88) n+=5;
    if(selected.nitrogen==='Low') n-=4;
    if(selected.phosphorus==='Low') n-=4;
    if(verified) n+=6;
    return Math.max(0,Math.min(100,n));
  },[selected,verified]);

  function runScan(){
    setRunning(true); setVerified(false); setLastScan('Scanning spectral signature…');
    setTimeout(()=>setLastScan('Matching calibration library…'),700);
    setTimeout(()=>setLastScan('Generating management decision…'),1400);
    setTimeout(()=>{setRunning(false);setLastScan('Screening complete');},2200);
  }

  return <main style={{minHeight:'100vh',background:'#f3f1e8',color:'#16241b',fontFamily:'Arial,sans-serif'}}>
    <header style={{background:'#123d2a',color:'#fff',padding:'14px 18px',position:'sticky',top:0,zIndex:5}}><div style={{maxWidth:1200,margin:'auto',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div style={{display:'flex',alignItems:'center',gap:12}}><Link href="/ag" style={{color:'#d9ead9',display:'inline-flex'}}><ArrowLeft size={20}/></Link><strong style={{letterSpacing:1.3}}>ARIDON SOILSCAN AI</strong></div><div style={{fontSize:12,color:'#d3e4d5'}}>Rapid screening · evidence layer · finance-ready records</div></div></header>

    <section style={{maxWidth:1200,margin:'auto',padding:'38px 18px 22px'}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,330px),1fr))',gap:20,alignItems:'stretch'}}>
      <article style={{background:'#173f2c',color:'#fff',borderRadius:22,padding:26}}><div style={{display:'inline-flex',gap:8,alignItems:'center',fontSize:12,fontWeight:900,color:'#cfe3ba'}}><ScanLine size={18}/> FIELD SCREENING MVP</div><h1 style={{fontSize:'clamp(38px,6vw,66px)',lineHeight:.96,letterSpacing:-2.5,margin:'14px 0'}}>Scan soil. Find the decision. Keep the evidence.</h1><p style={{fontSize:18,lineHeight:1.55,color:'#d9e7dc'}}>SoilScan is designed as a rapid screening layer, not a replacement for certified laboratory analysis. It combines spectral readings, field context and calibration evidence to prioritize what deserves action or confirmation.</p><button onClick={runScan} disabled={running} style={{border:0,borderRadius:12,padding:'14px 18px',fontWeight:950,fontSize:16,cursor:'pointer',background:'#e8f1d6',color:'#163d2a',display:'inline-flex',gap:9,alignItems:'center'}}><Sparkles size={19}/>{running?'Scanning…':'Run Demo Scan'}</button><div style={{marginTop:12,fontSize:13,color:'#bdd1c2'}}>{lastScan}</div></article>
      <article style={{background:'#fff',border:'1px solid #d8dfd4',borderRadius:22,padding:24}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><div><div style={{fontSize:12,fontWeight:950,color:'#397048'}}>CURRENT SAMPLE</div><h2 style={{fontSize:30,margin:'6px 0'}}>{selected.field}</h2></div><MapPin size={28} color="#397048"/></div><div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginTop:16}}>{[['Sample',selected.id],['Zone',selected.zone],['Acres',selected.acres],['Crop',selected.crop]].map(([k,v])=><div key={String(k)} style={{background:'#f7f7f2',borderRadius:12,padding:12}}><div style={{fontSize:11,color:'#68736b',fontWeight:900}}>{k}</div><div style={{fontWeight:900,marginTop:4}}>{v}</div></div>)}</div><div style={{marginTop:16,display:'flex',gap:8,flexWrap:'wrap'}}>{samples.map(s=><button key={s.id} onClick={()=>{setSelected(s);setVerified(false)}} style={{border:selected.id===s.id?'2px solid #397048':'1px solid #ccd4ca',background:'#fff',borderRadius:999,padding:'8px 11px',cursor:'pointer',fontWeight:800}}>{s.zone}</button>)}</div></article>
    </div></section>

    <section style={{maxWidth:1200,margin:'auto',padding:'0 18px 22px'}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
      {[{label:'Nitrogen screen',value:selected.nitrogen,icon:<Leaf size={22}/>},{label:'Phosphorus screen',value:selected.phosphorus,icon:<FlaskConical size={22}/>},{label:'Soil moisture',value:`${selected.moisture}%`,icon:<Waves size={22}/>},{label:'Model confidence',value:`${selected.confidence}%`,icon:<Gauge size={22}/>},{label:'Soil trend',value:selected.trend,icon:selected.trend==='Improving'?<TrendingUp size={22}/>:selected.trend==='Declining'?<TrendingDown size={22}/>:<Gauge size={22}/>}].map(x=><article key={x.label} style={{background:'#fff',border:'1px solid #d8dfd4',borderRadius:16,padding:17}}><div style={{display:'flex',gap:8,alignItems:'center',color:'#397048'}}>{x.icon}<span style={{fontSize:12,fontWeight:950}}>{x.label.toUpperCase()}</span></div><div style={{display:'inline-block',marginTop:12,padding:'7px 10px',borderRadius:999,fontSize:20,fontWeight:950,...badge(String(x.value))}}>{x.value}</div></article>)}
    </div></section>

    <section style={{maxWidth:1200,margin:'auto',padding:'0 18px 28px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,330px),1fr))',gap:16}}>
      <article style={{background:'#fff',border:'1px solid #d8dfd4',borderRadius:20,padding:22}}><div style={{display:'flex',gap:9,alignItems:'center',color:'#397048',fontWeight:950}}><BrainCircuit size={23}/> ARIDON DECISION</div><h2 style={{fontSize:30,margin:'10px 0'}}>What happens next?</h2><p style={{fontSize:17,lineHeight:1.55,color:'#4e5d53'}}>{selected.action}</p><div style={{background:'#fff8e8',border:'1px solid #ead9a9',borderRadius:13,padding:13,display:'flex',gap:9,alignItems:'flex-start'}}><TriangleAlert size={20} color="#8b6416"/><div style={{fontSize:13,lineHeight:1.45}}>Screening result only. Use laboratory or agronomic confirmation when exact nutrient quantities, regulatory compliance or high-cost applications depend on the result.</div></div></article>

      <article style={{background:'#fff',border:'1px solid #d8dfd4',borderRadius:20,padding:22}}><div style={{display:'flex',gap:9,alignItems:'center',color:'#397048',fontWeight:950}}><Beaker size={23}/> VALIDATION PROTOCOL</div><h2 style={{fontSize:30,margin:'10px 0'}}>Evidence, not guesswork.</h2><div style={{display:'grid',gap:10}}>{['Spectral scan captured','GPS + field context attached','Model confidence recorded','Lab confirmation linked when available','Decision and outcome preserved'].map((x,i)=><div key={x} style={{display:'flex',gap:9,alignItems:'center'}}>{i<3||verified?<CheckCircle2 size={19} color="#397048"/>:<div style={{width:19,height:19,border:'2px solid #aab5aa',borderRadius:99}}/>}<span>{x}</span></div>)}</div><button onClick={()=>setVerified(true)} style={{marginTop:16,border:'1px solid #397048',background:verified?'#e6f2df':'#fff',color:'#245f35',borderRadius:11,padding:'11px 14px',fontWeight:900,cursor:'pointer'}}>{verified?'Lab confirmation linked':'Simulate lab confirmation'}</button></article>

      <article style={{background:'#173f2c',color:'#fff',borderRadius:20,padding:22}}><div style={{display:'flex',gap:9,alignItems:'center',color:'#cfe3ba',fontWeight:950}}><Landmark size={23}/> REGENERATIVE FINANCE</div><h2 style={{fontSize:30,margin:'10px 0'}}>Underwriting evidence score</h2><div style={{fontSize:68,fontWeight:950,lineHeight:1}}>{score}<span style={{fontSize:24,color:'#bdd1c2'}}>/100</span></div><div style={{height:10,background:'#315a43',borderRadius:99,overflow:'hidden',margin:'14px 0'}}><div style={{height:'100%',width:`${score}%`,background:'#dcecb8'}}/></div><p style={{color:'#dbe8df',lineHeight:1.55}}>Prototype score combines measurement confidence, trend direction and validation status. In production it would also use water efficiency, input intensity, yield stability, practice adoption and financial history.</p></article>
    </section>

    <section style={{background:'#e4eadf',padding:'36px 18px'}}><div style={{maxWidth:1200,margin:'auto'}}><div style={{fontSize:12,fontWeight:950,color:'#397048'}}>BUILD ROADMAP</div><h2 style={{fontSize:'clamp(32px,5vw,50px)',margin:'8px 0 18px'}}>Station → mobile lab → tractor loop.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>{[
      ['1. SoilScan Station','Controlled lighting + hyperspectral scanning + calibration samples + Aridon dashboard.','Best first pilot at the Southwest Technology Campus.'],
      ['2. Mobile SoilScan','Trailer or truck package with sample prep, scanner, GPS and edge compute.','Take rapid screening directly to farms and ranches.'],
      ['3. Tractor SoilScan','Field sampling/exposure + multisensor readings + AI + variable-rate prescription handoff.','Close the loop from measurement to input decision.'],
      ['4. Finance Evidence Layer','Preserve baselines, trends, confidence, lab confirmations and outcomes.','Turn soil improvement into lender, insurer, grant and impact evidence.']
    ].map(([title,body,foot])=><article key={title} style={{background:'#fff',border:'1px solid #d2dbd0',borderRadius:16,padding:18}}><h3 style={{margin:'0 0 8px',fontSize:22}}>{title}</h3><p style={{color:'#55635a',lineHeight:1.5}}>{body}</p><div style={{fontSize:12,fontWeight:900,color:'#397048'}}>{foot}</div></article>)}</div></div></section>

    <footer style={{padding:'24px 18px 40px'}}><div style={{maxWidth:1200,margin:'auto',display:'flex',justifyContent:'space-between',gap:14,flexWrap:'wrap',alignItems:'center'}}><div><strong>Aridon SoilScan AI</strong><div style={{fontSize:12,color:'#67736b',marginTop:4}}>Prototype decision-support module. Not a certified laboratory result.</div></div><Link href="/ag" style={{color:'#397048',fontWeight:900,textDecoration:'none'}}>Back to Aridon Ag</Link></div></footer>
  </main>
}
