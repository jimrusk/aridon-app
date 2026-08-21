'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Criteria = {
  industries: string; geographies: string; min_revenue: number; max_revenue: number; min_ebitda: number; max_price: number; max_multiple: number;
  min_recurring_revenue_pct: number; max_top_customer_pct: number; max_owner_dependency_pct: number; max_capex_pct: number; required_seller_finance_pct: number;
  preferred_traits: string; exclusion_traits: string;
};
type Thesis = { id: string; name: string; active: boolean; criteria: Criteria };
const initial: Criteria = { industries:'', geographies:'Southwest U.S.', min_revenue:500000, max_revenue:10000000, min_ebitda:150000, max_price:5000000, max_multiple:4, min_recurring_revenue_pct:25, max_top_customer_pct:25, max_owner_dependency_pct:50, max_capex_pct:10, required_seller_finance_pct:10, preferred_traits:'Recurring customers, durable local demand, simple operations, documented processes, strong second-in-command, owner willing to transition.', exclusion_traits:'Fraud concerns, unverified cash sales, extreme customer concentration, unresolved litigation, non-transferable licenses, owner-only relationships.' };
const box: React.CSSProperties = { background:'#0D1728', border:'1px solid #263958', borderRadius:16, padding:18 };
const inputStyle: React.CSSProperties = { width:'100%', boxSizing:'border-box', border:'1px solid #30435F', borderRadius:9, background:'#08111F', color:'#F8FAFC', padding:'10px 11px' };

export default function ThesisPage(){
  const [name,setName]=useState('Primary Acquisition Thesis'); const [criteria,setCriteria]=useState<Criteria>(initial); const [existing,setExisting]=useState<Thesis[]>([]); const [message,setMessage]=useState('');
  useEffect(()=>{fetch('/api/acquisitions/thesis',{cache:'no-store'}).then(r=>r.json()).then(v=>Array.isArray(v)&&setExisting(v)).catch(()=>{});},[]);
  const update=(key:keyof Criteria,value:string|number)=>setCriteria(c=>({...c,[key]:value}));
  async function save(){ setMessage('Saving…'); const r=await fetch('/api/acquisitions/thesis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,criteria,active:true})}); const p=await r.json(); if(!r.ok){setMessage(p.error||'Could not save.');return;} setExisting(v=>[p,...v]); setMessage('Acquisition thesis saved.'); }
  return <main style={{minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif',padding:'24px 18px 70px'}}><div style={{maxWidth:1100,margin:'0 auto'}}>
    <nav style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><strong>ARIDON 3 · ACQUISITION THESIS</strong><div style={{display:'flex',gap:14}}><Link href="/acquisitions/pipeline" style={{color:'#9EF0CF',textDecoration:'none',fontWeight:900}}>Pipeline</Link><Link href="/dashboard" style={{color:'#9EF0CF',textDecoration:'none',fontWeight:900}}>Dashboard</Link></div></nav>
    <header style={{padding:'45px 0 24px'}}><div style={{color:'#9EF0CF',fontSize:12,fontWeight:950}}>DEFINE THE HUNT BEFORE CHASING DEALS</div><h1 style={{fontSize:'clamp(38px,6vw,66px)',lineHeight:1,margin:'8px 0 12px'}}>Tell Aridon what a good acquisition looks like.</h1><p style={{color:'#AEBBD0',fontSize:17,lineHeight:1.6,maxWidth:820}}>This becomes the screening standard for industry, size, cash flow, concentration, owner dependence, capital intensity, seller financing and explicit exclusion rules.</p></header>
    <section style={{...box,display:'grid',gap:14}}><label>Thesis name<input style={{...inputStyle,marginTop:6}} value={name} onChange={e=>setName(e.target.value)}/></label>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12}}>
        {([['industries','Target industries'],['geographies','Target geographies']] as const).map(([k,l])=><label key={k}>{l}<input style={{...inputStyle,marginTop:6}} value={criteria[k]} onChange={e=>update(k,e.target.value)}/></label>)}
        {([['min_revenue','Minimum revenue'],['max_revenue','Maximum revenue'],['min_ebitda','Minimum EBITDA/SDE'],['max_price','Maximum price'],['max_multiple','Maximum multiple'],['min_recurring_revenue_pct','Minimum recurring revenue %'],['max_top_customer_pct','Maximum top-customer %'],['max_owner_dependency_pct','Maximum owner-dependency %'],['max_capex_pct','Maximum capex %'],['required_seller_finance_pct','Preferred seller-finance %']] as const).map(([k,l])=><label key={k}>{l}<input type="number" style={{...inputStyle,marginTop:6}} value={criteria[k]} onChange={e=>update(k,Number(e.target.value)||0)}/></label>)}
      </div>
      <label>Preferred traits<textarea rows={4} style={{...inputStyle,marginTop:6}} value={criteria.preferred_traits} onChange={e=>update('preferred_traits',e.target.value)}/></label>
      <label>Automatic red flags / exclusions<textarea rows={4} style={{...inputStyle,marginTop:6}} value={criteria.exclusion_traits} onChange={e=>update('exclusion_traits',e.target.value)}/></label>
      <button onClick={save} style={{justifySelf:'start',border:0,borderRadius:10,padding:'11px 16px',background:'#9EF0CF',color:'#07101D',fontWeight:950,cursor:'pointer'}}>Save Thesis</button>{message?<div style={{color:'#BFD0E5'}}>{message}</div>:null}
    </section>
    {existing.length?<section style={{marginTop:16,...box}}><h2 style={{marginTop:0}}>Saved theses</h2><div style={{display:'grid',gap:10}}>{existing.map(t=><div key={t.id} style={{border:'1px solid #2A3B58',borderRadius:12,padding:13}}><strong>{t.name}</strong><div style={{color:'#93A4BC',marginTop:5}}>{t.criteria?.industries||'Any industry'} · {t.criteria?.geographies||'Any geography'} · Max multiple {t.criteria?.max_multiple||'—'}x</div></div>)}</div></section>:null}
  </div></main>;
}
