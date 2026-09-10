'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, Droplets, FileCheck2, Leaf, Plus, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

type EvidenceKey = 'yield' | 'nitrogen' | 'nutrient' | 'land' | 'gis' | 'traceability' | 'water' | 'attestation';
type FieldRecord = {
  id: string;
  fieldId: string;
  farm: string;
  producer: string;
  countyState: string;
  crop: string;
  acres: number;
  harvestYear: number;
  landUseHistory: string;
  actualYield: number;
  benchmarkYield: number;
  syntheticN: number;
  nitrificationInhibitor: boolean;
  manure: string;
  tillage: string;
  coverCrop: string;
  nutrientPlan: boolean;
  nutrientRecords: boolean;
  gisBoundary: boolean;
  selfDeclaration: boolean;
  traceability: boolean;
  sustainabilityAttestation: boolean;
  waterSource: string;
  annualAllocationAf: number;
  expectedNeedAf: number;
  pumpingCostPerAf: number;
  waterQualityRisk: number;
  infrastructureRisk: number;
  premiumPerUnit: number;
  waterSavingsPerAcre: number;
  inputSavingsPerAcre: number;
  evidence: Record<EvidenceKey, boolean>;
};

const STORAGE_KEY = 'aridon-ag-field-passport-v2';
const currentYear = new Date().getFullYear();

const blankField = (n = 1): FieldRecord => ({
  id: `${Date.now()}-${n}`,
  fieldId: `FIELD-${String(n).padStart(3, '0')}`,
  farm: '', producer: '', countyState: '', crop: 'Corn', acres: 0, harvestYear: currentYear,
  landUseHistory: '', actualYield: 0, benchmarkYield: 0, syntheticN: 0, nitrificationInhibitor: false,
  manure: 'None', tillage: 'Conventional', coverCrop: 'None', nutrientPlan: false, nutrientRecords: false,
  gisBoundary: false, selfDeclaration: false, traceability: false, sustainabilityAttestation: false,
  waterSource: 'Irrigation district', annualAllocationAf: 0, expectedNeedAf: 0, pumpingCostPerAf: 0,
  waterQualityRisk: 2, infrastructureRisk: 2, premiumPerUnit: 0, waterSavingsPerAcre: 0, inputSavingsPerAcre: 0,
  evidence: { yield:false, nitrogen:false, nutrient:false, land:false, gis:false, traceability:false, water:false, attestation:false },
});

const sample: FieldRecord = {
  ...blankField(1),
  id: 'sample-1', fieldId:'NORTH-40', farm:'Demo Farm', producer:'Producer', countyState:'San Juan County, NM', crop:'Corn', acres:40,
  landUseHistory:'Continuous cropland', actualYield:185, benchmarkYield:178, syntheticN:165, nitrificationInhibitor:true,
  manure:'None', tillage:'Reduced till', coverCrop:'Winter rye', nutrientPlan:true, nutrientRecords:true, gisBoundary:true,
  selfDeclaration:false, traceability:true, sustainabilityAttestation:false, waterSource:'Irrigation district', annualAllocationAf:105,
  expectedNeedAf:120, pumpingCostPerAf:22, waterQualityRisk:2, infrastructureRisk:3, premiumPerUnit:0.08,
  waterSavingsPerAcre:18, inputSavingsPerAcre:24,
  evidence:{ yield:true, nitrogen:true, nutrient:true, land:true, gis:true, traceability:true, water:false, attestation:false },
};

function pct(done: boolean[]) { return Math.round((done.filter(Boolean).length / Math.max(done.length, 1)) * 100); }
function money(n: number) { return n.toLocaleString(undefined, { style:'currency', currency:'USD', maximumFractionDigits:0 }); }

