import Link from 'next/link';
import { ArrowRight, BarChart3, Brain, CheckCircle2, ClipboardList, FileText, Gauge, Layers3, Lightbulb, LockKeyhole, MessageSquareText, Network, ShieldCheck, Sparkles, Target, Users, Zap } from 'lucide-react';

const pulse = [
  ['AI value', 'Where is AI already producing measurable value?'],
  ['Implementation friction', 'Where are pilots, data, procurement or adoption getting stuck?'],
  ['Morale + workload', 'Is AI reducing burden, shifting it, or creating anxiety and rework?'],
  ['Access + training', 'Who has access to tools, coaching and safe experimentation?'],
  ['Culture + leadership', 'Which leadership practices are helping teams move forward?'],
];

const liveFlow = [
  ['1', 'Private leadership pulse', 'Before the event, attendees answer a short confidential pulse so facilitators know which issues deserve room time.', ClipboardList],
  ['2', 'Peer exchange rooms', 'Participants discuss practical wins, blockers, workforce effects and leadership practices rather than sitting through long presentations.', Users],
  ['3', 'Anonymous capture', 'Aridon captures themes without attaching comments to a person or organization unless they explicitly opt in.', LockKeyhole],
  ['4', 'Pattern engine', 'AI clusters recurring issues, contradictions, emerging practices and unanswered questions across both rooms.', Brain],
  ['5', 'Human review gate', 'Forum leaders review every theme, quote and conclusion before anything becomes part of an external briefing.', ShieldCheck],
  ['6', 'Executive briefing', 'The approved output becomes an anonymized briefing with patterns, practical ideas, leadership wisdom and recommended next experiments.', FileText],
];

const themes = [
  {title:'Where AI is creating value', score:'72%', note:'Document analysis, forecasting, internal knowledge and repetitive workflow reduction', icon:Zap},
  {title:'Where implementation gets stuck', score:'61%', note:'Data quality, unclear ownership, procurement, integration and trust', icon:Layers3},
  {title:'Workforce pressure', score:'54%', note:'Concern around expectations, workload redistribution, role clarity and pace of change', icon:Gauge},
  {title:'Unequal access', score:'47%', note:'Different teams receive different tools, training, permissions and executive sponsorship', icon:Network},
];

const outputs = [
  ['Executive Pattern Brief', 'An anonymized post-Forum synthesis: what leaders are seeing, what is working, what is failing and what deserves further testing.', FileText],
  ['90-Day Leadership Action Board', 'Turn the best ideas into owners, experiments, dates, risks and measurable outcomes instead of letting them disappear after the event.', Target],
  ['Clean Energy AI Benchmark', 'Build a recurring benchmark across utilities, developers, manufacturers, finance, services and nonprofits without exposing company-specific responses.', BarChart3],
  ['Peer Learning Network', 'With explicit opt-in, connect leaders facing the same implementation problem so the Forum becomes an ongoing learning network.', Network],
];

const safeguards = [
  'Anonymous by default for discussion capture',
  'No company attribution without explicit opt-in',
  'Human approval before publishing synthesized findings',
  'Separate raw notes from public briefing content',
  'Role-based access for facilitators and event leaders',
  'Configurable retention and deletion policy',
  'AI findings shown with evidence/confidence, not presented as fact by default',
  'No automated employment or personnel decisions',
];

