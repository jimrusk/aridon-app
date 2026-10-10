'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, BadgeDollarSign, CheckCircle2, ClipboardCheck, Factory, FileCheck2, HandCoins, Landmark, Leaf, ShieldCheck, Tractor, Users } from 'lucide-react';

type Status='Verified'|'Documented'|'Estimated'|'Missing';
type Field={name:string;status:Status;note:string};

const capitalFields:Field[]=[
 {name:'Project entity + ownership',status:'Documented',note:'Borrower/project company, sponsor and governance'},
 {name:'Total project cost + sources/uses',status:'Estimated',note:'Separate construction, equipment, working capital and reserves'},
 {name:'Rural / TEA eligibility',status:'Missing',note:'Independent location determination required before any EB-5 representation'},
 {name:'Jobs required + projected',status:'Missing',note:'Economic/job study and job cushion'},
 {name:'Senior debt + collateral',status:'Missing',note:'Term, lien, DSCR, appraisal and guarantees'},
 {name:'Catalytic / first-loss layer',status:'Estimated',note:'Grant, recoverable grant, PRI or subordinated capital'},
 {name:'Patient / strategic equity',status:'Estimated',note:'Governance, preferred return, distributions and liquidity'},
 {name:'Buyer / offtake commitments',status:'Missing',note:'Volumes, pricing, term and counterparty quality'},
 {name:'Refinance / investor exit',status:'Missing',note:'Target year, takeout source, extension rights and downside'},
 {name:'Insurance / risk transfer',status:'Missing',note:'Property, crop, business interruption and transition-risk options'}
];

const evidenceFields:Field[]=[
 {name:'Historical financials',status:'Missing',note:'3 years where available plus YTD'},
 {name:'Field + producer baseline',status:'Documented',note:'Soil, water, yield, inputs, labor and practice history'},
 {name:'Water evidence',status:'Documented',note:'Source, rights, reliability, quality, storage and efficiency'},
 {name:'Transition persistence record',status:'Estimated',note:'Practice start, required duration, reversion triggers and cure period'},
 {name:'Independent verification',status:'Missing',note:'Method, verifier, date, provenance and confidence'},
 {name:'Site control + permits',status:'Missing',note:'Lease/deed, zoning, utilities, environmental and construction status'},
 {name:'Construction / equipment bids',status:'Missing',note:'Vendor scope, contingency, schedule and commissioning'},
 {name:'Market evidence',status:'Missing',note:'LOIs, contracts, throughput and customer concentration'},
 {name:'Downside model',status:'Missing',note:'Yield, price, utilization, delay, rate and cost-overrun scenarios'},
 {name:'Measurement plan',status:'Documented',note:'Financial + soil + water + yield + jobs + workforce KPIs'}
];

const routes=[
 ['Grant / catalytic capital','Demonstration, measurement, technical assistance, public benefit and first-loss support.'],
 ['Private credit','Equipment, working capital, transition costs and cash-flowing infrastructure.'],
 ['Patient / preferred equity','Longer-duration projects where conventional VC timing is a mismatch.'],
 ['Revenue-based finance','Recurring revenue/throughput with repayment tied to business performance.'],
 ['Rural job-creation capital','Screen qualifying rural processing/storage projects for EB-5 and related economic-development structures.'],
 ['Infrastructure finance','Cold storage, processing, aggregation, water, energy and shared regional assets.'],
 ['Natural capital','Translate soil/water/resilience evidence into asset protection and operating value.'],
 ['Land-access capital','Layer conservation, lease-to-own, mortgage and mission-aligned ownership structures.']
];

