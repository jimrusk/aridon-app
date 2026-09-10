'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileCheck2, MapPinned, ShieldCheck } from 'lucide-react';

type ReviewData = {
  role: 'buyer'|'verifier'|'auditor';
  permissions: Record<string, boolean>;
  expiresAt: string;
  passport: {
    id:string; producer:string|null; farmName:string|null; fieldId:string|null; state:string|null; county:string|null;
    crop:string|null; harvestYear:number|null; readiness:{z45?:number;iscc?:number;carb?:number}; status:string;
    recordData:Record<string,any>|null; boundaryGeoJson:any;
  };
  documents:Array<{id:string;evidenceType:string;label:string|null;filename:string;mimeType:string;sizeBytes:number;url:string|null}>;
};

function BoundaryMap({geo}:{geo:any}){
  const points = useMemo(()=>{
    try {
      const coords = geo?.type === 'Polygon' ? geo.coordinates?.[0] : geo?.type === 'MultiPolygon' ? geo.coordinates?.[0]?.[0] : null;
      if(!Array.isArray(coords) || coords.length < 3) return [] as Array<[number,number]>;
      const xs=coords.map((p:any)=>Number(p[0])).filter(Number.isFinite), ys=coords.map((p:any)=>Number(p[1])).filter(Number.isFinite);
      if(!xs.length || !ys.length) return [];
      const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
      return coords.map((p:any)=>{
        const x=20+((Number(p[0])-minX)/(maxX-minX||1))*360;
        const y=220-((Number(p[1])-minY)/(maxY-minY||1))*190;
        return [x,y] as [number,number];
      });
    }catch{return []}
  },[geo]);
  if(!points.length) return <div style={{padding:22,border:'1px dashed #bac8b7',borderRadius:14,color:'#657069'}}>No GIS boundary was included with this review.</div>;
  return <svg viewBox="0 0 400 240" role="img" aria-label="Field boundary preview" style={{width:'100%',background:'#eef2e8',borderRadius:14,border:'1px solid #d2dccd'}}>
    <path d={`M ${points.map(p=>p.join(' ')).join(' L ')} Z`} fill="#b9d39d" stroke="#285b38" strokeWidth="4"/>
    <text x="20" y="22" fontSize="12" fill="#466050">GIS boundary preview</text>
  </svg>;
}

function Pill({children}:{children:React.ReactNode}){return <span style={{display:'inline-flex',padding:'6px 9px',borderRadius:999,background:'#e5eee0',color:'#285b38',fontSize:12,fontWeight:900}}>{children}</span>}

