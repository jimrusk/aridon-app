'use client';

import { useMemo, useState } from 'react';

const inputStyle: React.CSSProperties = { width:'100%', boxSizing:'border-box', padding:'12px 13px', border:'1px solid #cbd9cf', borderRadius:10, fontSize:15, background:'#fff', color:'#183b4e' };
const labelStyle: React.CSSProperties = { display:'grid', gap:6, fontSize:13, fontWeight:800, color:'#365464' };

const SQ_IN_PER_ACRE = 43560 * 144;

function nfmt(n:number, digits=0){
  return new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(Number.isFinite(n)?n:0);
}
function money(n:number){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
}

export default function AgAcreCalculator(){
  const [crop,setCrop]=useState('Corn');
  const [acres,setAcres]=useState(100);
  const [rowSpacing,setRowSpacing]=useState(30);
  const [plantSpacing,setPlantSpacing]=useState(8);
  const [germination,setGermination]=useState(92);
  const [yieldPerPlant,setYieldPerPlant]=useState(0.65);
  const [pricePerUnit,setPricePerUnit]=useState(0.18);
  const [costPerAcre,setCostPerAcre]=useState(650);

  const r=useMemo(()=>{
    const rs=Math.max(.1,rowSpacing);
    const ps=Math.max(.1,plantSpacing);
    const planted=SQ_IN_PER_ACRE/(rs*ps);
    const established=planted*Math.min(100,Math.max(0,germination))/100;
    const yieldAcre=established*Math.max(0,yieldPerPlant);
    const grossAcre=yieldAcre*Math.max(0,pricePerUnit);
    const netAcre=grossAcre-Math.max(0,costPerAcre);
    return {
      planted, established, yieldAcre, grossAcre, netAcre,
      totalSeed: planted*Math.max(0,acres),
      totalYield: yieldAcre*Math.max(0,acres),
      totalGross: grossAcre*Math.max(0,acres),
      totalNet: netAcre*Math.max(0,acres),
    };
  },[acres,rowSpacing,plantSpacing,germination,yieldPerPlant,pricePerUnit,costPerAcre]);

  return <section id="acre-calculator" style={{background:'#fff',border:'1px solid #dce8df',borderRadius:22,padding:24,boxShadow:'0 18px 50px #173b2a12'}}>
    <div style={{fontSize:12,fontWeight:950,letterSpacing:1,color:'#2e7d32'}}>ARIDON AG PLANTING & ACRE PROFIT CALCULATOR</div>
    <h2 style={{fontSize:'clamp(30px,4vw,46px)',margin:'8px 0'}}>How many seeds? How much can it grow? What can an acre make?</h2>
    <p style={{color:'#607284',lineHeight:1.65,maxWidth:900}}>Use crop spacing, germination, expected yield and market price to estimate planting population, production and cash return. Results are planning estimates only; actual yield and price vary by crop, hybrid/variety, soil, weather, irrigation, disease, harvest loss and market conditions.</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginTop:18}}>
      <label style={labelStyle}>Crop / variety<input style={inputStyle} value={crop} onChange={e=>setCrop(e.target.value)} /></label>
      <label style={labelStyle}>Field acres<input style={inputStyle} type="number" min="0" step="1" value={acres} onChange={e=>setAcres(Number(e.target.value))}/></label>
      <label style={labelStyle}>Row spacing (inches)<input style={inputStyle} type="number" min="0.1" step="0.1" value={rowSpacing} onChange={e=>setRowSpacing(Number(e.target.value))}/></label>
      <label style={labelStyle}>Seed / plant spacing in row (inches)<input style={inputStyle} type="number" min="0.1" step="0.1" value={plantSpacing} onChange={e=>setPlantSpacing(Number(e.target.value))}/></label>
      <label style={labelStyle}>Expected germination / stand (%)<input style={inputStyle} type="number" min="0" max="100" step="1" value={germination} onChange={e=>setGermination(Number(e.target.value))}/></label>
      <label style={labelStyle}>Expected yield per established plant (lb)<input style={inputStyle} type="number" min="0" step="0.01" value={yieldPerPlant} onChange={e=>setYieldPerPlant(Number(e.target.value))}/></label>
      <label style={labelStyle}>Expected selling price ($ / lb)<input style={inputStyle} type="number" min="0" step="0.01" value={pricePerUnit} onChange={e=>setPricePerUnit(Number(e.target.value))}/></label>
      <label style={labelStyle}>Estimated total cost per acre ($)<input style={inputStyle} type="number" min="0" step="10" value={costPerAcre} onChange={e=>setCostPerAcre(Number(e.target.value))}/></label>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginTop:20}}>
      <Metric title="Seeds planted / acre" value={nfmt(r.planted)} sub={`${crop || 'Crop'} target population`} />
      <Metric title="Expected plants / acre" value={nfmt(r.established)} sub={`${nfmt(germination)}% stand assumption`} />
      <Metric title="Expected yield / acre" value={`${nfmt(r.yieldAcre,0)} lb`} sub="Based on established plants × yield/plant" />
      <Metric title="Gross revenue / acre" value={money(r.grossAcre)} sub="Yield × expected selling price" strong />
      <Metric title="Estimated net / acre" value={money(r.netAcre)} sub={`Gross less ${money(costPerAcre)} cost/acre`} strong={r.netAcre>=0} danger={r.netAcre<0}/>
    </div>

    <div style={{marginTop:18,background:'#f5f8f5',borderRadius:16,padding:18}}>
      <div style={{fontSize:12,fontWeight:950,color:'#2e7d32'}}>WHOLE FIELD ESTIMATE · {nfmt(acres)} ACRES</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10,marginTop:10}}>
        <Total label="Seeds needed" value={nfmt(r.totalSeed)} />
        <Total label="Expected production" value={`${nfmt(r.totalYield)} lb`} />
        <Total label="Gross crop revenue" value={money(r.totalGross)} />
        <Total label="Estimated field net" value={money(r.totalNet)} />
      </div>
    </div>

    <div style={{marginTop:16,padding:15,borderRadius:13,background:'#fff8e8',color:'#6f5616',fontSize:13,lineHeight:1.6}}><strong>Important:</strong> This calculator is a planning tool, not an agronomic planting recommendation. For final seeding rates, confirm the crop-specific population, seed label, local extension guidance, irrigation capacity and equipment calibration. For commodities sold by bushel, cwt, ton, head or another unit, convert expected yield and price to a consistent per-pound basis here until Aridon adds crop-specific unit presets.</div>
  </section>
}

function Metric({title,value,sub,strong=false,danger=false}:{title:string,value:string,sub:string,strong?:boolean,danger?:boolean}){
  const bg=danger?'#fff0ed':strong?'#0a533e':'#f5f8f5';
  const color=danger?'#8d2f25':strong?'#fff':'#183b4e';
  return <div style={{background:bg,color,borderRadius:15,padding:18}}><div style={{fontSize:12,fontWeight:900,opacity:.78}}>{title}</div><div style={{fontSize:28,fontWeight:950,margin:'5px 0'}}>{value}</div><div style={{fontSize:12,opacity:.72}}>{sub}</div></div>
}
function Total({label,value}:{label:string,value:string}){return <div><div style={{fontSize:12,color:'#607284',fontWeight:850}}>{label}</div><div style={{fontSize:22,fontWeight:950,color:'#183b4e',marginTop:3}}>{value}</div></div>}