function readiness(field: FieldRecord) {
  const base = [!!field.fieldId, !!field.farm, !!field.producer, !!field.countyState, !!field.crop, field.acres>0, !!field.harvestYear, !!field.landUseHistory];
  const z45 = [...base, field.actualYield>0, field.benchmarkYield>0, field.syntheticN>=0, !!field.tillage, !!field.coverCrop, field.nutrientPlan, field.nutrientRecords, field.evidence.yield, field.evidence.nitrogen, field.evidence.nutrient];
  const iscc = [...base, field.traceability, field.selfDeclaration, field.evidence.land, field.evidence.traceability];
  const carb = [...base, field.gisBoundary, field.traceability, field.sustainabilityAttestation, field.evidence.gis, field.evidence.traceability, field.evidence.attestation];
  return { z45:pct(z45), iscc:pct(iscc), carb:pct(carb) };
}

function waterScore(field: FieldRecord) {
  const shortfall = Math.max(0, field.expectedNeedAf - field.annualAllocationAf);
  const shortfallPct = field.expectedNeedAf > 0 ? Math.min(100, shortfall / field.expectedNeedAf * 100) : 0;
  const score = Math.round(Math.min(100, shortfallPct * 0.6 + field.waterQualityRisk * 8 + field.infrastructureRisk * 8));
  return { score, shortfall, shortfallPct };
}

function opportunity(field: FieldRecord) {
  const cropPremium = field.acres * field.actualYield * field.premiumPerUnit;
  const water = field.acres * field.waterSavingsPerAcre;
  const inputs = field.acres * field.inputSavingsPerAcre;
  return { cropPremium, water, inputs, total:cropPremium + water + inputs };
}

const inputStyle: React.CSSProperties = { width:'100%', boxSizing:'border-box', padding:'10px 11px', border:'1px solid #ccd8c8', borderRadius:9, background:'#fff', fontSize:14 };
const labelStyle: React.CSSProperties = { display:'grid', gap:5, fontSize:12, fontWeight:850, color:'#4b5b51' };
const card: React.CSSProperties = { background:'#fff', border:'1px solid #d7e0d3', borderRadius:18, padding:20 };

