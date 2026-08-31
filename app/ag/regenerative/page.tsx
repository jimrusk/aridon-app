"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, Droplets, HandCoins, Leaf, LineChart, ShieldCheck, Sprout, WalletCards } from "lucide-react";

const money=(value:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(value)?value:0);

const practices=[
  {name:'Rotational grazing',why:'Improve forage utilization, recovery time and grazing resilience while tracking stocking and water impacts.'},
  {name:'Cover crops',why:'Model seed and establishment cost against soil protection, forage, water retention and yield effects.'},
  {name:'Reduced tillage',why:'Compare machinery, fuel and labor changes with agronomic and soil-health outcomes.'},
  {name:'Water efficiency',why:'Evaluate irrigation, storage, monitoring and water-production projects against cost, reliability and savings.'},
  {name:'Soil amendments / compost',why:'Track application cost, nutrient strategy and measured soil response without assuming an outcome.'},
  {name:'Pasture & habitat restoration',why:'Organize fencing, reseeding, water, habitat and conservation-practice economics into one project plan.'},
];

const evidence=[
  ['Soil','Organic matter, infiltration, ground cover, compaction and lab results'],
  ['Water','Use, source, cost, storage, efficiency, production and drought reliability'],
  ['Production','Yield, forage, stocking, animal performance and crop quality'],
  ['Economics','Input cost, labor, equipment, revenue, margin and cash-flow change'],
  ['Verification','Source document, measurement date, method, confidence and independent review where needed'],
];

