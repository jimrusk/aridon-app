'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Cloud, Leaf } from 'lucide-react';
import FarmPassportCollaboration from '../../../../components/FarmPassportCollaboration';

const STORAGE_KEY = 'aridon-ag-field-passport-v2';
const currentYear = new Date().getFullYear();

const blankField = () => ({
  id: `local-${Date.now()}`,
  fieldId: 'FIELD-001',
  farm: '',
  producer: '',
  countyState: '',
  crop: 'Corn',
  acres: 0,
  harvestYear: currentYear,
  landUseHistory: '',
  actualYield: 0,
  benchmarkYield: 0,
  syntheticN: 0,
  nitrificationInhibitor: false,
  manure: 'None',
  tillage: 'Conventional',
  coverCrop: 'None',
  nutrientPlan: false,
  nutrientRecords: false,
  gisBoundary: false,
  selfDeclaration: false,
  traceability: false,
  sustainabilityAttestation: false,
  waterSource: 'Irrigation district',
  annualAllocationAf: 0,
  expectedNeedAf: 0,
  pumpingCostPerAf: 0,
  waterQualityRisk: 2,
  infrastructureRisk: 2,
  premiumPerUnit: 0,
  waterSavingsPerAcre: 0,
  inputSavingsPerAcre: 0,
  evidence: { yield:false, nitrogen:false, nutrient:false, land:false, gis:false, traceability:false, water:false, attestation:false },
});

type LocalField = ReturnType<typeof blankField> & Record<string, unknown>;

function pct(done:boolean[]){return Math.round(done.filter(Boolean).length/Math.max(1,done.length)*100);}
function readiness(field:Record<string,unknown>){
  const evidence=(field.evidence&&typeof field.evidence==='object'?field.evidence:{}) as Record<string,unknown>;
  const base=[Boolean(field.fieldId),Boolean(field.farm),Boolean(field.producer),Boolean(field.countyState),Boolean(field.crop),Number(field.acres)>0,Number(field.harvestYear)>0,Boolean(field.landUseHistory)];
  const z45=[...base,Number(field.actualYield)>0,Number(field.benchmarkYield)>0,Number(field.syntheticN)>=0,Boolean(field.tillage),Boolean(field.coverCrop),field.nutrientPlan===true,field.nutrientRecords===true,evidence.yield===true,evidence.nitrogen===true,evidence.nutrient===true];
  const iscc=[...base,field.traceability===true,field.selfDeclaration===true,evidence.land===true,evidence.traceability===true];
  const carb=[...base,field.gisBoundary===true,field.traceability===true,field.sustainabilityAttestation===true,evidence.gis===true,evidence.traceability===true,evidence.attestation===true];
  return {z45:pct(z45),iscc:pct(iscc),carb:pct(carb)};
}

export default function FarmPassportCloudPage(){
  const [fields,setFields]=useState<LocalField[]>([]);
  const [selectedId,setSelectedId]=useState('');
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    try{
      const raw=window.localStorage.getItem(STORAGE_KEY);
      const saved=raw?JSON.parse(raw):[];
      if(Array.isArray(saved)&&saved.length){
        setFields(saved as LocalField[]);
        setSelectedId(String(saved[0]?.id||''));
      }
    }catch{}
    setLoaded(true);
  },[]);

  const field=useMemo(()=>fields.find(item=>String(item.id)===selectedId)||fields[0]||blankField(),[fields,selectedId]);
  const ready=useMemo(()=>readiness(field),[field]);

  function importRecord(record:Record<string,unknown>){
    const merged={...blankField(),...record} as LocalField;
    const id=String(merged.id||`cloud-${Date.now()}`);
    merged.id=id;
    setFields(prev=>{
      const exists=prev.some(item=>String(item.id)===id);
      const next=exists?prev.map(item=>String(item.id)===id?merged:item):[...prev,merged];
      try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{}
      return next;
    });
    setSelectedId(id);
  }

  if(!loaded) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f4f1e8',fontFamily:'Arial,sans-serif'}}>Opening secure Farm Passport cloud…</main>;

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#17241c',fontFamily:'Arial,sans-serif',paddingBottom:60}}>
    <header style={{background:'#143d2a',color:'#fff',padding:'16px'}}><div style={{maxWidth:1180,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:11,color:'#c8e2ac',fontWeight:950,letterSpacing:1}}>ARIDON AG</div><strong style={{fontSize:24}}>Secure Farm Passport Cloud</strong></div><Link href="/ag/farm-passport" style={{color:'#fff',textDecoration:'none',fontWeight:900,display:'inline-flex',gap:6,alignItems:'center'}}><ArrowLeft size={17}/> Field Passport</Link></div></header>

    <section style={{maxWidth:1180,margin:'auto',padding:'26px 16px 16px'}}>
      <div style={{background:'#173f2c',color:'#fff',borderRadius:18,padding:22,display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:18,alignItems:'center'}} className="cloud-hero"><div><div style={{display:'flex',gap:8,alignItems:'center',color:'#c8e2ac',fontSize:12,fontWeight:950}}><Cloud size={21}/> OWNER-CONTROLLED COLLABORATION</div><h1 style={{fontSize:'clamp(36px,5vw,58px)',lineHeight:1,margin:'8px 0 10px'}}>Take the field record beyond one phone.</h1><p style={{color:'#dce8df',fontSize:17,lineHeight:1.55,margin:0,maxWidth:760}}>Back it up securely, attach proof, capture the field boundary and give a buyer, verifier or auditor temporary access without exposing the rest of the farm workspace.</p></div><Leaf size={64} color="#c8e2ac"/></div>

      <div style={{background:'#fff',border:'1px solid #d7e0d3',borderRadius:16,padding:15,marginTop:14,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}><strong style={{fontSize:13}}>LOCAL FIELD:</strong>{fields.length?<><select value={String(field.id)} onChange={e=>setSelectedId(e.target.value)} style={{flex:'1 1 260px',padding:'9px 10px',border:'1px solid #ccd8c8',borderRadius:9,background:'#fff'}}>{fields.map(item=><option key={String(item.id)} value={String(item.id)}>{String(item.fieldId||'Untitled field')} · {String(item.crop||'Crop')}</option>)}</select><span style={{fontSize:12,color:'#68756d'}}>Choose which on-device field to save or share.</span></>:<span style={{fontSize:13,color:'#68756d'}}>No local fields yet. You can still load an existing cloud record below, or create a field in Field Passport first.</span>}</div>
    </section>

    <section style={{maxWidth:1180,margin:'auto',padding:'0 16px'}}><FarmPassportCollaboration field={field} readiness={ready} onImportRecord={importRecord}/></section>

    <style jsx>{`@media(max-width:760px){.cloud-hero{grid-template-columns:1fr!important}.cloud-hero>svg{display:none}}`}</style>
  </main>;
}
