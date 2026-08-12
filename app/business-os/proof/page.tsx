import Link from 'next/link';

const funnel = [
  ['Founding proof prospects contacted','1','Ideal Plumbing & Heating contacted Aug. 12, 2026'],
  ['Qualified replies','0','A reply only counts if the business has a plausible test case and decision-maker access'],
  ['Pilots started','0','A pilot starts only after the owner agrees to scope, baseline, data boundary, and success threshold'],
  ['Pilots completed','0','No completed proof case yet'],
  ['Paid conversions','0','Stripe-confirmed paid continuation only'],
  ['Verified MRR','$0','Starting Stripe baseline'],
  ['Measurable client outcomes','0','Booked work, collected revenue, or documented time savings confirmed by the business'],
];

export default function AridonProofPage() {
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
        </div>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:38}}>
          {funnel.map(([label,value,note]) => <article key={label} style={{background:'#fff',border:'1px solid #D1CBC0',borderRadius:16,padding:20}}><div style={{fontSize:12,fontWeight:900,color:'#6B665E'}}>{label}</div><div style={{fontSize:34,fontWeight:950,margin:'7px 0'}}>{value}</div><div style={{fontSize:13,lineHeight:1.5,color:'#6B665E'}}>{note}</div></article>)}
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
