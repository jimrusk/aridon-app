import Link from 'next/link';

const pilotEmail = 'mailto:jimrusk66@gmail.com?subject=I%20want%20an%20Aridon%2014-Day%20Revenue%20Recovery%20Pilot&body=Business%20name%3A%0AWebsite%3A%0AState%20(NM%20or%20AZ)%3A%0AThe%20revenue%20leak%20I%20most%20want%20Aridon%20to%20attack%3A%0A';

export default function RevenueRecoveryPilotPage() {
  return (
    <main style={{minHeight:'100vh',background:'#0B1220',color:'#F7FAFC',fontFamily:'Arial,sans-serif'}}>
      <section style={{maxWidth:1120,margin:'0 auto',padding:'32px 20px 76px'}}>
        <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <Link href="/business-os" style={{color:'#fff',textDecoration:'none',fontWeight:950}}>ARIDON PRIVATE BUSINESS OS</Link>
          <a href={pilotEmail} style={{background:'#A4F3D3',color:'#07130F',textDecoration:'none',fontWeight:950,padding:'12px 16px',borderRadius:12}}>Claim a Pilot Spot</a>
        </nav>

        <div style={{paddingTop:70,maxWidth:950}}>
          <div style={{fontSize:12,fontWeight:950,letterSpacing:1.2,color:'#A4F3D3'}}>NEW MEXICO + ARIZONA · 14 DAYS · NO UPFRONT FEE</div>
          <h1 style={{fontSize:'clamp(48px,8vw,88px)',lineHeight:.94,letterSpacing:-4,margin:'14px 0 22px'}}>Make Aridon prove it on money your business may already be losing.</h1>
          <p style={{fontSize:21,lineHeight:1.65,color:'#C7D2E2',maxWidth:860}}>We are selecting a small number of owner-led businesses in New Mexico and Arizona for a 14-day Revenue Recovery Pilot. Aridon attacks stale estimates, missed follow-ups, old customers worth reactivating, slow lead response, and owner time buried in admin. You keep approval control. There is no upfront pilot fee.</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:24}}>
            <a href={pilotEmail} style={{background:'#A4F3D3',color:'#07130F',textDecoration:'none',fontWeight:950,padding:'15px 20px',borderRadius:12}}>Yes — Test Aridon on My Business</a>
            <Link href="/business-os/proof" style={{border:'1px solid #51617A',color:'#fff',textDecoration:'none',fontWeight:900,padding:'14px 19px',borderRadius:12}}>Watch Aridon Prove Itself</Link>
          </div>
          <p style={{fontSize:12,color:'#8290A5',marginTop:14}}>Reply with your business name, website, state, and the one revenue leak you want attacked first. No account or password is required to request the pilot.</p>
        </div>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12,marginTop:52}}>
          {[
            ['Quiet estimates','Find quotes and proposals that never got a real second chance.'],
            ['Missed lead follow-up','Identify inquiries that went cold because nobody had time to chase them.'],
            ['Old customers','Surface repeat-service, maintenance, renewal, and reactivation opportunities.'],
            ['Owner bottlenecks','Find work that is stuck because too much depends on one person.'],
            ['Slow response','Reduce the gap between a prospect raising a hand and your business answering.'],
            ['Admin drag','Turn notes, inbox clutter, research, reminders, and follow-ups into coordinated work.'],
          ].map(([title,text]) => <article key={title} style={{background:'#111B2B',border:'1px solid #26354C',borderRadius:16,padding:20}}><h2 style={{fontSize:20,margin:'0 0 8px'}}>{title}</h2><p style={{margin:0,color:'#B9C5D6',lineHeight:1.6}}>{text}</p></article>)}
        </section>
      </section>

      <section style={{background:'#F5F2EA',color:'#171717',padding:'70px 20px'}}>
        <div style={{maxWidth:1020,margin:'0 auto'}}>
          <div style={{fontSize:12,fontWeight:950,letterSpacing:1}}>THE TEST IS SIMPLE</div>
          <h2 style={{fontSize:'clamp(36px,6vw,62px)',lineHeight:1,margin:'10px 0 28px'}}>No AI theater. We establish a baseline, attack real leaks, and measure what changed.</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
            {[
              ['1 · Baseline','Agree on the starting numbers: open estimates, dormant leads, repeat-customer opportunities, response time, and owner hours.'],
              ['2 · Attack','Aridon ranks the highest-value opportunities and prepares the follow-up, reactivation, research, and next actions.'],
              ['3 · Approve','Your team approves consequential external actions. Aridon does not invent consent or make commitments for you.'],
              ['4 · Measure','Track revived opportunities, responses, booked work, documented revenue influence, and time saved.'],
              ['5 · Decide','At day 14, keep Aridon only if the evidence justifies continuing.'],
            ].map(([title,text]) => <article key={title} style={{background:'#fff',border:'1px solid #D4CEC2',borderRadius:16,padding:20}}><strong style={{fontSize:18}}>{title}</strong><p style={{lineHeight:1.6,color:'#5E5A53'}}>{text}</p></article>)}
          </div>

          <div style={{marginTop:36,padding:24,borderRadius:18,background:'#171717',color:'#fff'}}>
            <div style={{fontSize:12,fontWeight:950,color:'#A4F3D3'}}>FOUNDING PILOT TERMS</div>
            <h3 style={{fontSize:28,margin:'8px 0 10px'}}>No upfront fee. No revenue guarantee. No long contract.</h3>
            <p style={{color:'#C8CDD5',lineHeight:1.65,maxWidth:840}}>If the pilot demonstrates useful measurable value and you want to continue, we will show you the paid option before anything is charged. If it does not, stop. External sends, pricing commitments, contracts, spending, and other consequential actions stay under human approval.</p>
          </div>

          <div style={{textAlign:'center',marginTop:44}}>
            <h2 style={{fontSize:'clamp(34px,5vw,52px)',margin:'0 0 14px'}}>Give us one real business problem. Make Aridon earn the right to stay.</h2>
            <a href={pilotEmail} style={{display:'inline-block',background:'#171717',color:'#fff',textDecoration:'none',fontWeight:950,padding:'15px 20px',borderRadius:12}}>Claim a 14-Day Pilot</a>
            <div style={{marginTop:14}}><Link href="/business-os/beta" style={{color:'#4A4A4A',fontWeight:800}}>Or build a free workspace yourself</Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}
