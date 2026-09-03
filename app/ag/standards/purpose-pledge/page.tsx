import Link from 'next/link';
import { ArrowLeft, BadgeCheck, BarChart3, CircleDollarSign, ClipboardCheck, FileCheck2, HeartHandshake, Leaf, Network, Scale, ShieldCheck, Sprout, Target, Users } from 'lucide-react';

const commitments = [
  ['Purpose-led governance','Board commitments, accountable owners, milestones, approvals and decision records.',Target],
  ['Product quality & transparency','Claims, sourcing records, testing evidence and customer-facing transparency packages.',BadgeCheck],
  ['Supply-web integrity','Producer and supplier mapping, traceability, assurance, corrective actions and evidence.',Network],
  ['Fair compensation','Policy tracking, ratio review, exceptions and approval history.',Scale],
  ['Living wage & farmer livelihoods','Farmer income, price paid, margins, financing cost and livelihood improvement.',CircleDollarSign],
  ['Well-being & inclusion','Workforce goals, participation, training, safety and inclusion actions.',Users],
  ['Community engagement','Community commitments, grants, partner programs, feedback and outcomes.',HeartHandshake],
  ['Climate action','Soil, water, biodiversity, energy, emissions and resilience interventions with evidence.',Leaf],
  ['Circularity & waste','Packaging, material flows, waste streams, recovery targets and supplier plans.',ShieldCheck],
  ['Capability building','Training, agronomy support, technical assistance, completion and follow-up.',Sprout],
];

const years = [
  ['Year 1','Baseline + ownership','Assign owners, capture policies, establish baselines and close critical evidence gaps.'],
  ['Year 2','Execution + verification','Run programs, collect field evidence, measure progress and resolve exceptions.'],
  ['Year 3','Accountability + renewal','Prepare an approved progress package, document lessons and set the next cycle.'],
];

export default function PurposePledgePage(){
  return <main style={{minHeight:'100vh',background:'#f5f6f2',color:'#17384a',fontFamily:'Arial,sans-serif',paddingBottom:80}}>
    <header style={{background:'linear-gradient(135deg,#153747,#274d45 70%,#536e4e)',color:'#fff',padding:'22px 20px 46px'}}><div style={{maxWidth:1160,margin:'auto'}}>
      <nav style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}><Link href="/ag/standards" style={{display:'inline-flex',gap:8,alignItems:'center',color:'#fff',textDecoration:'none',fontWeight:900}}><ArrowLeft size={17}/> Standards Hub</Link><span style={{background:'#d5efad',color:'#173b2d',padding:'8px 11px',borderRadius:999,fontSize:11,fontWeight:950}}>ALIGNMENT PROTOTYPE</span></nav>
      <div style={{maxWidth:900,paddingTop:36}}><div style={{color:'#d5efad',fontSize:12,fontWeight:950,letterSpacing:1}}>PURPOSE PLEDGE READINESS</div><h1 style={{fontSize:'clamp(42px,7vw,72px)',lineHeight:.98,letterSpacing:-2.5,margin:'12px 0 18px'}}>Purpose becomes a workflow.<br/><span style={{color:'#d5efad'}}>Promises become evidence.</span></h1><p style={{fontSize:19,lineHeight:1.65,color:'#e1ece7'}}>Aridon turns stakeholder commitments into assigned work, measurable outcomes, preserved evidence and board-ready reporting without making farmers or suppliers drown in forms.</p></div>
    </div></header>

    <section style={{maxWidth:1160,margin:'-18px auto 0',padding:'0 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>
      <Metric title="Commitments mapped" value="10" sub="One operating model" icon={Target}/><Metric title="Evidence layers" value="5" sub="Policy to verification" icon={FileCheck2}/><Metric title="Planning cycle" value="3 years" sub="Baseline to renewal" icon={ClipboardCheck}/><Metric title="Reporting" value="Live" sub="Board + stakeholder views" icon={BarChart3}/>
    </section>

    <section style={{maxWidth:1160,margin:'22px auto 0',padding:'0 20px'}}><div style={{background:'#fff',border:'1px solid #dce7df',borderRadius:22,padding:24}}><div style={{fontSize:12,fontWeight:950,color:'#2e7d32'}}>COMMITMENT MAP</div><h2 style={{fontSize:34,margin:'6px 0 18px'}}>A single record behind every public commitment</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>{commitments.map(([title,text,Icon]:any)=><div key={title} style={{background:'#f7f9f6',borderRadius:16,padding:17}}><Icon color="#2e7d32"/><h3 style={{margin:'9px 0 5px'}}>{title}</h3><p style={{margin:0,color:'#607284',lineHeight:1.5,fontSize:14}}>{text}</p></div>)}</div></div></section>

    <section style={{maxWidth:1160,margin:'18px auto 0',padding:'0 20px'}}><div style={{background:'#e7f0e3',borderRadius:22,padding:24}}><div style={{fontSize:12,fontWeight:950,color:'#2e7d32'}}>THREE-YEAR OPERATING CYCLE</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,marginTop:14}}>{years.map(([year,title,text])=><div key={year} style={{background:'#fff',borderRadius:16,padding:18}}><div style={{fontSize:12,fontWeight:950,color:'#2e7d32'}}>{year}</div><h3 style={{margin:'6px 0'}}>{title}</h3><p style={{margin:0,color:'#607284',lineHeight:1.55,fontSize:14}}>{text}</p></div>)}</div></div></section>

    <section style={{maxWidth:1160,margin:'18px auto 0',padding:'0 20px'}}><div style={{background:'#fff',border:'1px solid #dce7df',borderRadius:18,padding:20,color:'#607284',lineHeight:1.55}}><strong style={{color:'#17384a'}}>Partnership position:</strong> Aridon should complement Purpose Pledge and its human advisors, not replace them. The software can handle the evidence ledger, action queue, stakeholder coordination and reporting package while people retain judgment, facilitation and accountability. This prototype does not imply affiliation or endorsement.</div></section>
  </main>
}

function Metric({title,value,sub,icon:Icon}:any){return <div style={{background:'#fff',border:'1px solid #dce7df',borderRadius:17,padding:18,boxShadow:'0 8px 24px rgba(20,50,35,.05)'}}><Icon color="#2e7d32"/><div style={{fontSize:12,color:'#647989',fontWeight:900,marginTop:9}}>{title}</div><div style={{fontSize:29,fontWeight:950,marginTop:3}}>{value}</div><div style={{fontSize:12,color:'#71818d',marginTop:4}}>{sub}</div></div>}
