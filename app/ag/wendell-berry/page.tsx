'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ExternalLink, Heart, Leaf, LibraryBig, MessageCircleQuestion, ShieldCheck, Sprout, Users, Wheat } from 'lucide-react';

const lessons = [
  {
    title: 'Care for the land as a living place',
    theme: 'Soil & Stewardship',
    icon: Leaf,
    teaching: 'Berry repeatedly connects good farming with the long-term health of soil, water, animals, people and the place itself. Productivity matters, but it should not be purchased by exhausting the land that makes production possible.',
    source: 'It All Turns on Affection, 2012 Jefferson Lecture',
    sourceNote: 'National Endowment for the Humanities',
    href: 'https://www.neh.gov/news/2012-jefferson-lecture-wendell-berry',
    apply: 'Aridon can translate this principle into measurable stewardship: soil trends, erosion risk, water use, grazing pressure, input history and a practical next-action plan.'
  },
  {
    title: 'A farm belongs to a community, not only a market',
    theme: 'Community',
    icon: Users,
    teaching: 'Berry treats agriculture as a relationship among households, neighbors, local businesses and the land. A healthy farm economy should help rural communities remain places where people can live, work and belong.',
    source: 'The Berry Center mission and archive',
    sourceNote: 'The Berry Center',
    href: 'https://berrycenter.org/about/',
    apply: 'Aridon can surface nearby processors, buyers, cooperatives, service providers and institutions so more value can remain in the producer’s region.'
  },
  {
    title: 'Technology should answer to people and place',
    theme: 'Technology & Scale',
    icon: Sprout,
    teaching: 'Berry’s criticism of industrial agriculture is not simply a rejection of tools. It asks a harder question: does a tool strengthen good work, local knowledge and the health of the place, or does it make those things easier to discard?',
    source: 'Agriculture for a Small Planet and related agrarian essays',
    sourceNote: 'Archive of The Berry Center',
    href: 'https://berrycenter.org/initiatives/archive-of-the-berry-center/',
    apply: 'Aridon can evaluate proposed equipment or software against labor, debt, soil, water, energy, resilience and ownership goals instead of ranking it by novelty alone.'
  },
  {
    title: 'Affection is practical',
    theme: 'Belonging & Economy',
    icon: Heart,
    teaching: 'Berry argues that durable stewardship grows from informed affection for a particular place. Knowledge matters most when it is joined to care, memory and responsibility.',
    source: 'It All Turns on Affection, 2012 Jefferson Lecture',
    sourceNote: 'National Endowment for the Humanities',
    href: 'https://www.neh.gov/about/awards/jefferson-lecture/wendell-e-berry-biography',
    apply: 'Aridon can preserve local farm memory alongside modern records, helping families use field history, financial history and stewardship goals when making decisions.'
  },
  {
    title: 'The farmer has to be able to make a living',
    theme: 'Farm Economics',
    icon: Wheat,
    teaching: 'Berry’s agrarian vision is not nostalgia. It depends on farms being economically viable enough for good husbandry, family continuity and community life to survive.',
    source: 'Wendell Berry biography and Jefferson Lecture materials',
    sourceNote: 'National Endowment for the Humanities',
    href: 'https://www.neh.gov/about/awards/jefferson-lecture/wendell-e-berry-biography',
    apply: 'Aridon can connect stewardship decisions to margin, debt, grants, transition costs, local premiums and succession planning so conservation does not become a luxury.'
  },
  {
    title: 'Old knowledge and new knowledge should stay in conversation',
    theme: 'Memory & Learning',
    icon: LibraryBig,
    teaching: 'Berry describes sustainability as requiring cultural continuity as well as ecological continuity. The experience of older people, younger people, farmers and communities is part of the operating knowledge of a place.',
    source: 'It All Turns on Affection, 2012 Jefferson Lecture',
    sourceNote: 'National Endowment for the Humanities',
    href: 'https://www.neh.gov/about/awards/jefferson-lecture/wendell-e-berry-biography',
    apply: 'Aridon can create a farm memory layer where family knowledge, photos, notes, field history and decisions remain usable by the next generation.'
  }
];