export default function CapitalFitV2(){
 const [projectCost,setProjectCost]=useState(12000000);
 const [grantPct,setGrantPct]=useState(15);
 const [catalyticPct,setCatalyticPct]=useState(10);
 const [debtPct,setDebtPct]=useState(45);
 const [eb5Pct,setEb5Pct]=useState(20);
 const [equityPct,setEquityPct]=useState(10);
 const [jobs,setJobs]=useState(120);
 const [annualEBITDA,setAnnualEBITDA]=useState(1800000);
 const [annualDebtService,setAnnualDebtService]=useState(1100000);
 const totalPct=grantPct+catalyticPct+debtPct+eb5Pct+equityPct;
 const dscr=annualDebtService>0?annualEBITDA/annualDebtService:0;
 const missing=[...capitalFields,...evidenceFields].filter(x=>x.status==='Missing').length;
 const readiness=Math.max(0,Math.min(100,Math.round(100-missing*5-Math.abs(100-totalPct)*2+(dscr>=1.25?5:0))));
 const verdict=readiness>=85?'CAPITAL READY':readiness>=60?'NEARLY READY':'NOT READY';
 const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
 const stack=useMemo(()=>[
  ['Grant',grantPct],['Catalytic',catalyticPct],['Senior / private debt',debtPct],['Rural job-creation / EB-5 screen',eb5Pct],['Sponsor / patient equity',equityPct]
 ],[grantPct,catalyticPct,debtPct,eb5Pct,equityPct]);
 return <main style={{minHeight:'100vh',background:'#f3f1e8',color:'#17251b',fontFamily:'Arial,sans-serif'}}>
  <header style={{background:'#123d2a',color:'#fff',padding:'14px 18px',position:'sticky',top:0,zIndex:10}}><div style={{maxWidth:1240,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div style={{display:'flex',gap:10,alignItems:'center'}}><Link href="/ag/finance/capital-fit" style={{color:'#fff'}}><ArrowLeft size={20}/></Link><strong>ARIDON CAPITAL FIT 2.0</strong></div><span style={{fontSize:12,color:'#d5e4d7'}}>Evidence → risk transfer → capital stack → repayment → exit</span></div></header>

  <section style={{maxWidth:1240,margin:'auto',padding:'34px 18px 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,350px),1fr))',gap:16}}>
   <article style={{background:'#173f2c',color:'#fff',borderRadius:22,padding:25}}><div style={{fontSize:12,fontWeight:950,color:'#cfe3ba'}}>LIVE PILOT · SOUTHWEST AG PROCESSING + COLD STORAGE</div><h1 style={{fontSize:'clamp(38px,6vw,62px)',lineHeight:1,margin:'10px 0'}}>Build the deal, not just the score.</h1><p style={{fontSize:17,lineHeight:1.55,color:'#dce8df'}}>Capital Fit 2.0 assembles a financeable project record across farm evidence, infrastructure, insurance, jobs, market demand, blended capital and investor liquidity.</p></article>
   <article style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:22,padding:24}}><div style={{display:'flex',justifyContent:'space-between'}}><div><div style={{fontSize:12,fontWeight:950,color:'#397048'}}>READINESS VERDICT</div><h2 style={{fontSize:34,margin:'8px 0'}}>{verdict}</h2></div><ShieldCheck size={34} color="#397048"/></div><div style={{fontSize:72,fontWeight:950}}>{readiness}<span style={{fontSize:18}}>/100</span></div><p>{missing} decision-grade items are still missing. Stack allocation totals {totalPct}%.</p><div style={{padding:12,borderRadius:12,background:dscr>=1.25?'#e8f1df':'#fff1ec',fontWeight:900}}>Modeled DSCR: {dscr.toFixed(2)}x {dscr>=1.25?'✓':'· strengthen coverage'}</div></article>
  </section>

  <section style={{maxWidth:1240,margin:'auto',padding:'0 18px 22px'}}><article style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:22,padding:22}}><div style={{display:'flex',gap:9,alignItems:'center'}}><HandCoins/><h2 style={{margin:0}}>Capital Stack Builder</h2></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginTop:16}}><label style={{fontWeight:800}}>Project cost<input type="number" value={projectCost} onChange={e=>setProjectCost(+e.target.value)} style={{width:'100%',padding:10,marginTop:6}}/></label><label style={{fontWeight:800}}>Annual EBITDA<input type="number" value={annualEBITDA} onChange={e=>setAnnualEBITDA(+e.target.value)} style={{width:'100%',padding:10,marginTop:6}}/></label><label style={{fontWeight:800}}>Annual debt service<input type="number" value={annualDebtService} onChange={e=>setAnnualDebtService(+e.target.value)} style={{width:'100%',padding:10,marginTop:6}}/></label><label style={{fontWeight:800}}>Projected jobs<input type="number" value={jobs} onChange={e=>setJobs(+e.target.value)} style={{width:'100%',padding:10,marginTop:6}}/></label></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10,marginTop:18}}>{stack.map(([name,pct]:any,i)=><div key={name} style={{background:'#f6f7f2',padding:14,borderRadius:14}}><strong>{name}</strong><div style={{fontSize:26,fontWeight:950,margin:'7px 0'}}>{money(projectCost*pct/100)}</div><input type="range" min="0" max="80" value={pct} onChange={e=>[setGrantPct,setCatalyticPct,setDebtPct,setEb5Pct,setEquityPct][i](+e.target.value)} style={{width:'100%'}}/><div>{pct}%</div></div>)}</div><p style={{fontSize:12,color:'#657169'}}>EB-5 is a screening pathway only. Eligibility, offering structure, job methodology and securities/immigration compliance require qualified counsel and project-specific diligence.</p></article></section>

  <section style={{maxWidth:1240,margin:'auto',padding:'0 18px 22px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,430px),1fr))',gap:16}}>{[[capitalFields,'CAPITAL FIT FIELDS',<Landmark key="i"/>],[evidenceFields,'LENDER / INVESTOR EVIDENCE PACKAGE',<FileCheck2 key="i"/>]].map(([fields,title,icon]:any)=><article key={title} style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:22,padding:22}}><div style={{display:'flex',gap:9,alignItems:'center'}}>{icon}<h2>{title}</h2></div>{fields.map((f:Field)=><div key={f.name} style={{borderTop:'1px solid #e3e7e1',padding:'12px 0',display:'grid',gridTemplateColumns:'1fr auto',gap:10}}><div><strong>{f.name}</strong><div style={{fontSize:13,color:'#667269',marginTop:4}}>{f.note}</div></div><span style={{height:'fit-content',fontSize:10,fontWeight:950,padding:'5px 8px',borderRadius:999,background:f.status==='Missing'?'#f8e1dc':'#e5efdf'}}>{f.status.toUpperCase()}</span></div>)}</article>)}</section>

  <section style={{maxWidth:1240,margin:'auto',padding:'0 18px 22px'}}><article style={{background:'#e6ecdf',borderRadius:22,padding:22}}><div style={{display:'flex',gap:9,alignItems:'center'}}><BadgeDollarSign/><h2>Capital Matching Routes</h2></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:10}}>{routes.map(([n,d])=><div key={n} style={{background:'#fff',borderRadius:14,padding:15}}><strong>{n}</strong><p style={{color:'#59665e',lineHeight:1.45}}>{d}</p></div>)}</div></article></section>

  <section style={{maxWidth:1240,margin:'auto',padding:'0 18px 40px'}}><article style={{background:'#fff',border:'2px solid #173f2c',borderRadius:22,padding:22}}><div style={{display:'flex',gap:9,alignItems:'center'}}><ClipboardCheck/><h2>Smallest Practical Validation Pilot</h2></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>{[
   ['1 · Define one asset','One Four Corners processing/cold-storage project with site, capex, throughput and operating company.'],
   ['2 · Recruit supply','Document a small producer cohort, products, volumes, transition practices and delivery windows.'],
   ['3 · Recruit demand','Secure at least one buyer LOI/offtake expression with volume and pricing logic.'],
   ['4 · Build evidence room','Financials, site control, permits, bids, soil/water/yield records, jobs and verification provenance.'],
   ['5 · Test capital stack','Run lender debt, catalytic layer, patient equity and rural job-creation eligibility in parallel.'],
   ['6 · Get market verdict','Ask real capital providers what changes approval, pricing, advance rate, reserves and exit confidence.']
  ].map(([a,b])=><div key={a} style={{background:'#f6f7f2',borderRadius:14,padding:15}}><strong>{a}</strong><p style={{lineHeight:1.45}}>{b}</p></div>)}</div><div style={{marginTop:16,padding:16,borderRadius:14,background:'#173f2c',color:'#fff'}}><strong>OUTPUT:</strong> one lender/investor-ready package showing exactly what is verified, what is missing, who carries each risk, where repayment comes from and how capital exits.</div></article></section>
 </main>;
}
