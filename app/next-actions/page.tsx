'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Move = {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'WATCH';
  lane: 'Sponsor' | 'Funding' | 'Campus' | 'Water' | 'Acquisition' | 'Partner';
  company: string;
  person?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  status: string;
  reason: string;
  next: string;
  fit: number;
  value?: string;
  due: string;
};

const seed: Move[] = [
  { id:'echo', priority:'HIGH', lane:'Sponsor', company:'ECHO Robotics', title:'Robotics / commercial landscape team', status:'Sponsorship + Southwest test-facility outreach sent', reason:'Strong fit for autonomous mowing, commercial grounds, sports turf and harsh-environment testing.', next:'Identify the robotics/business-development decision maker and follow up with a branded proving-ground offer.', fit:94, value:'Equipment + sponsorship', due:'5 days' },
  { id:'firefly', priority:'HIGH', lane:'Sponsor', company:'FireFly Robotics', title:'Commercial autonomous mowing', status:'Founding robotics sponsor outreach sent', reason:'Electric autonomous mowing platform fits the campus proving-ground model and regional demo events.', next:'Request a technical demo call and propose a named robotics test zone.', fit:92, value:'Equipment + sponsorship', due:'5 days' },
  { id:'kress', priority:'HIGH', lane:'Sponsor', company:'Kress', title:'North America robotics / business development', status:'Sponsorship proposal sent', reason:'Commercial robotics, sports facilities and municipal landscaping are a direct match for the campus.', next:'Route to the North America robotics lead and pitch the Southwest demonstration program.', fit:90, value:'Equipment + sponsorship', due:'5 days' },
  { id:'sorenson', priority:'HIGH', lane:'Funding', company:'Sorenson Impact', person:'Smit Naik', email:'Smit.Naik@sorensoninstitute.com', status:'Investment mailbox bounced; proposal rerouted directly', reason:'Impact-capital fit for measurable water, ecological and regional-development outcomes.', next:'Watch for Smit routing response, then schedule a capital-structure conversation with the assigned investment lead.', fit:88, value:'Pilot / impact capital', due:'Await reply' },
  { id:'jan', priority:'MEDIUM', lane:'Water', company:'Arizona Water Resilience', person:'Jan Green', email:'jan@gotgreen.info', phone:'602-620-2699', location:'Scottsdale, AZ', status:'Advisor / strategic partner outreach sent', reason:'Strong bridge into Realtors, HOAs, sustainable housing and first-community pilot development.', next:'Schedule an introductory call and identify one HOA or developer candidate for a WaterSmart Property pilot.', fit:85, value:'Pilot + advisor', due:'7 days' },
  { id:'campus', priority:'HIGH', lane:'Campus', company:'Southwest Technology & Resilience Campus', status:'Founding-partner outreach active', reason:'Multiple sponsor, R&D, manufacturing and testing conversations can be bundled into one campus commercialization engine.', next:'Package the robotics companies into a Founding Robotics Partners program with named test zones, demo days and sponsor tiers.', fit:96, value:'Campus capitalization', due:'Now' },
  { id:'tlc', priority:'MEDIUM', lane:'Acquisition', company:'TLC Total Lawn Care', person:'Gerry Bower', email:'gerry.bower@tlclawncare.com', status:'Direct acquisition outreach sent', reason:'Commercial grounds care, irrigation and multi-market Texas presence fit the landscaping roll-up thesis.', next:'If Gerry engages, request three years of financials, recurring-revenue mix, management depth and preferred transaction structure.', fit:87, value:'Acquisition', due:'Await reply' },
];

const colors = { HIGH:'#FF6B6B', MEDIUM:'#F7C948', WATCH:'#8AA4C8' } as const;

