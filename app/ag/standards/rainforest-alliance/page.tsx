import Link from 'next/link';
import { ArrowLeft, BarChart3, ClipboardCheck, FileCheck2, Globe2, Leaf, MapPinned, Network, ShieldCheck, Sprout, Waves } from 'lucide-react';

const workstreams = [
  ['Soil health & fertility','Track baseline conditions, regenerative practices, field observations, lab results and improvement trends.',Sprout],
  ['Biodiversity','Record habitat, tree cover, conservation actions, field evidence and improvement milestones.',Leaf],
  ['Climate resilience','Connect farm plans to climate risks, adaptation actions, weather events and resilience outcomes.',Globe2],
  ['Water stewardship','Track water sources, use, conservation actions, field observations and evidence of responsible management.',Waves],
  ['Farmer livelihoods','Measure farmer income, price received, financing, yield, production cost and livelihood improvement alongside environmental outcomes.',BarChart3],
  ['Geodata & risk readiness','Store farm points and polygons, flag missing geodata, preserve GIS checks and route exceptions for human review.',MapPinned],
  ['Traceability','Link producer, farm unit, crop lot, buyer, evidence and chain-of-custody records without forcing duplicate data entry.',Network],
  ['Audit evidence','Create requirement-linked evidence rooms, action queues, nonconformity follow-up and approval history.',FileCheck2],
];

const workflow = [
  ['1. Baseline','Import producer, farm, geodata, crop, social and environmental records.'],
  ['2. Readiness map','Translate the organization’s applicable program scope into an internal action and evidence checklist.'],
  ['3. Field execution','Push simple tasks to farmers, agronomists and field officers with offline-friendly evidence capture.'],
  ['4. Exception queue','Surface missing evidence, overdue actions, risk flags and conflicting records before an audit.'],
  ['5. Human verification','Program leads and authorized verifiers review evidence and decide what is ready.'],
  ['6. Reporting package','Export approved records for certification preparation, internal management and impact reporting.'],
];

