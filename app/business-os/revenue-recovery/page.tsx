import Link from 'next/link';

export default function RevenueRecoveryPilotPage() {
  return (
    <main style={{minHeight:'100vh',background:'#0B1220',color:'#F7FAFC',fontFamily:'Arial,sans-serif'}}>
      <section style={{maxWidth:1120,margin:'0 auto',padding:'32px 20px 76px'}}>
        <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <Link href="/business-os" style={{color:'#fff',textDecoration:'none',fontWeight:950}}>ARIDON PRIVATE BUSINESS OS</Link>
          <Link href="/business-os/beta" style={{background:'#A4F3D3',color:'#07130F',textDecoration:'none',fontWeight:950,padding:'12px 16px',borderRadius:12}}>Request the Pilot</Link>
        </nav>

        <div style={{paddingTop:70,maxWidth:950}}>
          <div style={{fontSize:12,fontWeight:950,letterSpacing:1.2,color:'#A4F3D3'}}>14-DAY REVENUE RECOVERY PILOT · NO UPFRONT FEE</div>
          <h1 style={{fontSize:'clamp(48px,8vw,88px)',lineHeight:.94,letterSpacing:-4,margin:'14px 0 22px'}}>What money is your business already leaving on the table?</h1>
          <p style={{fontSize:21,lineHeight:1.65,color:'#C7D2E2',maxWidth:860}}>Give Aridon 14 days to look for stale estimates, missed follow-ups, old customers worth reactivating, slow lead response, and owner time buried in admin. You keep approval control. There is no upfront pilot fee. If we cannot demonstrate measurable business value, you walk away.</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:24}}>
            <Link href="/business-os/beta" style={{background:'#A4F3D3',color:'#07130F',textDecoration:'none',fontWeight:950,padding:'15px 20px',borderRadius:12}}>Start My 14-Day Pilot</Link>
            <Link href="/business-os/revenue" style={{border:'1px solid #51617A',color:'#fff',textDecoration:'none',fontWeight:900,padding:'14px 19px',borderRadius:12}}>Estimate My Revenue Leak</Link>
          </div>
          <p style={{fontSize:12,color:'#8290A5',marginTop:14}}>No guaranteed revenue claims. Results depend on the quality of your existing opportunities, customer demand, pricing, capacity, and follow-through.</p>
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
          <div style={{fontSize:12,fontWeight:950,letterSpacing:1}}>WHAT HAPPENS IN THE 14 DAYS</div>
          <h2 style={{fontSize:'clamp(36px,6vw,62px)',lineHeight:1,margin:'10px 0 28px'}}>We do not ask you to “try some AI.” We put Aridon against real money problems.</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
            {[
              ['1 · Find','We map the existing revenue leaks and rank them by likely value and speed.'],
              ['2 · Recover','Aridon prepares the follow-ups, reactivation campaigns, priorities, and next actions for your approval.'],
              ['3 · Measure','We track responses, booked work, revived opportunities, time saved, and what did not work.'],
              ['4 · Decide','At the end, you see the evidence. If the value is not there, you can walk away.'],
            ].map(([title,text]) => <article key={title} style={{background:'#fff',border:'1px solid #D4CEC2',borderRadius:16,padding:20}}><strong style={{fontSize:18}}>{title}</strong><p style={{lineHeight:1.6,color:'#5E5A53'}}>{text}</p></article>)}
          </div>
          <div style={{marginTop:36,padding:24,borderRadius:18,background:'#171717',color:'#fff'}}>
            <div style={{fontSize:12,fontWeight:950,color:'#A4F3D3'}}>OWNER CONTROL STAYS ON</div>
            <h3 style={{fontSize:28,margin:'8px 0 10px'}}>Aridon can prepare and organize. You approve consequential actions.</h3>
            <p style={{color:'#C8CDD5',lineHeight:1.65,maxWidth:840}}>No private systems are accessed without permission. External sends, pricing commitments, contracts, spending, and other consequential actions remain behind human approval unless you explicitly configure otherwise.</p>
          </div>
          <div style={{textAlign:'center',marginTop:44}}>
            <h2 style={{fontSize:'clamp(34px,5vw,52px)',margin:'0 0 14px'}}>If there is recoverable value hiding in the business, let’s go find it.</h2>
            <Link href="/business-os/beta" style={{display:'inline-block',background:'#171717',color:'#fff',textDecoration:'none',fontWeight:950,padding:'15px 20px',borderRadius:12}}>Request the Revenue Recovery Pilot</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
