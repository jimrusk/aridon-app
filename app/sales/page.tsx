import Link from 'next/link';

const mint = '#9EF0CF';
const dark = '#07101D';

export default function SalesHome() {
  return <main style={{minHeight:'100vh',background:dark,color:'#F8FAFC',fontFamily:'Arial,sans-serif'}}>
    <section style={{maxWidth:1160,margin:'0 auto',padding:'24px 20px 72px'}}>
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <strong style={{letterSpacing:1}}>ARIDON</strong>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <Link href="/business-os/proof" style={nav}>Proof</Link>
          <a href="#pricing" style={nav}>Pricing</a>
          <Link href="/?workspace=1" style={nav}>Workspace</Link>
          <Link href="/analyze-business" style={smallButton}>Analyze My Business Free</Link>
        </div>
      </nav>

      <div className="hero" style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:28,alignItems:'center',paddingTop:72}}>
        <div>
          <div style={{color:mint,fontWeight:950,fontSize:12,letterSpacing:1.2}}>AI EXECUTIVE TEAM FOR OWNER-LED BUSINESSES</div>
          <h1 style={{fontSize:'clamp(48px,7vw,82px)',lineHeight:.94,letterSpacing:-3.5,margin:'14px 0 22px'}}>Find what your business is leaking. Put an AI executive team on fixing it.</h1>
          <p style={{color:'#B8C4D5',fontSize:20,lineHeight:1.65,maxWidth:790}}>Start with a free analysis of your real website. Aridon scores clarity, conversion, trust and visibility, then shows what the executive team would attack first. If the value is there, continue with Aridon for $497/month.</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:24}}>
            <Link href="/analyze-business" style={button}>Analyze My Business Free</Link>
            <a href="#pricing" style={outline}>See the $497 Plan</a>
          </div>
          <div style={{display:'flex',gap:15,flexWrap:'wrap',marginTop:15,color:'#91A0B5',fontSize:12,fontWeight:800}}><span>✓ No card to analyze</span><span>✓ No login required</span><span>✓ Owner approval stays in control</span></div>
        </div>

        <aside style={{background:'#102033',border:'1px solid #2A3A57',borderRadius:22,padding:22}}>
          <div style={{color:mint,fontSize:11,fontWeight:950}}>WHAT ARIDON CAN ATTACK</div>
          <h2 style={{fontSize:30,lineHeight:1.05,margin:'10px 0 12px'}}>One business. One team. One measurable next move.</h2>
          {[
            ['Revenue leaks','Stale estimates, dormant customers, missed follow-up and slow response.'],
            ['Conversion leaks','Weak calls to action, unclear offers and trust gaps.'],
            ['Execution leaks','Work that dies in inboxes, spreadsheets or “we need to get to that.”'],
            ['Decision leaks','Research and comparisons that steal owner time.']
          ].map(([title,text])=><div key={title} style={{borderTop:'1px solid #2A3A57',padding:'13px 0'}}><strong>{title}</strong><div style={{color:'#AEBBD0',lineHeight:1.5,fontSize:14,marginTop:4}}>{text}</div></div>)}
        </aside>
      </div>
    </section>

    <section style={{background:'#F4F1E9',color:'#171717',padding:'70px 20px'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{fontSize:12,fontWeight:950}}>HOW IT WORKS</div>
        <h2 style={{fontSize:'clamp(38px,6vw,60px)',lineHeight:1,letterSpacing:-2,margin:'10px 0 22px'}}>See the value before you buy the system.</h2>
        <div className="steps" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
          <Step n="01" title="Analyze" text="Paste your website. Get a real executive readout on what is working and what is costing opportunity." />
          <Step n="02" title="Prioritize" text="Aridon turns the findings into the next few moves instead of burying you under a giant feature list." />
          <Step n="03" title="Execute" text="Continue only when the work is worth paying for. Keep consequential actions under owner approval." />
        </div>
        <div style={{marginTop:38,background:'#171717',color:'#fff',borderRadius:20,padding:26}}>
          <div style={{color:mint,fontWeight:950,fontSize:12}}>NO CANNED DEMO</div>
          <h3 style={{fontSize:34,margin:'8px 0'}}>Give Aridon your own business to analyze.</h3>
          <p style={{color:'#C8CDD5',lineHeight:1.6,maxWidth:760}}>The fastest way to understand Aridon is to use it on something real. The free analyzer is the front door.</p>
          <Link href="/analyze-business" style={button}>Run the Free Analysis</Link>
        </div>
      </div>
    </section>

    <section style={{background:'#0A1422',padding:'70px 20px'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{color:mint,fontWeight:950,fontSize:12}}>NOT ANOTHER CHATBOT TAB</div>
        <h2 style={{fontSize:'clamp(38px,6vw,60px)',lineHeight:1,letterSpacing:-2,margin:'10px 0 22px'}}>Aridon is built to move business work.</h2>
        <div className="features" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
          <Feature title="Executive lenses" text="Operations, growth, finance, research and risk thinking around the same problem." />
          <Feature title="Company context" text="Leads, projects, tasks and company knowledge stay connected to the work." />
          <Feature title="Controlled execution" text="Prepare actions quickly while keeping high-consequence decisions behind human approval." />
          <Feature title="Proof over promises" text="Use measurable pilots and a public proof scoreboard instead of vague AI claims." />
        </div>
        <div style={{marginTop:22}}><Link href="/business-os/proof" style={outline}>View the Public Proof Scoreboard</Link></div>
      </div>
    </section>

    <section id="pricing" style={{background:'#F4F1E9',color:'#171717',padding:'70px 20px'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <div style={{fontSize:12,fontWeight:950}}>FOUNDING CONTINUATION</div>
        <h2 style={{fontSize:'clamp(40px,6vw,62px)',lineHeight:1,margin:'10px 0 18px'}}>One simple paid next step.</h2>
        <div style={{background:'#fff',border:'1px solid #D4CEC2',borderRadius:20,padding:26}}>
          <div><strong style={{fontSize:58}}>$497</strong><span style={{fontSize:18}}> / month</span></div>
          <p style={{fontSize:18,lineHeight:1.65,color:'#5D5A54'}}>Continue with Aridon when the analysis, demo or pilot shows enough value to justify keeping the executive operating system working for your business.</p>
          <ul style={{lineHeight:1.9,color:'#3F3C37'}}><li>Executive analysis and decision support</li><li>Growth and revenue-recovery tools</li><li>Projects, tasks and company context</li><li>Owner-approved execution path</li><li>Cancel anytime</li></ul>
          <Link href="/business-os/revenue-recovery" style={{...button,display:'inline-block'}}>See the Pilot & $497 Continuation</Link>
          <p style={{fontSize:12,color:'#777067',marginTop:12}}>No revenue guarantee. Starting a paid subscription is an explicit owner decision.</p>
        </div>
      </div>
    </section>

    <footer style={{padding:'28px 20px',borderTop:'1px solid #22324A',color:'#8FA0B8'}}><div style={{maxWidth:1100,margin:'0 auto',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><strong style={{color:'#fff'}}>ARIDON</strong><span>Analyze → Decide → Approve → Execute → Measure</span></div></footer>
    <style>{`@media(max-width:820px){.hero,.steps,.features{grid-template-columns:1fr !important}}`}</style>
  </main>;
}

function Step({n,title,text}:{n:string;title:string;text:string}){return <article style={{background:'#fff',border:'1px solid #D4CEC2',borderRadius:16,padding:20}}><div style={{fontSize:12,fontWeight:950,color:'#6B665E'}}>{n}</div><h3 style={{fontSize:25,margin:'8px 0'}}>{title}</h3><p style={{color:'#5D5A54',lineHeight:1.6,margin:0}}>{text}</p></article>}
function Feature({title,text}:{title:string;text:string}){return <article style={{background:'#0D1728',border:'1px solid #2A3A57',borderRadius:16,padding:20}}><h3 style={{margin:'0 0 8px'}}>{title}</h3><p style={{color:'#AEBBD0',lineHeight:1.6,margin:0}}>{text}</p></article>}
const nav={color:'#DCE4EF',textDecoration:'none',fontWeight:800,fontSize:13} as const;
const smallButton={background:mint,color:'#07130F',textDecoration:'none',fontWeight:950,padding:'10px 13px',borderRadius:10,fontSize:13} as const;
const button={background:mint,color:'#07130F',textDecoration:'none',fontWeight:950,padding:'14px 18px',borderRadius:12,textAlign:'center' as const};
const outline={border:'1px solid #51617A',color:'#fff',textDecoration:'none',fontWeight:900,padding:'13px 17px',borderRadius:12,textAlign:'center' as const};