export default function CleanEnergyLeadershipOS(){
  return <main style={{minHeight:'100vh',background:'#f5f4ef',color:'#17202a',fontFamily:'Arial,sans-serif',paddingBottom:80}}>
    <header style={{background:'linear-gradient(135deg,#111b2e,#263c66 58%,#7d275a)',color:'#fff',padding:'22px 20px 56px'}}>
      <div style={{maxWidth:1180,margin:'auto'}}>
        <nav style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}>
          <Link href="/business-os" style={{color:'#fff',textDecoration:'none',fontWeight:950,letterSpacing:1}}>ARIDON · EXECUTIVE OS</Link>
          <span style={{background:'#f1b9d5',color:'#4e1237',padding:'8px 12px',borderRadius:999,fontSize:11,fontWeight:950}}>SHAREABLE CONCEPT PROTOTYPE</span>
        </nav>
        <div style={{maxWidth:930,paddingTop:52}}>
          <div style={{color:'#f1b9d5',fontSize:12,fontWeight:950,letterSpacing:1.2}}>AI LEADERSHIP + CLEAN ENERGY</div>
          <h1 style={{fontSize:'clamp(46px,7.5vw,80px)',lineHeight:.96,letterSpacing:-3,margin:'12px 0 20px'}}>Turn a leadership forum into a living operating system.</h1>
          <p style={{fontSize:20,lineHeight:1.65,color:'#dce4f1',maxWidth:880}}>Aridon helps a peer-learning event capture what leaders are actually encountering, protect confidentiality, identify useful patterns, convert ideas into 90-day experiments and produce an anonymized executive briefing that extends the value far beyond the room.</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:26}}><a href="#flow" style={primary}>See the Forum Workflow <ArrowRight size={18}/></a><a href="#brief" style={secondary}>View the Executive Brief Model</a></div>
        </div>
      </div>
    </header>

    <section style={{maxWidth:1180,margin:'-22px auto 0',padding:'0 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
      <Metric title="Forum model" value="Peer-first" sub="Conversation over presentation" icon={MessageSquareText}/>
      <Metric title="Capture" value="Anonymous" sub="Attribution only by opt-in" icon={LockKeyhole}/>
      <Metric title="Output" value="Executive brief" sub="Patterns + practical ideas" icon={FileText}/>
      <Metric title="Follow-through" value="90 days" sub="Experiments + owners + outcomes" icon={Target}/>
    </section>

    <section style={{maxWidth:1180,margin:'24px auto 0',padding:'0 20px',display:'grid',gridTemplateColumns:'minmax(0,1.15fr) minmax(300px,.85fr)',gap:14}}>
      <article style={card}>
        <div style={eyebrow}>PRE-FORUM AI LEADERSHIP PULSE</div>
        <h2 style={h2}>Know what the room needs before the room begins.</h2>
        <p style={body}>A five-minute confidential pulse gives facilitators a live picture of value, friction, morale, workload, access, training and culture before the first conversation starts.</p>
        <div style={{display:'grid',gap:10,marginTop:18}}>{pulse.map(([title,text],i)=><div key={title} style={{display:'grid',gridTemplateColumns:'34px 1fr',gap:10,background:'#f7f6f2',borderRadius:13,padding:13}}><div style={{width:32,height:32,borderRadius:999,display:'grid',placeItems:'center',background:'#e8c0d7',color:'#5a1740',fontWeight:950}}>{i+1}</div><div><strong>{title}</strong><div style={{fontSize:13,color:'#657080',lineHeight:1.5,marginTop:3}}>{text}</div></div></div>)}</div>
      </article>
      <aside style={{background:'#151f33',color:'#fff',borderRadius:20,padding:22}}>
        <div style={{display:'flex',gap:9,alignItems:'center',color:'#f1b9d5',fontWeight:950,fontSize:12}}><Sparkles size={21}/> FACILITATOR BRIEF</div>
        <h2 style={{fontSize:30,margin:'10px 0 14px'}}>“Here is what deserves room time.”</h2>
        {['Two themes with strong agreement','One issue splitting leaders sharply','Three implementation blockers repeated across sectors','One workforce concern requiring care','Four practical examples worth inviting into discussion'].map((x,i)=><div key={x} style={{padding:'11px 0',borderTop:i?'1px solid #33405a':0,color:'#dce4f1',lineHeight:1.5}}>{x}</div>)}
      </aside>
    </section>

    <section id="flow" style={{maxWidth:1180,margin:'26px auto 0',padding:'0 20px'}}>
      <div style={{maxWidth:850}}><div style={eyebrow}>THE FORUM OPERATING LOOP</div><h2 style={h2}>Capture the wisdom without turning the event into surveillance.</h2><p style={body}>The system is deliberately designed around confidentiality, human facilitation and explicit publishing controls.</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12,marginTop:20}}>{liveFlow.map(([num,title,text,Icon]:any)=><article key={title} style={card}><div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><div style={{width:36,height:36,borderRadius:10,background:'#8e2f66',color:'#fff',display:'grid',placeItems:'center',fontWeight:950}}>{num}</div><Icon color="#8e2f66"/></div><h3 style={{fontSize:22,margin:'12px 0 7px'}}>{title}</h3><p style={{...body,fontSize:14,margin:0}}>{text}</p></article>)}</div>
    </section>

    <section style={{background:'#151f33',color:'#fff',padding:'72px 20px',marginTop:62}}>
      <div style={{maxWidth:1180,margin:'auto'}}>
        <div style={{maxWidth:850}}><div style={{...eyebrow,color:'#f1b9d5'}}>LIVE PATTERN BOARD · EXAMPLE DATA</div><h2 style={{...h2,color:'#fff'}}>See the room without exposing the people in it.</h2><p style={{...body,color:'#bbc8da'}}>Illustrative scores show how Aridon could summarize anonymized themes during or after the Forum. Real data would only appear after the event host approves the survey design and privacy rules.</p></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,marginTop:22}}>{themes.map(({title,score,note,icon:Icon})=><article key={title} style={{background:'#202c43',border:'1px solid #3a4964',borderRadius:17,padding:19}}><Icon color="#f1b9d5"/><div style={{fontSize:30,fontWeight:950,marginTop:10}}>{score}</div><h3 style={{fontSize:20,margin:'5px 0 7px'}}>{title}</h3><p style={{margin:0,color:'#c2ccdb',lineHeight:1.5,fontSize:13}}>{note}</p></article>)}</div>
      </div>
    </section>

    <section id="brief" style={{maxWidth:1180,margin:'0 auto',padding:'72px 20px'}}>
      <div style={{maxWidth:860}}><div style={eyebrow}>AFTER THE FORUM</div><h2 style={h2}>The event ends. The learning does not.</h2><p style={body}>The strongest output is not a transcript. It is a reviewed, anonymized operating brief that leaders can use Monday morning.</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:12,marginTop:22}}>{outputs.map(([title,text,Icon]:any)=><article key={title} style={card}><Icon color="#8e2f66"/><h3 style={{fontSize:23,margin:'11px 0 7px'}}>{title}</h3><p style={{...body,fontSize:14,margin:0}}>{text}</p></article>)}</div>
    </section>

    <section style={{background:'#e9e3ee',padding:'64px 20px'}}><div style={{maxWidth:1180,margin:'auto',display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(300px,.8fr)',gap:16,alignItems:'start'}}>
      <article><div style={eyebrow}>EXECUTIVE BRIEF STRUCTURE</div><h2 style={h2}>One document leaders will actually read.</h2><div style={{display:'grid',gap:9,marginTop:18}}>{['1. Five patterns leaders are seeing now','2. Where AI is producing practical value','3. Where implementation is getting stuck','4. Morale, workload, access and training signals','5. Leadership practices associated with progress','6. Important disagreements and unresolved questions','7. Ten practical experiments worth testing','8. 90-day follow-up questions for the community'].map(x=><div key={x} style={{background:'#fff',borderRadius:12,padding:'12px 14px',fontWeight:850}}>{x}</div>)}</div></article>
      <aside style={{background:'#fff',borderRadius:20,padding:22,border:'1px solid #d4c7dc'}}><div style={{display:'flex',gap:8,alignItems:'center',color:'#8e2f66',fontWeight:950,fontSize:12}}><Lightbulb/> WHAT MAKES THIS DIFFERENT</div><h3 style={{fontSize:28,margin:'10px 0'}}>The system looks for operating patterns, not quotable sound bites.</h3><p style={body}>Instead of producing a polished recap that says everyone had a great conversation, Aridon preserves disagreement, implementation friction, confidence levels and the conditions under which an idea actually worked.</p></aside>
    </div></section>

    <section style={{maxWidth:1180,margin:'0 auto',padding:'68px 20px'}}><div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(300px,.8fr)',gap:16}}>
      <article style={card}><div style={{display:'flex',gap:9,alignItems:'center',color:'#8e2f66',fontSize:12,fontWeight:950}}><ShieldCheck/> TRUST + GOVERNANCE</div><h2 style={h2}>Trust is part of the product.</h2><div style={{display:'grid',gap:10,marginTop:18}}>{safeguards.map(x=><div key={x} style={{display:'flex',gap:9,alignItems:'flex-start'}}><CheckCircle2 size={19} color="#8e2f66"/><span style={{lineHeight:1.45}}>{x}</span></div>)}</div></article>
      <aside style={{background:'#8e2f66',color:'#fff',borderRadius:20,padding:24}}><div style={{color:'#f8d7e8',fontSize:12,fontWeight:950}}>PILOT PROPOSAL</div><h2 style={{fontSize:34,margin:'8px 0 10px'}}>Run it with one Forum first.</h2><p style={{color:'#fdeef6',lineHeight:1.65}}>Start with the leadership pulse, two facilitated rooms, anonymized capture and one reviewed executive briefing. Measure participant usefulness, trust, signal quality and whether the post-event actions are still being used 30 and 90 days later.</p><div style={{marginTop:18,paddingTop:16,borderTop:'1px solid rgba(255,255,255,.25)',fontSize:13,lineHeight:1.6}}>Designed to complement human facilitators and event leaders, not replace them.</div></aside>
    </div></section>

    <section style={{maxWidth:1180,margin:'0 auto',padding:'0 20px'}}><div style={{background:'#fff',border:'1px solid #d8d2c8',borderRadius:18,padding:20,color:'#667080',lineHeight:1.55}}><strong style={{color:'#17202a'}}>Concept status:</strong> This is an Aridon prototype inspired by the leadership-forum use case shown to us. It is not affiliated with, endorsed by, or an official product of WRISE or the individuals shown in the source post. Any live deployment should be co-designed with the event host, including consent, retention and publishing rules.</div></section>
  </main>
}

const card:any={background:'#fff',border:'1px solid #d9d7d0',borderRadius:20,padding:22,boxShadow:'0 8px 24px rgba(20,30,40,.04)'};
const eyebrow:any={color:'#8e2f66',fontSize:12,fontWeight:950,letterSpacing:.8};
const h2:any={fontSize:'clamp(32px,4.8vw,50px)',lineHeight:1.03,letterSpacing:-1.4,margin:'8px 0 12px'};
const body:any={color:'#657080',lineHeight:1.62};
const primary:any={display:'inline-flex',gap:8,alignItems:'center',background:'#f1b9d5',color:'#41132f',textDecoration:'none',padding:'14px 17px',borderRadius:12,fontWeight:950};
const secondary:any={display:'inline-flex',gap:8,alignItems:'center',border:'1px solid #6e7890',color:'#fff',textDecoration:'none',padding:'14px 17px',borderRadius:12,fontWeight:900};
function Metric({title,value,sub,icon:Icon}:any){return <div style={{background:'#fff',border:'1px solid #d9d7d0',borderRadius:17,padding:18,boxShadow:'0 8px 24px rgba(20,30,40,.05)'}}><Icon color="#8e2f66"/><div style={{fontSize:12,color:'#6d7580',fontWeight:900,marginTop:9}}>{title}</div><div style={{fontSize:28,fontWeight:950,marginTop:3}}>{value}</div><div style={{fontSize:12,color:'#7a828d',marginTop:4}}>{sub}</div></div>}
