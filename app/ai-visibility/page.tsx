'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Eye, FileSearch, Gauge, Loader2, Search, ShieldCheck, Sparkles, Target, TrendingUp, Wrench } from 'lucide-react';

type Scan = {
  generatedAt: string;
  runId: string | null;
  competitiveMetricLabel: string;
  nextMeasurement: string;
  competitorErrors: Array<{ website: string; error: string }>;
  history: Array<{ created_at: string; overall_score: number; citation_readiness: number; answer_coverage: number }>;
  site: {
    website: string;
    brandName: string;
    scores: { overall: number; searchReadiness: number; aiReadiness: number; citationReadiness: number; answerCoverage: number };
    prompts: Array<{ prompt: string; intent: string; covered: boolean; evidence: string }>;
    citationSignals: Array<{ label: string; status: 'strong' | 'partial' | 'missing'; detail: string }>;
    fixQueue: Array<{ id: string; title: string; why: string; impact: string; approvalRequired: boolean; status: string }>;
    sourcePages: Array<{ url: string; title: string; score: number }>;
    providerStates: Array<{ name: string; status: string; detail: string }>;
    caveat: string;
  };
  competitors: Array<{ website: string; brandName: string; overall: number; aiReadiness: number; citationReadiness: number; answerCoverage: number; readinessShare: number }>;
};

type FixPackage = {
  title: string;
  goal: string;
  implementation: string[];
  draft: { suggestedTitle: string; suggestedMetaDescription: string; faqSeeds: string[] };
  successMetrics: string[];
  approvalRequired: boolean;
  publicationStatus: string;
};

const card = { background:'#0d1728', border:'1px solid #293b58', borderRadius:18, padding:18 } as const;
const metric = { ...card, minHeight:132 } as const;

function Score({ label, value, note }: { label: string; value: number; note: string }) {
  return <div style={metric}><div style={{ color:'#9fb0c8', fontSize:11, fontWeight:950, letterSpacing:.8 }}>{label.toUpperCase()}</div><div style={{ fontSize:42, fontWeight:950, marginTop:4 }}>{value}</div><div style={{ color:'#a9b7ca', fontSize:12, lineHeight:1.45 }}>{note}</div></div>;
}

