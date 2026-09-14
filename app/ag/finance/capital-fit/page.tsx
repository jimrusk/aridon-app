'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft, BadgeDollarSign, BarChart3, Bot, CheckCircle2, ClipboardCheck,
  Droplets, FileCheck2, FlaskConical, HandCoins, Landmark, Leaf, Network,
  ShieldCheck, Sprout, TimerReset, TrendingUp, Users, WalletCards
} from 'lucide-react';

type CapitalPath = { name:string; type:string; fit:number; use:string; evidence:string[]; action:string; };

const basePaths:CapitalPath[]=[
  {name:'Regenerative Transition Private Credit',type:'Private credit',fit:91,use:'Working capital, transition costs, equipment and multi-year practice changes.',evidence:['3-year cash flow','Soil baseline + trend','Input reduction plan','Yield history','Owner contribution'],action:'Prepare a lender-ready transition memo and debt-service case.'},
  {name:'Patient / Flexible Equity',type:'Alternative equity',fit:87,use:'Growth where standard venture timelines do not fit regenerative businesses, infrastructure or regional food-system companies.',evidence:['Unit economics','Cash-flow path','Governance','Investor return profile','Liquidity / exit options'],action:'Compare patient equity, preferred equity and strategic capital before defaulting to conventional VC.'},
  {name:'Revenue-Based / Royalty Capital',type:'Flexible growth capital',fit:83,use:'Businesses with recurring revenue or throughput that need growth capital without immediate conventional equity exits.',evidence:['Revenue history','Gross margin','Repayment waterfall','Customer concentration','Downside case'],action:'Model repayment as a percentage of revenue and test cash-flow tolerance.'},
  {name:'Farmland Mortgage / Lease Capital',type:'Real assets',fit:84,use:'Land acquisition, refinance, conservation-aligned ownership and long-duration leases.',evidence:['Appraisal / land value','Farm operating history','Soil + water resilience record','Debt schedule','Conservation plan'],action:'Package land economics separately from operating-company economics.'},
  {name:'Infrastructure Finance',type:'Project finance / term debt',fit:88,use:'Storage, processing, aggregation, irrigation, energy and shared regional infrastructure.',evidence:['Project capex','Throughput / utilization','Offtake or buyer evidence','Operating margin','Permits + site control'],action:'Create a stand-alone project model with repayment tied to infrastructure cash flow.'},
  {name:'Regional Transition Finance',type:'Blended regional capital',fit:90,use:'Producer cohorts plus processing, water, technical assistance, workforce and market infrastructure across a defined region.',evidence:['Regional producer pipeline','Shared infrastructure plan','Anchor buyers','Public / philanthropic match','Outcome measurement'],action:'Bundle farms and infrastructure into one investable regional transition package.'},
  {name:'Natural Capital / Real Asset Investment',type:'Natural capital',fit:86,use:'Farmland and working-land strategies where soil, water, biodiversity, resilience and operating performance can improve asset value.',evidence:['Land economics','Water risk','Soil trend','Operating performance','Natural-capital measurement'],action:'Translate ecological improvements into asset protection, operating savings, income and long-term value.'},
  {name:'Grant + Blended Capital',type:'Non-dilutive / catalytic',fit:86,use:'Demonstration, research, conservation, water, measurement, training and first-loss support.',evidence:['Public benefit','Technical scope','Matching funds','Measurement plan','Milestones'],action:'Match the project to grants and pair grant dollars with lender, sponsor or investor capital.'},
  {name:'Farmer Equity / Strategic Investment',type:'Equity',fit:69,use:'Growth platforms, processing businesses, technology adoption and scalable enterprises.',evidence:['Growth plan','Unit economics','Market demand','Governance','Exit / liquidity path'],action:'Use only where equity fits the business, not merely because debt is unavailable.'}
];