export default function FarmPassportPage() {
  const [fields, setFields] = useState<FieldRecord[]>([sample]);
  const [selectedId, setSelectedId] = useState(sample.id);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as FieldRecord[];
        if (Array.isArray(saved) && saved.length) { setFields(saved); setSelectedId(saved[0].id); }
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fields)); } catch {}
  }, [fields, loaded]);

  const field = fields.find(f => f.id === selectedId) || fields[0];
  const ready = useMemo(() => readiness(field), [field]);
  const water = useMemo(() => waterScore(field), [field]);
  const upside = useMemo(() => opportunity(field), [field]);

  const update = <K extends keyof FieldRecord>(key: K, value: FieldRecord[K]) => {
    setFields(prev => prev.map(f => f.id === field.id ? { ...f, [key]: value } : f));
  };
  const toggleEvidence = (key: EvidenceKey) => update('evidence', { ...field.evidence, [key]:!field.evidence[key] });
  const addField = () => {
    const next = blankField(fields.length + 1);
    setFields(prev => [...prev, next]); setSelectedId(next.id);
  };
  const exportPackage = () => {
    const payload = { generatedAt:new Date().toISOString(), ownerReviewRequired:true, field, readiness:ready, waterRisk:water, scenarioOpportunity:upside };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href=url; a.download=`aridon-field-passport-${field.fieldId || 'field'}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const eva = useMemo(() => {
    const notes: string[] = [];
    if (ready.z45 < 85) notes.push(`45Z / FD-CIC readiness is ${ready.z45}%. Finish the missing evidence before treating this field as submission-ready.`);
    if (!field.evidence.water) notes.push('Add irrigation or meter evidence so water use can be tied to field economics and drought exposure.');
    if (water.shortfall > 0) notes.push(`Current scenario shows a ${water.shortfall.toFixed(1)} acre-foot water gap. Compare crop demand, allocation and supplemental supply before the next commitment.`);
    if (!field.selfDeclaration || !field.sustainabilityAttestation) notes.push('ISCC/CARB declarations are incomplete. Keep them owner-reviewed and separate from raw private operating data.');
    if (field.actualYield > 0 && field.benchmarkYield > 0 && field.actualYield < field.benchmarkYield) notes.push('Actual yield is below benchmark. Review water timing, nutrient timing and field-specific constraints before assuming a market premium fixes the margin.');
    if (!notes.length) notes.push('This field is unusually complete. Next step: owner review, verifier/buyer requirements check, and controlled export of only the evidence they request.');
    return notes.slice(0,4);
  }, [field, ready, water]);

  if (!field) return null;

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#17241c',fontFamily:'Arial,sans-serif',paddingBottom:60}}>
    <header style={{background:'#143d2a',color:'#fff',padding:'15px 16px',position:'sticky',top:0,zIndex:20}}>
      <div style={{maxWidth:1180,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div><div style={{fontSize:11,color:'#c8e2ac',fontWeight:950,letterSpacing:1}}>ARIDON AG</div><strong style={{fontSize:22}}>Field Passport</strong></div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}><Link href="/ag" style={{color:'#fff',textDecoration:'none',fontWeight:850,display:'inline-flex',gap:5,alignItems:'center'}}><ArrowLeft size={17}/> Ag Home</Link><button onClick={exportPackage} style={{border:0,background:'#c8e2ac',color:'#143d2a',padding:'10px 12px',borderRadius:9,fontWeight:950,cursor:'pointer'}}><Download size={16} style={{verticalAlign:'middle',marginRight:5}}/>Export field package</button></div>
      </div>
    </header>

    <section style={{maxWidth:1180,margin:'auto',padding:'28px 16px 0'}}>
      <div className="hero-grid" style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(260px,1fr)',gap:16,alignItems:'stretch'}}>
        <div style={{...card,background:'#173f2c',color:'#fff',border:0}}><div style={{color:'#c8e2ac',fontSize:12,fontWeight:950}}>FARM ONCE. RECORD ONCE. QUALIFY EVERYWHERE.</div><h1 style={{fontSize:'clamp(38px,6vw,62px)',lineHeight:.98,margin:'9px 0 13px',letterSpacing:-2}}>One field record for compliance, water risk and profit decisions.</h1><p style={{margin:0,color:'#dce8df',fontSize:17,lineHeight:1.55,maxWidth:760}}>Capture the evidence once, map it to 45Z, ISCC and CARB, see what is missing, measure water exposure and model the dollars before anything leaves the farm.</p></div>
        <div style={card}><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>SELECT FIELD</div><select value={field.id} onChange={e=>setSelectedId(e.target.value)} style={{...inputStyle,marginTop:7}}>{fields.map(f=><option key={f.id} value={f.id}>{f.fieldId || 'Untitled field'} · {f.crop || 'Crop'}</option>)}</select><button onClick={addField} style={{width:'100%',marginTop:9,border:'1px solid #356943',background:'#eff6e9',color:'#285336',padding:'10px 12px',borderRadius:9,fontWeight:950,cursor:'pointer'}}><Plus size={16} style={{verticalAlign:'middle',marginRight:5}}/>Add another field</button><div style={{marginTop:10,fontSize:12,color:'#657168'}}>Saved automatically on this device.</div></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginTop:14}}>
        <div style={card}><FileCheck2 size={23} color="#356943"/><div style={{fontSize:12,fontWeight:900,color:'#617067',marginTop:7}}>45Z / FD-CIC</div><strong style={{fontSize:31}}>{ready.z45}%</strong><div style={{fontSize:12,color:'#6a766f'}}>record readiness</div></div>
        <div style={card}><ShieldCheck size={23} color="#356943"/><div style={{fontSize:12,fontWeight:900,color:'#617067',marginTop:7}}>ISCC / CARB</div><strong style={{fontSize:31}}>{Math.round((ready.iscc+ready.carb)/2)}%</strong><div style={{fontSize:12,color:'#6a766f'}}>combined readiness</div></div>
        <div style={card}><Droplets size={23} color={water.score>=60?'#9a522d':'#356943'}/><div style={{fontSize:12,fontWeight:900,color:'#617067',marginTop:7}}>Water risk</div><strong style={{fontSize:31}}>{water.score}/100</strong><div style={{fontSize:12,color:'#6a766f'}}>{water.shortfall>0?`${water.shortfall.toFixed(1)} AF modeled gap`:'No modeled allocation gap'}</div></div>
        <div style={card}><TrendingUp size={23} color="#356943"/><div style={{fontSize:12,fontWeight:900,color:'#617067',marginTop:7}}>Scenario upside</div><strong style={{fontSize:31}}>{money(upside.total)}</strong><div style={{fontSize:12,color:'#6a766f'}}>illustrative, not guaranteed</div></div>
      </div>
    </section>

    <section style={{maxWidth:1180,margin:'auto',padding:'16px',display:'grid',gap:16}}>
      <div style={card}>
        <div style={{display:'flex',gap:9,alignItems:'center'}}><Leaf size={24} color="#356943"/><div><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>1 · UNIVERSAL FIELD RECORD</div><h2 style={{margin:'2px 0',fontSize:28}}>Enter it once.</h2></div></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10,marginTop:15}}>
          <label style={labelStyle}>Field ID<input style={inputStyle} value={field.fieldId} onChange={e=>update('fieldId',e.target.value)}/></label>
          <label style={labelStyle}>Farm<input style={inputStyle} value={field.farm} onChange={e=>update('farm',e.target.value)}/></label>
          <label style={labelStyle}>Producer<input style={inputStyle} value={field.producer} onChange={e=>update('producer',e.target.value)}/></label>
          <label style={labelStyle}>County / State<input style={inputStyle} value={field.countyState} onChange={e=>update('countyState',e.target.value)}/></label>
          <label style={labelStyle}>Crop / feedstock<input style={inputStyle} value={field.crop} onChange={e=>update('crop',e.target.value)}/></label>
          <label style={labelStyle}>Acres<input type="number" style={inputStyle} value={field.acres} onChange={e=>update('acres',Number(e.target.value))}/></label>
          <label style={labelStyle}>Harvest year<input type="number" style={inputStyle} value={field.harvestYear} onChange={e=>update('harvestYear',Number(e.target.value))}/></label>
          <label style={labelStyle}>Land-use history<input style={inputStyle} value={field.landUseHistory} onChange={e=>update('landUseHistory',e.target.value)}/></label>
          <label style={labelStyle}>Actual yield / acre<input type="number" style={inputStyle} value={field.actualYield} onChange={e=>update('actualYield',Number(e.target.value))}/></label>
          <label style={labelStyle}>Benchmark yield / acre<input type="number" style={inputStyle} value={field.benchmarkYield} onChange={e=>update('benchmarkYield',Number(e.target.value))}/></label>
          <label style={labelStyle}>Synthetic N / acre<input type="number" style={inputStyle} value={field.syntheticN} onChange={e=>update('syntheticN',Number(e.target.value))}/></label>
          <label style={labelStyle}>Manure / organic fertilizer<input style={inputStyle} value={field.manure} onChange={e=>update('manure',e.target.value)}/></label>
          <label style={labelStyle}>Tillage<input style={inputStyle} value={field.tillage} onChange={e=>update('tillage',e.target.value)}/></label>
          <label style={labelStyle}>Cover crop<input style={inputStyle} value={field.coverCrop} onChange={e=>update('coverCrop',e.target.value)}/></label>
        </div>
        <div style={{display:'flex',gap:14,flexWrap:'wrap',marginTop:14,fontSize:13}}>
          {([['nitrificationInhibitor','Nitrification inhibitor'],['nutrientPlan','Nutrient management plan'],['nutrientRecords','Nutrient application records'],['gisBoundary','GIS boundary'],['traceability','Quantity & traceability'],['selfDeclaration','ISCC self-declaration'],['sustainabilityAttestation','CARB sustainability attestation']] as [keyof FieldRecord,string][]).map(([key,label])=><label key={String(key)} style={{display:'flex',gap:6,alignItems:'center'}}><input type="checkbox" checked={Boolean(field[key])} onChange={e=>update(key,e.target.checked as never)}/>{label}</label>)}
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:12,fontWeight:950,color:'#356943'}}>2 · COMPLIANCE AUTOPILOT</div><h2 style={{fontSize:28,margin:'4px 0 14px'}}>See the gaps before a buyer, verifier or advisor does.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
          {[['45Z / USDA FD-CIC',ready.z45],['ISCC EU / RED III',ready.iscc],['CARB LCFS',ready.carb]].map(([name,value])=><div key={String(name)} style={{background:'#f7f8f3',border:'1px solid #dfe5dc',borderRadius:13,padding:14}}><strong>{name}</strong><div style={{height:9,background:'#e1e7de',borderRadius:99,overflow:'hidden',margin:'10px 0 7px'}}><div style={{height:'100%',width:`${value}%`,background:'#356943'}}/></div><div style={{fontSize:13,color:'#5c6961'}}>{value}% ready · owner/verifier review still required</div></div>)}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
        <div style={card}><div style={{display:'flex',gap:8,alignItems:'center'}}><Droplets size={23} color="#356943"/><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>3 · WATER SECURITY</div></div><h2 style={{fontSize:27,margin:'6px 0 12px'}}>Put water beside crop economics.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:9}}>
          <label style={labelStyle}>Water source<input style={inputStyle} value={field.waterSource} onChange={e=>update('waterSource',e.target.value)}/></label>
          <label style={labelStyle}>Allocation (acre-feet)<input type="number" style={inputStyle} value={field.annualAllocationAf} onChange={e=>update('annualAllocationAf',Number(e.target.value))}/></label>
          <label style={labelStyle}>Expected need (acre-feet)<input type="number" style={inputStyle} value={field.expectedNeedAf} onChange={e=>update('expectedNeedAf',Number(e.target.value))}/></label>
          <label style={labelStyle}>Pumping cost / AF<input type="number" style={inputStyle} value={field.pumpingCostPerAf} onChange={e=>update('pumpingCostPerAf',Number(e.target.value))}/></label>
          <label style={labelStyle}>Water quality risk 1-5<input type="range" min="1" max="5" value={field.waterQualityRisk} onChange={e=>update('waterQualityRisk',Number(e.target.value))}/><span>{field.waterQualityRisk}</span></label>
          <label style={labelStyle}>Infrastructure risk 1-5<input type="range" min="1" max="5" value={field.infrastructureRisk} onChange={e=>update('infrastructureRisk',Number(e.target.value))}/><span>{field.infrastructureRisk}</span></label>
        </div>{water.shortfall>0&&<div style={{marginTop:12,padding:11,borderRadius:10,background:'#fff3e9',border:'1px solid #e3c3a7',fontSize:13}}><AlertTriangle size={16} style={{verticalAlign:'middle',marginRight:5}}/>Modeled shortfall: <strong>{water.shortfall.toFixed(1)} acre-feet</strong> ({water.shortfallPct.toFixed(0)}% of expected need).</div>}</div>

        <div style={card}><div style={{display:'flex',gap:8,alignItems:'center'}}><TrendingUp size={23} color="#356943"/><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>4 · REVENUE OPTIMIZER</div></div><h2 style={{fontSize:27,margin:'6px 0 12px'}}>Turn compliance into a business case.</h2><div style={{display:'grid',gap:9}}><label style={labelStyle}>Illustrative buyer premium / yield unit<input type="number" step="0.01" style={inputStyle} value={field.premiumPerUnit} onChange={e=>update('premiumPerUnit',Number(e.target.value))}/></label><label style={labelStyle}>Water savings / acre<input type="number" style={inputStyle} value={field.waterSavingsPerAcre} onChange={e=>update('waterSavingsPerAcre',Number(e.target.value))}/></label><label style={labelStyle}>Input savings / acre<input type="number" style={inputStyle} value={field.inputSavingsPerAcre} onChange={e=>update('inputSavingsPerAcre',Number(e.target.value))}/></label></div><div style={{marginTop:13,display:'grid',gap:5,fontSize:13}}><div>Crop-market scenario: <strong>{money(upside.cropPremium)}</strong></div><div>Water savings scenario: <strong>{money(upside.water)}</strong></div><div>Input savings scenario: <strong>{money(upside.inputs)}</strong></div><div style={{fontSize:22,marginTop:4}}>Total modeled upside: <strong>{money(upside.total)}</strong></div></div><p style={{fontSize:11,color:'#6d7771',lineHeight:1.45}}>Scenario only. 45Z is a clean-fuel producer tax credit; any farm-level premium depends on contracts, program rules, verification and market terms.</p></div>
      </div>

      <div style={card}><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>5 · EVIDENCE VAULT</div><h2 style={{fontSize:28,margin:'4px 0 12px'}}>Proof follows the field.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8}}>{([['yield','Yield / harvest record'],['nitrogen','Nitrogen / fertilizer receipt'],['nutrient','Nutrient application log'],['land','Land-use / eligibility proof'],['gis','GIS boundary file'],['traceability','Quantity / chain-of-custody record'],['water','Water meter / irrigation evidence'],['attestation','Signed declaration / attestation']] as [EvidenceKey,string][]).map(([key,label])=><button key={key} onClick={()=>toggleEvidence(key)} style={{textAlign:'left',display:'flex',gap:9,alignItems:'center',padding:12,borderRadius:10,border:`1px solid ${field.evidence[key]?'#9dbb90':'#d8ded5'}`,background:field.evidence[key]?'#eef6e9':'#fafaf7',cursor:'pointer'}}>{field.evidence[key]?<CheckCircle2 size={19} color="#356943"/>:<div style={{width:19,height:19,border:'2px solid #9ba69f',borderRadius:99}}/>}<strong style={{fontSize:13}}>{label}</strong></button>)}</div><p style={{fontSize:12,color:'#657168',marginBottom:0}}>This build tracks evidence readiness and exports the owner-reviewed package. Secure file storage and verifier-specific document exchange can sit on top of this record without changing the farmer's workflow.</p></div>

      <div style={{...card,background:'#173f2c',color:'#fff',border:0}}><div style={{display:'flex',gap:8,alignItems:'center',color:'#c8e2ac'}}><Sparkles size={22}/><strong style={{fontSize:12}}>6 · EVA FIELD ADVISOR</strong></div><h2 style={{fontSize:29,margin:'7px 0 12px'}}>What needs attention next?</h2><div style={{display:'grid',gap:8}}>{eva.map((note,i)=><div key={note} style={{display:'flex',gap:9,alignItems:'flex-start',background:'#ffffff0d',padding:11,borderRadius:10,lineHeight:1.45}}><div style={{minWidth:27,height:27,borderRadius:99,background:'#c8e2ac',color:'#173f2c',display:'grid',placeItems:'center',fontWeight:950}}>{i+1}</div><span>{note}</span></div>)}</div><div style={{marginTop:12,fontSize:12,color:'#cbdccf'}}>Eva's guidance here is decision support, not certification. Final eligibility and submissions still require current program rules and the appropriate owner/verifier review.</div></div>
    </section>

    <style jsx>{`@media(max-width:760px){.hero-grid{grid-template-columns:1fr!important}}`}</style>
  </main>;
}