const examples = [
  {
    q: 'Should I convert 200 acres to regenerative grazing?',
    theme: 'Soil & Stewardship',
    answer: 'Berry’s work would push the decision beyond a simple yield comparison. The useful questions are whether the change improves the land’s fertility, reduces dependence on damaging inputs, fits the farm’s scale, supports good work and still allows the household to make a living.',
    action: 'Aridon next step: compare forage plan, water availability, fencing cost, carrying capacity, transition grants and three-year cash flow before recommending a move.'
  },
  {
    q: 'A large processor offered me a better price. Should I leave my local buyer?',
    theme: 'Community & Economy',
    answer: 'Berry’s teaching would treat price as important but incomplete. A decision also changes relationships, local capacity, transport, bargaining power and the resilience of the regional farm economy.',
    action: 'Aridon next step: compare net price after hauling and fees, payment reliability, contract terms, local economic value and concentration risk.'
  },
  {
    q: 'Is new farm technology automatically better if it saves labor?',
    theme: 'Technology & Scale',
    answer: 'Not automatically. A Berry-informed review would ask what kind of labor disappears, what new dependence is created, whether debt rises, whether local skill is lost and whether the tool helps the farm care for its place better over time.',
    action: 'Aridon next step: score the technology on payback, repairability, ownership, labor quality, data control, water, soil and long-term resilience.'
  }
];