const coordinationQuestions=[
  ['Capital','What type of capital actually fits the farm, land, infrastructure or operating company?'],
  ['Risk','Which risks are agronomic, financial, market, water, insurance, management or execution risks?'],
  ['Evidence','What data will a lender, insurer, investor, foundation or buyer accept as decision-grade evidence?'],
  ['Returns','Where do investor returns come from: cash flow, land appreciation, margin expansion, ecosystem value, exit or repayment?'],
  ['Liquidity','When and how can capital exit or recycle without destabilizing the farm or project?'],
  ['Coordination','Which parts must move together: producer transition, buyers, infrastructure, technical assistance and capital?'],
  ['Verification','Who measured each claim, by what method, on what date, and with what confidence?'],
  ['Pilot','What is the smallest real project that can prove the model before a larger capital deployment?']
];

export default function CapitalFitPage(){
  const [verified,setVerified]=useState(true);
  const [water,setWater]=useState(78);
  const [soil,setSoil]=useState(82);
  const [yieldStability,setYieldStability]=useState(74);
  const [inputEfficiency,setInputEfficiency]=useState(81);
  const [practice,setPractice]=useState(88);

  const [investment,setInvestment]=useState(1000000);
  const [annualCashYield,setAnnualCashYield]=useState(7);
  const [holdYears,setHoldYears]=useState(7);
  const [terminalMultiple,setTerminalMultiple]=useState(1.25);
  const [catalyticPct,setCatalyticPct]=useState(20);

  const [laborHours,setLaborHours]=useState(10000);
  const [loadedWage,setLoadedWage]=useState(24);
  const [automationCapex,setAutomationCapex]=useState(180000);
  const [hoursReduced,setHoursReduced]=useState(3000);
  const [annualMaintenance,setAnnualMaintenance]=useState(18000);
  const [qualityBenefit,setQualityBenefit]=useState(25000);

  const riskScore=useMemo(()=>Math.round((soil*.24)+(water*.18)+(yieldStability*.22)+(inputEfficiency*.18)+(practice*.12)+(verified?6:0)),[soil,water,yieldStability,inputEfficiency,practice,verified]);
  const riskBand=riskScore>=82?'Lower transition risk':riskScore>=68?'Moderate transition risk':'Elevated transition risk';
  const paths=basePaths.map((p,i)=>({...p,fit:Math.max(40,Math.min(98,p.fit + Math.round((riskScore-78)/4) - (i===8?4:0)))})).sort((a,b)=>b.fit-a.fit);

  const liquidity=useMemo(()=>{
    const catalytic=investment*(catalyticPct/100);
    const privateCapital=investment-catalytic;
    const annualDistribution=privateCapital*(annualCashYield/100);
    const totalDistributions=annualDistribution*holdYears;
    const exitValue=privateCapital*terminalMultiple;
    const totalInvestorProceeds=totalDistributions+exitValue;
    const grossMultiple=privateCapital>0?totalInvestorProceeds/privateCapital:0;
    const roughAnnualized=holdYears>0?(Math.pow(grossMultiple,1/holdYears)-1)*100:0;
    return {catalytic,privateCapital,annualDistribution,totalDistributions,exitValue,totalInvestorProceeds,grossMultiple,roughAnnualized};
  },[investment,catalyticPct,annualCashYield,holdYears,terminalMultiple]);

  const automation=useMemo(()=>{
    const currentLaborCost=laborHours*loadedWage;
    const laborSavings=hoursReduced*loadedWage;
    const netAnnualBenefit=laborSavings+qualityBenefit-annualMaintenance;
    const paybackYears=netAnnualBenefit>0?automationCapex/netAnnualBenefit:Infinity;
    const firstYearROI=automationCapex>0?(netAnnualBenefit/automationCapex)*100:0;
    const remainingHours=Math.max(0,laborHours-hoursReduced);
    return {currentLaborCost,laborSavings,netAnnualBenefit,paybackYears,firstYearROI,remainingHours};
  },[laborHours,loadedWage,automationCapex,hoursReduced,annualMaintenance,qualityBenefit]);

  const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);

  return <main style={{minHeight:'100vh',background:'#f3f1e8',color:'#17251b',fontFamily:'Arial,sans-serif'}}>
    <header style={{background:'#123d2a',color:'#fff',padding:'14px 18px',position:'sticky',top:0,zIndex:5}}><div style={{maxWidth:1220,margin:'auto',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div style={{display:'flex',gap:10,alignItems:'center'}}><Link href="/ag/finance" style={{color:'#dce9dc',display:'inline-flex'}}><ArrowLeft size={20}/></Link><strong style={{letterSpacing:1.2}}>ARIDON REGENERATIVE CAPITAL FIT</strong></div><div style={{fontSize:12,color:'#cee0d1'}}>Field evidence → risk record → capital → liquidity → automation ROI</div></div></header>

    <section style={{maxWidth:1220,margin:'auto',padding:'36px 18px 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,340px),1fr))',gap:18}}>
      <article style={{background:'#173f2c',color:'#fff',borderRadius:22,padding:26}}><div style={{display:'flex',gap:8,alignItems:'center',color:'#cfe3ba',fontWeight:900,fontSize:12}}><HandCoins size={20}/> CAPITAL COORDINATION LAYER</div><h1 style={{fontSize:'clamp(38px,6vw,64px)',lineHeight:.98,letterSpacing:-2.2,margin:'12px 0'}}>Match the farm to the capital. Prove the risk and return story.</h1><p style={{fontSize:18,lineHeight:1.55,color:'#dce8df'}}>Aridon turns operational, soil, water, yield, labor and financial evidence into a finance-ready record, then shows how capital gets deployed, repaid or exited.</p><div style={{display:'flex',gap:9,flexWrap:'wrap',marginTop:18}}><Link href="/ag/soilscan" style={{background:'#e8f1d6',color:'#153c29',textDecoration:'none',fontWeight:950,padding:'12px 14px',borderRadius:11}}>Open SoilScan Evidence</Link><Link href="/ag/finance/farm-ownership" style={{background:'#fff',color:'#153c29',textDecoration:'none',fontWeight:950,padding:'12px 14px',borderRadius:11}}>Farm Ownership Pathway</Link><Link href="/ag/funding" style={{border:'1px solid #86a58d',color:'#fff',textDecoration:'none',fontWeight:900,padding:'12px 14px',borderRadius:11}}>Open Funding Workflow</Link></div></article>

      <article style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:22,padding:24}}><div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'start'}}><div><div style={{fontSize:12,color:'#397048',fontWeight:950}}>REGENERATIVE RISK RECORD</div><h2 style={{fontSize:30,margin:'7px 0'}}>Current underwriting signal</h2></div><ShieldCheck size={30} color="#397048"/></div><div style={{fontSize:74,fontWeight:950,lineHeight:1,marginTop:8}}>{riskScore}<span style={{fontSize:22,color:'#6a776d'}}>/100</span></div><div style={{fontWeight:900,color:riskScore>=82?'#2b6b3e':'#7b651d',marginTop:8}}>{riskBand}</div><p style={{color:'#59665e',lineHeight:1.5}}>Prototype score only. It organizes evidence for lender, insurer and investor review. It does not replace their underwriting.</p><button onClick={()=>setVerified(v=>!v)} style={{border:'1px solid #397048',background:verified?'#e6f2df':'#fff',color:'#235f35',borderRadius:10,padding:'10px 12px',fontWeight:900,cursor:'pointer'}}>{verified?'Verification attached':'Attach verification'}</button></article>
    </section>

    <section style={{maxWidth:1220,margin:'auto',padding:'0 18px 22px'}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(205px,1fr))',gap:12}}>{[
      ['Soil condition + trend',soil,setSoil,<Leaf size={20}/>],['Water efficiency',water,setWater,<Droplets size={20}/>],['Yield stability',yieldStability,setYieldStability,<BarChart3 size={20}/>],['Input efficiency',inputEfficiency,setInputEfficiency,<FlaskConical size={20}/>],['Practice adoption',practice,setPractice,<Sprout size={20}/>]
    ].map(([label,value,setValue,icon]:any)=><article key={label} style={{background:'#fff',border:'1px solid #d7dfd4',borderRadius:16,padding:16}}><div style={{display:'flex',gap:8,alignItems:'center',color:'#397048'}}>{icon}<strong style={{fontSize:12}}>{String(label).toUpperCase()}</strong></div><div style={{fontSize:34,fontWeight:950,margin:'10px 0 4px'}}>{value}</div><input aria-label={label} type="range" min="0" max="100" value={value} onChange={e=>setValue(Number(e.target.value))} style={{width:'100%'}}/></article>)}</div></section>

    <section style={{maxWidth:1220,margin:'auto',padding:'0 18px 30px'}}><div style={{fontSize:12,fontWeight:950,color:'#397048'}}>CAPITAL-FIT ENGINE</div><h2 style={{fontSize:'clamp(32px,5vw,48px)',margin:'7px 0 16px'}}>Rank financing by fit, not by whoever answers first.</h2><div style={{display:'grid',gap:12}}>{paths.map((p,idx)=><article key={p.name} style={{background:'#fff',border:idx===0?'2px solid #397048':'1px solid #d7dfd4',borderRadius:18,padding:18,display:'grid',gridTemplateColumns:'minmax(190px,.8fr) minmax(260px,1.4fr)',gap:16}}><div><div style={{display:'flex',gap:8,alignItems:'center',color:'#397048',fontWeight:950}}><BadgeDollarSign size={21}/> {p.type}</div><h3 style={{fontSize:24,margin:'8px 0 5px'}}>{p.name}</h3><div style={{fontSize:13,color:'#667269'}}>{p.use}</div><div style={{fontSize:42,fontWeight:950,marginTop:10}}>{p.fit}% <span style={{fontSize:12,color:'#6d786f'}}>FIT</span></div></div><div><div style={{fontWeight:950,marginBottom:8}}>Evidence package</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:7}}>{p.evidence.map(e=><div key={e} style={{display:'flex',gap:7,alignItems:'center',fontSize:13}}><CheckCircle2 size={16} color="#397048"/>{e}</div>)}</div><div style={{marginTop:13,background:'#f5f7f1',borderRadius:11,padding:11,fontSize:13}}><strong>Next action:</strong> {p.action}</div></div></article>)}</div></section>

    <section style={{background:'#fff7e8',padding:'40px 18px'}}><div style={{maxWidth:1220,margin:'auto'}}><div style={{display:'flex',alignItems:'center',gap:9,color:'#79551b',fontSize:12,fontWeight:950}}><WalletCards size={20}/> CAPITAL EXIT & LIQUIDITY ENGINE</div><h2 style={{fontSize:'clamp(32px,5vw,48px)',margin:'8px 0 8px'}}>Show exactly how the money comes back.</h2><p style={{maxWidth:860,color:'#66573f',lineHeight:1.6}}>Model patient, catalytic and conventional capital together so the investor can see distributions, refinance or exit timing, and the farm can see the burden before signing.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginTop:18}}>{[
      ['Total project capital',investment,setInvestment,100000,10000000,50000,'$'],
      ['Annual cash yield %',annualCashYield,setAnnualCashYield,0,20,.5,'%'],
      ['Hold period years',holdYears,setHoldYears,1,20,1,'yr'],
      ['Exit / refinance multiple',terminalMultiple,setTerminalMultiple,.5,3,.05,'x'],
      ['Catalytic capital %',catalyticPct,setCatalyticPct,0,80,5,'%']
    ].map(([label,value,setter,min,max,step,suffix]:any)=><article key={label} style={{background:'#fff',border:'1px solid #ead8b9',borderRadius:14,padding:15}}><strong style={{fontSize:12,color:'#79551b'}}>{String(label).toUpperCase()}</strong><div style={{fontSize:25,fontWeight:950,margin:'8px 0'}}>{suffix==='$'?money(value):`${Number(value).toLocaleString()}${suffix==='yr'?' years':suffix}`}</div><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>setter(Number(e.target.value))} style={{width:'100%'}}/></article>)}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:16}}>{[
        ['Catalytic / risk-tolerant layer',money(liquidity.catalytic)],['Private capital exposed',money(liquidity.privateCapital)],['Annual investor distribution',money(liquidity.annualDistribution)],['Modeled exit / refinance value',money(liquidity.exitValue)],['Gross proceeds to private capital',money(liquidity.totalInvestorProceeds)],['Gross multiple',`${liquidity.grossMultiple.toFixed(2)}x`],['Rough annualized return',`${liquidity.roughAnnualized.toFixed(1)}%`]
      ].map(([k,v])=><article key={k} style={{background:'#fff',border:'1px solid #ead8b9',borderRadius:14,padding:16}}><div style={{fontSize:12,color:'#7b694d',fontWeight:900}}>{k}</div><div style={{fontSize:30,fontWeight:950,marginTop:6}}>{v}</div></article>)}</div><p style={{fontSize:12,color:'#766953',marginTop:14}}>Screening model only. Actual IRR, tax treatment, distributions, terminal value and exit rights require transaction-specific modeling and investor review.</p></div></section>

    <section style={{background:'#edf3f4',padding:'40px 18px'}}><div style={{maxWidth:1220,margin:'auto'}}><div style={{display:'flex',alignItems:'center',gap:9,color:'#315965',fontSize:12,fontWeight:950}}><Bot size={20}/> LABOR & AUTOMATION ROI RECORD</div><h2 style={{fontSize:'clamp(32px,5vw,48px)',margin:'8px 0 8px'}}>Prove whether automation actually helps the farm.</h2><p style={{maxWidth:860,color:'#52656b',lineHeight:1.6}}>Track labor scarcity, safety, cost, quality and workforce impact so robotics and AI investments can be underwritten with real operating economics.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginTop:18}}>{[
        ['Annual labor hours',laborHours,setLaborHours,1000,50000,500],
        ['Loaded wage $/hour',loadedWage,setLoadedWage,10,60,1],
        ['Automation capex',automationCapex,setAutomationCapex,10000,1000000,10000],
        ['Hours reduced / reassigned',hoursReduced,setHoursReduced,0,20000,250],
        ['Annual maintenance',annualMaintenance,setAnnualMaintenance,0,150000,2500],
        ['Annual quality / yield benefit',qualityBenefit,setQualityBenefit,0,250000,5000]
      ].map(([label,value,setter,min,max,step]:any)=><article key={label} style={{background:'#fff',border:'1px solid #cfdee1',borderRadius:14,padding:15}}><strong style={{fontSize:12,color:'#315965'}}>{String(label).toUpperCase()}</strong><div style={{fontSize:25,fontWeight:950,margin:'8px 0'}}>{String(label).includes('wage')||String(label).includes('capex')||String(label).includes('maintenance')||String(label).includes('benefit')?money(value):Number(value).toLocaleString()}</div><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>setter(Number(e.target.value))} style={{width:'100%'}}/></article>)}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:16}}>{[
        ['Current annual labor cost',money(automation.currentLaborCost)],['Labor savings / capacity value',money(automation.laborSavings)],['Net annual automation benefit',money(automation.netAnnualBenefit)],['Simple payback',Number.isFinite(automation.paybackYears)?`${automation.paybackYears.toFixed(1)} years`:'No payback'],['First-year ROI',`${automation.firstYearROI.toFixed(1)}%`],['Remaining human labor hours',automation.remainingHours.toLocaleString()]
      ].map(([k,v])=><article key={k} style={{background:'#fff',border:'1px solid #cfdee1',borderRadius:14,padding:16}}><div style={{fontSize:12,color:'#5a7076',fontWeight:900}}>{k}</div><div style={{fontSize:30,fontWeight:950,marginTop:6}}>{v}</div></article>)}</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12,marginTop:14}}>{['Task bottleneck and seasonal labor gap','Worker-safety and ergonomics benefit','Training / role-upgrade requirement','Yield, quality and downtime effect','Vendor/service dependency','Human override and operating continuity'].map(x=><div key={x} style={{background:'#fff',border:'1px solid #cfdee1',borderRadius:12,padding:13,display:'flex',gap:8,alignItems:'center'}}><CheckCircle2 size={17} color="#315965"/><span style={{fontSize:13}}>{x}</span></div>)}</div></div></section>

    <section style={{background:'#173f2c',color:'#fff',padding:'38px 18px'}}><div style={{maxWidth:1220,margin:'auto'}}><div style={{display:'flex',alignItems:'center',gap:9,color:'#cfe3ba',fontSize:12,fontWeight:950}}><Network size={20}/> RFSI CAPITAL QUESTION ENGINE</div><h2 style={{fontSize:'clamp(32px,5vw,48px)',margin:'8px 0 8px'}}>Answer the questions before the investor asks them.</h2><p style={{maxWidth:860,color:'#dce8df',lineHeight:1.6}}>These recurring decision questions now feed directly into capital fit, liquidity planning, natural-capital underwriting, labor/automation ROI and regional transition finance.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:12,marginTop:18}}>{coordinationQuestions.map(([title,body])=><article key={title} style={{background:'#214c37',border:'1px solid #3c664e',borderRadius:16,padding:17}}><strong style={{color:'#d9efc7'}}>{title}</strong><p style={{margin:'7px 0 0',lineHeight:1.5,color:'#eef5ef'}}>{body}</p></article>)}</div></div></section>

    <section style={{background:'#e5eadf',padding:'36px 18px'}}><div style={{maxWidth:1220,margin:'auto'}}><div style={{fontSize:12,fontWeight:950,color:'#397048'}}>LENDER / INSURER / INVESTOR EVIDENCE PACKET</div><h2 style={{fontSize:'clamp(30px,5vw,46px)',margin:'7px 0 16px'}}>One record, multiple capital conversations.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>{[
      [<FileCheck2 size={24}/>, 'Operating & financial','Cash flow, debt, enterprise margin, liquidity, repayment capacity and requested use of funds.'],
      [<Leaf size={24}/>, 'Regenerative evidence','Baseline, practice adoption, soil trend, input intensity, lab verification and measurement confidence.'],
      [<Droplets size={24}/>, 'Water resilience','Water source, efficiency, reliability, conservation actions and drought exposure.'],
      [<TrendingUp size={24}/>, 'Performance','Yield stability, production variance, buyer/offtake evidence and margin trend.'],
      [<Landmark size={24}/>, 'Natural capital value','Land value, conservation options, biodiversity, carbon/water opportunities, resilience and asset-protection effects.'],
      [<TimerReset size={24}/>, 'Liquidity & exit','Holding period, cash yield, refinance point, terminal value, distribution policy and investor capital recycling.'],
      [<Bot size={24}/>, 'Labor & automation','Labor bottlenecks, safety, hours, wage burden, automation capex, payback, workforce transition and operating continuity.'],
      [<ClipboardCheck size={24}/>, 'Validation trail','Who measured it, method used, date, source file, confidence and verification status.'],
      [<Users size={24}/>, 'Capital coordination','Recommended lender/investor class, missing evidence, next introduction, co-investor role and application status.']
    ].map(([icon,title,body]:any)=><article key={title} style={{background:'#fff',border:'1px solid #d2dbd0',borderRadius:16,padding:18}}><div style={{color:'#397048'}}>{icon}</div><h3 style={{fontSize:21,margin:'9px 0 6px'}}>{title}</h3><p style={{margin:0,color:'#58665d',lineHeight:1.5}}>{body}</p></article>)}</div></div></section>

    <footer style={{padding:'24px 18px 38px'}}><div style={{maxWidth:1220,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center'}}><div><strong>Aridon Ag Regenerative Finance Layer</strong><div style={{fontSize:12,color:'#68746b',marginTop:4}}>Decision support and evidence organization. Final credit, insurance, investment and automation decisions remain with the relevant provider and operator.</div></div><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Link href="/ag/finance" style={{color:'#397048',fontWeight:900,textDecoration:'none'}}>Finance OS</Link><Link href="/ag" style={{color:'#397048',fontWeight:900,textDecoration:'none'}}>Aridon Ag</Link></div></div></footer>
  </main>;
}
