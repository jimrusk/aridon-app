'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, ShieldCheck, Users } from 'lucide-react';

const toggles = [
  ['anonymous','Anonymous matching','Use derived signals to look for relevant help without revealing your identity or private facts.'],
  ['context','Limited context','Allow the approved need card below to be shown to a candidate after a possible match is found.'],
  ['intro','Introduction request','Allow Aridon to ask the candidate whether they want an introduction.'],
  ['contact','Direct contact','Share your approved contact details only after both sides approve the introduction.'],
  ['followup','Follow-up','Allow follow-up after the introduction. This is separate and is off by default.'],
] as const;

export default function NeedCardPage(){
 const [consent,setConsent]=useState<Record<string,boolean>>({anonymous:true,context:false,intro:false,contact:false,followup:false});
 return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif',padding:'28px 16px 70px'}}><div style={{maxWidth:900,margin:'auto'}}><Link href="/ag/app" style={{color:'#356943',fontWeight:900,textDecoration:'none'}}>← My 3 Priorities</Link><div style={{marginTop:24,color:'#356943',fontSize:12,fontWeight:950}}>OWNER-APPROVED NEED CARD</div><h1 style={{fontSize:'clamp(38px,7vw,62px)',lineHeight:1,margin:'8px 0 12px'}}>Control exactly what leaves your ranch.</h1><p style={{fontSize:18,lineHeight:1.55,color:'#56635a'}}>This is the narrow first matching workflow. Aridon identifies a real need, you approve the problem card, then you decide separately whether matching, context, an introduction, contact or follow-up are allowed.</p>

<section style={{background:'#fff',border:'2px solid #356943',borderRadius:18,padding:20,marginTop:22}}><div style={{display:'flex',gap:10,alignItems:'center'}}><CheckCircle2 color="#356943"/><strong>Example need card</strong></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,marginTop:16}}>{[['Problem','Water reliability'],['Region','Western U.S.'],['Operation','Livestock / cow-calf'],['Timing','Action this season'],['Scale','Owner-provided acreage / herd band'],['Help wanted','Water specialist or conservation district']].map(([a,b])=><div key={a} style={{background:'#f4f1e8',borderRadius:11,padding:12}}><div style={{fontSize:11,color:'#667169',fontWeight:950}}>{a}</div><strong>{b}</strong></div>)}</div><p style={{fontSize:12,color:'#667169',marginBottom:0}}>Matching uses the minimum derived signals needed for practical fit, including geography and season. Sensitive source facts are not exposed as a ranking explanation.</p></section>

<section style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:20,marginTop:14}}><div style={{display:'flex',gap:9,alignItems:'center'}}><ShieldCheck color="#356943"/><h2 style={{margin:0}}>Disclosure preview & permissions</h2></div><p style={{color:'#5a675f'}}>Audience: a vetted water-help candidate serving the approved region. Purpose: explore help for this specific project. Permission expires after this request unless you approve another use.</p><div style={{display:'grid',gap:10}}>{toggles.map(([key,title,text])=><label key={key} style={{display:'flex',gap:12,padding:13,border:'1px solid #dfe5dc',borderRadius:12,alignItems:'flex-start'}}><input type="checkbox" checked={!!consent[key]} onChange={e=>setConsent(c=>({...c,[key]:e.target.checked}))} style={{width:22,height:22}}/><span><strong>{title}</strong><br/><span style={{fontSize:13,color:'#5f6a62'}}>{text}</span></span></label>)}</div></section>

<section style={{background:'#163d2a',color:'#fff',borderRadius:18,padding:20,marginTop:14}}><Users color="#c5e2aa"/><h2>Candidate types first, identities second.</h2><p style={{color:'#dbe8df',lineHeight:1.55}}>Aridon first returns a small set of useful categories such as local institution, vetted commercial specialist, peer operator, university/research partner, funding partner or implementation provider. You choose whether to request a limited-context introduction. No raw profile exchange.</p><button style={{border:0,borderRadius:11,padding:'13px 15px',fontWeight:950,background:'#fff',color:'#163d2a'}}>Approve this need card</button></section>

<p style={{fontSize:12,color:'#667169',marginTop:14}}>After an introduction, Aridon stores only an audit receipt and minimum task state. Follow-up is not automatic. The owner decides whether to continue.</p></div></main>;
}
