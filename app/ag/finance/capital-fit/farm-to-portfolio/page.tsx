'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Droplets, Landmark, TrendingUp } from 'lucide-react';

export default function FarmToPortfolioPage(){
  const [acres,setAcres]=useState(1000);
  const [baselineMargin,setBaselineMargin]=useState(450);
  const [postMargin,setPostMargin]=useState(700);
  const [baselineValue,setBaselineValue]=useState(12000000);
  const [postValue,setPostValue]=useState(15000000);
  const [transitionCapex,setTransitionCapex]=useState(1500000);
  const [waterReduction,setWaterReduction]=useState(20);
  const [yieldVolatilityReduction,setYieldVolatilityReduction]=useState(15);
  const [holdYears,setHoldYears]=useState(10);
  const result=useMemo(()=>{
    const annualMarginGain=(postMargin-baselineMargin)*acres;
    const assetGain=postValue-baselineValue;
    const totalGain=annualMarginGain*holdYears+assetGain-transitionCapex;
    const multiple=transitionCapex>0?(transitionCapex+Math.max(0,totalGain))/transitionCapex:0;
    const annualized=holdYears>0&&multiple>0?(Math.pow(multiple,1/holdYears)-1)*100:0;
    return {annualMarginGain,assetGain,totalGain,multiple,annualized};
  },[acres,baselineMargin,postMargin,baselineValue,postValue,transitionCapex,holdYears]);
  const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
  const evidence=['Historical farm financials','Field-level yield + margin history','Soil baseline + trend','Water rights/source/reliability','Water use per acre','Crop + tenant/operator mix','Buyer/offtake documentation','Insurance/loss history','Appraisal and valuation method','Transition + infrastructure budget','Verification source/date/method','Investor cash-flow + refinance/exit waterfall'];
  return <main style={{minHeight:'100vh',background:'#f3f1e8',color:'#17251b',fontFamily:'Arial,sans-serif'}}>
    <header style={{background:'#123d2a',color:'#fff',padding:'14px 18px'}}><div style={{maxWidth:1180,margin:'auto',display:'flex',gap:10,alignItems:'center'}}><Link href="/ag/finance/capital-fit" style={{color:'#fff'}}><ArrowLeft size={20}/></Link><strong>CAPITAL FIT · FARM-TO-PORTFOLIO RETURN BRIDGE</strong></div></header>
    <section style={{maxWidth:1180,margin:'auto',padding:'34px 18px'}}><div style={{background:'#173f2c',color:'#fff',padding:26,borderRadius:22}}><div style={{fontSize:12,fontWeight:900,color:'#d9efc7'}}>INSTITUTIONAL UNDERWRITING TRANSLATION</div><h1 style={{fontSize:'clamp(36px,6vw,60px)',lineHeight:1,margin:'10px 0'}}>Show how a farm intervention becomes portfolio performance.</h1><p style={{fontSize:18,lineHeight:1.55,maxWidth:900}}>Intervention → operating improvement → margin/acre → volatility reduction → water resilience → market security → asset value → cash yield → investor return.</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:18}}>{[
        ['Acres',acres,setAcres,100,10000,100],['Baseline margin / acre',baselineMargin,setBaselineMargin,0,3000,50],['Post-intervention margin / acre',postMargin,setPostMargin,0,4000,50],['Baseline appraised value',baselineValue,setBaselineValue,1000000,100000000,500000],['Post-intervention value',postValue,setPostValue,1000000,150000000,500000],['Transition / infrastructure capex',transitionCapex,setTransitionCapex,0,25000000,100000],['Water use reduction %',waterReduction,setWaterReduction,0,60,1],['Yield volatility reduction %',yieldVolatilityReduction,setYieldVolatilityReduction,0,60,1],['Hold period years',holdYears,setHoldYears,1,20,1]
      ].map(([label,value,setter,min,max,step]:any)=><article key={label} style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:14,padding:15}}><strong style={{fontSize:11,color:'#397048'}}>{String(label).toUpperCase()}</strong><div style={{fontSize:24,fontWeight:950,margin:'8px 0'}}>{String(label).includes('value')||String(label).includes('capex')||String(label).includes('margin')?money(value):Number(value).toLocaleString()+(String(label).includes('%')?'%':'')}</div><input type="range" min={min} max={max} step={step} value={value} onChange={e=>setter(Number(e.target.value))} style={{width:'100%'}}/></article>)}</div>
      <h2 style={{fontSize:34,margin:'30px 0 12px'}}>Investor effect</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>{[[<TrendingUp key="a"/>,'Annual margin improvement',money(result.annualMarginGain)],[<Landmark key="b"/>,'Modeled asset-value improvement',money(result.assetGain)],[<Droplets key="c"/>,'Water-use improvement',waterReduction+'%'],[<TrendingUp key="d"/>,'Yield-volatility improvement',yieldVolatilityReduction+'%'],[<Landmark key="e"/>,'Modeled gross value created',money(result.totalGain)],[<TrendingUp key="f"/>,'Screening annualized return',result.annualized.toFixed(1)+'%']].map(([icon,label,value]:any)=><article key={label} style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:14,padding:17}}><div style={{color:'#397048'}}>{icon}</div><div style={{fontSize:12,fontWeight:900,color:'#667269',marginTop:7}}>{label}</div><div style={{fontSize:28,fontWeight:950,marginTop:5}}>{value}</div></article>)}</div>
      <h2 style={{fontSize:34,margin:'30px 0 12px'}}>Aridon Farm-to-Portfolio Investment Record</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:10}}>{evidence.map(x=><div key={x} style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:12,padding:13,display:'flex',gap:8,alignItems:'center'}}><CheckCircle2 size={17} color="#397048"/>{x}</div>)}</div>
      <div style={{marginTop:20,background:'#fff1ec',border:'1px solid #e7c1b7',borderRadius:14,padding:16}}><strong>SCREENING MODEL, NOT AN INVESTMENT PROMISE.</strong><p style={{margin:'6px 0 0',lineHeight:1.5}}>Capital Fit must label every input as verified, measured, documented, estimated or missing. Ecological improvements count as financial value only when a defensible cash-flow, risk, valuation or monetization pathway is documented.</p></div>
    </section>
  </main>;
}
