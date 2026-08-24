'use client';

import { useMemo, useState } from 'react';
import { summarizeVerifiedValue, ValueOpportunity } from '../../lib/valueEngine';

const seed: ValueOpportunity[] = [];
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function ValueCenterPage() {
  const [items] = useState<ValueOpportunity[]>(seed);
  const totals = useMemo(() => summarizeVerifiedValue(items), [items]);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:'48px 24px',fontFamily:'system-ui'}}>
      <p style={{letterSpacing:2,fontWeight:800}}>ARIDON VALUE CENTER</p>
      <h1 style={{fontSize:'clamp(38px,7vw,76px)',margin:'8px 0'}}>Verified Value Created</h1>
      <div style={{fontSize:'clamp(48px,9vw,96px)',fontWeight:900}}>{money.format(totals.verified)}</div>
      <p style={{fontSize:20,maxWidth:780}}>Aridon finds financial opportunities, keeps consequential actions behind human approval, and separates modeled opportunity from verified realized value.</p>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:16,marginTop:32}}>
        <Metric label="Opportunity identified" value={money.format(totals.identified)} />
        <Metric label="Approved value" value={money.format(totals.approved)} />
        <Metric label="Verified value" value={money.format(totals.verified)} />
        <Metric label="Verified hours saved" value={String(totals.hoursSaved)} />
      </section>

      <section style={{marginTop:48}}>
        <h2>Find → Prove → Act → Measure → Learn → Repeat</h2>
        <p>Every opportunity moves through an evidence-backed state machine: Identified → Approved → Executed → Observed → Verified. Rejected opportunities remain in the audit trail.</p>
      </section>

      <section style={{marginTop:40}}>
        <h2>Three ways into Aridon</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:16}}>
          <Card title="Revenue Recovery" text="Find stale estimates, dormant customers, missed follow-up, cross-sell and conversion opportunities." />
          <Card title="Farm Profit Check" text="Find buyer, input, labor, water, inventory, crop/livestock and administrative profit opportunities." />
          <Card title="Business Rescue" text="Preserve customers, cash, inventory and enterprise value before restructuring, liquidation or sale." />
        </div>
      </section>

      <section style={{marginTop:40,padding:24,border:'1px solid #bbb',borderRadius:18}}>
        <h2>Evidence before claims</h2>
        <p>Modeled value is never presented as realized value. A result becomes verified only after evidence is attached and the financial outcome is reconciled.</p>
      </section>
    </main>
  );
}

function Metric({label,value}:{label:string,value:string}) { return <div style={{padding:20,border:'1px solid #ccc',borderRadius:16}}><div style={{fontSize:13,textTransform:'uppercase'}}>{label}</div><div style={{fontSize:30,fontWeight:800,marginTop:8}}>{value}</div></div> }
function Card({title,text}:{title:string,text:string}) { return <article style={{padding:22,border:'1px solid #ccc',borderRadius:16}}><h3>{title}</h3><p>{text}</p></article> }