export default function RainforestAlliancePage(){
  return <main style={{minHeight:'100vh',background:'#f3f7f2',color:'#17384a',fontFamily:'Arial,sans-serif',paddingBottom:80}}>
    <header style={{background:'linear-gradient(135deg,#073d35,#176049 65%,#5d7d42)',color:'#fff',padding:'22px 20px 48px'}}><div style={{maxWidth:1160,margin:'auto'}}>
      <nav style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}><Link href="/ag/standards" style={{display:'inline-flex',gap:8,alignItems:'center',color:'#fff',textDecoration:'none',fontWeight:900}}><ArrowLeft size={17}/> Standards Hub</Link><span style={{background:'#d7f0a9',color:'#15392c',padding:'8px 11px',borderRadius:999,fontSize:11,fontWeight:950}}>REGENERATIVE READINESS PROTOTYPE</span></nav>
      <div style={{maxWidth:900,paddingTop:38}}><div style={{color:'#d7f0a9',fontSize:12,fontWeight:950,letterSpacing:1}}>RAINFOREST ALLIANCE COMPATIBILITY LAYER</div><h1 style={{fontSize:'clamp(42px,7vw,72px)',lineHeight:.98,letterSpacing:-2.5,margin:'12px 0 18px'}}>Field work to evidence.<br/><span style={{color:'#d7f0a9'}}>Evidence to readiness.</span></h1><p style={{fontSize:19,lineHeight:1.65,color:'#e1eee8'}}>Aridon can organize regenerative agriculture and supply-chain evidence so farmers, companies, agronomists and program teams can see what is complete, what is missing and what needs action before formal third-party certification review.</p></div>
    </div></header>

    <section style={{maxWidth:1160,margin:'-18px auto 0',padding:'0 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
      <Metric title="Core workstreams" value="8" sub="Field to audit evidence" icon={Leaf}/><Metric title="Evidence state" value="Live" sub="Complete • due • exception" icon={FileCheck2}/><Metric title="Geodata readiness" value="Mapped" sub="Points • polygons • checks" icon={MapPinned}/><Metric title="Human review" value="Required" sub="No auto-certification" icon={ShieldCheck}/>
    </section>

    <section style={{maxWidth:1160,margin:'22px auto 0',padding:'0 20px'}}><div style={{background:'#fff',border:'1px solid #dbe8df',borderRadius:22,padding:24}}><div style={{fontSize:12,fontWeight:950,color:'#2e7d32'}}>REGENERATIVE + CERTIFICATION READINESS</div><h2 style={{fontSize:34,margin:'6px 0 18px'}}>The same field record should serve the farmer and the verifier.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>{workstreams.map(([title,text,Icon]:any)=><div key={title} style={{background:'#f7faf6',borderRadius:16,padding:17}}><Icon color="#2e7d32"/><h3 style={{margin:'9px 0 5px'}}>{title}</h3><p style={{margin:0,color:'#607284',lineHeight:1.5,fontSize:14}}>{text}</p></div>)}</div></div></section>

    <section style={{maxWidth:1160,margin:'18px auto 0',padding:'0 20px'}}><div style={{background:'#e6f1e2',borderRadius:22,padding:24}}><div style={{display:'flex',gap:8,alignItems:'center',fontSize:12,fontWeight:950,color:'#2e7d32'}}><ClipboardCheck/> OPERATING WORKFLOW</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,marginTop:14}}>{workflow.map(([title,text])=><div key={title} style={{background:'#fff',borderRadius:16,padding:18}}><h3 style={{margin:'0 0 7px'}}>{title}</h3><p style={{margin:0,color:'#607284',lineHeight:1.55,fontSize:14}}>{text}</p></div>)}</div></div></section>

    <section style={{maxWidth:1160,margin:'18px auto 0',padding:'0 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:12}}>
      <div style={{background:'#0e3c49',color:'#fff',borderRadius:20,padding:22}}><div style={{fontSize:12,fontWeight:950,color:'#d7f0a9'}}>PARTNER VALUE</div><h2 style={{margin:'7px 0 9px'}}>Aridon should be plumbing, not a competing standard.</h2><p style={{margin:0,color:'#deebee',lineHeight:1.6}}>Rainforest Alliance retains the standard, certification rules and human assurance process. Aridon focuses on producer onboarding, field execution, data quality, evidence organization, traceability, action management and reporting interoperability.</p></div>
      <div style={{background:'#fff',border:'1px solid #dbe8df',borderRadius:20,padding:22}}><div style={{fontSize:12,fontWeight:950,color:'#2e7d32'}}>PILOT IDEA</div><h2 style={{margin:'7px 0 9px'}}>Coffee cohort readiness pilot</h2><p style={{margin:0,color:'#607284',lineHeight:1.6}}>Run a small producer cohort with farm records, geodata, regenerative practice plans, livelihood metrics and evidence workflows. Measure administrative time, missing-evidence rates, farmer usability and audit-preparation efficiency.</p></div>
    </section>

    <section style={{maxWidth:1160,margin:'18px auto 0',padding:'0 20px'}}><div style={{background:'#fff',border:'1px solid #dbe8df',borderRadius:18,padding:20,color:'#607284',lineHeight:1.55}}><strong style={{color:'#17384a'}}>Important:</strong> This is an Aridon compatibility and certification-readiness prototype. It is not an official Rainforest Alliance tool, does not reproduce or replace the Rainforest Alliance standards, and does not imply endorsement, affiliation, accreditation, audit approval or certification.</div></section>
  </main>
}

function Metric({title,value,sub,icon:Icon}:any){return <div style={{background:'#fff',border:'1px solid #dbe8df',borderRadius:17,padding:18,boxShadow:'0 8px 24px rgba(20,50,35,.05)'}}><Icon color="#2e7d32"/><div style={{fontSize:12,color:'#647989',fontWeight:900,marginTop:9}}>{title}</div><div style={{fontSize:29,fontWeight:950,marginTop:3}}>{value}</div><div style={{fontSize:12,color:'#71818d',marginTop:4}}>{sub}</div></div>}