export default function AIVisibilityPage() {
  const [website, setWebsite] = useState('');
  const [competitors, setCompetitors] = useState(['', '', '']);
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fixLoading, setFixLoading] = useState('');
  const [fixPackage, setFixPackage] = useState<FixPackage | null>(null);

  const previous = useMemo(() => scan?.history?.[0] || null, [scan]);
  const delta = previous && scan ? scan.site.scores.overall - Number(previous.overall_score || 0) : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setScan(null);
    setFixPackage(null);
    try {
      const response = await fetch('/api/ai-visibility', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ website, competitors: competitors.filter((item) => item.trim()) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Aridon could not complete that scan.');
      setScan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aridon could not complete that scan.');
    } finally { setLoading(false); }
  }

  async function prepareFix(action: Scan['site']['fixQueue'][number]) {
    if (!scan) return;
    setFixLoading(action.id);
    setFixPackage(null);
    try {
      const response = await fetch('/api/ai-visibility/fix', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          website: scan.site.website,
          brandName: scan.site.brandName,
          action: action.title,
          why: action.why,
          evidence: [
            ...scan.site.prompts.map((item) => `${item.prompt}: ${item.evidence}`),
            ...scan.site.citationSignals.map((item) => `${item.label}: ${item.status} - ${item.detail}`),
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not prepare that fix.');
      setFixPackage(data.package);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not prepare that fix.'); }
    finally { setFixLoading(''); }
  }

  return <main style={{ minHeight:'100vh', background:'#07101d', color:'#f8fafc', fontFamily:'Arial,sans-serif' }}>
    <section style={{ maxWidth:1180, margin:'0 auto', padding:'24px 20px 80px' }}>
      <nav style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <Link href="/" style={{ color:'#f8fafc', textDecoration:'none', fontWeight:950 }}>ARIDON</Link>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Link href="/site-indexing" style={{ color:'#e8edf5', textDecoration:'none', border:'1px solid #40516d', padding:'9px 12px', borderRadius:10, fontWeight:850 }}>Index Engine</Link>
          <Link href="/analyze-business" style={{ color:'#07130f', textDecoration:'none', background:'#9ef0cf', padding:'10px 13px', borderRadius:10, fontWeight:950 }}>Analyze Business</Link>
        </div>
      </nav>

      <div style={{ maxWidth:950, paddingTop:58 }}>
        <div style={{ color:'#9ef0cf', fontSize:12, fontWeight:950, letterSpacing:1 }}>ARIDON · AI VISIBILITY CENTER</div>
        <h1 style={{ fontSize:'clamp(48px,7vw,82px)', lineHeight:.95, letterSpacing:-3, margin:'14px 0 18px' }}>Can ChatGPT find your business?</h1>
        <p style={{ color:'#b8c4d5', lineHeight:1.65, fontSize:19, maxWidth:900 }}>See whether your website is structured to become an answer and citation source, which buyer prompts it can support, where competitors are better prepared, and the exact fixes Aridon should prepare next.</p>
      </div>

      <form onSubmit={submit} style={{ ...card, marginTop:26, display:'grid', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) auto', gap:10 }} className="scan-row">
          <input value={website} onChange={(e)=>setWebsite(e.target.value)} placeholder="https://yourbusiness.com" required aria-label="Business website" style={{ width:'100%', boxSizing:'border-box', background:'#07101d', color:'#fff', border:'1px solid #42526e', borderRadius:11, padding:'15px', fontSize:17 }} />
          <button disabled={loading} style={{ border:0, borderRadius:11, background:'#9ef0cf', color:'#07130f', padding:'14px 18px', fontWeight:950, fontSize:16, cursor:loading?'wait':'pointer', opacity:loading?.72:1 }}>
            {loading ? <><Loader2 size={17} style={{ verticalAlign:'middle', marginRight:6 }} />Scanning…</> : <>Run Free AI Visibility Scan <ArrowRight size={17} style={{ verticalAlign:'middle', marginLeft:5 }}/></>}
          </button>
        </div>
        <div>
          <div style={{ color:'#9fb0c8', fontSize:12, fontWeight:900, marginBottom:7 }}>OPTIONAL COMPETITORS · UP TO 3</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>
            {competitors.map((value,index)=><input key={index} value={value} onChange={(e)=>setCompetitors((current)=>current.map((item,i)=>i===index?e.target.value:item))} placeholder={`Competitor ${index+1} website`} style={{ width:'100%', boxSizing:'border-box', background:'#07101d', color:'#fff', border:'1px solid #34445f', borderRadius:10, padding:'12px 13px' }} />)}
          </div>
        </div>
        <div style={{ color:'#8291a8', fontSize:11, lineHeight:1.45 }}>The free scan measures public-site readiness. It does not fabricate live mentions or citations from third-party AI products.</div>
      </form>

      {error && <div style={{ marginTop:14, padding:14, borderRadius:12, background:'#3a1620', border:'1px solid #7c3343', color:'#ffd7df' }}>{error}</div>}

      {!scan && !loading && <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:12, marginTop:22 }}>
        {[
          [Eye,'AI Presence','Separate what Aridon can verify from what still needs live provider observation.'],
          [Target,'Prompt Intelligence','Map buyer questions to pages that can actually answer them.'],
          [FileSearch,'Citation Intelligence','Find the proof, entity, metadata and crawl gaps that weaken citations.'],
          [TrendingUp,'Competitor Readiness','Compare up to three competitors without pretending a proxy is live share-of-voice.'],
          [Wrench,'Fix It','Turn findings into owner-approved page, FAQ, proof and crawl fixes.'],
          [Gauge,'Measure It','Save each run and compare visibility readiness over time.'],
        ].map(([Icon,title,text]:any)=><article key={title} style={card}><Icon size={25} color="#9ef0cf"/><h3 style={{ fontSize:21, margin:'10px 0 6px' }}>{title}</h3><p style={{ color:'#aebbd0', lineHeight:1.5, margin:0 }}>{text}</p></article>)}
      </section>}

      {scan && <div style={{ marginTop:24, display:'grid', gap:16 }}>
        <section style={{ ...card, background:'#102033' }}>
          <div style={{ color:'#9ef0cf', fontSize:11, fontWeight:950 }}>AI VISIBILITY SNAPSHOT</div>
          <div style={{ display:'flex', justifyContent:'space-between', gap:18, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div><h2 style={{ margin:'8px 0 4px', fontSize:34 }}>{scan.site.brandName}</h2><div style={{ color:'#aebbd0', overflowWrap:'anywhere' }}>{scan.site.website}</div></div>
            {delta !== null && <div style={{ fontWeight:950, color:delta>=0?'#9ef0cf':'#ffb4c0' }}>{delta>=0?'+':''}{delta} points vs last saved scan</div>}
          </div>
        </section>

        <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:10 }}>
          <Score label="Overall" value={scan.site.scores.overall} note="Combined discoverability and answer readiness" />
          <Score label="AI Readiness" value={scan.site.scores.aiReadiness} note="Structured content and knowledge depth" />
          <Score label="Citation Readiness" value={scan.site.scores.citationReadiness} note="Identity, proof, metadata, crawl signals" />
          <Score label="Answer Coverage" value={scan.site.scores.answerCoverage} note="How well the site answers buyer questions" />
          <Score label="Search Readiness" value={scan.site.scores.searchReadiness} note="Indexing and internal discovery fundamentals" />
        </section>

        <section className="two-col" style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:14 }}>
          <article style={card}>
            <div style={{ display:'flex', gap:8, alignItems:'center', color:'#b9cfff', fontWeight:950, fontSize:12 }}><Bot size={19}/> AI PRESENCE / OBSERVATION STATUS</div>
            <div style={{ display:'grid', gap:10, marginTop:13 }}>{scan.site.providerStates.map((item)=><div key={item.name} style={{ borderTop:'1px solid #263650', paddingTop:10 }}><div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}><strong>{item.name}</strong><span style={{ color:item.status.includes('connect')?'#f4d06f':'#9ef0cf', fontSize:11, fontWeight:950 }}>{item.status.toUpperCase()}</span></div><div style={{ color:'#aebbd0', fontSize:12, lineHeight:1.5, marginTop:4 }}>{item.detail}</div></div>)}</div>
          </article>

          <article style={card}>
            <div style={{ display:'flex', gap:8, alignItems:'center', color:'#9ef0cf', fontWeight:950, fontSize:12 }}><Target size={19}/> PROMPT INTELLIGENCE</div>
            <div style={{ display:'grid', gap:10, marginTop:13 }}>{scan.site.prompts.map((item)=><div key={item.prompt} style={{ borderTop:'1px solid #263650', paddingTop:10 }}><div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>{item.covered?<CheckCircle2 size={17} color="#9ef0cf"/>:<Search size={17} color="#f4d06f"/>}<strong>{item.prompt}</strong></div><div style={{ color:'#aebbd0', fontSize:12, lineHeight:1.45, marginTop:4 }}>{item.evidence}</div></div>)}</div>
          </article>
        </section>

        <section style={card}>
          <div style={{ color:'#9ef0cf', fontWeight:950, fontSize:12 }}>CITATION INTELLIGENCE</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:10, marginTop:12 }}>{scan.site.citationSignals.map((item)=><div key={item.label} style={{ border:'1px solid #263650', borderRadius:13, padding:13 }}><div style={{ fontSize:11, fontWeight:950, color:item.status==='strong'?'#9ef0cf':item.status==='partial'?'#f4d06f':'#ffb4c0' }}>{item.status.toUpperCase()}</div><strong style={{ display:'block', margin:'5px 0' }}>{item.label}</strong><div style={{ color:'#aebbd0', fontSize:12, lineHeight:1.45 }}>{item.detail}</div></div>)}</div>
        </section>

        {scan.competitors.length > 1 && <section style={card}>
          <div style={{ color:'#b9cfff', fontWeight:950, fontSize:12 }}>COMPETITOR VISIBILITY</div>
          <h2 style={{ margin:'7px 0 4px', fontSize:27 }}>Who is better prepared to be found and cited?</h2>
          <div style={{ color:'#8fa0b8', fontSize:11, marginBottom:12 }}>{scan.competitiveMetricLabel}</div>
          <div style={{ display:'grid', gap:8 }}>{scan.competitors.map((item,index)=><div key={item.website} style={{ display:'grid', gridTemplateColumns:'minmax(160px,1.5fr) repeat(4,minmax(70px,.5fr))', gap:8, padding:'11px 0', borderTop:'1px solid #263650', alignItems:'center' }} className="competitor-row"><div><strong>{index===0?'YOU · ':''}{item.brandName}</strong><div style={{ color:'#8291a8', fontSize:11, overflowWrap:'anywhere' }}>{item.website}</div></div><div><b>{item.overall}</b><div style={{ fontSize:10, color:'#8291a8' }}>overall</div></div><div><b>{item.citationReadiness}</b><div style={{ fontSize:10, color:'#8291a8' }}>citation</div></div><div><b>{item.answerCoverage}</b><div style={{ fontSize:10, color:'#8291a8' }}>answers</div></div><div><b>{item.readinessShare}%</b><div style={{ fontSize:10, color:'#8291a8' }}>proxy share</div></div></div>)}</div>
        </section>}

        <section style={{ ...card, background:'linear-gradient(135deg,#10261f,#102033)', borderColor:'#3c6b59' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', color:'#9ef0cf', fontWeight:950, fontSize:12 }}><Wrench size={19}/> FIX IT · OWNER-APPROVED QUEUE</div>
          <h2 style={{ fontSize:30, margin:'8px 0 12px' }}>Aridon found the next five moves.</h2>
          <div style={{ display:'grid', gap:9 }}>{scan.site.fixQueue.map((action,index)=><div key={action.id} style={{ borderTop:'1px solid #315144', paddingTop:11, display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center' }} className="fix-row"><div><strong>{index+1}. {action.title}</strong><div style={{ color:'#bfd0c6', fontSize:12, lineHeight:1.5, marginTop:4 }}>{action.why}</div><div style={{ marginTop:5, fontSize:10, fontWeight:950, color:action.impact==='high'?'#9ef0cf':'#b9cfff' }}>{action.impact.toUpperCase()} IMPACT · {action.approvalRequired?'OWNER APPROVAL BEFORE PUBLISHING':'MEASUREMENT ACTION'}</div></div><button onClick={()=>prepareFix(action)} disabled={fixLoading===action.id} style={{ border:'1px solid #6ca98c', background:'#163d31', color:'#fff', borderRadius:10, padding:'10px 12px', fontWeight:900, cursor:'pointer' }}>{fixLoading===action.id?'Preparing…':'Prepare Fix'}</button></div>)}</div>
        </section>

        {fixPackage && <section style={{ ...card, borderColor:'#6ca98c' }}>
          <div style={{ color:'#9ef0cf', fontSize:11, fontWeight:950 }}>DRAFT FIX PACKAGE · NOT PUBLISHED</div>
          <h2 style={{ fontSize:28, margin:'8px 0 6px' }}>{fixPackage.title}</h2>
          <p style={{ color:'#c8d2df', lineHeight:1.6 }}>{fixPackage.goal}</p>
          <div className="two-col" style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:14 }}>
            <div><strong>Implementation</strong><ol style={{ color:'#c4cfdd', lineHeight:1.55, paddingLeft:20 }}>{fixPackage.implementation.map((item)=><li key={item} style={{ marginTop:7 }}>{item}</li>)}</ol></div>
            <div><strong>Draft content seeds</strong><div style={{ marginTop:9, color:'#c4cfdd', lineHeight:1.5 }}><b>Title:</b> {fixPackage.draft.suggestedTitle}<br/><br/><b>Description:</b> {fixPackage.draft.suggestedMetaDescription}<br/><br/><b>FAQ:</b><ul>{fixPackage.draft.faqSeeds.map((item)=><li key={item}>{item}</li>)}</ul></div></div>
          </div>
          <div style={{ marginTop:10, borderTop:'1px solid #315144', paddingTop:10, color:'#9ef0cf', fontWeight:900 }}><ShieldCheck size={16} style={{ verticalAlign:'middle', marginRight:5 }}/> Owner approval remains required before production publishing or material website edits.</div>
        </section>}

        <section style={card}>
          <div style={{ display:'flex', gap:8, alignItems:'center', color:'#b9cfff', fontWeight:950, fontSize:12 }}><Gauge size={19}/> MEASURE IT</div>
          <h2 style={{ fontSize:28, margin:'8px 0 6px' }}>Did the fixes actually move anything?</h2>
          <p style={{ color:'#aebbd0', lineHeight:1.55, marginTop:0 }}>{scan.nextMeasurement}</p>
          {scan.history.length ? <div style={{ display:'grid', gap:6, marginTop:12 }}>{scan.history.map((item)=><div key={item.created_at} style={{ borderTop:'1px solid #263650', paddingTop:8, display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', color:'#c4cfdd' }}><span>{new Date(item.created_at).toLocaleString()}</span><span>Overall <b>{item.overall_score}</b> · Citation <b>{item.citation_readiness}</b> · Answers <b>{item.answer_coverage}</b></span></div>)}</div> : <div style={{ color:'#8291a8' }}>This is the first saved scan for this exact canonical URL.</div>}
        </section>

        <section style={{ ...card, background:'#111c30' }}>
          <div style={{ color:'#9ef0cf', fontWeight:950, fontSize:12 }}>STANDALONE REVENUE FRONT DOOR</div>
          <h2 style={{ fontSize:31, margin:'8px 0 8px' }}>Start with visibility. Grow into Aridon.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
            <div style={{ border:'1px solid #2c405d', borderRadius:13, padding:14 }}><strong>Free</strong><div style={{ fontSize:28, fontWeight:950, margin:'4px 0' }}>$0</div><div style={{ color:'#aebbd0', fontSize:13 }}>One AI Visibility Scan + prioritized fixes.</div></div>
            <div style={{ border:'1px solid #3d6f5d', borderRadius:13, padding:14 }}><strong>AI Visibility Monitor</strong><div style={{ fontSize:28, fontWeight:950, margin:'4px 0' }}>$149/mo</div><div style={{ color:'#aebbd0', fontSize:13 }}>Recurring scans, change tracking, fix queue, prompt/citation monitoring workflow.</div></div>
            <div style={{ border:'1px solid #53678a', borderRadius:13, padding:14 }}><strong>Aridon Business OS</strong><div style={{ fontSize:28, fontWeight:950, margin:'4px 0' }}>Full system</div><div style={{ color:'#aebbd0', fontSize:13 }}>Visibility → lead → follow-up → proposal → owner approval → revenue measurement.</div></div>
          </div>
        </section>

        <div style={{ color:'#8291a8', fontSize:11, lineHeight:1.5 }}>{scan.site.caveat}</div>
      </div>}
    </section>

    <style>{`@media(max-width:760px){.scan-row,.two-col,.competitor-row,.fix-row{grid-template-columns:1fr !important}}`}</style>
  </main>;
}
