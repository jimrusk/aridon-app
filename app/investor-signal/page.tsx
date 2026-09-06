'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Copy, Target, TrendingUp, Users, BookOpen, MessageSquare, Radar, Sparkles } from 'lucide-react';

const mint='#9EF0CF';
const card={background:'#0D1728',border:'1px solid #2A3A57',borderRadius:18,padding:18} as const;

type Dimension = { id:string; label:string; description:string; points:number };
const dimensions: Dimension[] = [
  {id:'positioning',label:'Positioning',description:'An investor can explain the company in one sentence after ten seconds.',points:15},
  {id:'founder',label:'Founder Story',description:'The founder story clearly connects problem, discovery, solution, proof and long-term vision.',points:10},
  {id:'proof',label:'Proof',description:'The public story shows milestones, customer interest, partners, prototypes, pilots or measurable progress.',points:20},
  {id:'market',label:'Market Thesis',description:'The company explains why the problem matters now and how large the opportunity can become.',points:15},
  {id:'visibility',label:'Visibility',description:'The founder publishes useful, credible material often enough to become recognizable.',points:15},
  {id:'capital',label:'Capital Story',description:'Investors can see what capital is for, what milestone it unlocks and what comes after.',points:15},
  {id:'diligence',label:'Diligence Readiness',description:'Deck, financials, ownership, IP, risks and core documents are organized and defensible.',points:10},
];

const curriculum = [
  ['Week 1','Become Understandable','Build the one-line company story, founder thesis, market problem and “why now” statement.','Finish with a 10-second explanation another person can repeat.'],
  ['Week 2','Become Credible','Turn milestones, evidence, partners, designs, prototypes, customers and third-party validation into public proof.','Finish with a proof inventory and three proof posts.'],
  ['Week 3','Become Visible','Build five content pillars and a repeatable founder publishing rhythm.','Finish with a 30-day investor visibility calendar.'],
  ['Week 4','Become Trusted','Teach the market something useful, explain tradeoffs and show how the founder thinks.','Finish with two authority posts and one transparent project update.'],
  ['Week 5','Become Investable','Tighten the deck, use of funds, milestone plan, valuation logic, risks and diligence package.','Finish with a clean investor room and funding ask.'],
  ['Week 6','Become Funded','Target the right capital, start conversations, rehearse objections and follow up with discipline.','Finish with a prioritized investor pipeline and meeting script.'],
];

