'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Beaker, Droplets, Handshake, Leaf, ShieldCheck, TrendingUp } from 'lucide-react';

const card: React.CSSProperties = { background:'#fff', border:'1px solid #d8e1d5', borderRadius:18, padding:20 };
const input: React.CSSProperties = { width:'100%', padding:'11px 12px', borderRadius:10, border:'1px solid #cdd7ca', background:'#fff', fontSize:15 };
const label: React.CSSProperties = { display:'grid', gap:6, fontSize:13, fontWeight:800, color:'#425046' };

function money(n:number){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n); }
function num(v:string){ const n=Number(v); return Number.isFinite(n)?n:0; }

export default function ResiliencePage(){
  const [acres,setAcres]=useState('500');
  const [yieldPerAcre,setYieldPerAcre]=useState('1.8');
  const [price,setPrice]=useState('240');
  const [costPerAcre,setCostPerAcre]=useState('310');
  const [yieldTrend,setYieldTrend]=useState('-0.4');
  const [priceTrend,setPriceTrend]=useState('2');
  const [costTrend,setCostTrend]=useState('2.5');
  const [waterRisk,setWaterRisk]=useState('35');

  const projections=useMemo(()=>[1,5,10,25].map(year=>{
    const a=num(acres), y=num(yieldPerAcre)*Math.pow(1+num(yieldTrend)/100,year), p=num(price)*Math.pow(1+num(priceTrend)/100,year), c=num(costPerAcre)*Math.pow(1+num(costTrend)/100,year);
    const gross=a*y*p;
    const operating=a*c;
    const riskPenalty=gross*(Math.min(Math.max(num(waterRisk),0),100)/100)*0.18;
    return {year,gross,operating,net:gross-operating-riskPenalty};
  }),[acres,yieldPerAcre,price,costPerAcre,yieldTrend,priceTrend,costTrend,waterRisk]);

  const [annualAf,setAnnualAf]=useState('120');
  const [powerRate,setPowerRate]=useState('0.13');
  const [conventional,setConventional]=useState('160');
  const [recycled,setRecycled]=useState('650');
  const [awgKwh,setAwgKwh]=useState('1200');

  const water=useMemo(()=>{
    const af=num(annualAf), kwhPrice=num(powerRate);
    const gallons=af*325851;
    return [
      {name:'Conventional supply',annual:af*num(conventional),energy:'Enter local pumping energy separately',note:'Baseline source. Replace with your utility, well or district cost.'},
      {name:'Recycled / reclaimed',annual:af*num(recycled),energy:'Site-specific',note:'Use when treatment, conveyance and crop rules allow.'},
      {name:'Atmospheric water',annual:(gallons/1000)*num(awgKwh)*kwhPrice,energy:`${Math.round((gallons/1000)*num(awgKwh)).toLocaleString()} kWh/yr`,note:'Energy-only planning case. Replace the default with measured AWG performance before investment decisions.'},
    ];
  },[annualAf,powerRate,conventional,recycled,awgKwh]);

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif'}}>
    <header style={{background:'#163d2a',color:'#fff',padding:'16px 18px'}}><div style={{maxWidth:1180,margin:'auto',display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,flexWrap:'wrap'}}><div><strong style={{letterSpacing:1.5}}>ARIDON AG · RESILIENCE ENGINE</strong><div style={{fontSize:12,color:'#dbe8df',marginTop:3}}>Forecast → compare → test → partner</div></div><Link href="/ag" style={{color:'#fff',textDecoration:'none',display:'inline-flex',gap:7,alignItems:'center',fontWeight:850}}><ArrowLeft size={17}/> Aridon Ag</Link></div></header>

    <section style={{maxWidth:1180,margin:'auto',padding:'46px 18px 28px'}}><div style={{color:'#356943',fontSize:12,fontWeight:950,letterSpacing:.8}}>FOUR-LAYER AGRIFOOD RESILIENCE STACK</div><h1 style={{fontSize:'clamp(42px,7vw,74px)',lineHeight:.96,letterSpacing:-2.5,margin:'10px 0 16px'}}>Turn long-range risk into a farm-level decision.</h1><p style={{fontSize:19,lineHeight:1.55,maxWidth:860,color:'#526058'}}>Aridon connects farm economics, water scenarios, physical testing and research partnerships in one decision path. These tools are planning models, not guarantees. Replace assumptions with measured farm, utility, climate and equipment data as they become available.</p></section>

    <section style={{maxWidth:1180,margin:'auto',padding:'10px 18px 60px',display:'grid',gap:18}}>
      <article style={card}><div style={{display:'flex',gap:12,alignItems:'center'}}><div style={{width:44,height:44,borderRadius:12,display:'grid',placeItems:'center',background:'#e7f0df'}}><TrendingUp color="#356943"/></div><div><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>LAYER 1</div><h2 style={{margin:'3px 0',fontSize:30}}>Aridon Ag Forecast Engine</h2></div></div><p style={{color:'#5a675f',lineHeight:1.55}}>Model 1-, 5-, 10- and 25-year operating outcomes from acres, yield, price, costs and water exposure. The output is a decision signal, not a prediction carved in stone.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginTop:14}}>
        <label style={label}>Acres<input style={input} value={acres} onChange={e=>setAcres(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Yield / acre<input style={input} value={yieldPerAcre} onChange={e=>setYieldPerAcre(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Price / unit ($)<input style={input} value={price} onChange={e=>setPrice(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Operating cost / acre ($)<input style={input} value={costPerAcre} onChange={e=>setCostPerAcre(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Annual yield trend (%)<input style={input} value={yieldTrend} onChange={e=>setYieldTrend(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Annual price trend (%)<input style={input} value={priceTrend} onChange={e=>setPriceTrend(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Annual cost trend (%)<input style={input} value={costTrend} onChange={e=>setCostTrend(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Water risk score (0–100)<input style={input} value={waterRisk} onChange={e=>setWaterRisk(e.target.value)} inputMode="decimal"/></label>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10,marginTop:16}}>{projections.map(p=><div key={p.year} style={{background:'#faf9f4',border:'1px solid #e2e6df',borderRadius:14,padding:15}}><div style={{fontWeight:950,color:'#356943'}}>{p.year}-year case</div><div style={{fontSize:12,color:'#667169',marginTop:7}}>Gross</div><strong>{money(p.gross)}</strong><div style={{fontSize:12,color:'#667169',marginTop:7}}>Operating cost</div><strong>{money(p.operating)}</strong><div style={{fontSize:12,color:'#667169',marginTop:7}}>Risk-adjusted operating result</div><strong style={{fontSize:20}}>{money(p.net)}</strong></div>)}</div></article>

      <article style={card}><div style={{display:'flex',gap:12,alignItems:'center'}}><div style={{width:44,height:44,borderRadius:12,display:'grid',placeItems:'center',background:'#e3eef4'}}><Droplets color="#2e6176"/></div><div><div style={{fontSize:12,fontWeight:950,color:'#2e6176'}}>LAYER 2</div><h2 style={{margin:'3px 0',fontSize:30}}>Water Scenario Engine</h2></div></div><p style={{color:'#5a675f',lineHeight:1.55}}>Compare water pathways on the same annual demand. The AWG case below intentionally uses an editable energy assumption so field measurements can replace estimates.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginTop:14}}>
        <label style={label}>Annual demand (acre-feet)<input style={input} value={annualAf} onChange={e=>setAnnualAf(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Electricity ($/kWh)<input style={input} value={powerRate} onChange={e=>setPowerRate(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Conventional water ($/AF)<input style={input} value={conventional} onChange={e=>setConventional(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>Recycled water ($/AF)<input style={input} value={recycled} onChange={e=>setRecycled(e.target.value)} inputMode="decimal"/></label>
        <label style={label}>AWG energy (kWh / 1,000 gal)<input style={input} value={awgKwh} onChange={e=>setAwgKwh(e.target.value)} inputMode="decimal"/></label>
      </div>
      <div style={{overflowX:'auto',marginTop:16}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:680}}><thead><tr>{['Scenario','Annual planning cost','Energy','Decision note'].map(h=><th key={h} style={{textAlign:'left',padding:'11px 10px',borderBottom:'1px solid #d8e1d5',fontSize:12,color:'#667169'}}>{h}</th>)}</tr></thead><tbody>{water.map(w=><tr key={w.name}><td style={{padding:'13px 10px',borderBottom:'1px solid #edf0eb',fontWeight:900}}>{w.name}</td><td style={{padding:'13px 10px',borderBottom:'1px solid #edf0eb'}}>{money(w.annual)}</td><td style={{padding:'13px 10px',borderBottom:'1px solid #edf0eb'}}>{w.energy}</td><td style={{padding:'13px 10px',borderBottom:'1px solid #edf0eb',color:'#5a675f'}}>{w.note}</td></tr>)}</tbody></table></div></article>

      <article style={card}><div style={{display:'flex',gap:12,alignItems:'center'}}><div style={{width:44,height:44,borderRadius:12,display:'grid',placeItems:'center',background:'#f0eadb'}}><Beaker color="#725d2c"/></div><div><div style={{fontSize:12,fontWeight:950,color:'#725d2c'}}>LAYER 3</div><h2 style={{margin:'3px 0',fontSize:30}}>Southwest Food & Water Resilience Lab</h2></div></div><p style={{color:'#5a675f',lineHeight:1.55}}>A campus test path that turns model recommendations into measured evidence before scale-up.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10,marginTop:14}}>{[
        ['1 · Baseline','Measure water, energy, soil, crop/livestock performance, labor and operating cost before intervention.'],
        ['2 · Controlled pilot','Run one change at a time where practical: irrigation, AWG, reuse, storage, greenhouse, energy or automation.'],
        ['3 · Verification','Track output, cost, uptime, water quality, maintenance, labor and operational side effects.'],
        ['4 · Scale decision','Compare measured benefit with capital cost, funding, payback, resilience and farmer acceptance.'],
      ].map(([t,d])=><div key={t} style={{background:'#faf9f4',borderRadius:14,padding:15,border:'1px solid #e2e6df'}}><strong>{t}</strong><p style={{color:'#5a675f',lineHeight:1.5,marginBottom:0}}>{d}</p></div>)}</div><div style={{marginTop:14,padding:14,borderRadius:12,background:'#f7f3e7',color:'#5f5439'}}><ShieldCheck size={18} style={{verticalAlign:'middle',marginRight:8}}/>No pilot is marked successful until its measurements, assumptions and limitations are attached to the result.</div></article>

      <article style={card}><div style={{display:'flex',gap:12,alignItems:'center'}}><div style={{width:44,height:44,borderRadius:12,display:'grid',placeItems:'center',background:'#ece6f4'}}><Handshake color="#5b4772"/></div><div><div style={{fontSize:12,fontWeight:950,color:'#5b4772'}}>LAYER 4</div><h2 style={{margin:'3px 0',fontSize:30}}>Research & Partnership Integration</h2></div></div><p style={{color:'#5a675f',lineHeight:1.55}}>Connect global agrifood research to field execution. Aridon can ingest research assumptions and scenario outputs, translate them into farm decisions, test interventions and return measured evidence.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10,marginTop:14}}>{[
        ['Research inputs','Climate scenarios, crop assumptions, water constraints, price/trade scenarios and policy research.'],
        ['Aridon translation','Convert macro findings into operation-specific risk, economics and intervention choices.'],
        ['Field execution','Route approved trials into farms, ranches, greenhouses and Southwest Technology Campus test facilities.'],
        ['Evidence loop','Return measured performance, costs, constraints and farmer outcomes to improve the next decision.'],
      ].map(([t,d],i)=><div key={t} style={{background:'#faf9f4',borderRadius:14,padding:15,border:'1px solid #e2e6df'}}>{i===0?<BarChart3 size={20} color="#5b4772"/>:i===1?<Leaf size={20} color="#5b4772"/>:i===2?<Beaker size={20} color="#5b4772"/>:<Handshake size={20} color="#5b4772"/>}<h3 style={{margin:'9px 0 6px'}}>{t}</h3><p style={{color:'#5a675f',lineHeight:1.5,margin:0}}>{d}</p></div>)}</div><div style={{marginTop:16,background:'#163d2a',color:'#fff',borderRadius:14,padding:17}}><strong>Partnership target: IFPRI / CGIAR</strong><div style={{color:'#dbe8df',marginTop:6,lineHeight:1.5}}>Proposed role: research and scenario intelligence upstream; Aridon as the farm-level decision, deployment and verification layer downstream.</div></div></article>
    </section>
  </main>;
}
