'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, FileCheck2, MapPinned, ShieldCheck, Sprout, UploadCloud } from 'lucide-react';

type FieldRecord = {
  producer: string;
  farmName: string;
  fieldId: string;
  state: string;
  county: string;
  acres: string;
  crop: string;
  harvestYear: string;
  actualYield: string;
  benchmarkYield: string;
  syntheticN: string;
  nitrificationInhibitor: boolean;
  manureApplied: boolean;
  tillage: string;
  coverCrop: string;
  nutrientPlan: boolean;
  landUseHistory: boolean;
  gisBoundary: boolean;
  traceabilityDocs: boolean;
  sustainabilityAttestation: boolean;
  notes: string;
};

const EMPTY: FieldRecord = {
  producer: '', farmName: '', fieldId: '', state: '', county: '', acres: '', crop: 'Corn', harvestYear: '2026', actualYield: '', benchmarkYield: '', syntheticN: '', nitrificationInhibitor: false, manureApplied: false, tillage: 'No-till', coverCrop: 'None', nutrientPlan: false, landUseHistory: false, gisBoundary: false, traceabilityDocs: false, sustainabilityAttestation: false, notes: ''
};

const inputStyle = { width:'100%', padding:'12px 13px', border:'1px solid #ccd7ca', borderRadius:10, background:'#fff', fontSize:15 } as const;
const labelStyle = { display:'grid', gap:6, fontWeight:800, color:'#26372c', fontSize:13 } as const;