const posts = [
  {
    day:'Day 1', pillar:'Vision', title:'Why Farmington can become a Southwest crossroads',
    text:`Farmington sits at a rare intersection of geography and opportunity. New Mexico, Colorado, Arizona and Utah meet around a region that already understands energy, agriculture, tourism and hard infrastructure.\n\nAridon Crossroads is our proposal to connect those strengths in one place: innovation, manufacturing, agriculture, sports, hospitality and entertainment on a campus built for the Four Corners.\n\nWe are now opening conversations with development partners, sponsors, operators and long-term capital that want to help build the next chapter of Farmington.\n\n#FarmingtonNM #EconomicDevelopment #FourCorners #Innovation #AridonCrossroads`
  },
  {
    day:'Day 3', pillar:'Proof', title:'Show the master plan logic',
    text:`A campus this broad should not depend on one giant check. That is why we are designing Aridon Crossroads as multiple economic engines that reinforce one another.\n\nSports and entertainment can draw people. Hospitality keeps them here. Restaurants capture spend. Innovation and R&D create high-value activity. Manufacturing and logistics create durable jobs. Agriculture and resilience technology give the campus a Southwest mission.\n\nThe goal is not “build everything at once.” The goal is phased momentum.\n\nWe are speaking with partners for individual districts, buildings and operating concepts now.\n\n#RealEstateDevelopment #Infrastructure #NewMexico #AridonCrossroads`
  },
  {
    day:'Day 5', pillar:'Intelligence', title:'What makes mixed-use campuses investable',
    text:`The strongest mixed-use projects are not collections of unrelated buildings. They create reasons for each use to make the others stronger.\n\nAt Aridon Crossroads, a tournament can feed hotel demand. Hotel guests support restaurants and entertainment. Corporate visitors see technology demonstrations. Manufacturing partners can use training, conference and R&D capacity. Agriculture can become both a working system and a demonstration environment.\n\nThat is the flywheel we are designing for Farmington.\n\n#MixedUseDevelopment #Investment #EconomicDevelopment #AridonCrossroads`
  },
  {
    day:'Day 8', pillar:'Journey', title:'What we are building first',
    text:`We are breaking Aridon Crossroads into phases so the project can earn momentum instead of waiting for every piece to be perfect.\n\nPhase 1: sports, restaurants and entertainment.\nPhase 2: business, innovation, R&D, workforce and manufacturing support.\nPhase 3: hospitality, expanded manufacturing, greenhouses and future growth.\n\nEach phase can recruit its own capital and operating partners while serving the same long-term campus.\n\nIf your company belongs in one of those phases, I would like to hear from you.\n\n#FarmingtonNM #Development #SportsTourism #Manufacturing #AridonCrossroads`
  },
  {
    day:'Day 11', pillar:'Opportunity', title:'The capital doors are intentionally different',
    text:`We are not looking for one investor to finance all of Aridon Crossroads.\n\nWe are building separate doors for family offices, real-estate capital, project finance, strategic corporations, naming-rights sponsors, operators, tenants and R&D partners.\n\nThat lets a water or energy investor focus on technology. A developer can focus on real estate. A hospitality group can focus on the hotel. A sponsor can own a visible piece of the destination.\n\nDifferent mandates. One campus.\n\nWe are opening those conversations now.\n\n#FamilyOffice #ProjectFinance #Sponsorship #AridonCrossroads`
  },
  {
    day:'Day 15', pillar:'Vision', title:'Why water, energy and agriculture belong on the campus',
    text:`The Southwest cannot separate economic growth from water, energy and food resilience.\n\nThat is why Aridon Crossroads includes water and energy R&D, agricultural innovation, greenhouses and demonstration systems beside the business and manufacturing campus.\n\nThe campus can become a place where technologies are not only discussed in a conference room. They can be tested, measured, improved and shown to customers in a real operating environment.\n\nThat is the kind of R&D ecosystem we want to build in Farmington.\n\n#WaterInnovation #Energy #AgTech #Southwest #AridonCrossroads`
  },
  {
    day:'Day 19', pillar:'Proof', title:'Who belongs at the table',
    text:`Aridon Crossroads is now recruiting six kinds of partners: capital, corporate sponsors, developers, research and education partners, public-sector collaborators, and operators or tenants.\n\nA project like this gets stronger when those groups are in the room early enough to shape what gets built.\n\nIf you work in infrastructure, real estate, hospitality, sports, manufacturing, agriculture, water, energy or economic development, I would be glad to compare notes.\n\n#Partnerships #EconomicDevelopment #Investment #FarmingtonNM #AridonCrossroads`
  },
  {
    day:'Day 23', pillar:'Intelligence', title:'Why phased development protects the vision',
    text:`Big visions fail when every component becomes dependent on every other component.\n\nOur design principle for Aridon Crossroads is the opposite: create a master vision, then make the pieces independently financeable and operable.\n\nA restaurant district can move before a lab. A lab can move before a hotel. A manufacturing building can move when a tenant is ready. Each win adds traffic, credibility and infrastructure for the next one.\n\nThat is how we intend to turn a concept plan into a real district.\n\n#DevelopmentStrategy #RealEstate #Infrastructure #AridonCrossroads`
  },
  {
    day:'Day 27', pillar:'Founder', title:'Why we are doing this in Farmington',
    text:`It would be easier to say a major technology and innovation campus belongs somewhere else. Albuquerque. Phoenix. Denver. Dallas.\n\nBut that misses the point. Places like Farmington can build the next generation of opportunity if we create the infrastructure, partnerships and reasons for companies to come.\n\nAridon Crossroads is our attempt to put business growth, manufacturing, technology, entertainment and community opportunity in the same picture.\n\nWe are not waiting for someone else to imagine it.\n\n#FarmingtonNM #FourCorners #Innovation #Manufacturing #AridonCrossroads`
  },
  {
    day:'Day 30', pillar:'Opportunity', title:'Direct invitation',
    text:`Thirty days ago we began making Aridon Crossroads easier to see, understand and evaluate. Now I want to make the invitation explicit.\n\nWe are looking for serious conversations with family offices, developers, infrastructure investors, corporate sponsors, manufacturers, hospitality and entertainment operators, universities and strategic technology partners.\n\nIf the Four Corners belongs in your Southwest growth strategy, take a look at Aridon Crossroads.\n\nThe public project brief is here: https://aridon-v02.vercel.app/crossroads\n\n#InvestmentOpportunity #EconomicDevelopment #NewMexico #AridonCrossroads`
  },
];

const objections = [
  ['“This is too many businesses at once.”','Crossroads is a master-planned ecosystem, not one operating company trying to run every business. The financing strategy separates real estate, operating concepts, technology, sponsorship and project infrastructure so each partner can participate where it has expertise.'],
  ['“Why Farmington?”','Farmington provides a Four Corners location, an existing sports complex and a regional economy already connected to energy, agriculture, tourism and infrastructure. The thesis is to create new reasons for companies, visitors and talent to stay and invest in the region.'],
  ['“How much capital do you need?”','The right answer depends on the specific phase and partner. Crossroads is being structured so individual districts, buildings and technology programs can have their own capital plans rather than requiring one all-or-nothing campus raise.'],
  ['“What is proven today?”','Separate the current evidence from the vision. Show completed designs, live Aridon software, partner conversations, outreach, pilot work and any verified commitments. Do not claim financing, site control or tenants until documented.'],
  ['“What is the investor return?”','Do not promise returns. Identify the specific vehicle first: company equity, real estate, project finance, operating JV or sponsorship. Then present economics and risks appropriate to that vehicle after diligence.'],
];

