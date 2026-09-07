'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, BadgeDollarSign, BarChart3, CheckCircle2, ClipboardCheck, Droplets, FileCheck2, FlaskConical, HandCoins, Landmark, Leaf, ShieldCheck, Sprout, TrendingUp, Users } from 'lucide-react';

type CapitalPath = {
  name:string;
  type:string;
  fit:number;
  use:string;
  evidence:string[];
  action:string;
};

const basePaths:CapitalPath[]=[
  {name:'Regenerative Transition Private Credit',type:'Private credit',fit:91,use:'Working capital, transition costs, equipment and multi-year practice changes.',evidence:['3-year cash flow','Soil baseline + trend','Input reduction plan','Yield history','Owner contribution'],action:'Prepare a lender-ready transition memo and debt-service case.'},
  {name:'Farmland Mortgage / Lease Capital',type:'Real assets',fit:84,use:'Land acquisition, refinance, conservation-aligned ownership and long-duration leases.',evidence:['Appraisal / land value','Farm operating history','Soil + water resilience record','Debt schedule','Conservation plan'],action:'Package land economics separately from operating-company economics.'},
  {name:'Infrastructure Finance',type:'Project finance / term debt',fit:88,use:'Storage, processing, aggregation, irrigation, energy and shared regional infrastructure.',evidence:['Project capex','Throughput / utilization','Offtake or buyer evidence','Operating margin','Permits + site control'],action:'Create a stand-alone project model with repayment tied to infrastructure cash flow.'},
  {name:'Grant + Blended Capital',type:'Non-dilutive / catalytic',fit:86,use:'Demonstration, research, conservation, water, measurement, training and first-loss support.',evidence:['Public benefit','Technical scope','Matching funds','Measurement plan','Milestones'],action:'Match the project to grants and pair grant dollars with lender or sponsor capital.'},
  {name:'Farmer Equity / Strategic Investment',type:'Equity',fit:69,use:'Growth platforms, processing businesses, technology adoption and scalable enterprises.',evidence:['Growth plan','Unit economics','Market demand','Governance','Exit / liquidity path'],action:'Use only where equity fits the business, not merely because debt is unavailable.'}
];

