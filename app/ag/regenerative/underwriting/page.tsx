"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, FileCheck2, HandCoins, Landmark, LineChart, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { getBrowserClient } from "../../../../lib/supabase";

const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
type ProjectType='Water / infrastructure'|'Land access'|'Soil / crop transition'|'Grazing / livestock'|'Aggregator / supply chain';
type Measurement={category:string;metric:string;value:number;unit:string;source:string;verified:boolean};

export default function Page(){
  const [operation,setOperation]=useState('');
  const [stateName,setStateName]=useState('New Mexico');
  const [acres,setAcres]=useState(1000);
  const [projectType,setProjectType]=useState<ProjectType>('Water / infrastructure');
  const [goal,setGoal]=useState('Improve resilience and reduce operating risk');
  const [projectCost,setProjectCost]=useState(300000);
  const [grant,setGrant]=useState(90000);
  const [equity,setEquity]=useState(30000);
  const [annualBenefit,setAnnualBenefit]=useState(80000);
  const [annualDebtService,setAnnualDebtService]=useState(36000);
  const [soilYears,setSoilYears]=useState(3);
  const [waterReliability,setWaterReliability]=useState(72);
  const [margin,setMargin]=useState(14);
  const [diversification,setDiversification]=useState(3);
  const [lossFreeYears,setLossFreeYears]=useState(3);
  const [dataCoverage,setDataCoverage]=useState(65);
  const [projectId,setProjectId]=useState<string|null>(null);
  const [status,setStatus]=useState('');
  const [recipient,setRecipient]=useState('');
  const [measurement,setMeasurement]=useState<Measurement>({category:'Soil',metric:'Organic matter',value:2.8,unit:'%',source:'Lab report',verified:false});
  const [measurements,setMeasurements]=useState<Measurement[]>([]);

  const model=useMemo(()=>{
    const debt=Math.max(0,projectCost-grant-equity);
    const dscr=annualDebtService>0?annualBenefit/annualDebtService:0;
    const leverage=projectCost>0?debt/projectCost:0;
    const soil=clamp(35+soilYears*6.5);
    const water=clamp(waterReliability);
    const production=clamp(40+diversification*10);
    const financial=clamp((margin*2)+(dscr*25));
    const climate=clamp((waterReliability*.65)+(diversification*7));
    const insurance=clamp(35+lossFreeYears*7);
    const data=clamp(dataCoverage);
    const overall=clamp(soil*.14+water*.16+production*.13+financial*.22+climate*.12+insurance*.10+data*.13);
    return {debt,dscr,leverage,soil,water,production,financial,climate,insurance,data,overall};
  },[projectCost,grant,equity,annualBenefit,annualDebtService,soilYears,waterReliability,margin,diversification,lossFreeYears,dataCoverage]);

  const capitalPlan=useMemo(()=>{
    const gap=model.debt;
    if(projectType==='Land access') return [
      ['Producer equity',equity,'Owner commitment'],
      ['Land capital / long-term lease',gap*.75,'Patient farmland or lease capital'],
      ['Conservation / transition assistance',grant,'Public or philanthropic cost share'],
      ['Bridge / working capital',gap*.25,'Transition-period liquidity'],
    ];
    if(projectType==='Aggregator / supply chain') return [
      ['Sponsor equity',equity,'Sponsor commitment'],
      ['Grant / catalytic capital',grant,'De-risk early capacity and market development'],
      ['Working-capital facility',gap*.55,'Inventory, receivables and seasonal needs'],
      ['Growth debt or equity',gap*.45,'Expansion and aggregation infrastructure'],
    ];
    return [
      ['Producer equity',equity,'Owner commitment'],
      ['Grant / cost share',grant,'NRCS, USDA, state, foundation or corporate support'],
      ['Equipment / project debt',gap*.7,'Cash-flow-supported senior capital'],
      ['Impact / subordinated capital',gap*.3,'Fill transition or risk-sharing gap'],
    ];
  },[projectType,equity,grant,model.debt]);

  async function saveWorkspace(){
    setStatus('Saving…');
    try{
      const supabase=getBrowserClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){setStatus('Sign in to Aridon to save this underwriting workspace.');return;}
      const payload={operation_name:operation||'Unnamed operation',state:stateName,acres,enterprise:projectType,transition_goal:goal,project_cost:projectCost,producer_equity:equity,expected_grants:grant,expected_annual_benefit:annualBenefit,annual_debt_service:annualDebtService,status:'underwriting'};
      const result=projectId
        ?await supabase.from('regenerative_projects').update(payload).eq('id',projectId).select('id').single()
        :await supabase.from('regenerative_projects').insert(payload).select('id').single();
      if(result.error) throw result.error;
      const id=result.data.id as string;
      setProjectId(id);
      const risk={project_id:id,soil_score:model.soil,water_score:model.water,production_score:model.production,financial_score:model.financial,climate_score:model.climate,insurance_score:model.insurance,data_score:model.data,overall_score:model.overall,dscr:model.dscr,debt_to_project_cost:model.leverage,loss_history_years:lossFreeYears,notes:`${projectType}; margin ${margin}%`};
      const riskResult=await supabase.from('regenerative_risk_assessments').insert(risk);
      if(riskResult.error) throw riskResult.error;
      await supabase.from('regenerative_capital_stack').delete().eq('project_id',id);
      const stackResult=await supabase.from('regenerative_capital_stack').insert(capitalPlan.map(([type,amount,why])=>({project_id:id,capital_type:String(type),amount:Number(amount),status:'candidate',conditions:{rationale:String(why)}})));
      if(stackResult.error) throw stackResult.error;
      setStatus('Saved: project, risk assessment and coordinated capital stack.');
    }catch(e:any){setStatus(`Save failed: ${e?.message||'unknown error'}`);}
  }

  async function addMeasurement(){
    const m={...measurement};
    setMeasurements(v=>[m,...v]);
    if(!projectId){setStatus('Measurement added locally. Save the workspace to persist it.');return;}
    try{
      const supabase=getBrowserClient();
      const result=await supabase.from('regenerative_measurements').insert({project_id:projectId,category:m.category,metric:m.metric,value:m.value,unit:m.unit,source:m.source,verification_status:m.verified?'verified':'unverified',confidence:m.verified?90:60});
      if(result.error) throw result.error;
      setStatus('Measurement added to the outcomes ledger.');
    }catch(e:any){setStatus(`Measurement save failed: ${e?.message||'unknown error'}`);}
  }

  async function approveDisclosure(){
    if(!projectId){setStatus('Save the project before creating a disclosure approval.');return;}
    if(!recipient.trim()){setStatus('Enter a lender, insurer or investor first.');return;}
    try{
      const supabase=getBrowserClient();
      const result=await supabase.from('regenerative_disclosures').insert({project_id:projectId,recipient_name:recipient,recipient_category:'capital / risk partner',purpose:'regenerative underwriting review',approved_fields:['project economics','capital stack','risk scores','verified measurements']});
      if(result.error) throw result.error;
      setStatus(`Disclosure permission recorded for ${recipient}.`);
    }catch(e:any){setStatus(`Permission save failed: ${e?.message||'unknown error'}`);}
  }

  const numberField=(label:string,value:number,setter:(n:number)=>void,suffix?:string)=><label style={{display:'grid',gap:6,fontWeight:800,fontSize:13}}>{label}<div style={{display:'flex',alignItems:'center',gap:6}}><input type="number" value={value} onChange={e=>setter(Number(e.target.value)||0)} style={{width:'100%',padding:'11px 12px',border:'1px solid #b9c6bb',borderRadius:10,fontSize:15}}/>{suffix&&<span>{suffix}</span>}</div></label>;
  const score=(name:string,value:number)=><div style={{border:'1px solid #d4ddd2',borderRadius:13,padding:14,background:'#fff'}}><small style={{fontWeight:900,color:'#356943'}}>{name}</small><div style={{fontSize:28,fontWeight:950,marginTop:3}}>{value.toFixed(0)}</div><div style={{height:7,background:'#e7ece6',borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:`${value}%`,background:'#356943'}}/></div></div>;

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif'}}>
    <header style={{background:'#102d25',color:'#fff',padding:'14px 18px'}}><div style={{maxWidth:1180,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><Link href="/ag/regenerative" style={{color:'#fff',textDecoration:'none',fontWeight:950}}>← REGENERATIVE + FINANCE</Link><span style={{color:'#c8e2ac',fontWeight:900}}>Risk & Underwriting Layer</span></div></header>

    <section style={{maxWidth:1180,margin:'auto',padding:'44px 18px 28px'}}><div style={{color:'#356943',fontSize:12,fontWeight:950,letterSpacing:1.2}}>CAPITAL COORDINATION + UNDERWRITING</div><h1 style={{fontSize:'clamp(40px,6vw,68px)',lineHeight:.98,margin:'8px 0 14px'}}>From farm change to finance-ready evidence.</h1><p style={{fontSize:19,lineHeight:1.6,color:'#56635a',maxWidth:900}}>Aridon identifies the real constraint, coordinates blended capital, and connects soil, water, production, insurance and financial evidence to a lender-ready risk profile.</p></section>

    <section style={{maxWidth:1180,margin:'auto',padding:'0 18px 40px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:16}}>
      <article style={{background:'#fff',border:'1px solid #d6dfd3',borderRadius:18,padding:20}}><h2 style={{marginTop:0}}>1. Define the blockage</h2><div style={{display:'grid',gap:12}}><label style={{fontWeight:800,fontSize:13}}>Operation<input value={operation} onChange={e=>setOperation(e.target.value)} placeholder="Ranch or farm name" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:11,border:'1px solid #b9c6bb',borderRadius:10}}/></label><label style={{fontWeight:800,fontSize:13}}>State<input value={stateName} onChange={e=>setStateName(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:11,border:'1px solid #b9c6bb',borderRadius:10}}/></label>{numberField('Acres',acres,setAcres)}<label style={{fontWeight:800,fontSize:13}}>Project type<select value={projectType} onChange={e=>setProjectType(e.target.value as ProjectType)} style={{display:'block',width:'100%',marginTop:6,padding:11,border:'1px solid #b9c6bb',borderRadius:10}}>{['Water / infrastructure','Land access','Soil / crop transition','Grazing / livestock','Aggregator / supply chain'].map(x=><option key={x}>{x}</option>)}</select></label><label style={{fontWeight:800,fontSize:13}}>Transition goal<textarea value={goal} onChange={e=>setGoal(e.target.value)} rows={3} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:11,border:'1px solid #b9c6bb',borderRadius:10}}/></label></div></article>
      <article style={{background:'#fff',border:'1px solid #d6dfd3',borderRadius:18,padding:20}}><h2 style={{marginTop:0}}>2. Economics</h2><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}>{numberField('Project cost',projectCost,setProjectCost)}{numberField('Grant / cost share',grant,setGrant)}{numberField('Producer equity',equity,setEquity)}{numberField('Annual benefit',annualBenefit,setAnnualBenefit)}{numberField('Annual debt service',annualDebtService,setAnnualDebtService)}{numberField('Operating margin',margin,setMargin,'%')}</div><div style={{marginTop:16,padding:16,borderRadius:14,background:'#163d2a',color:'#fff'}}><div style={{fontSize:12,fontWeight:950,color:'#c8e2ac'}}>FINANCING GAP</div><div style={{fontSize:38,fontWeight:950}}>{money(model.debt)}</div><div>Directional DSCR {model.dscr.toFixed(2)}x · debt/project cost {(model.leverage*100).toFixed(0)}%</div></div></article>
    </section>

    <section style={{background:'#fff',borderTop:'1px solid #d6dfd3',borderBottom:'1px solid #d6dfd3',padding:'46px 18px'}}><div style={{maxWidth:1180,margin:'auto'}}><div style={{display:'flex',alignItems:'center',gap:9}}><HandCoins color="#356943"/><strong style={{color:'#356943'}}>COORDINATED CAPITAL STACK</strong></div><h2 style={{fontSize:38,margin:'8px 0 18px'}}>Finance the constraint, not just the farm.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>{capitalPlan.map(([type,amount,why])=><article key={String(type)} style={{border:'1px solid #d6dfd3',borderRadius:15,padding:17,background:'#faf9f4'}}><Landmark size={22} color="#356943"/><h3 style={{margin:'9px 0 4px'}}>{String(type)}</h3><div style={{fontSize:25,fontWeight:950}}>{money(Number(amount))}</div><p style={{color:'#5b675f',lineHeight:1.5,marginBottom:0}}>{String(why)}</p></article>)}</div></div></section>

    <section style={{maxWidth:1180,margin:'auto',padding:'48px 18px'}}><div style={{display:'flex',alignItems:'center',gap:9}}><ShieldCheck color="#356943"/><strong style={{color:'#356943'}}>REGENERATIVE RISK & UNDERWRITING</strong></div><h2 style={{fontSize:38,margin:'8px 0 8px'}}>Translate resilience into underwriting evidence.</h2><p style={{color:'#59665e',maxWidth:880,lineHeight:1.55}}>These scores are decision support, not a credit decision or actuarial certification. Aridon preserves the evidence so lenders and insurers can apply their own models.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,margin:'22px 0'}}>{numberField('Years of documented soil practices',soilYears,setSoilYears)}{numberField('Water reliability',waterReliability,setWaterReliability,'%')}{numberField('Enterprise diversification',diversification,setDiversification,'/5')}{numberField('Loss-free / low-loss years',lossFreeYears,setLossFreeYears)}{numberField('Evidence/data coverage',dataCoverage,setDataCoverage,'%')}</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10}}>{[['Soil',model.soil],['Water',model.water],['Production',model.production],['Financial',model.financial],['Climate',model.climate],['Insurance',model.insurance],['Data',model.data]].map(([n,v])=>score(String(n),Number(v)))}</div><article style={{marginTop:14,background:'#163d2a',color:'#fff',borderRadius:17,padding:20,display:'flex',justifyContent:'space-between',gap:18,flexWrap:'wrap',alignItems:'center'}}><div><small style={{color:'#c8e2ac',fontWeight:950}}>UNDERWRITING READINESS</small><div style={{fontSize:43,fontWeight:950}}>{model.overall.toFixed(0)}/100</div></div><div style={{maxWidth:650,lineHeight:1.55}}>{model.overall>=75?'Strong evidence package. Verify source documents and partner-specific underwriting criteria before submission.':model.overall>=55?'Promising. Close evidence or cash-flow gaps before lender or insurer review.':'Early-stage. Build measurements, strengthen economics and reduce concentrated risks before financing outreach.'}</div></article></section>

    <section style={{background:'#e6ecdf',padding:'46px 18px'}}><div style={{maxWidth:1180,margin:'auto'}}><div style={{display:'flex',alignItems:'center',gap:9}}><LineChart color="#356943"/><strong style={{color:'#356943'}}>MEASUREMENT HISTORY</strong></div><h2 style={{fontSize:36,margin:'8px 0 16px'}}>Build the actuarial and performance record over time.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,background:'#fff',padding:16,borderRadius:16}}><label>Category<select value={measurement.category} onChange={e=>setMeasurement({...measurement,category:e.target.value})} style={{display:'block',width:'100%',padding:10,marginTop:5}}>{['Soil','Water','Production','Economics','Insurance','Climate'].map(x=><option key={x}>{x}</option>)}</select></label><label>Metric<input value={measurement.metric} onChange={e=>setMeasurement({...measurement,metric:e.target.value})} style={{display:'block',width:'100%',boxSizing:'border-box',padding:10,marginTop:5}}/></label><label>Value<input type="number" value={measurement.value} onChange={e=>setMeasurement({...measurement,value:Number(e.target.value)||0})} style={{display:'block',width:'100%',boxSizing:'border-box',padding:10,marginTop:5}}/></label><label>Unit<input value={measurement.unit} onChange={e=>setMeasurement({...measurement,unit:e.target.value})} style={{display:'block',width:'100%',boxSizing:'border-box',padding:10,marginTop:5}}/></label><label>Source<input value={measurement.source} onChange={e=>setMeasurement({...measurement,source:e.target.value})} style={{display:'block',width:'100%',boxSizing:'border-box',padding:10,marginTop:5}}/></label><label style={{display:'flex',alignItems:'end',gap:8,paddingBottom:10}}><input type="checkbox" checked={measurement.verified} onChange={e=>setMeasurement({...measurement,verified:e.target.checked})}/> Verified source</label><button onClick={addMeasurement} style={{border:0,borderRadius:11,background:'#163d2a',color:'#fff',fontWeight:900,padding:12,cursor:'pointer'}}>Add measurement</button></div>{measurements.length>0&&<div style={{display:'grid',gap:8,marginTop:12}}>{measurements.map((m,i)=><div key={i} style={{background:'#fff',border:'1px solid #d2dccc',borderRadius:12,padding:12}}><strong>{m.category}: {m.metric}</strong> · {m.value} {m.unit} · {m.source} · {m.verified?'verified':'unverified'}</div>)}</div>}</div></section>

    <section style={{maxWidth:1180,margin:'auto',padding:'48px 18px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}><article style={{border:'1px solid #d6dfd3',borderRadius:17,padding:20,background:'#fff'}}><LockKeyhole color="#356943"/><h2>Permission-controlled packet</h2><p style={{lineHeight:1.55,color:'#5a675f'}}>Aridon can identify a partner without sharing producer data. Approval is recorded before economics, scores or measurements leave the producer workspace.</p><input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Recipient organization" style={{width:'100%',boxSizing:'border-box',padding:11,border:'1px solid #b9c6bb',borderRadius:10}}/><button onClick={approveDisclosure} style={{marginTop:10,border:0,borderRadius:11,background:'#163d2a',color:'#fff',padding:'12px 14px',fontWeight:900,cursor:'pointer'}}>Approve underwriting packet</button></article><article style={{background:'#163d2a',color:'#fff',borderRadius:17,padding:20}}><FileCheck2 color="#c8e2ac"/><h2>Partner-ready output</h2><p style={{color:'#dbe8df',lineHeight:1.55}}>Use of proceeds, capital stack, producer contribution, grants, DSCR, risk drivers, loss history, soil/water/production evidence, verification status and disclosure permission are assembled in one trail.</p><button onClick={()=>window.print()} style={{border:'1px solid #c8e2ac',borderRadius:10,background:'transparent',color:'#fff',padding:'11px 13px',fontWeight:900,cursor:'pointer'}}>Print / save underwriting brief</button></article></section>

    <section style={{background:'#fff',borderTop:'1px solid #d6dfd3',padding:'30px 18px 60px'}}><div style={{maxWidth:1180,margin:'auto',display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}><button onClick={saveWorkspace} style={{display:'inline-flex',alignItems:'center',gap:8,border:0,borderRadius:12,background:'#163d2a',color:'#fff',padding:'14px 17px',fontWeight:950,cursor:'pointer'}}><Save size={18}/> Save to Aridon</button><Link href="/ag/funding" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #9aac9d',borderRadius:12,padding:'13px 16px',color:'#163d2a',textDecoration:'none',fontWeight:900}}><BarChart3 size={18}/> Match funding programs</Link>{status&&<span>{status}</span>}</div></section>
  </main>;
}
