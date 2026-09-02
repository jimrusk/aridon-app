import Link from 'next/link';

const links=[
  ['/boardroom','Executive Boardroom','Bring a decision to the executive team.'],
  ['/ceo-brief','CEO Brief','Build the current executive summary.'],
  ['/finance','FP&A Command Center','Plan, forecast, stress-test cash and margins, and ask the numbers what they mean.'],
  ['/execution','Execution Engine','Move approved work into execution.'],
  ['/controls','Approval Center','Review actions that need owner approval.'],
  ['/avatars','Executive Voice Room','Talk with the Aridon executive team.'],
  ['/investor-intelligence','Investment Intelligence','Screen startup and growth investments, expose diligence risks, generate management questions, and draft an investor memo.'],
  ['/acquisitions/pipeline','Acquisition Pipeline','Run Aridon 3 from lead capture through underwriting, LOI, diligence, close, and the first 100 days.'],
  ['/acquisitions/thesis','Acquisition Thesis','Define exactly what Aridon should buy and what it should automatically reject.'],
  ['/acquisitions','Acquisition Deal Engine','Score leverage, structure financing, and build a seller negotiation plan.'],
  ['/business-os','Business OS','Open the customer-facing operating system.'],
  ['/analyze-business','Analyze Any Business','Run the public business analyzer.']
];

export default function DashboardPage(){
  return <main style={{minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif',padding:'28px 20px'}}>
    <div style={{maxWidth:1050,margin:'0 auto'}}>
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><strong>ARIDON WORKSPACE</strong><Link href="/" style={{color:'#9EF0CF',textDecoration:'none',fontWeight:900}}>View Public Site</Link></nav>
      <div style={{padding:'58px 0 24px'}}><div style={{color:'#9EF0CF',fontSize:12,fontWeight:950}}>OWNER COMMAND CENTER</div><h1 style={{fontSize:'clamp(42px,7vw,72px)',lineHeight:.96,margin:'10px 0'}}>Run Aridon from here.</h1><p style={{color:'#B8C4D5',fontSize:18,lineHeight:1.6,maxWidth:760}}>The public homepage now sells the outcome. This workspace keeps the operating tools out of the prospect's way.</p></div>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>{links.map(([href,title,text])=><Link key={href} href={href} style={{background:'#0D1728',border:'1px solid #2A3A57',borderRadius:16,padding:20,color:'#F8FAFC',textDecoration:'none'}}><strong style={{fontSize:20}}>{title}</strong><div style={{color:'#AEBBD0',lineHeight:1.55,marginTop:7}}>{text}</div></Link>)}</section>
    </div>
  </main>;
}
