'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { Building2, CheckCircle2, FileText, HandCoins, Leaf, MapPinned, ShieldCheck, Sprout, TrendingUp } from 'lucide-react';

type Inputs = {
  askingPrice:number;
  agValue:number;
  annualRevenue:number;
  annualProfit:number;
  cash:number;
  debt:number;
  leaseYears:number;
  easementReduction:number;
  grantCapital:number;
  patientCapital:number;
};

const initial:Inputs={askingPrice:900000,agValue:520000,annualRevenue:180000,annualProfit:42000,cash:65000,debt:75000,leaseYears:4,easementReduction:42,grantCapital:75000,patientCapital:100000};

export default function FarmOwnershipPage(){
  const [x,setX]=useState(initial);
  const model=useMemo(()=>{
    const postEasement=x.askingPrice*(1-x.easementReduction/100);
    const protectedPurchase=Math.min(postEasement,x.agValue||postEasement);
    const gap=Math.max(0,protectedPurchase-x.cash-x.grantCapital-x.patientCapital);
    const debtCoverage=x.debt>0?x.annualProfit/x.debt:1;
    const margin=x.annualRevenue>0?x.annualProfit/x.annualRevenue:0;
    const readiness=Math.max(0,Math.min(100,Math.round(35+Math.min(20,margin*100)+Math.min(15,(x.cash/Math.max(protectedPurchase,1))*100)+Math.min(15,(x.annualProfit/Math.max(gap,1))*100)+Math.min(15,x.leaseYears*3))));
    return {postEasement,protectedPurchase,gap,debtCoverage,margin,readiness};
  },[x]);

  const upd=(k:keyof Inputs,v:string)=>setX(p=>({...p,[k]:Number(v)||0}));

  return <main style={s.main}>
    <header style={s.header}><Link href="/ag/finance" style={s.brand}>ARIDON AG FINANCE</Link><span style={s.pill}>Farm Ownership Pathway</span></header>
    <section style={s.hero}><div style={s.wrap}>
      <div style={s.eyebrow}>LAND ACCESS · BLENDED CAPITAL · LEASE-TO-OWN</div>
      <h1 style={s.h1}>Turn a farm candidate into an ownership plan.</h1>
      <p style={s.lead}>A working underwriting and readiness layer for farmers, land partners, lenders, foundations and conservation organizations. It models acquisition, easement value, blended capital, lease runway and the remaining financing gap.</p>
    </div></section>

    <section style={s.wrap}>
      <div style={s.flow}>
        {[[MapPinned,'Land candidate'],[Leaf,'Conservation value'],[Sprout,'Farmer readiness'],[HandCoins,'Capital stack'],[FileText,'Evidence package'],[Building2,'Ownership']] .map(([Icon,label]:any)=><div style={s.flowItem} key={label}><Icon size={20}/><span>{label}</span></div>)}
      </div>

      <div style={s.grid2}>
        <div style={s.panel}>
          <h2>Model the deal</h2>
          <div style={s.formGrid}>
            <Input label="Current asking price" v={x.askingPrice} onChange={v=>upd('askingPrice',v)} prefix="$"/>
            <Input label="Estimated agricultural value" v={x.agValue} onChange={v=>upd('agValue',v)} prefix="$"/>
            <Input label="Farmer annual revenue" v={x.annualRevenue} onChange={v=>upd('annualRevenue',v)} prefix="$"/>
            <Input label="Farmer annual profit" v={x.annualProfit} onChange={v=>upd('annualProfit',v)} prefix="$"/>
            <Input label="Farmer cash/equity" v={x.cash} onChange={v=>upd('cash',v)} prefix="$"/>
            <Input label="Existing debt" v={x.debt} onChange={v=>upd('debt',v)} prefix="$"/>
            <Input label="Lease runway" v={x.leaseYears} onChange={v=>upd('leaseYears',v)} suffix=" years"/>
            <Input label="Modeled easement/value reduction" v={x.easementReduction} onChange={v=>upd('easementReduction',v)} suffix="%"/>
            <Input label="Grant / philanthropic capital" v={x.grantCapital} onChange={v=>upd('grantCapital',v)} prefix="$"/>
            <Input label="Patient / below-market capital" v={x.patientCapital} onChange={v=>upd('patientCapital',v)} prefix="$"/>
          </div>
          <p style={s.note}>This is a planning model, not a valuation, lending commitment or legal determination. Conservation easement value and financing terms require qualified third-party review.</p>
        </div>

        <div style={s.panel}>
          <h2>Ownership pathway</h2>
          <Metric label="Modeled protected purchase price" value={money(model.protectedPurchase)}/>
          <Metric label="Remaining financing gap" value={money(model.gap)}/>
          <Metric label="Operating margin" value={`${(model.margin*100).toFixed(1)}%`}/>
          <Metric label="Readiness score" value={`${model.readiness}/100`}/>
          <div style={s.scoreTrack}><div style={{...s.scoreBar,width:`${model.readiness}%`}}/></div>
          <div style={s.callout}><ShieldCheck size={20}/><div><strong>Next evidence to collect</strong><p>3-year P&L, balance sheet, tax returns, production plan, market/offtake evidence, water access, conservation eligibility, lease terms and lender requirements.</p></div></div>
        </div>
      </div>

      <h2 style={{marginTop:34}}>Capital stack builder</h2>
      <div style={s.cards}>
        <Card icon={<HandCoins/>} title="Grant / philanthropic" text="Reduce the acquisition or transition burden with recoverable grants, gifts, sponsor capital or program funding."/>
        <Card icon={<Leaf/>} title="Conservation value" text="Model how an easement or protected-use structure can lower the property toward agricultural value."/>
        <Card icon={<TrendingUp/>} title="Patient capital" text="Add low-cost or flexible capital that gives the operator time to build revenue and lender readiness."/>
        <Card icon={<Building2/>} title="Permanent debt" text="Convert the proven operating business into lender-ready ownership financing when the lease runway ends."/>
      </div>

      <div style={s.panelWide}>
        <h2>Aridon evidence package</h2>
        <p style={s.leadSmall}>Farm Passport + SoilScan + water records + enterprise budgets + P&L + market contracts + regenerative practices + property documents + monthly progress tracking → one lender / funder / land-partner package.</p>
        <div style={s.checks}>{['Business plan','Balance sheet','Profit & loss history','Expansion plan','Revenue forecast','Water and land evidence','Regenerative practice record','Market / buyer evidence','Monthly progress reviews','Exit-to-ownership plan'].map(t=><span key={t}><CheckCircle2 size={15}/>{t}</span>)}</div>
      </div>
    </section>
  </main>
}