export default function InvestorSignalPage(){
  const [checked,setChecked]=useState<Record<string,boolean>>({positioning:true,founder:true,market:true});
  const [tab,setTab]=useState<'score'|'learn'|'campaign'|'simulator'>('score');
  const [copied,setCopied]=useState('');
  const score=useMemo(()=>dimensions.reduce((n,d)=>n+(checked[d.id]?d.points:0),0),[checked]);

  async function copy(text:string,id:string){
    try{await navigator.clipboard.writeText(text);setCopied(id);setTimeout(()=>setCopied(''),1600)}catch{}
  }

  return <main style={{minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif'}}>
    <section style={{maxWidth:1180,margin:'0 auto',padding:'24px 20px 80px'}}>
      <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <Link href="/" style={{color:'#fff',textDecoration:'none',fontWeight:950}}>ARIDON</Link>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Link href="/crossroads" style={{color:'#07130F',background:mint,textDecoration:'none',fontWeight:950,padding:'10px 13px',borderRadius:10}}>View Crossroads</Link>
          <Link href="/ai-visibility" style={{color:'#E8EDF5',textDecoration:'none',border:'1px solid #40516D',padding:'9px 12px',borderRadius:10,fontWeight:850}}>AI Visibility</Link>
        </div>
      </nav>

      <div style={{maxWidth:980,paddingTop:58}}>
        <div style={{color:mint,fontSize:12,fontWeight:950,letterSpacing:1}}>ARIDON · INVESTOR SIGNAL OS</div>
        <h1 style={{fontSize:'clamp(49px,7vw,82px)',lineHeight:.95,letterSpacing:-3,margin:'14px 0 18px'}}>Get noticed. Become trusted. Become investable.</h1>
        <p style={{color:'#B8C4D5',lineHeight:1.65,fontSize:19,maxWidth:900}}>A founder teaching and execution system for turning positioning, proof, public content and investor preparation into a repeatable capital-building process. Crossroads is loaded as the first live campaign.</p>
      </div>

      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:28}}>
        {([
          ['score','Readiness Score',Target],['learn','6-Week Accelerator',BookOpen],['campaign','Crossroads Campaign',Radar],['simulator','Investor Simulator',MessageSquare]
        ] as const).map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} style={{border:tab===id?'1px solid #9EF0CF':'1px solid #374861',background:tab===id?'#15382F':'#0D1728',color:'#fff',borderRadius:11,padding:'11px 13px',fontWeight:900,cursor:'pointer',display:'flex',gap:7,alignItems:'center'}}><Icon size={16}/>{label}</button>)}
      </div>

      {tab==='score' && <section style={{marginTop:18,display:'grid',gridTemplateColumns:'minmax(260px,.7fr) minmax(0,1.5fr)',gap:14}} className="signal-grid">
        <article style={{...card,minHeight:260}}>
          <div style={{color:mint,fontSize:11,fontWeight:950}}>INVESTOR READINESS</div>
          <div style={{fontSize:76,fontWeight:950,lineHeight:1,margin:'12px 0 4px'}}>{score}</div>
          <div style={{color:'#90A0B8'}}>out of 100</div>
          <div style={{height:10,background:'#1D2A40',borderRadius:999,overflow:'hidden',marginTop:18}}><div style={{height:'100%',width:`${score}%`,background:mint}}/></div>
          <p style={{color:'#AEBBD0',lineHeight:1.55}}>{score>=80?'Strong public signal. Focus on deal structure, evidence quality and investor fit.':score>=60?'Good foundation. Close the proof and diligence gaps before increasing outreach volume.':'Build the signal before pushing harder on investors. Visibility without trust wastes attention.'}</p>
        </article>
        <div style={{display:'grid',gap:9}}>{dimensions.map(d=><button key={d.id} onClick={()=>setChecked(c=>({...c,[d.id]:!c[d.id]}))} style={{...card,textAlign:'left',cursor:'pointer',display:'grid',gridTemplateColumns:'auto minmax(0,1fr) auto',gap:11,alignItems:'start',color:'#fff'}}>{checked[d.id]?<CheckCircle2 size={22} color={mint}/>:<Circle size={22} color="#6C7C94"/>}<span><strong style={{fontSize:18}}>{d.label}</strong><span style={{display:'block',color:'#AEBBD0',fontSize:13,lineHeight:1.5,marginTop:4}}>{d.description}</span></span><b style={{color:mint}}>+{d.points}</b></button>)}</div>
      </section>}

      {tab==='learn' && <section style={{marginTop:18,display:'grid',gap:12}}>{curriculum.map(([week,title,work,outcome],i)=><article key={week} style={{...card,display:'grid',gridTemplateColumns:'110px minmax(0,1fr)',gap:16}} className="week-row"><div><div style={{color:mint,fontSize:11,fontWeight:950}}>{week.toUpperCase()}</div><div style={{fontSize:42,fontWeight:950,opacity:.28}}>0{i+1}</div></div><div><h2 style={{fontSize:28,margin:'0 0 8px'}}>{title}</h2><p style={{color:'#B8C4D5',lineHeight:1.6,margin:'0 0 9px'}}>{work}</p><div style={{borderLeft:'3px solid #9EF0CF',paddingLeft:11,color:'#E9FFF7',fontWeight:850}}>Deliverable: {outcome}</div></div></article>)}</section>}

      {tab==='campaign' && <section style={{marginTop:18}}>
        <article style={{...card,background:'#102033',marginBottom:12}}><div style={{display:'flex',gap:9,alignItems:'center',color:mint,fontWeight:950}}><Sparkles size={18}/> CROSSROADS 30-DAY INVESTOR VISIBILITY CAMPAIGN</div><p style={{color:'#B8C4D5',lineHeight:1.6,marginBottom:0}}>These are deliberate investor signals, not random social posts. Each post strengthens one of five pillars: vision, proof, intelligence, journey or opportunity. Publish with the public Crossroads page as the destination when relevant.</p></article>
        <div style={{display:'grid',gap:11}}>{posts.map((p,i)=><article key={p.day} style={card}><div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'center'}}><div><div style={{fontSize:11,fontWeight:950,color:i%2? '#9DB7FF':mint}}>{p.day.toUpperCase()} · {p.pillar.toUpperCase()}</div><h3 style={{fontSize:23,margin:'5px 0 0'}}>{p.title}</h3></div><button onClick={()=>copy(p.text,p.day)} style={{border:'1px solid #42536C',background:'#07101D',color:'#fff',borderRadius:10,padding:'9px 11px',fontWeight:850,cursor:'pointer'}}><Copy size={15} style={{verticalAlign:'middle',marginRight:5}}/>{copied===p.day?'Copied':'Copy post'}</button></div><pre style={{whiteSpace:'pre-wrap',fontFamily:'Arial,sans-serif',color:'#B8C4D5',lineHeight:1.62,fontSize:14,margin:'14px 0 0'}}>{p.text}</pre></article>)}</div>
      </section>}

      {tab==='simulator' && <section style={{marginTop:18}}>
        <article style={{...card,background:'#102033',marginBottom:12}}><div style={{display:'flex',gap:9,alignItems:'center',color:mint,fontWeight:950}}><Users size={18}/> INVESTOR OBJECTION TRAINER</div><p style={{color:'#B8C4D5',lineHeight:1.6,marginBottom:0}}>Practice out loud. Answer before reading the coaching response. The goal is concise credibility, not a speech.</p></article>
        <div style={{display:'grid',gap:10}}>{objections.map(([q,a])=><details key={q} style={card}><summary style={{cursor:'pointer',fontWeight:950,fontSize:20}}>{q}</summary><div style={{borderTop:'1px solid #2A3A57',marginTop:13,paddingTop:13,color:'#B8C4D5',lineHeight:1.65}}>{a}</div></details>)}</div>
      </section>}

      <section style={{marginTop:28,background:'#F4F1E9',color:'#171717',borderRadius:20,padding:24}}>
        <div style={{fontSize:11,fontWeight:950}}>CROSSROADS NEXT SIGNAL</div>
        <h2 style={{fontSize:32,margin:'7px 0'}}>Make the public page the source of truth.</h2>
        <p style={{color:'#5F5A52',lineHeight:1.65,maxWidth:880}}>Every investor post, email, sponsorship conversation and introduction should point back to one consistent Crossroads page. That gives search engines, AI systems, investors and partners the same description of the project instead of a trail of conflicting versions.</p>
        <div style={{display:'flex',gap:9,flexWrap:'wrap'}}><Link href="/crossroads" style={{background:'#171717',color:'#fff',textDecoration:'none',fontWeight:950,padding:'12px 14px',borderRadius:10}}>Open Crossroads Page</Link><Link href="/ai-visibility" style={{border:'1px solid #AAA298',color:'#171717',textDecoration:'none',fontWeight:950,padding:'11px 14px',borderRadius:10}}>Run Visibility Scan</Link></div>
      </section>
    </section>
    <style jsx global>{`@media(max-width:760px){.signal-grid{grid-template-columns:1fr!important}.week-row{grid-template-columns:1fr!important}}`}</style>
  </main>
}
