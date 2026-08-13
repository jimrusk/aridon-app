'use client';

import Link from 'next/link';
import { useState } from 'react';

const executives = [
  { name: 'Eva', role: 'Executive Sentinel', focus: 'Turn the owner’s question into the next clear move.' },
  { name: 'Heather', role: 'COO', focus: 'Convert decisions into owners, deadlines, and execution.' },
  { name: 'Scout', role: 'Growth', focus: 'Find the strongest commercial opportunity without spraying noise.' },
];

export default function MobileDemo() {
  const [active, setActive] = useState(0);
  const executive = executives[active];
  return <main style={{minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif'}}>
    <section style={{maxWidth:760,margin:'0 auto',padding:'22px 18px 54px'}}>
      <Link href="/mobile-app" style={{color:'#9EF0CF',textDecoration:'none',fontWeight:900}}>← Aridon</Link>
      <div style={{paddingTop:34}}><div style={{color:'#9EF0CF',fontSize:11,fontWeight:950}}>READ-ONLY REVIEW DEMO</div><h1 style={{fontSize:'clamp(44px,11vw,68px)',lineHeight:.95,letterSpacing:-3,margin:'10px 0 15px'}}>A boardroom that fits in your hand.</h1><p style={{color:'#B6C3D5',fontSize:17,lineHeight:1.6}}>This demo uses sample company data so app reviewers and new users can explore Aridon without an account.</p></div>
      <section style={{marginTop:22,background:'#101B2D',border:'1px solid #2B3D5A',borderRadius:20,padding:20}}>
        <div style={{color:'#9EF0CF',fontSize:11,fontWeight:950}}>SAMPLE COMPANY · HIGH DESERT SERVICES</div>
        <h2 style={{fontSize:34,margin:'8px 0 5px'}}>{executive.name}</h2><div style={{color:'#B9CFFF',fontWeight:900}}>{executive.role}</div>
        <p style={{color:'#D6DFEC',lineHeight:1.65,fontSize:16}}>{executive.focus}</p>
        <div style={{background:'#081321',borderRadius:14,padding:16,color:'#DDE6F2',lineHeight:1.6}}>“The fastest owner-level win is to follow up every open estimate older than seven days, assign one owner, and review recovered revenue Friday. I would not add another campaign until that leak is closed.”</div>
      </section>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12}}>{executives.map((x,i)=><button key={x.name} onClick={()=>{navigator.vibrate?.(18);setActive(i)}} style={{border:i===active?'1px solid #9EF0CF':'1px solid #334866',background:i===active?'#17312C':'#0E192A',color:'#fff',borderRadius:13,padding:'13px 8px',fontWeight:900}}>{x.name}</button>)}</div>
      <section style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:14}}>
        <Card title="Today" value="4" text="owner decisions queued"/><Card title="Open work" value="11" text="tasks across 3 projects"/><Card title="Company Brain" value="26" text="reusable context items"/><Card title="Approval control" value="ON" text="human confirmation required"/>
      </section>
      <div style={{marginTop:20,textAlign:'center'}}><Link href="/customer/login?next=%2Fcustomer%2Fstart%3Fnative%3D1&native=1" style={{display:'inline-block',background:'#9EF0CF',color:'#07130F',textDecoration:'none',fontWeight:950,padding:'14px 18px',borderRadius:12}}>Sign In to a Real Workspace</Link></div>
    </section>
  </main>
}

function Card({title,value,text}:{title:string;value:string;text:string}) { return <article style={{background:'#0E192A',border:'1px solid #2B3D5A',borderRadius:15,padding:15}}><div style={{color:'#92A2B9',fontSize:10,fontWeight:900}}>{title.toUpperCase()}</div><strong style={{display:'block',fontSize:28,margin:'5px 0'}}>{value}</strong><span style={{color:'#AEBBD0',fontSize:12,lineHeight:1.4}}>{text}</span></article> }