export default function FarmPassportReview({params}:{params:{token:string}}){
  const [data,setData]=useState<ReviewData|null>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [reviewerName,setReviewerName]=useState('');
  const [organization,setOrganization]=useState('');
  const [reviewStatus,setReviewStatus]=useState('received');
  const [notes,setNotes]=useState('');
  const [requested,setRequested]=useState('');
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);

  useEffect(()=>{
    fetch(`/api/ag/farm-passport/review/${encodeURIComponent(params.token)}`,{cache:'no-store'})
      .then(async r=>{const j=await r.json(); if(!r.ok) throw new Error(j.error||'Unable to open review.'); return j;})
      .then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  },[params.token]);

  async function submit(){
    setSending(true); setError('');
    try{
      const r=await fetch(`/api/ag/farm-passport/review/${encodeURIComponent(params.token)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reviewerName,organization,reviewStatus,notes,requestedItems:requested.split('\n').map(v=>v.trim()).filter(Boolean)})});
      const j=await r.json(); if(!r.ok) throw new Error(j.error||'Unable to submit review.');
      setSent(true);
    }catch(e){setError(e instanceof Error?e.message:'Unable to submit review.')}finally{setSending(false)}
  }

  if(loading) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f4f1e8',fontFamily:'Arial,sans-serif'}}>Opening secure Farm Passport…</main>;
  if(error && !data) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f4f1e8',fontFamily:'Arial,sans-serif',padding:24}}><div style={{maxWidth:560,background:'#fff',border:'1px solid #dfc3bc',borderRadius:18,padding:24}}><AlertTriangle size={32} color="#8f4d3d"/><h1>Review link unavailable</h1><p>{error}</p></div></main>;
  if(!data) return null;
  const p=data.passport, r=p.recordData||{};
  const waterGap=Math.max(0,Number(r.expectedNeedAf||0)-Number(r.annualAllocationAf||0));

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif',paddingBottom:60}}>
    <header style={{background:'#163d2a',color:'#fff',padding:'16px 18px'}}><div style={{maxWidth:1050,margin:'auto',display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:12,color:'#c8e2ac',fontWeight:950,letterSpacing:1}}>ARIDON AG · SECURE REVIEW ROOM</div><strong style={{fontSize:22}}>Farm Passport</strong></div><div style={{display:'flex',gap:8,alignItems:'center'}}><ShieldCheck size={19}/><span style={{fontWeight:850,textTransform:'capitalize'}}>{data.role} access</span></div></div></header>

    <section style={{maxWidth:1050,margin:'auto',padding:'32px 18px 14px'}}>
      <div style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:20,padding:22}}><div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><div><div style={{color:'#356943',fontSize:12,fontWeight:950}}>OWNER-APPROVED FIELD RECORD</div><h1 style={{fontSize:'clamp(36px,6vw,58px)',margin:'6px 0 10px'}}>{p.farmName||'Farm'} · {p.fieldId||'Field'}</h1><p style={{margin:0,color:'#5a675f',fontSize:17}}>{[p.producer,p.county,p.state,p.crop,p.harvestYear].filter(Boolean).join(' · ')}</p></div><div style={{display:'flex',gap:8,alignItems:'flex-start',flexWrap:'wrap'}}><Pill>45Z {p.readiness?.z45??0}%</Pill><Pill>ISCC {p.readiness?.iscc??0}%</Pill><Pill>CARB {p.readiness?.carb??0}%</Pill></div></div></div>
    </section>

    {data.permissions.record && <section style={{maxWidth:1050,margin:'auto',padding:'0 18px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
      <article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:17,padding:19}}><FileCheck2 color="#356943"/><h2>Production record</h2><div style={{display:'grid',gap:7,color:'#4f5e55'}}><span>Acres: <strong>{r.acres||'Not entered'}</strong></span><span>Actual yield: <strong>{r.actualYield||'Not entered'}</strong></span><span>Benchmark yield: <strong>{r.benchmarkYield||'Not entered'}</strong></span><span>Synthetic N: <strong>{r.syntheticN??'Not entered'}</strong></span><span>Tillage: <strong>{r.tillage||'Not entered'}</strong></span><span>Cover crop: <strong>{r.coverCrop||'Not entered'}</strong></span></div></article>
      <article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:17,padding:19}}><CheckCircle2 color="#356943"/><h2>Traceability</h2><div style={{display:'grid',gap:7,color:'#4f5e55'}}><span>Land-use history: <strong>{r.landUseHistory||'Not entered'}</strong></span><span>Nutrient plan: <strong>{r.nutrientPlan?'Yes':'No'}</strong></span><span>Nutrient records: <strong>{r.nutrientRecords?'Yes':'No'}</strong></span><span>Traceability: <strong>{r.traceability?'Yes':'No'}</strong></span><span>Self-declaration: <strong>{r.selfDeclaration?'Yes':'No'}</strong></span></div></article>
      <article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:17,padding:19}}><ShieldCheck color="#356943"/><h2>Water context</h2><div style={{display:'grid',gap:7,color:'#4f5e55'}}><span>Source: <strong>{r.waterSource||'Not entered'}</strong></span><span>Allocation: <strong>{r.annualAllocationAf||0} acre-ft</strong></span><span>Expected need: <strong>{r.expectedNeedAf||0} acre-ft</strong></span><span>Modeled shortfall: <strong>{waterGap} acre-ft</strong></span><span>Pumping cost: <strong>${Number(r.pumpingCostPerAf||0).toLocaleString()}/acre-ft</strong></span></div></article>
    </section>}

    {data.permissions.boundary && <section style={{maxWidth:1050,margin:'auto',padding:'16px 18px 0'}}><article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:20}}><div style={{display:'flex',gap:9,alignItems:'center',marginBottom:14}}><MapPinned color="#356943"/><h2 style={{margin:0}}>GIS field boundary</h2></div><BoundaryMap geo={p.boundaryGeoJson}/></article></section>}

    {data.permissions.documents && <section style={{maxWidth:1050,margin:'auto',padding:'16px 18px 0'}}><article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:20}}><h2 style={{marginTop:0}}>Shared evidence documents</h2>{data.documents.length?<div style={{display:'grid',gap:9}}>{data.documents.map(d=><div key={d.id} style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',padding:'11px 0',borderTop:'1px solid #edf0ea'}}><div><strong>{d.label||d.filename}</strong><div style={{fontSize:12,color:'#667169'}}>{d.evidenceType} · {d.filename}</div></div>{d.url?<a href={d.url} target="_blank" rel="noreferrer" style={{display:'inline-flex',gap:6,alignItems:'center',color:'#285b38',fontWeight:900,textDecoration:'none'}}><Download size={16}/>Open</a>:<span>Unavailable</span>}</div>)}</div>:<p style={{color:'#667169'}}>No documents were shared with this link.</p>}</article></section>}

    {data.permissions.review && <section style={{maxWidth:1050,margin:'auto',padding:'16px 18px 0'}}><article style={{background:'#163d2a',color:'#fff',borderRadius:18,padding:22}}><div style={{fontSize:12,color:'#c8e2ac',fontWeight:950}}>REVIEW RESPONSE</div><h2 style={{fontSize:30,margin:'6px 0 14px'}}>Return the decision to the producer.</h2>{sent?<div style={{background:'#ffffff14',borderRadius:14,padding:18}}><CheckCircle2 color="#c8e2ac"/><h3>Review received.</h3><p style={{color:'#dbe8df',marginBottom:0}}>Your response is now attached to this Farm Passport for the owner to review.</p></div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}><label style={{display:'grid',gap:5,fontWeight:800}}>Your name<input value={reviewerName} onChange={e=>setReviewerName(e.target.value)} style={{padding:11,borderRadius:9,border:'none'}}/></label><label style={{display:'grid',gap:5,fontWeight:800}}>Organization<input value={organization} onChange={e=>setOrganization(e.target.value)} style={{padding:11,borderRadius:9,border:'none'}}/></label><label style={{display:'grid',gap:5,fontWeight:800}}>Review status<select value={reviewStatus} onChange={e=>setReviewStatus(e.target.value)} style={{padding:11,borderRadius:9,border:'none'}}><option value="received">Received</option><option value="needs_information">Needs information</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></label><label style={{display:'grid',gap:5,fontWeight:800,gridColumn:'1/-1'}}>Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} style={{padding:11,borderRadius:9,border:'none',resize:'vertical'}}/></label><label style={{display:'grid',gap:5,fontWeight:800,gridColumn:'1/-1'}}>Requested items, one per line<textarea value={requested} onChange={e=>setRequested(e.target.value)} rows={3} style={{padding:11,borderRadius:9,border:'none',resize:'vertical'}}/></label><div style={{gridColumn:'1/-1'}}><button disabled={sending} onClick={submit} style={{background:'#c8e2ac',color:'#163d2a',border:'none',borderRadius:10,padding:'12px 16px',fontWeight:950,cursor:'pointer'}}>{sending?'Submitting…':'Submit review'}</button>{error&&<div style={{marginTop:10,color:'#ffd7ca'}}>{error}</div>}</div></div>}</article></section>}

    <footer style={{maxWidth:1050,margin:'auto',padding:'22px 18px',color:'#667169',fontSize:12,lineHeight:1.5}}>This owner-approved review room organizes records and evidence. Aridon does not certify program eligibility or replace the decision of a buyer, verifier, auditor, tax professional, or program administrator. Link expires {new Date(data.expiresAt).toLocaleString()}.</footer>
  </main>;
}