export default function RegenerativeFinancePage(){
  const [projectCost,setProjectCost]=useState(250000);
  const [grant,setGrant]=useState(75000);
  const [ownerEquity,setOwnerEquity]=useState(25000);
  const [annualBenefit,setAnnualBenefit]=useState(65000);
  const [annualDebtService,setAnnualDebtService]=useState(30000);

  const model=useMemo(()=>{
    const debt=Math.max(0,projectCost-grant-ownerEquity);
    const payback=annualBenefit>0?Math.max(0,projectCost-grant)/annualBenefit:0;
    const dscr=annualDebtService>0?annualBenefit/annualDebtService:0;
    return {debt,payback,dscr};
  },[projectCost,grant,ownerEquity,annualBenefit,annualDebtService]);

  const field=(label:string,value:number,setter:(n:number)=>void)=><label style={{display:'grid',gap:7,fontWeight:850,fontSize:13}}>{label}<input type="number" value={value} onChange={e=>setter(Number(e.target.value)||0)} style={{padding:'12px 13px',borderRadius:10,border:'1px solid #b7c4b8',fontSize:16,background:'#fff'}}/></label>;

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif'}}>
    <header style={{background:'#163d2a',color:'#fff',padding:'15px 18px'}}><div style={{maxWidth:1160,margin:'auto',display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}><Link href="/ag" style={{color:'#fff',textDecoration:'none',fontWeight:950,letterSpacing:1.2}}>ARIDON AG</Link><div style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:14}}><Link href="/ag/funding" style={{color:'#dbe8df',textDecoration:'none'}}>Funding</Link><Link href="/ag/finance" style={{color:'#dbe8df',textDecoration:'none'}}>Finance OS</Link><Link href="/ag/snapshot" style={{color:'#fff',textDecoration:'none',fontWeight:900}}>Operation Snapshot</Link></div></div></header>

    <section style={{maxWidth:1160,margin:'auto',padding:'58px 18px 34px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,320px),1fr))',gap:28,alignItems:'center'}}>
      <div><div style={{color:'#356943',fontWeight:950,fontSize:12,letterSpacing:1.3}}>REGENERATIVE AGRICULTURE + FINANCE</div><h1 style={{fontSize:'clamp(44px,7vw,76px)',lineHeight:.96,letterSpacing:-2.5,margin:'10px 0 18px'}}>Make the land plan financeable.</h1><p style={{fontSize:20,lineHeight:1.6,color:'#526058',maxWidth:760}}>Aridon connects a regenerative practice to its cost, available assistance, financing need, expected operating impact and the evidence required to prove what actually changed.</p><div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:20}}><a href="#capital" style={{display:'inline-flex',alignItems:'center',gap:8,background:'#163d2a',color:'#fff',padding:'14px 17px',borderRadius:12,textDecoration:'none',fontWeight:950}}>Build the capital stack <ArrowRight size={18}/></a><Link href="/ag/funding" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #9cab9f',color:'#163d2a',padding:'14px 17px',borderRadius:12,textDecoration:'none',fontWeight:900}}>Find funding</Link></div></div>
      <aside style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:20,padding:23}}><Leaf size={32} color="#356943"/><div style={{color:'#356943',fontSize:12,fontWeight:950,marginTop:12}}>THE ARIDON RULE</div><h2 style={{fontSize:30,margin:'8px 0 12px'}}>No green claims without evidence.</h2><p style={{margin:0,color:'#58655d',lineHeight:1.6}}>The system can model scenarios and organize proof. Outcomes stay labeled estimated until measurements, source records or qualified verification support them.</p></aside>
    </section>

    <section style={{background:'#fff',borderTop:'1px solid #d8e1d5',borderBottom:'1px solid #d8e1d5',padding:'52px 18px'}}><div style={{maxWidth:1160,margin:'auto'}}><div style={{display:'flex',alignItems:'center',gap:10}}><Sprout size={25} color="#356943"/><div style={{color:'#356943',fontSize:12,fontWeight:950}}>TRANSITION PLANNER</div></div><h2 style={{fontSize:'clamp(32px,5vw,52px)',margin:'8px 0 22px'}}>Turn practices into projects.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:12}}>{practices.map(p=><article key={p.name} style={{border:'1px solid #d8e1d5',borderRadius:16,padding:18,background:'#faf9f4'}}><CheckCircle2 size={21} color="#356943"/><h3 style={{fontSize:21,margin:'10px 0 7px'}}>{p.name}</h3><p style={{margin:0,color:'#5b675f',lineHeight:1.5}}>{p.why}</p></article>)}</div></div></section>

    <section id="capital" style={{maxWidth:1160,margin:'auto',padding:'56px 18px'}}><div style={{display:'flex',alignItems:'center',gap:10}}><WalletCards size={27} color="#356943"/><div style={{color:'#356943',fontSize:12,fontWeight:950}}>CAPITAL STACK BUILDER</div></div><h2 style={{fontSize:'clamp(34px,5vw,54px)',margin:'8px 0 10px'}}>See the financing gap before talking to a lender.</h2><p style={{color:'#58655d',fontSize:17,lineHeight:1.55,maxWidth:820}}>This is a directional planning model, not a loan quote or underwriting decision. Current program rules, rates and eligibility must be verified before a project is marked finance-ready.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,330px),1fr))',gap:18,marginTop:24}}>
        <div style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:20,display:'grid',gap:14}}>{field('Total project cost',projectCost,setProjectCost)}{field('Grant / cost share',grant,setGrant)}{field('Producer equity',ownerEquity,setOwnerEquity)}{field('Expected annual savings + revenue lift',annualBenefit,setAnnualBenefit)}{field('Estimated annual debt service',annualDebtService,setAnnualDebtService)}</div>
        <div style={{display:'grid',gap:12}}>
          <article style={{background:'#163d2a',color:'#fff',borderRadius:18,padding:22}}><HandCoins size={27} color="#c8e2ac"/><div style={{color:'#c8e2ac',fontWeight:950,fontSize:12,marginTop:10}}>ESTIMATED DEBT / CAPITAL GAP</div><div style={{fontSize:42,fontWeight:950,marginTop:5}}>{money(model.debt)}</div><p style={{color:'#dbe8df',lineHeight:1.5}}>Project cost less modeled grant/cost share and producer equity.</p></article>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}><article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:16,padding:18}}><LineChart size={23} color="#356943"/><div style={{fontSize:12,fontWeight:950,color:'#356943',marginTop:8}}>SIMPLE PAYBACK</div><div style={{fontSize:31,fontWeight:950,marginTop:4}}>{model.payback?model.payback.toFixed(1):'—'} yrs</div></article><article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:16,padding:18}}><BarChart3 size={23} color="#356943"/><div style={{fontSize:12,fontWeight:950,color:'#356943',marginTop:8}}>DIRECTIONAL DSCR</div><div style={{fontSize:31,fontWeight:950,marginTop:4}}>{model.dscr?model.dscr.toFixed(2):'—'}x</div></article></div>
          <article style={{background:'#e6ecdf',borderRadius:16,padding:18}}><strong>Potential stack:</strong><p style={{lineHeight:1.55,marginBottom:0}}>Producer equity + verified public cost share/grants + equipment or project debt + mission/impact capital where appropriate. Aridon keeps each source, condition, deadline and required proof in one workflow.</p></article>
        </div>
      </div>
    </section>

    <section style={{background:'#e6ecdf',padding:'54px 18px'}}><div style={{maxWidth:1160,margin:'auto'}}><div style={{display:'flex',alignItems:'center',gap:10}}><Droplets size={27} color="#356943"/><div style={{color:'#356943',fontSize:12,fontWeight:950}}>VERIFIED OUTCOMES LEDGER</div></div><h2 style={{fontSize:'clamp(34px,5vw,52px)',margin:'8px 0 20px'}}>Measure the change that capital paid for.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>{evidence.map(([title,text])=><article key={title} style={{background:'#fff',border:'1px solid #d2ddcf',borderRadius:15,padding:18}}><h3 style={{margin:'0 0 7px'}}>{title}</h3><p style={{margin:0,color:'#59665e',lineHeight:1.5}}>{text}</p></article>)}</div></div></section>

    <section style={{maxWidth:1160,margin:'auto',padding:'56px 18px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}><article style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:22}}><ShieldCheck size={27} color="#356943"/><div style={{fontSize:12,fontWeight:950,color:'#356943',marginTop:10}}>PRODUCER CONTROL</div><h2 style={{fontSize:29,margin:'7px 0 9px'}}>Permission before disclosure.</h2><p style={{color:'#5a675f',lineHeight:1.55}}>A potential lender or investor can be identified without receiving private producer data. Aridon shows exactly what would be shared, why and with whom before permission is granted.</p></article><article style={{background:'#163d2a',color:'#fff',borderRadius:18,padding:22}}><BarChart3 size={27} color="#c8e2ac"/><div style={{fontSize:12,fontWeight:950,color:'#c8e2ac',marginTop:10}}>LENDER / INVESTOR VIEW</div><h2 style={{fontSize:29,margin:'7px 0 9px'}}>A cleaner underwriting packet.</h2><p style={{color:'#dbe8df',lineHeight:1.55}}>Capital requested, use of proceeds, producer contribution, assistance, cash-flow model, repayment coverage, measured outcomes and verification status can be assembled into a permission-controlled project brief.</p></article></section>

    <section style={{background:'#163d2a',color:'#fff',padding:'48px 18px'}}><div style={{maxWidth:940,margin:'auto',textAlign:'center'}}><div style={{color:'#c8e2ac',fontSize:12,fontWeight:950}}>CONNECTED TO THE REST OF ARIDON AG</div><h2 style={{fontSize:'clamp(34px,5vw,50px)',margin:'8px 0 12px'}}>Plan it. Finance it. Measure it.</h2><p style={{color:'#dbe8df',fontSize:18,lineHeight:1.6}}>Use Money & Funding to find the capital path, Finance OS to understand the operation, and the regenerative workspace to connect the practice to measurable economics and outcomes.</p><div style={{display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap',marginTop:20}}><Link href="/ag/funding" style={{background:'#c8e2ac',color:'#17301e',padding:'13px 16px',borderRadius:11,fontWeight:950,textDecoration:'none'}}>Open Money & Funding</Link><Link href="/ag/finance" style={{border:'1px solid #b8cfb7',color:'#fff',padding:'13px 16px',borderRadius:11,fontWeight:900,textDecoration:'none'}}>Open Finance OS</Link></div></div></section>
  </main>;
}
