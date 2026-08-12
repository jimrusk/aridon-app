import Link from 'next/link';

const scorecards = [
  ['Starting MRR', '$0', 'Stripe baseline on Aug. 12, 2026'],
  ['Active subscriptions', '0', 'No paid subscription counted until Stripe confirms it'],
  ['Qualified pilot replies', '0', 'Cold outreach had not yet produced a qualified Business OS pilot reply'],
  ['First target', '1 paid customer', 'Prove the engine can move from zero to revenue'],
];

export default function AridonProofPage() {
  return (
    <main style={{minHeight:'100vh',background:'#F5F2EA',color:'#171717',fontFamily:'Arial,sans-serif'}}>
      <section style={{maxWidth:1100,margin:'0 auto',padding:'32px 20px 80px'}}>
        <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <Link href="/business-os" style={{color:'#171717',textDecoration:'none',fontWeight:950}}>ARIDON</Link>
          <Link href="/business-os/revenue-recovery" style={{background:'#171717',color:'#fff',textDecoration:'none',fontWeight:950,padding:'12px 16px',borderRadius:12}}>Put Aridon on My Business</Link>
        </nav>

        <div style={{paddingTop:60,maxWidth:940}}>
          <div style={{fontSize:12,fontWeight:950,letterSpacing:1.2}}>ARIDON ON ARIDON · PUBLIC PROOF CHALLENGE</div>
          <h1 style={{fontSize:'clamp(48px,8vw,88px)',lineHeight:.94,letterSpacing:-4,margin:'14px 0 22px'}}>We are making Aridon prove that Aridon can create revenue.</h1>
          <p style={{fontSize:21,lineHeight:1.65,color:'#55514A',maxWidth:850}}>No polished case-study fiction. We started with zero paid subscriptions. Aridon is now being used on its own business to identify conversion leaks, change the offer, run outreach, measure replies, and track every paid subscription that follows.</p>
        </div>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:38}}>
          {scorecards.map(([label,value,note]) => <article key={label} style={{background:'#fff',border:'1px solid #D1CBC0',borderRadius:16,padding:20}}><div style={{fontSize:12,fontWeight:900,color:'#6B665E'}}>{label}</div><div style={{fontSize:36,fontWeight:950,margin:'7px 0'}}>{value}</div><div style={{fontSize:13,lineHeight:1.5,color:'#6B665E'}}>{note}</div></article>)}
        </section>

        <section style={{marginTop:46,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14}}>
          {[
            ['What Aridon diagnosed','Cold prospects were being asked to understand a broad AI platform and complete a full account setup before trust existed. That is too much friction for the first yes.'],
            ['What Aridon changed','The front-door offer is now a 14-day Revenue Recovery Pilot for New Mexico and Arizona with no upfront fee, no account required to request it, and one concrete outcome: find measurable business value.'],
            ['What gets measured','Pilot requests, qualified conversations, activated pilots, paid subscriptions, MRR, influenced revenue, and the exact tactics that created each conversion.'],
            ['What counts as proof','Not clicks, impressions, AI output volume, or optimistic estimates. A paid customer counts. Measurable client outcomes count. Everything else is a leading indicator.'],
          ].map(([title,text]) => <article key={title} style={{background:'#171717',color:'#fff',borderRadius:18,padding:22}}><h2 style={{margin:'0 0 9px',fontSize:22}}>{title}</h2><p style={{color:'#C8C7C2',lineHeight:1.65,margin:0}}>{text}</p></article>)}
        </section>

        <section style={{marginTop:48,border:'1px solid #CFC8BC',borderRadius:20,padding:26,background:'#fff'}}>
          <div style={{fontSize:12,fontWeight:950}}>THE RULE</div>
          <h2 style={{fontSize:'clamp(34px,5vw,54px)',lineHeight:1,margin:'9px 0 15px'}}>Aridon does not get credit for activity. It gets credit for outcomes.</h2>
          <p style={{fontSize:18,lineHeight:1.65,color:'#55514A',maxWidth:850}}>The first milestone is brutally simple: move from $0 MRR to the first real paying customer. After that, the challenge becomes repeatability: can Aridon create a second and third customer without relying on luck?</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:20}}>
            <Link href="/business-os/revenue-recovery" style={{background:'#171717',color:'#fff',textDecoration:'none',fontWeight:950,padding:'14px 18px',borderRadius:12}}>Challenge Aridon With My Business</Link>
            <Link href="/business-os/revenue" style={{border:'1px solid #80786D',color:'#171717',textDecoration:'none',fontWeight:900,padding:'13px 17px',borderRadius:12}}>Estimate a Revenue Leak</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
