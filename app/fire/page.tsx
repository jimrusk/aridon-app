'use client';

import { useMemo, useState } from 'react';

type Inputs={age:number; annualSpend:number; invested:number; cash:number; monthlyInvest:number; returnPct:number; inflationPct:number; withdrawalPct:number; otherAnnualIncome:number};

const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Math.max(0,n||0));

function project(i:Inputs){
  const real=Math.max(-.95,(1+i.returnPct/100)/(1+i.inflationPct/100)-1);
  const need=Math.max(0,(i.annualSpend-i.otherAnnualIncome)/(i.withdrawalPct/100));
  let bal=i.invested+i.cash, months=0;
  const monthlyReal=Math.pow(1+real,1/12)-1;
  while(bal<need && months<1200){bal=bal*(1+monthlyReal)+i.monthlyInvest;months++}
  const d=new Date(); d.setMonth(d.getMonth()+months);
  return {need,months,date:d,bal,real};
}

export default function FirePage(){
 const [v,setV]=useState<Inputs>({age:45,annualSpend:72000,invested:350000,cash:30000,monthlyInvest:3500,returnPct:7,inflationPct:2.5,withdrawalPct:4,otherAnnualIncome:0});
 const [delta,setDelta]=useState({spend:0,monthly:0,windfall:0});
 const base=useMemo(()=>project(v),[v]);
 const scenario=useMemo(()=>project({...v,annualSpend:Math.max(0,v.annualSpend+delta.spend),monthlyInvest:Math.max(0,v.monthlyInvest+delta.monthly),invested:v.invested+delta.windfall}),[v,delta]);
 const shift=scenario.months-base.months;
 const set=(k:keyof Inputs,n:number)=>setV(x=>({...x,[k]:n}));
 const date=(d:Date)=>d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
 return <main style={{minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif',padding:'24px 18px 70px'}}>
  <div style={{maxWidth:1050,margin:'0 auto'}}>
   <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><strong style={{letterSpacing:2}}>ARIDON FIRE</strong><span style={{fontSize:12,color:'#9EF0CF',fontWeight:900}}>PERSONAL FINANCIAL INDEPENDENCE</span></header>
   <section style={{padding:'64px 0 28px'}}><div style={{color:'#9EF0CF',fontWeight:900,fontSize:12}}>YOUR FINISH LINE</div><h1 style={{fontSize:'clamp(44px,8vw,78px)',lineHeight:.96,letterSpacing:-3,margin:'12px 0'}}>You can be financially independent<br/><span style={{color:'#9EF0CF'}}>{date(base.date)}</span></h1><p style={{fontSize:19,color:'#B8C4D5',maxWidth:720,lineHeight:1.55}}>Connect the pieces of your financial life, then turn every decision into time gained or lost. This first version works immediately with manual numbers.</p></section>
   <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginBottom:22}}>
    <Metric title="FIRE number" value={money(base.need)}/><Metric title="Current assets" value={money(v.invested+v.cash)}/><Metric title="Progress" value={base.need?Math.min(100,Math.round((v.invested+v.cash)/base.need*100))+'%':'100%'}/><Metric title="Time remaining" value={base.months>=1200?'100+ years':Math.floor(base.months/12)+'y '+base.months%12+'m'}/>
   </section>
   <section style={panel}><h2>Build your baseline</h2><p style={sub}>Use today's dollars. Change anything and your finish line recalculates instantly.</p><div style={grid}>
    <Field label="Age" value={v.age} onChange={n=>set('age',n)}/><Field label="Annual spending" value={v.annualSpend} money onChange={n=>set('annualSpend',n)}/><Field label="Investments / retirement" value={v.invested} money onChange={n=>set('invested',n)}/><Field label="Cash" value={v.cash} money onChange={n=>set('cash',n)}/><Field label="Monthly investing" value={v.monthlyInvest} money onChange={n=>set('monthlyInvest',n)}/><Field label="Expected return %" value={v.returnPct} step=".1" onChange={n=>set('returnPct',n)}/><Field label="Inflation %" value={v.inflationPct} step=".1" onChange={n=>set('inflationPct',n)}/><Field label="Withdrawal rate %" value={v.withdrawalPct} step=".1" onChange={n=>set('withdrawalPct',n)}/><Field label="Annual pension / other retirement income" value={v.otherAnnualIncome} money onChange={n=>set('otherAnnualIncome',n)}/>
   </div></section>
   <section style={{...panel,marginTop:18,border:'1px solid #365C52'}}><div style={{color:'#9EF0CF',fontWeight:900,fontSize:12}}>WHAT-IF PLAYGROUND</div><h2 style={{fontSize:34,margin:'8px 0'}}>Change something. See what it costs in time.</h2><div style={grid}><Field label="Change annual spending" value={delta.spend} money signed onChange={n=>setDelta(x=>({...x,spend:n}))}/><Field label="Change monthly investing" value={delta.monthly} money signed onChange={n=>setDelta(x=>({...x,monthly:n}))}/><Field label="One-time investable windfall" value={delta.windfall} money signed onChange={n=>setDelta(x=>({...x,windfall:n}))}/></div>
    <div style={{marginTop:24,padding:22,borderRadius:16,background:'#101D2C'}}><div style={{fontSize:13,color:'#9FB0C6'}}>SCENARIO FINISH LINE</div><strong style={{fontSize:'clamp(32px,6vw,54px)',color:'#9EF0CF'}}>{date(scenario.date)}</strong><p style={{fontSize:20,marginBottom:0}}>{shift===0?'Same finish line.':shift<0?Math.abs(shift)+' months sooner.':shift+' months later.'}</p></div>
   </section>
   <p style={{color:'#8090A7',fontSize:12,lineHeight:1.5,marginTop:22}}>Planning tool only. Results are estimates, not financial, tax, or investment advice. Returns, inflation, taxes, market sequence and personal circumstances can materially change actual outcomes.</p>
  </div>
 </main>
}
const panel={background:'#0D1728',border:'1px solid #263A55',borderRadius:20,padding:22} as const;
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12} as const;
const sub={color:'#AEBBD0',lineHeight:1.5} as const;
function Metric({title,value}:{title:string,value:string}){return <div style={{background:'#F4F1E9',color:'#171717',borderRadius:16,padding:18}}><div style={{fontSize:12,fontWeight:900,color:'#65615A'}}>{title.toUpperCase()}</div><div style={{fontSize:28,fontWeight:900,marginTop:7}}>{value}</div></div>}
function Field({label,value,onChange,money:signedMoney,step='1',signed}:{label:string;value:number;onChange:(n:number)=>void;money?:boolean;step?:string;signed?:boolean}){return <label style={{display:'block',fontSize:12,fontWeight:800,color:'#B8C4D5'}}>{label}<div style={{display:'flex',alignItems:'center',background:'#07101D',border:'1px solid #334763',borderRadius:12,marginTop:7,padding:'0 12px'}}>{signedMoney&&<span>$</span>}<input aria-label={label} type="number" step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{width:'100%',padding:'13px 8px',background:'transparent',border:0,outline:'none',color:'#fff',fontSize:16}}/>{signed&&<span style={{fontSize:10,color:'#7E91AA'}}>+/−</span>}</div></label>}