function Input({label,v,onChange,prefix='',suffix=''}:{label:string;v:number;onChange:(v:string)=>void;prefix?:string;suffix?:string}){return <label style={s.label}><span>{label}</span><div style={s.inputWrap}>{prefix&&<b>{prefix}</b>}<input style={s.input} type="number" value={v} onChange={e=>onChange(e.target.value)}/>{suffix&&<b>{suffix}</b>}</div></label>}
function Metric({label,value}:{label:string;value:string}){return <div style={s.metric}><span>{label}</span><strong>{value}</strong></div>}
function Card({icon,title,text}:{icon:any;title:string;text:string}){return <div style={s.card}><div style={s.icon}>{icon}</div><strong>{title}</strong><p>{text}</p></div>}
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);

const s:Record<string,CSSProperties>={
main:{minHeight:'100vh',background:'#f4f1e8',color:'#17301E',fontFamily:'Inter,system-ui,sans-serif'},header:{padding:'14px 20px',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',borderBottom:'1px solid #c9d5c3',background:'#fff'},brand:{fontWeight:950,color:'#17301E',textDecoration:'none'},pill:{background:'#dcebcf',border:'1px solid #b9cda9',borderRadius:999,padding:'6px 10px',fontWeight:900,fontSize:12},hero:{background:'linear-gradient(135deg,#183823,#2c5b38)',color:'#fff'},wrap:{maxWidth:1160,margin:'0 auto',padding:'34px 20px'},eyebrow:{fontSize:12,fontWeight:950,letterSpacing:'.11em',color:'#b8ecae'},h1:{fontSize:'clamp(38px,6vw,68px)',lineHeight:1,letterSpacing:'-.04em',maxWidth:900,margin:'12px 0'},lead:{fontSize:18,lineHeight:1.6,maxWidth:930,color:'#e3eee3'},leadSmall:{fontSize:16,lineHeight:1.6,color:'#38523e'},flow:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:22},flowItem:{background:'#fff',border:'1px solid #cdd9c8',borderRadius:14,padding:13,display:'flex',gap:8,alignItems:'center',fontWeight:900},grid2:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:18},panel:{background:'#fff',border:'1px solid #cbd7c5',borderRadius:18,padding:20,boxShadow:'0 12px 34px rgba(23,48,30,.08)'},formGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12},label:{display:'grid',gap:6,fontSize:12,fontWeight:900},inputWrap:{display:'flex',alignItems:'center',gap:6,border:'1px solid #bfcdb9',borderRadius:11,padding:'0 10px',background:'#fbfcf8'},input:{width:'100%',border:0,outline:'none',padding:'11px 4px',background:'transparent',fontSize:16,fontWeight:800},note:{fontSize:12,color:'#657468',lineHeight:1.5},metric:{display:'flex',justifyContent:'space-between',gap:12,padding:'12px 0',borderBottom:'1px solid #e3e8df'},scoreTrack:{height:10,background:'#e5ece1',borderRadius:999,overflow:'hidden',margin:'14px 0'},scoreBar:{height:'100%',background:'#4d8c59'},callout:{display:'grid',gridTemplateColumns:'24px 1fr',gap:10,background:'#eef5e9',border:'1px solid #cfddc9',borderRadius:14,padding:14,marginTop:12},cards:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:13},card:{background:'#fff',border:'1px solid #cbd7c5',borderRadius:16,padding:17},icon:{width:38,height:38,borderRadius:10,display:'grid',placeItems:'center',background:'#e7f1df',marginBottom:10},panelWide:{background:'#fff',border:'1px solid #cbd7c5',borderRadius:18,padding:20,marginTop:24},checks:{display:'flex',flexWrap:'wrap',gap:8,marginTop:14},};
