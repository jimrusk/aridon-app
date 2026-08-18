'use client';

import { useMemo, useState } from 'react';

const inputStyle: React.CSSProperties = { width:'100%', boxSizing:'border-box', padding:'12px 13px', border:'1px solid #cbd9cf', borderRadius:10, fontSize:15, background:'#fff', color:'#183b4e' };
const labelStyle: React.CSSProperties = { display:'grid', gap:6, fontSize:13, fontWeight:800, color:'#365464' };

function money(n:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0)}

export default function AgProfitCheck(){
  const [sales,setSales]=useState(750000);
  const [payroll,setPayroll]=useState(125000);
  const [inputs,setInputs]=useState(180000);
  const [water,setWater]=useState(42000);
  const [equipment,setEquipment]=useState(65000);
  const [acres,setAcres]=useState(600);

  const result=useMemo(()=>{
    const laborPct=sales?payroll/sales:0;
    const inputPct=sales?inputs/sales:0;
    const waterPct=sales?water/sales:0;
    const equipPct=sales?equipment/sales:0;
    const payrollOpp=Math.max(0,payroll-(sales*.14));
    const inputOpp=Math.max(inputs*.035, inputs-(sales*.22));
    const waterOpp=water*.08;
    const equipOpp=equipment*.05;
    const salesOpp=sales*.025;
    const total=payrollOpp+inputOpp+waterOpp+equipOpp+salesOpp;
    let score=92;
    if(laborPct>.16) score-=10; else if(laborPct>.14) score-=5;
    if(inputPct>.28) score-=10; else if(inputPct>.23) score-=5;
    if(waterPct>.08) score-=7; else if(waterPct>.05) score-=3;
    if(equipPct>.11) score-=7; else if(equipPct>.08) score-=3;
    score=Math.max(45,Math.min(96,Math.round(score)));
    return { laborPct,inputPct,waterPct,equipPct,payrollOpp,inputOpp,waterOpp,equipOpp,salesOpp,total,score,perAcre:acres?sales/acres:0 };
  },[sales,payroll,inputs,water,equipment,acres]);

  return <section id="profit-check" style={{background:'#fff',border:'1px solid #dce8df',borderRadius:22,padding:24,boxShadow:'0 18px 50px #173b2a12'}}>
    <div style={{fontSize:12,fontWeight:950,letterSpacing:1,color:'#2e7d32'}}>FREE ARIDON FARM PROFIT CHECK</div>
    <h2 style={{fontSize:'clamp(30px,4vw,46px)',margin:'8px 0'}}>See where your operation may be leaking margin.</h2>
    <p style={{color:'#607284',lineHeight:1.65,maxWidth:820}}>Enter approximate annual figures. This quick screen is directional, not accounting advice. Aridon uses the information to surface areas worth a closer look.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginTop:18}}>
      <label style={labelStyle}>Annual sales<input style={inputStyle} type="number" value={sales} onChange={e=>setSales(Number(e.target.value))}/></label>
      <label style={labelStyle}>Payroll / labor<input style={inputStyle} type="number" value={payroll} onChange={e=>setPayroll(Number(e.target.value))}/></label>
      <label style={labelStyle}>Inputs / feed / seed / fertilizer<input style={inputStyle} type="number" value={inputs} onChange={e=>setInputs(Number(e.target.value))}/></label>
      <label style={labelStyle}>Water / irrigation cost<input style={inputStyle} type="number" value={water} onChange={e=>setWater(Number(e.target.value))}/></label>
      <label style={labelStyle}>Equipment / repair cost<input style={inputStyle} type="number" value={equipment} onChange={e=>setEquipment(Number(e.target.value))}/></label>
      <label style={labelStyle}>Acres operated<input style={inputStyle} type="number" value={acres} onChange={e=>setAcres(Number(e.target.value))}/></label>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginTop:20}}>
      <Metric title="Farm Profit Score" value={`${result.score}/100`} sub="Directional operating score" />
      <Metric title="Revenue / acre" value={money(result.perAcre)} sub="Approximate annual sales per acre" />
      <Metric title="Potential opportunity" value={money(result.total)} sub="Areas Aridon would investigate" strong />
    </div>

    <div style={{marginTop:16,display:'grid',gap:9}}>
      <Insight label="Sales" value={result.salesOpp} text="Buyer follow-up, pricing, contract and repeat-order opportunities." />
      <Insight label="Payroll" value={result.payrollOpp} text={`Labor is ${(result.laborPct*100).toFixed(1)}% of sales. Aridon can look for overtime and crew-scheduling pressure.`} />
      <Insight label="Inputs" value={result.inputOpp} text={`Inputs are ${(result.inputPct*100).toFixed(1)}% of sales. Review purchasing, field/crop margin and inventory usage.`} />
      <Insight label="Water" value={result.waterOpp} text="Review irrigation cost, timing, drought exposure and resilience opportunities." />
      <Insight label="Equipment" value={result.equipOpp} text="Review downtime, preventive maintenance and repair-cost patterns." />
    </div>
    <div style={{marginTop:18,padding:16,borderRadius:14,background:'#edf7ec',color:'#234434',fontWeight:800}}>Next: connect real farm records and let Aridon turn these estimates into a prioritized 30-day action plan.</div>
  </section>
}

function Metric({title,value,sub,strong=false}:{title:string,value:string,sub:string,strong?:boolean}){return <div style={{background:strong?'#0a533e':'#f5f8f5',color:strong?'#fff':'#183b4e',borderRadius:15,padding:18}}><div style={{fontSize:12,fontWeight:900,opacity:.78}}>{title}</div><div style={{fontSize:30,fontWeight:950,margin:'5px 0'}}>{value}</div><div style={{fontSize:12,opacity:.72}}>{sub}</div></div>}
function Insight({label,value,text}:{label:string,value:number,text:string}){return <div style={{display:'grid',gridTemplateColumns:'110px 130px 1fr',gap:10,alignItems:'center',padding:'11px 0',borderBottom:'1px solid #e4ece6'}}><strong>{label}</strong><span style={{fontWeight:900,color:'#2e7d32'}}>{money(value)}</span><span style={{color:'#607284',fontSize:14}}>{text}</span></div>}
