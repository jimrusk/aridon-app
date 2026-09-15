'use client';

import { useMemo, useState } from 'react';

const modules = [
  ['01','Foundations','Cash vs conventional vs subject-to vs seller finance vs hybrid. Learn deed, debt, equity, liens, amortization, escrow, insurance and servicing.'],
  ['02','Subject-To','Analyze the existing loan, arrears, escrow, insurance, authorization, servicing, seller protections, due-on-sale risk and exits.'],
  ['03','Seller Finance','Structure price, down payment, rate, amortization, maturity/balloon and seller security.'],
  ['04','Hybrid Structures','Combine existing debt, seller-carried equity, cash or private capital without forcing every seller into one structure.'],
  ['05','Deal Finding','Score expired/withdrawn listings, tired landlords, inherited/vacant property, pre-foreclosure, high-equity and free-and-clear owners.'],
  ['06','Seller Conversation','Diagnose motivation, timeline, debt, payment, desired cash and objections before proposing terms.'],
  ['07','Underwriting','Compare cash, SubTo, seller-finance and hybrid outcomes using cash required, monthly spread, DSCR, CoC return and risk.'],
  ['08','Due Diligence','Title, liens, taxes, HOA, loan statements, insurance, inspection, leases, utilities, permits and judgments.'],
  ['09','Closing & Compliance','Use qualified local counsel/title/escrow. Check state and federal lending, disclosure, servicing and consumer-protection requirements.'],
  ['10','Exit Strategy','Stress-test rental, resale, refinance and other lawful exits before committing to a structure.'],
  ['11','Capital Stack','Model earnest money, reinstatement, closing costs, repairs, reserves and appropriately documented private/transactional capital.'],
  ['12','Operating System','CRM stages, lead scoring, follow-up, agent/wholesaler relationships, transaction coordination, servicing and audit trail.'],
];

function money(v:number){return Number.isFinite(v)?v.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}):'$0'}

export default function CreativeFinancePage(){
 const [price,setPrice]=useState(400000),[balance,setBalance]=useState(300000),[payment,setPayment]=useState(2100),[rent,setRent]=useState(3200),[cash,setCash]=useState(25000),[repairs,setRepairs]=useState(10000);
 const a=useMemo(()=>{const equity=Math.max(0,price-balance), spread=rent-payment, required=cash+repairs, coc=required>0?spread*12/required*100:0; return {equity,spread,required,coc}},[price,balance,payment,rent,cash,repairs]);
 return <main style={{maxWidth:1180,margin:'0 auto',padding:'48px 24px 80px',fontFamily:'system-ui,sans-serif',color:'#10221a'}}>
  <p style={{fontWeight:800,letterSpacing:2,color:'#2d6a4f'}}>ARIDON REAL ESTATE</p>
  <h1 style={{fontSize:'clamp(38px,6vw,72px)',lineHeight:.95,margin:'12px 0 22px'}}>Creative Finance Academy</h1>
  <p style={{fontSize:20,maxWidth:820,lineHeight:1.6}}>Learn the public principles behind subject-to and seller financing, then use Aridon to turn them into a disciplined deal-analysis workflow. Education first, underwriting second, paperwork only with qualified local professionals.</p>
  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,margin:'42px 0'}}>{modules.map(([n,t,d])=><article key={n} style={{border:'1px solid #cbd8d0',borderRadius:18,padding:22,background:'#f7faf8'}}><b style={{color:'#2d6a4f'}}>{n}</b><h2 style={{margin:'8px 0',fontSize:20}}>{t}</h2><p style={{lineHeight:1.5,margin:0}}>{d}</p></article>)}</section>
  <section style={{borderRadius:24,padding:28,background:'#10221a',color:'white'}}><p style={{fontWeight:800,letterSpacing:2,color:'#9fe0bb'}}>EVA DEAL LAB</p><h2 style={{fontSize:32,marginTop:8}}>Quick creative-finance screen</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>{[['Purchase price',price,setPrice],['Existing loan',balance,setBalance],['Monthly PITI/debt',payment,setPayment],['Expected rent',rent,setRent],['Cash to seller/close',cash,setCash],['Repairs',repairs,setRepairs]].map(([l,v,s]:any)=><label key={l} style={{display:'grid',gap:6}}><span>{l}</span><input type='number' value={v} onChange={e=>s(+e.target.value)} style={{padding:12,borderRadius:10,border:0,fontSize:17}}/></label>)}</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginTop:22}}>{[['Est. equity',money(a.equity)],['Monthly spread*',money(a.spread)],['Initial cash*',money(a.required)],['Simple CoC*',a.coc.toFixed(1)+'%']].map(([l,v])=><div key={l} style={{background:'#19372a',padding:18,borderRadius:14}}><small>{l}</small><strong style={{display:'block',fontSize:24,marginTop:4}}>{v}</strong></div>)}</div><p style={{fontSize:13,opacity:.8,lineHeight:1.5}}>*Screening estimates only. Excludes vacancy, management, maintenance, capex, taxes/insurance not included in entered payment, utilities, financing fees and other costs. Never present a subject-to transaction as a formal loan assumption. Existing loan documents may contain due-on-sale provisions.</p></section>
  <section style={{marginTop:38}}><h2>Eva’s deal gate</h2><p style={{fontSize:18,lineHeight:1.7,maxWidth:900}}>For every lead: <b>discover → verify debt/title → calculate four structures → stress-test → explain seller tradeoffs → compliance review → closing professional → service payments → monitor exit.</b> Aridon should reject deals that only work with optimistic rent, hidden seller risk, missing disclosures or an unrealistic refinance.</p><p style={{padding:18,borderLeft:'5px solid #2d6a4f',background:'#eef6f1',lineHeight:1.6}}><b>Guardrail:</b> Creative financing is not a loophole around lender rights or consumer-protection law. Seller-financed residential transactions can trigger federal and state requirements, and a subject-to purchase can expose the seller and buyer to due-on-sale and credit/default risk. Use a real-estate attorney and experienced title/escrow professional for the property’s jurisdiction.</p></section>
 </main>
}