function downloadFile(name:string, body:string, type:string){
  const blob = new Blob([body], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FarmPassportPage(){
  const [record,setRecord] = useState<FieldRecord>(EMPTY);
  const [saved,setSaved] = useState(false);

  useEffect(()=>{
    try {
      const raw = localStorage.getItem('aridon-farm-passport');
      if(raw) setRecord({...EMPTY,...JSON.parse(raw)});
    } catch {}
  },[]);

  const readiness = useMemo(()=>{
    const base = [record.producer,record.farmName,record.fieldId,record.state,record.county,record.acres,record.crop,record.harvestYear].filter(Boolean).length;
    const z45 = base + [record.actualYield,record.syntheticN,record.tillage,record.coverCrop,record.nutrientPlan].filter(Boolean).length;
    const iscc = base + [record.landUseHistory,record.traceabilityDocs,record.sustainabilityAttestation].filter(Boolean).length;
    const carb = base + [record.gisBoundary,record.landUseHistory,record.traceabilityDocs].filter(Boolean).length;
    return {
      z45: Math.min(100,Math.round(z45/13*100)),
      iscc: Math.min(100,Math.round(iscc/11*100)),
      carb: Math.min(100,Math.round(carb/11*100)),
    };
  },[record]);

  function patch<K extends keyof FieldRecord>(key:K,value:FieldRecord[K]){ setRecord(r=>({...r,[key]:value})); setSaved(false); }
  function save(){ localStorage.setItem('aridon-farm-passport',JSON.stringify(record)); setSaved(true); }
  function exportJson(){ downloadFile(`aridon-farm-passport-${record.fieldId||'field'}.json`,JSON.stringify({generatedAt:new Date().toISOString(),record,readiness},null,2),'application/json'); }
  function exportCsv(){
    const rows = Object.entries(record).map(([k,v])=>`"${k.replaceAll('"','""')}","${String(v).replaceAll('"','""')}"`);
    downloadFile(`aridon-farm-passport-${record.fieldId||'field'}.csv`,`Field,Value\n${rows.join('\n')}`,'text/csv');
  }

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif',paddingBottom:60}}>
    <header style={{background:'#163d2a',color:'#fff',padding:'16px 18px'}}><div style={{maxWidth:1120,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:12,fontWeight:950,color:'#c8e2ac',letterSpacing:1}}>ARIDON AG</div><h1 style={{margin:'3px 0 0',fontSize:28}}>Farm Passport</h1></div><Link href="/ag" style={{display:'inline-flex',alignItems:'center',gap:7,color:'#fff',textDecoration:'none',fontWeight:850}}><ArrowLeft size={18}/> Back to Aridon Ag</Link></div></header>

    <section style={{maxWidth:1120,margin:'auto',padding:'38px 18px 20px',display:'grid',gridTemplateColumns:'1.25fr .75fr',gap:18}} className="passport-grid">
      <div>
        <div style={{color:'#356943',fontSize:12,fontWeight:950}}>ENTER ONCE. REUSE ACROSS MARKETS.</div>
        <h2 style={{fontSize:'clamp(38px,6vw,62px)',lineHeight:1,letterSpacing:-2,margin:'8px 0 14px'}}>One field record. Multiple compliance pathways.</h2>
        <p style={{fontSize:18,lineHeight:1.6,color:'#526058',maxWidth:760}}>Capture the farm-level facts behind 45Z, ISCC and CARB workflows, keep supporting evidence together, and export an audit-ready package for review. Aridon organizes evidence and readiness. It does not certify eligibility or tax-credit qualification.</p>
      </div>
      <aside style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:20}}><ShieldCheck size={30} color="#356943"/><h3 style={{fontSize:24,margin:'9px 0'}}>Owner-controlled data</h3><p style={{color:'#5a675f',lineHeight:1.55,margin:0}}>This MVP saves the working record in this browser and lets the producer export a package. Sharing, auditor access and formal certification should remain explicit owner-approved actions.</p></aside>
    </section>

    <section style={{maxWidth:1120,margin:'auto',padding:'12px 18px 24px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}} className="passport-grid-3">
      {[
        ['45Z readiness',readiness.z45,'Yield, nitrogen, tillage, cover crop and nutrient-management evidence'],
        ['ISCC readiness',readiness.iscc,'Farm identity, land-use eligibility, traceability and sustainability evidence'],
        ['CARB readiness',readiness.carb,'GIS boundaries, feedstock quantity, land-use history and traceability evidence'],
      ].map(([title,pct,text])=><article key={String(title)} style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:16,padding:18}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><strong>{title}</strong><span style={{fontWeight:950,color:'#356943'}}>{pct}%</span></div><div style={{height:8,borderRadius:99,background:'#e7ece4',margin:'12px 0'}}><div style={{height:'100%',width:`${pct}%`,borderRadius:99,background:'#356943'}}/></div><p style={{margin:0,color:'#5a675f',fontSize:14,lineHeight:1.45}}>{text}</p></article>)}
    </section>

    <section style={{maxWidth:1120,margin:'auto',padding:'0 18px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}} className="passport-grid">
      <article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:20}}>
        <div style={{display:'flex',gap:9,alignItems:'center'}}><MapPinned size={24} color="#356943"/><h3 style={{margin:0,fontSize:26}}>Field identity</h3></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:18}} className="passport-grid">
          <label style={labelStyle}>Producer<input style={inputStyle} value={record.producer} onChange={e=>patch('producer',e.target.value)}/></label>
          <label style={labelStyle}>Farm / operation<input style={inputStyle} value={record.farmName} onChange={e=>patch('farmName',e.target.value)}/></label>
          <label style={labelStyle}>Field ID<input style={inputStyle} value={record.fieldId} onChange={e=>patch('fieldId',e.target.value)} placeholder="123-45"/></label>
          <label style={labelStyle}>Acres<input style={inputStyle} value={record.acres} onChange={e=>patch('acres',e.target.value)} inputMode="decimal"/></label>
          <label style={labelStyle}>State<input style={inputStyle} value={record.state} onChange={e=>patch('state',e.target.value)}/></label>
          <label style={labelStyle}>County<input style={inputStyle} value={record.county} onChange={e=>patch('county',e.target.value)}/></label>
          <label style={labelStyle}>Crop / feedstock<select style={inputStyle} value={record.crop} onChange={e=>patch('crop',e.target.value)}><option>Corn</option><option>Sorghum</option><option>Soybeans</option><option>Canola</option><option>Other</option></select></label>
          <label style={labelStyle}>Harvest year<input style={inputStyle} value={record.harvestYear} onChange={e=>patch('harvestYear',e.target.value)}/></label>
        </div>
      </article>

      <article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:20}}>
        <div style={{display:'flex',gap:9,alignItems:'center'}}><Sprout size={24} color="#356943"/><h3 style={{margin:0,fontSize:26}}>Production & practice data</h3></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:18}} className="passport-grid">
          <label style={labelStyle}>Actual yield<input style={inputStyle} value={record.actualYield} onChange={e=>patch('actualYield',e.target.value)} placeholder="bu/acre or ton/acre"/></label>
          <label style={labelStyle}>Benchmark yield<input style={inputStyle} value={record.benchmarkYield} onChange={e=>patch('benchmarkYield',e.target.value)}/></label>
          <label style={labelStyle}>Synthetic N applied<input style={inputStyle} value={record.syntheticN} onChange={e=>patch('syntheticN',e.target.value)} placeholder="lb N/acre"/></label>
          <label style={labelStyle}>Tillage<select style={inputStyle} value={record.tillage} onChange={e=>patch('tillage',e.target.value)}><option>No-till</option><option>Reduced till</option><option>Conventional till</option></select></label>
          <label style={labelStyle}>Cover crop<select style={inputStyle} value={record.coverCrop} onChange={e=>patch('coverCrop',e.target.value)}><option>None</option><option>Single species</option><option>Multi-species</option></select></label>
        </div>
        <div style={{display:'grid',gap:10,marginTop:16}}>
          {[['nitrificationInhibitor','Nitrification inhibitor used'],['manureApplied','Manure / organic fertilizer applied'],['nutrientPlan','Nutrient management plan on file']].map(([key,text])=><label key={key} style={{display:'flex',gap:9,alignItems:'center',fontWeight:750}}><input type="checkbox" checked={Boolean(record[key as keyof FieldRecord])} onChange={e=>patch(key as keyof FieldRecord,e.target.checked as never)}/>{text}</label>)}
        </div>
      </article>

      <article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:20}}>
        <div style={{display:'flex',gap:9,alignItems:'center'}}><FileCheck2 size={24} color="#356943"/><h3 style={{margin:0,fontSize:26}}>Evidence & traceability</h3></div>
        <div style={{display:'grid',gap:11,marginTop:18}}>
          {[['gisBoundary','GIS / field boundary verified'],['landUseHistory','Land-use history documented'],['traceabilityDocs','Delivery / scale / chain-of-custody records available'],['sustainabilityAttestation','Sustainability / eligibility attestation available']].map(([key,text])=><label key={key} style={{display:'flex',gap:9,alignItems:'center',fontWeight:750}}><input type="checkbox" checked={Boolean(record[key as keyof FieldRecord])} onChange={e=>patch(key as keyof FieldRecord,e.target.checked as never)}/>{text}</label>)}
          <label style={labelStyle}>Notes / missing evidence<textarea style={{...inputStyle,minHeight:110,resize:'vertical'}} value={record.notes} onChange={e=>patch('notes',e.target.value)} placeholder="Receipts, maps, declarations, agronomist notes, buyer requirements..."/></label>
        </div>
      </article>

      <article style={{background:'#163d2a',color:'#fff',borderRadius:18,padding:20}}>
        <div style={{display:'flex',gap:9,alignItems:'center'}}><UploadCloud size={24} color="#c8e2ac"/><h3 style={{margin:0,fontSize:26}}>Prepare the package</h3></div>
        <p style={{color:'#dbe8df',lineHeight:1.55}}>Save the field record, then export it for an ethanol plant, verifier, consultant, auditor or buyer. Formal submission should happen only after the producer reviews the package.</p>
        <div style={{display:'grid',gap:10,marginTop:18}}>
          <button onClick={save} style={{padding:'13px 15px',borderRadius:11,border:'none',fontWeight:950,cursor:'pointer',background:'#c8e2ac',color:'#163d2a'}}>{saved?'Saved in this browser ✓':'Save Farm Passport'}</button>
          <button onClick={exportJson} style={{padding:'13px 15px',borderRadius:11,border:'1px solid #dbe8df',fontWeight:900,cursor:'pointer',background:'transparent',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><Download size={18}/> Export JSON package</button>
          <button onClick={exportCsv} style={{padding:'13px 15px',borderRadius:11,border:'1px solid #dbe8df',fontWeight:900,cursor:'pointer',background:'transparent',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><Download size={18}/> Export CSV package</button>
        </div>
        <div style={{marginTop:18,paddingTop:15,borderTop:'1px solid #ffffff33',fontSize:13,color:'#dbe8df',lineHeight:1.5}}><CheckCircle2 size={16} style={{verticalAlign:'middle',marginRight:6}}/>Next build step: secure cloud storage, document upload, GIS mapping, role-based auditor access, buyer-specific templates and approved sharing.</div>
      </article>
    </section>

    <style jsx>{`@media(max-width:800px){.passport-grid,.passport-grid-3{grid-template-columns:1fr!important}}`}</style>
  </main>
}
