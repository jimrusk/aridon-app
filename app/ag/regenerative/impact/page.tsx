"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, ClipboardCheck, FileCheck2, Save, ShieldCheck, Target } from "lucide-react";
import { getBrowserClient } from "../../../../lib/supabase";

const readinessItems = [
  ['financials','Tax returns / P&L / balance sheet'],
  ['production','Production and yield records'],
  ['land','Land ownership, lease or site control'],
  ['budget','Detailed project budget and uses of funds'],
  ['quotes','Vendor quotes / equipment estimates'],
  ['insurance','Insurance and loss history'],
  ['collateral','Collateral / security plan where applicable'],
  ['management','Management experience and operating plan'],
  ['outcomes','Baseline and target outcomes'],
  ['verification','Measurement and verification plan'],
] as const;

const suggestedMetrics = [
  ['Water','Water use intensity','gal/acre or gal/unit'],
  ['Water','Water reliability','days or % availability'],
  ['Soil','Soil organic matter','%'],
  ['Soil','Infiltration / ground cover','in/hr or %'],
  ['Production','Yield or animal performance','unit/acre or unit/head'],
  ['Economics','Operating margin','%'],
  ['Economics','Input cost avoided','$/acre'],
  ['Resilience','Loss / interruption history','events or $'],
  ['Community','Jobs / producer participation','count'],
  ['Verification','Evidence coverage','% verified'],
];