export default function CapitalFitPage(){
  const [verified,setVerified]=useState(true);
  const [water,setWater]=useState(78);
  const [soil,setSoil]=useState(82);
  const [yieldStability,setYieldStability]=useState(74);
  const [inputEfficiency,setInputEfficiency]=useState(81);
  const [practice,setPractice]=useState(88);

  const riskScore=useMemo(()=>Math.round((soil*.24)+(water*.18)+(yieldStability*.22)+(inputEfficiency*.18)+(practice*.12)+(verified?6:0)),[soil,water,yieldStability,inputEfficiency,practice,verified]);
  const riskBand=riskScore>=82?'Lower transition risk':riskScore>=68?'Moderate transition risk':'Elevated transition risk';

  const paths=basePaths.map((p,i)=>({...p,fit:Math.max(40,Math.min(98,p.fit + Math.round((riskScore-78)/4) - (i===4?4:0)))})).sort((a,b)=>b.fit-a.fit);

  return <main style={{minHeight:'100vh',background:'#f3f1e8',color:'#17251b',fontFamily:'Arial,sans-serif'}}>
    <header style={{background:'#123d2a',color:'#fff',padding:'14px 18px',position:'sticky',top:0,zIndex:5}}><div style={{maxWidth:1220,margin:'auto',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div style={{display:'flex',gap:10,alignItems:'center'}}><Link href="/ag/finance" style={{color:'#dce9dc',display:'inline-flex'}}><ArrowLeft size={20}/></Link><strong style={{letterSpacing:1.2}}>ARIDON REGENERATIVE CAPITAL FIT</strong></div><div style={{fontSize:12,color:'#cee0d1'}}>Field evidence → risk record → right-fit capital</div></div></header>

    <section style={{maxWidth:1220,margin:'auto',padding:'36px 18px 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,340px),1fr))',gap:18}}>
      <article style={{background:'#173f2c',color:'#fff',borderRadius:22,padding:26}}><div style={{display:'flex',gap:8,alignItems:'center',color:'#cfe3ba',fontWeight:900,fontSize:12}}><HandCoins size={20}/> CAPITAL COORDINATION LAYER</div><h1 style={{fontSize:'clamp(38px,6vw,64px)',lineHeight:.98,letterSpacing:-2.2,margin:'12px 0'}}>Match the farm to the capital. Prove the risk story.</h1><p style={{fontSize:18,lineHeight:1.55,color:'#dce8df'}}>Aridon turns operational, soil, water, yield and financial evidence into a finance-ready record, then routes the project toward the capital structure that actually fits.</p><div style={{display:'flex',gap:9,flexWrap:'wrap',marginTop:18}}><Link href="/ag/soilscan" style={{background:'#e8f1d6',color:'#153c29',textDecoration:'none',fontWeight:950,padding:'12px 14px',borderRadius:11}}>Open SoilScan Evidence</Link><Link href="/ag/funding" style={{border:'1px solid #86a58d',color:'#fff',textDecoration:'none',fontWeight:900,padding:'12px 14px',borderRadius:11}}>Open Funding Workflow</Link></div></article>

      <article style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:22,padding:24}}><div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'start'}}><div><div style={{fontSize:12,color:'#397048',fontWeight:950}}>REGENERATIVE RISK RECORD</div><h2 style={{fontSize:30,margin:'7px 0'}}>Current underwriting signal</h2></div><ShieldCheck size={30} color="#397048"/></div><div style={{fontSize:74,fontWeight:950,lineHeight:1,marginTop:8}}>{riskScore}<span style={{fontSize:22,color:'#6a776d'}}>/100</span></div><div style={{fontWeight:900,color:riskScore>=82?'#2b6b3e':'#7b651d',marginTop:8}}>{riskBand}</div><p style={{color:'#59665e',lineHeight:1.5}}>Prototype score only. It is designed to organize evidence for lender and insurer review, not replace their underwriting.</p><button onClick={()=>setVerified(v=>!v)} style={{border:'1px solid #397048',background:verified?'#e6f2df':'#fff',color:'#235f35',borderRadius:10,padding:'10px 12px',fontWeight:900,cursor:'pointer'}}>{verified?'Verification attached':'Attach verification'}</button></article>
    </section>

    <section style={{maxWidth:1220,margin:'auto',padding:'0 18px 22px'}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(205px,1fr))',gap:12}}>{[
      ['Soil condition + trend',soil,setSoil,<Leaf size={20}/>],['Water efficiency',water,setWater,<Droplets size={20}/>],['Yield stability',yieldStability,setYieldStability,<BarChart3 size={20}/>],['Input efficiency',inputEfficiency,setInputEfficiency,<FlaskConical size={20}/>],['Practice adoption',practice,setPractice,<Sprout size={20}/>]
    ].map(([label,value,setValue,icon]:any)=><article key={label} style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:16,padding:16}}><div style={{display:'flex',gap:8,alignItems:'center',color:'#397048'}}>{icon}<strong style={{fontSize:12}}>{String(label).toUpperCase()}</strong></div><div style={{fontSize:34,fontWeight:950,margin:'10px 0 4px'}}>{value}</div><input aria-label={label} type="range" min="0" max="100" value={value} onChange={e=>setValue(Number(e.target.value))} style={{width:'100%'}}/></article>)}</div></section>

    <section style={{maxWidth:1220,margin:'auto',padding:'0 18px 26px'}}><div style={{fontSize:12,fontWeight:950,color:'#397048'}}>CAPITAL-FIT ENGINE</div><h2 style={{fontSize:'clamp(32px,5vw,48px)',margin:'7px 0 16px'}}>Rank financing by fit, not by whoever answers first.</h2><div style={{display:'grid',gap:12}}>{paths.map((p,idx)=><article key={p.name} style={{background:'#fff',border:idx===0?'2px solid #397048':'1px solid #d7dfd4',borderRadius:18,padding:18,display:'grid',gridTemplateColumns:'minmax(190px,.8fr) minmax(260px,1.4fr)',gap:16}}><div><div style={{display:'flex',gap:8,alignItems:'center',color:'#397048',fontWeight:950}}><BadgeDollarSign size={21}/> {p.type}</div><h3 style={{fontSize:24,margin:'8px 0 5px'}}>{p.name}</h3><div style={{fontSize:13,color:'#667269'}}>{p.use}</div><div style={{fontSize:42,fontWeight:950,marginTop:10}}>{p.fit}% <span style={{fontSize:12,color:'#6d786f'}}>FIT</span></div></div><div><div style={{fontWeight:950,marginBottom:8}}>Evidence package</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:7}}>{p.evidence.map(e=><div key={e} style={{display:'flex',gap:7,alignItems:'center',fontSize:13}}><CheckCircle2 size={16} color="#397048"/>{e}</div>)}</div><div style={{marginTop:13,background:'#f5f7f1',borderRadius:11,padding:11,fontSize:13}}><strong>Next action:</strong> {p.action}</div></div></article>)}</div></section>

    <section style={{background:'#e5eadf',padding:'36px 18px'}}><div style={{maxWidth:1220,margin:'auto'}}><div style={{fontSize:12,fontWeight:950,color:'#397048'}}>LENDER / INSURER EVIDENCE PACKET</div><h2 style={{fontSize:'clamp(30px,5vw,46px)',margin:'7px 0 16px'}}>One record, multiple capital conversations.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>{[
      [<FileCheck2 size={24}/>, 'Operating & financial','Cash flow, debt, enterprise margin, liquidity, repayment capacity and requested use of funds.'],
      [<Leaf size={24}/>, 'Regenerative evidence','Baseline, practice adoption, soil trend, input intensity, lab verification and measurement confidence.'],
      [<Droplets size={24}/>, 'Water resilience','Water source, efficiency, reliability, conservation actions and drought exposure.'],
      [<TrendingUp size={24}/>, 'Performance','Yield stability, production variance, buyer/offtake evidence and margin trend.'],
      [<ClipboardCheck size={24}/>, 'Validation trail','Who measured it, method used, date, source file, confidence and verification status.'],
      [<Users size={24}/>, 'Capital coordination','Recommended lender/investor class, missing evidence, next introduction and application status.']
    ].map(([icon,title,body]:any)=><article key={title} style={{background:'#fff',border:'1px solid #d2dbd0',borderRadius:16,padding:18}}><div style={{color:'#397048'}}>{icon}</div><h3 style={{fontSize:21,margin:'9px 0 6px'}}>{title}</h3><p style={{margin:0,color:'#58665d',lineHeight:1.5}}>{body}</p></article>)}</div></div></section>

    <footer style={{padding:'24px 18px 38px'}}><div style={{maxWidth:1220,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center'}}><div><strong>Aridon Ag Regenerative Finance Layer</strong><div style={{fontSize:12,color:'#68746b',marginTop:4}}>Decision support and evidence organization. Final credit and insurance decisions remain with the capital provider.</div></div><div style={{display:'flex',gap:12}}><Link href="/ag/finance" style={{color:'#397048',fontWeight:900,textDecoration:'none'}}>Finance OS</Link><Link href="/ag" style={{color:'#397048',fontWeight:900,textDecoration:'none'}}>Aridon Ag</Link></div></div></footer>
  </main>;
}