export default function NextActionsPage(){
  const [lane,setLane]=useState('All');
  const [done,setDone]=useState<Record<string,string>>({});
  const [selected,setSelected]=useState<Move|null>(seed[0]);
  const lanes=['All','Sponsor','Funding','Campus','Water','Acquisition','Partner'];
  const filtered=useMemo(()=>seed.filter(x=>lane==='All'||x.lane===lane).sort((a,b)=>b.fit-a.fit),[lane]);
  const active=filtered.filter(x=>!done[x.id]).length;

  return <main style={{minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif',padding:'22px 18px 80px'}}>
    <div style={{maxWidth:1240,margin:'0 auto'}}>
      <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <Link href='/' style={{color:'#F8FAFC',fontWeight:950,textDecoration:'none'}}>ARIDON</Link>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href='/dashboard' style={nav}>Workspace</Link><Link href='/customer/opportunities' style={nav}>Opportunity Intelligence</Link><Link href='/next-actions' style={{...nav,borderColor:'#9EF0CF',color:'#9EF0CF'}}>Next Moves</Link></div>
      </nav>

      <section style={{marginTop:42,display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:16,alignItems:'end'}}>
        <div><div style={eyebrow}>EVA · EXECUTIVE ACTION ENGINE</div><h1 style={{fontSize:'clamp(44px,7vw,78px)',lineHeight:.92,letterSpacing:-3,margin:'10px 0 14px'}}>What should happen next?</h1><p style={{color:'#AEBBD0',fontSize:19,lineHeight:1.6,maxWidth:820}}>The short list that matters now. Opportunities are ranked by fit, timing and strategic leverage, then turned into a concrete next move.</p></div>
        <div style={{background:'#0D1728',border:'1px solid #273A59',borderRadius:16,padding:'16px 18px',minWidth:200}}><div style={eyebrow}>ACTIVE MOVES</div><div style={{fontSize:42,fontWeight:950,marginTop:4}}>{active}</div><div style={{color:'#8FA2BF',fontSize:12}}>across {new Set(filtered.map(x=>x.lane)).size} workstreams</div></div>
      </section>

      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:22}}>{lanes.map(x=><button key={x} onClick={()=>setLane(x)} style={{...chip,background:lane===x?'#9EF0CF':'#101B2D',color:lane===x?'#07130F':'#DCE4EF',borderColor:lane===x?'#9EF0CF':'#2A3A57'}}>{x}</button>)}</div>

      <section style={{display:'grid',gridTemplateColumns:'minmax(0,1.35fr) minmax(320px,.65fr)',gap:16,marginTop:18,alignItems:'start'}}>
        <div style={{display:'grid',gap:10}}>{filtered.map((m,i)=>{
          const state=done[m.id];
          return <article key={m.id} onClick={()=>setSelected(m)} style={{background:selected?.id===m.id?'#111F34':'#0C1626',border:`1px solid ${selected?.id===m.id?'#4A658A':'#24344F'}`,borderRadius:18,padding:18,cursor:'pointer',opacity:state?0.55:1}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'start'}}><div style={{display:'flex',gap:10,alignItems:'center'}}><div style={{width:34,height:34,borderRadius:10,display:'grid',placeItems:'center',background:'#13243B',fontWeight:950}}>{i+1}</div><div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong style={{fontSize:21}}>{m.company}</strong><span style={{fontSize:11,fontWeight:950,color:colors[m.priority]}}>{m.priority}</span><span style={laneBadge}>{m.lane}</span></div><div style={{color:'#8FA2BF',fontSize:13,marginTop:3}}>{m.status}</div></div></div><div style={{fontSize:28,fontWeight:950,color:'#9EF0CF'}}>{m.fit}</div></div>
            <div style={{marginTop:14,padding:'12px 14px',background:'#08111F',borderRadius:12}}><div style={{fontSize:11,fontWeight:950,color:'#9EF0CF',letterSpacing:1}}>NEXT</div><div style={{lineHeight:1.55,marginTop:4}}>{m.next}</div></div>
            <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginTop:12,flexWrap:'wrap'}}><div style={{color:'#8FA2BF',fontSize:12}}>Due: {m.due}{m.value?` · ${m.value}`:''}</div><div style={{display:'flex',gap:7}}><button onClick={(e)=>{e.stopPropagation();setDone(d=>({...d,[m.id]:'approved'}))}} style={smallBtn}>Approve</button><button onClick={(e)=>{e.stopPropagation();setDone(d=>({...d,[m.id]:'skip'}))}} style={ghostBtn}>Skip</button></div></div>
          </article>
        })}</div>

        <aside style={{position:'sticky',top:18,background:'#F4F1E9',color:'#171717',borderRadius:20,padding:20}}>{selected? <><div style={{fontSize:11,fontWeight:950,letterSpacing:1}}>RELATIONSHIP CARD</div><h2 style={{fontSize:30,margin:'8px 0 4px'}}>{selected.company}</h2>{selected.person&&<div style={{fontWeight:850}}>{selected.person}</div>}{selected.title&&<div style={{color:'#67635C',marginTop:3}}>{selected.title}</div>}<div style={{display:'grid',gap:7,marginTop:16,fontSize:14}}>{selected.email&&<Row a='Email' b={selected.email}/>} {selected.phone&&<Row a='Phone' b={selected.phone}/>} {selected.location&&<Row a='Location' b={selected.location}/>}<Row a='Fit score' b={`${selected.fit}/100`}/><Row a='Workstream' b={selected.lane}/><Row a='Status' b={selected.status}/></div><hr style={{border:0,borderTop:'1px solid #D3CDBF',margin:'18px 0'}}/><div style={{fontSize:11,fontWeight:950}}>WHY THIS MATTERS</div><p style={{lineHeight:1.6,color:'#4E4B45'}}>{selected.reason}</p><div style={{fontSize:11,fontWeight:950,marginTop:18}}>RECOMMENDED MOVE</div><p style={{lineHeight:1.6}}>{selected.next}</p><div style={{display:'grid',gap:8,marginTop:18}}><button onClick={()=>setDone(d=>({...d,[selected.id]:'approved'}))} style={{...smallBtn,padding:'13px 16px',fontSize:14}}>Approve next move</button><button onClick={()=>setDone(d=>({...d,[selected.id]:'later'}))} style={{...ghostBtn,color:'#171717',borderColor:'#9F988A',padding:'12px 16px'}}>Move to watch list</button></div></>:<div>Select a move.</div>}</aside>
      </section>

      <section style={{marginTop:22,background:'#0D1728',border:'1px solid #273A59',borderRadius:18,padding:20}}><div style={eyebrow}>ARIDON ACTION LOOP</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8,marginTop:12}}>{['Discover','Identify','Verify contact','Score fit','Recommend','Approve','Execute','Watch reply','Next move'].map((x,i)=><div key={x} style={{background:'#091321',borderRadius:12,padding:12}}><div style={{color:'#9EF0CF',fontWeight:950,fontSize:11}}>{String(i+1).padStart(2,'0')}</div><div style={{fontWeight:850,marginTop:5}}>{x}</div></div>)}</div></section>
    </div>
  </main>
}

function Row({a,b}:{a:string;b:string}){return <div style={{display:'grid',gridTemplateColumns:'92px 1fr',gap:8}}><span style={{color:'#777168'}}>{a}</span><strong style={{wordBreak:'break-word'}}>{b}</strong></div>}
const nav={color:'#DCE4EF',textDecoration:'none',fontWeight:850,fontSize:13,border:'1px solid #2A3A57',borderRadius:999,padding:'9px 12px'} as const;
const eyebrow={color:'#9EF0CF',fontWeight:950,fontSize:11,letterSpacing:1.2} as const;
const chip={border:'1px solid #2A3A57',borderRadius:999,padding:'9px 12px',fontWeight:900,cursor:'pointer'} as const;
const laneBadge={fontSize:10,fontWeight:900,color:'#B8C7DA',border:'1px solid #34465F',borderRadius:999,padding:'3px 7px'} as const;
const smallBtn={background:'#9EF0CF',color:'#07130F',border:0,borderRadius:10,padding:'9px 12px',fontWeight:950,cursor:'pointer'} as const;
const ghostBtn={background:'transparent',color:'#DCE4EF',border:'1px solid #40516B',borderRadius:10,padding:'8px 11px',fontWeight:900,cursor:'pointer'} as const;