export default function ImpactPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>({});
  const [status,setStatus]=useState('');
  const [framework,setFramework]=useState('Investor / lender reporting');
  const [category,setCategory]=useState('Water');
  const [metric,setMetric]=useState('Water use intensity');
  const [baseline,setBaseline]=useState(0);
  const [current,setCurrent]=useState(0);
  const [target,setTarget]=useState(0);
  const [unit,setUnit]=useState('gal/acre');
  const [source,setSource]=useState('');
  const [verified,setVerified]=useState(false);

  const readiness=useMemo(()=>{
    const complete=readinessItems.filter(([key])=>checks[key]).length;
    const score=Math.round((complete/readinessItems.length)*100);
    const missing=readinessItems.filter(([key])=>!checks[key]).map(([,label])=>label);
    return {complete,score,missing};
  },[checks]);

  async function saveReadiness(){
    setStatus('Saving capital readiness…');
    try{
      const supabase=getBrowserClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){setStatus('Sign in to Aridon to save this readiness assessment.');return;}
      const {error}=await supabase.from('regenerative_capital_readiness').insert({checks,score:readiness.score,missing_items:readiness.missing});
      if(error) throw error;
      setStatus('Capital readiness assessment saved.');
    }catch(e:any){setStatus(`Save failed: ${e?.message||'unknown error'}`);}
  }

  async function saveMetric(){
    setStatus('Saving impact metric…');
    try{
      const supabase=getBrowserClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){setStatus('Sign in to Aridon to save impact metrics.');return;}
      const {error}=await supabase.from('regenerative_impact_metrics').insert({
        framework,category,metric,baseline,current_value:current,target_value:target,unit,evidence_source:source,
        verification_status:verified?'verified':'unverified',
        notes:'Framework mapping is directional and should be checked against the recipient’s current reporting requirements.'
      });
      if(error) throw error;
      setStatus('Impact metric saved to the evidence layer.');
    }catch(e:any){setStatus(`Metric save failed: ${e?.message||'unknown error'}`);}
  }

  const inputStyle={width:'100%',boxSizing:'border-box' as const,padding:'11px 12px',border:'1px solid #bcc8bd',borderRadius:10,background:'#fff'};

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif'}}>
    <header style={{background:'#102d25',color:'#fff',padding:'14px 18px'}}><div style={{maxWidth:1180,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><Link href="/ag/regenerative" style={{color:'#fff',textDecoration:'none',fontWeight:950}}>← REGENERATIVE + FINANCE</Link><Link href="/ag/regenerative/underwriting" style={{color:'#c8e2ac',textDecoration:'none',fontWeight:900}}>Risk + Underwriting →</Link></div></header>

    <section style={{maxWidth:1180,margin:'auto',padding:'48px 18px 30px'}}><div style={{color:'#356943',fontSize:12,fontWeight:950,letterSpacing:1.2}}>CAPITAL READINESS + IMPACT MAPPING</div><h1 style={{fontSize:'clamp(42px,6vw,70px)',lineHeight:.98,margin:'8px 0 14px'}}>Turn farm evidence into investor-ready proof.</h1><p style={{fontSize:19,lineHeight:1.6,color:'#58655d',maxWidth:900}}>Aridon now checks whether a project is ready to approach capital providers and maps farm outcomes into a reporting structure that lenders, insurers, impact investors and grant partners can review. It does not certify compliance with any external framework.</p></section>

    <section style={{maxWidth:1180,margin:'auto',padding:'0 18px 46px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:16}}>
      <article style={{background:'#fff',border:'1px solid #d7e0d5',borderRadius:20,padding:21}}><ClipboardCheck color="#356943"/><h2 style={{fontSize:31,margin:'9px 0'}}>Capital Readiness Score</h2><div style={{fontSize:52,fontWeight:950,color:'#163d2a'}}>{readiness.score}%</div><div style={{height:10,background:'#e5ebe3',borderRadius:99,overflow:'hidden',margin:'8px 0 18px'}}><div style={{height:'100%',width:`${readiness.score}%`,background:'#356943'}}/></div><div style={{display:'grid',gap:9}}>{readinessItems.map(([key,label])=><label key={key} style={{display:'flex',gap:9,alignItems:'flex-start',lineHeight:1.35}}><input type="checkbox" checked={!!checks[key]} onChange={e=>setChecks(v=>({...v,[key]:e.target.checked}))}/><span>{label}</span></label>)}</div><button onClick={saveReadiness} style={{marginTop:18,border:0,borderRadius:11,background:'#163d2a',color:'#fff',padding:'13px 15px',fontWeight:950,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8}}><Save size={17}/> Save readiness</button></article>

      <article style={{background:'#163d2a',color:'#fff',borderRadius:20,padding:22}}><FileCheck2 color="#c8e2ac"/><div style={{color:'#c8e2ac',fontWeight:950,fontSize:12,marginTop:10}}>WHAT ARIDON FLAGS BEFORE OUTREACH</div><h2 style={{fontSize:31,margin:'8px 0 12px'}}>Missing evidence becomes a work queue.</h2><p style={{color:'#dbe8df',lineHeight:1.55}}>A project should not be introduced as “finance-ready” merely because a lender or investor looks relevant. Aridon surfaces the missing documents, assumptions and verification first.</p><div style={{display:'grid',gap:8,marginTop:14}}>{readiness.missing.length?readiness.missing.slice(0,7).map(x=><div key={x} style={{display:'flex',gap:8,alignItems:'center'}}><Target size={16} color="#c8e2ac"/>{x}</div>):<div style={{display:'flex',gap:8,alignItems:'center'}}><CheckCircle2 size={18} color="#c8e2ac"/>Core readiness checklist complete. Final recipient-specific diligence is still required.</div>}</div></article>
    </section>

    <section style={{background:'#fff',borderTop:'1px solid #d7e0d5',borderBottom:'1px solid #d7e0d5',padding:'48px 18px'}}><div style={{maxWidth:1180,margin:'auto'}}><div style={{display:'flex',gap:9,alignItems:'center'}}><BarChart3 color="#356943"/><strong style={{color:'#356943'}}>IMPACT METRIC MAPPER</strong></div><h2 style={{fontSize:'clamp(34px,5vw,50px)',margin:'8px 0 18px'}}>Keep the raw measurement and the reporting map together.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:12}}>
      <label style={{fontWeight:850}}>Reporting lens<select value={framework} onChange={e=>setFramework(e.target.value)} style={{...inputStyle,marginTop:6}}><option>Investor / lender reporting</option><option>IRIS+ category mapping</option><option>UN SDG reference mapping</option><option>Insurance / risk review</option><option>Grant / program reporting</option><option>Custom partner framework</option></select></label>
      <label style={{fontWeight:850}}>Category<input value={category} onChange={e=>setCategory(e.target.value)} style={{...inputStyle,marginTop:6}}/></label>
      <label style={{fontWeight:850}}>Metric<input value={metric} onChange={e=>setMetric(e.target.value)} style={{...inputStyle,marginTop:6}}/></label>
      <label style={{fontWeight:850}}>Unit<input value={unit} onChange={e=>setUnit(e.target.value)} style={{...inputStyle,marginTop:6}}/></label>
      <label style={{fontWeight:850}}>Baseline<input type="number" value={baseline} onChange={e=>setBaseline(Number(e.target.value)||0)} style={{...inputStyle,marginTop:6}}/></label>
      <label style={{fontWeight:850}}>Current<input type="number" value={current} onChange={e=>setCurrent(Number(e.target.value)||0)} style={{...inputStyle,marginTop:6}}/></label>
      <label style={{fontWeight:850}}>Target<input type="number" value={target} onChange={e=>setTarget(Number(e.target.value)||0)} style={{...inputStyle,marginTop:6}}/></label>
      <label style={{fontWeight:850}}>Evidence source<input value={source} onChange={e=>setSource(e.target.value)} placeholder="lab, meter, invoice, audit…" style={{...inputStyle,marginTop:6}}/></label>
    </div><label style={{display:'flex',gap:8,alignItems:'center',marginTop:15,fontWeight:850}}><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/> Independently verified / reviewed</label><button onClick={saveMetric} style={{marginTop:16,border:0,borderRadius:11,background:'#163d2a',color:'#fff',padding:'13px 15px',fontWeight:950,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8}}><Save size={17}/> Save impact metric</button></div></section>

    <section style={{maxWidth:1180,margin:'auto',padding:'48px 18px'}}><div style={{display:'flex',gap:9,alignItems:'center'}}><ShieldCheck color="#356943"/><strong style={{color:'#356943'}}>SUGGESTED EVIDENCE LIBRARY</strong></div><h2 style={{fontSize:36,margin:'8px 0 18px'}}>Start with metrics capital providers can trace back to evidence.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>{suggestedMetrics.map(([cat,name,u])=><article key={`${cat}-${name}`} style={{background:'#fff',border:'1px solid #d7e0d5',borderRadius:14,padding:16}}><div style={{fontSize:11,fontWeight:950,color:'#356943'}}>{cat.toUpperCase()}</div><h3 style={{margin:'6px 0 4px'}}>{name}</h3><small style={{color:'#657169'}}>{u}</small></article>)}</div>{status&&<div style={{marginTop:18,padding:13,borderRadius:12,background:'#e7eee3',fontWeight:850}}>{status}</div>}</section>
  </main>;
}