export default function WendellBerryLegacyDemo(){
  const [question,setQuestion]=useState(examples[0].q);
  const [selected,setSelected]=useState(0);
  const [reviewMode,setReviewMode]=useState(false);

  const response = useMemo(()=>{
    const lower=question.toLowerCase();
    if(lower.includes('technology') || lower.includes('equipment') || lower.includes('labor')) return examples[2];
    if(lower.includes('buyer') || lower.includes('processor') || lower.includes('market') || lower.includes('price')) return examples[1];
    return examples[0];
  },[question]);

  return <main style={{minHeight:'100vh',background:'#f4f0e5',color:'#213026',fontFamily:'Georgia, Times New Roman, serif'}}>
    <header style={{borderBottom:'1px solid #d5d0c2',background:'#f8f5ec',position:'sticky',top:0,zIndex:20}}>
      <div style={{maxWidth:1120,margin:'auto',padding:'13px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}>
        <Link href="/ag" style={{display:'inline-flex',alignItems:'center',gap:8,color:'#31583d',fontFamily:'Arial,sans-serif',textDecoration:'none',fontWeight:800}}><ArrowLeft size={17}/> Aridon Ag</Link>
        <div style={{fontFamily:'Arial,sans-serif',fontSize:12,fontWeight:900,letterSpacing:.7,color:'#725a32'}}>PRIVATE CONCEPT FOR REVIEW</div>
      </div>
    </header>

    <section style={{maxWidth:1120,margin:'auto',padding:'66px 18px 46px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:36,alignItems:'center'}}>
      <div>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Arial,sans-serif',fontSize:12,fontWeight:900,letterSpacing:.7,color:'#526f48'}}><BookOpen size={17}/> ARIDON AG · LEGACY CLASSROOM CONCEPT</div>
        <h1 style={{fontSize:'clamp(48px,7vw,82px)',letterSpacing:-2.7,lineHeight:.94,margin:'16px 0 20px',fontWeight:500}}>Keep the teaching alive by putting it to work.</h1>
        <p style={{fontSize:21,lineHeight:1.62,color:'#526057',maxWidth:760}}>A proposed digital learning space for Wendell Berry’s agrarian work. It does not imitate him. It helps farmers, families and students find his ideas, trace them to their sources and consider what those ideas ask of a real decision today.</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:24,fontFamily:'Arial,sans-serif'}}>
          <a href="#teachings" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 17px',background:'#31583d',color:'#fff',borderRadius:10,textDecoration:'none',fontWeight:900}}>Explore the demo <ArrowRight size={18}/></a>
          <a href="https://berrycenter.org/" target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 17px',border:'1px solid #bcb5a5',color:'#31583d',borderRadius:10,textDecoration:'none',fontWeight:900}}>The Berry Center <ExternalLink size={16}/></a>
        </div>
      </div>
      <aside style={{background:'#fffdf7',border:'1px solid #d5d0c2',boxShadow:'0 18px 55px rgba(57,49,34,.08)',padding:25,borderRadius:18}}>
        <div style={{fontFamily:'Arial,sans-serif',fontSize:12,fontWeight:900,letterSpacing:.7,color:'#725a32'}}>THE RULES OF THE ROOM</div>
        <h2 style={{fontSize:31,margin:'8px 0 16px',fontWeight:500}}>Preserve the teacher. Never manufacture one.</h2>
        <div style={{display:'grid',gap:13,fontFamily:'Arial,sans-serif',lineHeight:1.45,color:'#4e5d53'}}>
          {['No AI impersonation of Wendell Berry.','No cloned voice or invented quotations.','Every teaching points back to an identified source.','Interpretation is labeled as interpretation.','The Berry Center can review, correct, approve or remove material.'].map(x=><div key={x} style={{display:'flex',alignItems:'flex-start',gap:9}}><CheckCircle2 size={20} color="#526f48"/><span>{x}</span></div>)}
        </div>
      </aside>
    </section>

    <section id="teachings" style={{background:'#fffdf7',borderTop:'1px solid #d5d0c2',borderBottom:'1px solid #d5d0c2',padding:'56px 18px'}}>
      <div style={{maxWidth:1120,margin:'auto'}}>
        <div style={{fontFamily:'Arial,sans-serif',fontSize:12,fontWeight:900,letterSpacing:.7,color:'#526f48'}}>EXPLORE HIS TEACHINGS</div>
        <h2 style={{fontSize:'clamp(38px,5vw,56px)',margin:'8px 0 8px',fontWeight:500}}>Start with a principle. Follow it back to the source.</h2>
        <p style={{fontFamily:'Arial,sans-serif',fontSize:17,lineHeight:1.6,color:'#627067',maxWidth:780}}>These cards are intentionally concise. A partnership version could use Berry Center-approved excerpts, archive records, audio, reading lists and commentary.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:12,marginTop:25}}>
          {lessons.map((lesson,i)=>{const Icon=lesson.icon; const active=selected===i; return <button key={lesson.title} onClick={()=>setSelected(i)} style={{textAlign:'left',cursor:'pointer',border:active?'2px solid #526f48':'1px solid #d5d0c2',background:active?'#eef1e7':'#fff',borderRadius:14,padding:17,color:'#213026'}}><Icon size={23} color="#526f48"/><div style={{fontFamily:'Arial,sans-serif',fontSize:11,fontWeight:900,letterSpacing:.6,color:'#725a32',marginTop:12}}>{lesson.theme.toUpperCase()}</div><div style={{fontFamily:'Georgia,serif',fontSize:22,lineHeight:1.2,marginTop:6}}>{lesson.title}</div></button>})}
        </div>
        <article style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,300px),1fr))',gap:24,background:'#f4f0e5',border:'1px solid #d5d0c2',borderRadius:17,padding:24}}>
          <div><div style={{fontFamily:'Arial,sans-serif',fontSize:11,fontWeight:900,color:'#526f48'}}>TEACHING</div><p style={{fontSize:21,lineHeight:1.55,margin:'8px 0 0'}}>{lessons[selected].teaching}</p></div>
          <div><div style={{fontFamily:'Arial,sans-serif',fontSize:11,fontWeight:900,color:'#526f48'}}>PUT IT TO WORK</div><p style={{fontFamily:'Arial,sans-serif',fontSize:16,lineHeight:1.6,color:'#526057',margin:'8px 0 14px'}}>{lessons[selected].apply}</p><a href={lessons[selected].href} target="_blank" rel="noreferrer" style={{fontFamily:'Arial,sans-serif',display:'inline-flex',alignItems:'center',gap:7,color:'#31583d',fontWeight:900,textDecoration:'none'}}>Source: {lessons[selected].source} <ExternalLink size={15}/></a><div style={{fontFamily:'Arial,sans-serif',fontSize:12,color:'#7a776e',marginTop:4}}>{lessons[selected].sourceNote}</div></div>
        </article>
      </div>
    </section>

    <section style={{maxWidth:1120,margin:'auto',padding:'58px 18px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,340px),1fr))',gap:26}}>
        <div>
          <div style={{display:'inline-flex',alignItems:'center',gap:7,fontFamily:'Arial,sans-serif',fontSize:12,fontWeight:900,letterSpacing:.7,color:'#526f48'}}><MessageCircleQuestion size={18}/> ASK HIS TEACHINGS</div>
          <h2 style={{fontSize:'clamp(38px,5vw,57px)',fontWeight:500,lineHeight:1.02,margin:'10px 0 14px'}}>A question from today. A path into the work.</h2>
          <p style={{fontFamily:'Arial,sans-serif',fontSize:17,lineHeight:1.6,color:'#5d6a61'}}>The system does not answer as Wendell. It identifies a relevant strand of his teaching, explains the connection and then lets Aridon calculate the practical decision separately.</p>
          <div style={{display:'grid',gap:8,marginTop:18}}>{examples.map((x,i)=><button key={x.q} onClick={()=>setQuestion(x.q)} style={{border:'1px solid #cbc5b8',background:'#fffdf7',padding:'12px 14px',borderRadius:10,textAlign:'left',cursor:'pointer',fontFamily:'Arial,sans-serif',color:'#31583d',fontWeight:800}}>{x.q}</button>)}</div>
        </div>
        <div style={{background:'#31583d',color:'#fff',borderRadius:18,padding:23,boxShadow:'0 16px 44px rgba(42,71,51,.16)'}}>
          <label style={{fontFamily:'Arial,sans-serif',fontSize:11,fontWeight:900,letterSpacing:.7,color:'#dbe6d7'}}>YOUR QUESTION</label>
          <textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={4} style={{width:'100%',boxSizing:'border-box',marginTop:8,borderRadius:10,border:'1px solid #79907a',padding:13,fontFamily:'Arial,sans-serif',fontSize:16,resize:'vertical',background:'#fff',color:'#213026'}}/>
          <div style={{borderTop:'1px solid rgba(255,255,255,.22)',marginTop:18,paddingTop:17}}>
            <div style={{fontFamily:'Arial,sans-serif',fontSize:11,fontWeight:900,color:'#dbe6d7'}}>FROM THE TEACHINGS · {response.theme.toUpperCase()}</div>
            <p style={{fontSize:20,lineHeight:1.55,margin:'8px 0 14px'}}>{response.answer}</p>
            <div style={{fontFamily:'Arial,sans-serif',background:'rgba(255,255,255,.1)',borderRadius:10,padding:13,lineHeight:1.5,color:'#edf3eb'}}>{response.action}</div>
          </div>
        </div>
      </div>
    </section>

    <section style={{background:'#dedfce',borderTop:'1px solid #c8c6b7',padding:'58px 18px'}}>
      <div style={{maxWidth:1120,margin:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,330px),1fr))',gap:28,alignItems:'start'}}>
        <div>
          <div style={{display:'inline-flex',alignItems:'center',gap:7,fontFamily:'Arial,sans-serif',fontSize:12,fontWeight:900,letterSpacing:.7,color:'#526f48'}}><ShieldCheck size={18}/> BERRY CENTER STEWARDSHIP PANEL</div>
          <h2 style={{fontSize:'clamp(38px,5vw,56px)',fontWeight:500,margin:'9px 0 13px'}}>The family and the Center stay in control of the legacy layer.</h2>
          <p style={{fontFamily:'Arial,sans-serif',fontSize:17,lineHeight:1.65,color:'#536158'}}>This is a proposed governance model, not a claim of endorsement. The partnership version would give authorized reviewers an audit trail and final say over what is represented as Berry teaching.</p>
          <button onClick={()=>setReviewMode(!reviewMode)} style={{marginTop:12,display:'inline-flex',alignItems:'center',gap:8,padding:'13px 16px',border:0,borderRadius:10,background:'#31583d',color:'#fff',fontFamily:'Arial,sans-serif',fontWeight:900,cursor:'pointer'}}>{reviewMode?'Close review preview':'Preview reviewer controls'} <ArrowRight size={17}/></button>
        </div>
        <div style={{background:'#fffdf7',border:'1px solid #c8c6b7',borderRadius:16,padding:20,fontFamily:'Arial,sans-serif'}}>
          {reviewMode ? <div><div style={{fontSize:11,fontWeight:900,color:'#725a32',letterSpacing:.7}}>REVIEW QUEUE · DEMO</div><h3 style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:500,margin:'8px 0 14px'}}>Technology should answer to people and place</h3>{['Source verified','Summary reviewed','Quotation check','Application clearly separated','Approve for classroom'].map((x,i)=><div key={x} style={{display:'flex',justifyContent:'space-between',gap:10,padding:'11px 0',borderTop:'1px solid #e2ded3'}}><span>{x}</span><strong style={{color:i<2?'#526f48':'#8b784d'}}>{i<2?'Complete':'Needs review'}</strong></div>)}</div> : <div style={{display:'grid',gap:13}}>{['Approve or reject teaching summaries','Attach the preferred source edition','Flag or remove inaccurate interpretations','Control approved quotation length','Add Berry Center commentary and reading paths','See exactly how Aridon applies a principle'].map(x=><div key={x} style={{display:'flex',gap:9,alignItems:'flex-start'}}><CheckCircle2 size={19} color="#526f48"/><span style={{lineHeight:1.45}}>{x}</span></div>)}</div>}
        </div>
      </div>
    </section>

    <section style={{maxWidth:900,margin:'auto',padding:'64px 18px 70px',textAlign:'center'}}>
      <div style={{fontFamily:'Arial,sans-serif',fontSize:12,fontWeight:900,letterSpacing:.7,color:'#725a32'}}>THE INVITATION</div>
      <h2 style={{fontSize:'clamp(40px,6vw,62px)',lineHeight:1.02,fontWeight:500,margin:'10px 0 18px'}}>Do not recreate Wendell Berry. Help another generation encounter the work.</h2>
      <p style={{fontFamily:'Arial,sans-serif',fontSize:18,lineHeight:1.7,color:'#536158',maxWidth:760,margin:'auto'}}>This prototype was prepared by Aridon as a respectful starting point for discussion with Mary Berry and The Berry Center. Nothing here should be understood as an official Berry Center product, endorsement or authorized edition.</p>
      <div style={{marginTop:25,display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap',fontFamily:'Arial,sans-serif'}}><a href="https://berrycenter.org/initiatives/archive-of-the-berry-center/" target="_blank" rel="noreferrer" style={{padding:'13px 16px',borderRadius:10,background:'#31583d',color:'#fff',textDecoration:'none',fontWeight:900}}>Visit the Archive <ExternalLink size={15} style={{verticalAlign:'middle'}}/></a><Link href="/ag" style={{padding:'13px 16px',borderRadius:10,border:'1px solid #bcb5a5',color:'#31583d',textDecoration:'none',fontWeight:900}}>Return to Aridon Ag</Link></div>
    </section>
  </main>
}
