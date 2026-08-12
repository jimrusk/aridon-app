'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '../../../lib/supabase';

type Metric = { id:string; label:string; value_text:string; note:string | null; sort_order:number; updated_at:string };

const fallback: Metric[] = [
  {id:'prospects_contacted',label:'Founding proof prospects contacted',value_text:'1',note:'Ideal Plumbing & Heating contacted Aug. 12, 2026',sort_order:10,updated_at:'2026-08-12T00:00:00Z'},
  {id:'qualified_replies',label:'Qualified replies',value_text:'0',note:'Only counts replies with a plausible test case and decision-maker access',sort_order:20,updated_at:'2026-08-12T00:00:00Z'},
  {id:'pilots_started',label:'Pilots started',value_text:'0',note:'Starts only after owner agrees to scope, baseline, data boundary, and success threshold',sort_order:30,updated_at:'2026-08-12T00:00:00Z'},
  {id:'pilots_completed',label:'Pilots completed',value_text:'0',note:'No completed proof case yet',sort_order:40,updated_at:'2026-08-12T00:00:00Z'},
  {id:'paid_conversions',label:'Paid conversions',value_text:'0',note:'Stripe-confirmed paid continuation only',sort_order:50,updated_at:'2026-08-12T00:00:00Z'},
  {id:'mrr',label:'Verified MRR',value_text:'$0',note:'Stripe-confirmed recurring revenue',sort_order:60,updated_at:'2026-08-12T00:00:00Z'},
  {id:'measurable_outcomes',label:'Measurable client outcomes',value_text:'0',note:'Booked work, collected revenue, or documented time savings confirmed by the business',sort_order:70,updated_at:'2026-08-12T00:00:00Z'},
];

export default function AridonProofPage() {
  const [metrics,setMetrics] = useState<Metric[]>(fallback);
  const [lastUpdated,setLastUpdated] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const db = getBrowserClient();
      const { data, error } = await db.from('aridon_public_proof_metrics').select('id,label,value_text,note,sort_order,updated_at').order('sort_order');
      if (!alive || error || !data?.length) return;
      const rows = data as Metric[];
      setMetrics(rows);
      const latest = rows.map((r)=>new Date(r.updated_at).getTime()).filter(Number.isFinite).sort((a,b)=>b-a)[0];
      if (latest) setLastUpdated(new Date(latest).toLocaleString());
    })();
    return () => { alive = false; };
  },[]);

  return (
    <main style={{minHeight:'100vh',background:'#F5F2EA',color:'#171717',fontFamily:'Arial,sans-serif'}}>
      <section style={{maxWidth:1100,margin:'0 auto',padding:'32px 20px 80px'}}>
        <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <Link href="/business-os" style={{color:'#171717',textDecoration:'none',fontWeight:950}}>ARIDON</Link>
          <Link href="/business-os/revenue-recovery" style={{background:'#171717',color:'#fff',textDecoration:'none',fontWeight:950,padding:'12px 16px',borderRadius:12}}>Apply for the Proof Pilot</Link>
        </nav>

        <div style={{paddingTop:60,maxWidth:940}}>
          <div style={{fontSize:12,fontWeight:950,letterSpacing:1.2}}>ARIDON ON ARIDON · PUBLIC PROOF CHALLENGE</div>
          <h1 style={{fontSize:'clamp(48px,8vw,88px)',lineHeight:.94,letterSpacing:-4,margin:'14px 0 22px'}}>No victory lap until the numbers move.</h1>
          <p style={{fontSize:21,lineHeight:1.65,color:'#55514A',maxWidth:850}}>Aridon started this challenge at $0 MRR and zero paid subscriptions. The first proof lane is deliberately narrow: New Mexico and Arizona plumbing/HVAC companies, stale estimates and missed follow-up, one auditable result at a time.</p>
          <p style={{fontSize:12,color:'#746E65'}}>{lastUpdated ? `Live scoreboard updated ${lastUpdated}` : 'Live scoreboard reads from Aridon proof metrics; verified changes replace the baseline automatically.'}</p>
        </div>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:38}}>
          {metrics.map((metric) => <article key={metric.id} style={{background:'#fff',border:'1px solid #D1CBC0',borderRadius:16,padding:20}}><div style={{fontSize:12,fontWeight:900,color:'#6B665E'}}>{metric.label}</div><div style={{fontSize:34,fontWeight:950,margin:'7px 0'}}>{metric.value_text}</div><div style={{fontSize:13,lineHeight:1.5,color:'#6B665E'}}>{metric.note}</div></article>)}
        </section>

        <section style={{marginTop:46,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14}}>
          {[
            ['The first lane','Plumbing/HVAC. Stale estimates, missed follow-up, and dormant customers. We are not testing ten industries and ten workflows at once.'],
            ['Proof business #1 target','Ideal Plumbing & Heating in Albuquerque is the first qualification target. Contacted does not mean qualified, agreed, or active. Consent comes first.'],
            ['Revenue influenced','Opportunity value connected to an Aridon-assisted action that produced a measurable response, reactivation, proposal movement, or booking.'],
            ['Revenue collected','Cash actually received by the pilot business and confirmed by the owner. Influenced and collected revenue are reported separately.'],
            ['What counts as proof','Booked work, collected revenue, verified opportunity movement, or documented time saved. Email volume, clicks, AI output, and projections do not count as outcomes.'],
            ['What happens on day 14','Publish the agreed baseline, actions approved, responses, booked work, revenue influenced, revenue collected if known, hours saved, and what failed.'],
          ].map(([title,text]) => <article key={title} style={{background:'#171717',color:'#fff',borderRadius:18,padding:22}}><h2 style={{margin:'0 0 9px',fontSize:22}}>{title}</h2><p style={{color:'#C8C7C2',lineHeight:1.65,margin:0}}>{text}</p></article>)}
        </section>

        <section style={{marginTop:48,border:'1px solid #CFC8BC',borderRadius:20,padding:26,background:'#fff'}}>
          <div style={{fontSize:12,fontWeight:950}}>THE FIRST MILESTONE</div>
          <h2 style={{fontSize:'clamp(34px,5vw,54px)',lineHeight:1,margin:'9px 0 15px'}}>$0 MRR → one real paying customer with a verified reason to keep Aridon.</h2>
          <p style={{fontSize:18,lineHeight:1.65,color:'#55514A',maxWidth:850}}>After customer one, the challenge becomes repeatability: can the same narrow workflow produce customer two and customer three without changing the definition of success?</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:20}}>
            <Link href="/business-os/revenue-recovery" style={{background:'#171717',color:'#fff',textDecoration:'none',fontWeight:950,padding:'14px 18px',borderRadius:12}}>Give Aridon a Real Test Case</Link>
            <Link href="/business-os/revenue" style={{border:'1px solid #80786D',color:'#171717',textDecoration:'none',fontWeight:900,padding:'13px 17px',borderRadius:12}}>Estimate a Revenue Leak</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
