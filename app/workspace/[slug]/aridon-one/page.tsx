'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Provider = { provider: string; label: string; model: string; enabled: boolean; specialty: string };
type Memory = { id: string; executive_id: string; memory_type: string; summary: string; confidence: number | string; source: string; last_reinforced_at: string };
type Outcome = { id: string; name: string; status: string; baseline_value?: number | null; current_value?: number | null; target_value?: number | null; unit?: string | null; notes?: string | null; updated_at: string };
type Worker = { id: string; executive: string; name: string; objective: string; status: string; provider: string; cycle_count: number; max_cycles: number; next_run_at?: string | null; result?: any; error?: string | null; updated_at: string };
type Receipt = { id: string; runId: string; objective: string; state: string; issuedAt: string; totals: { actions: number; completed: number; verified: number; pendingApproval: number; failed: number }; proof: Array<{ kind: string; verified: boolean; label: string; evidence: any }> };
type Metrics = { activeOutcomes: number; activeWorkers: number; councilRuns: number; verifiedReceipts: number; awaitingApproval: number; memoryItems: number };
type Data = { businessName: string; slug: string; router: { mode: string; providers: Provider[]; routes: Array<{ task: string; preferred: string; fallback: string }> }; memory: { memories: Memory[]; reflections: Array<{ id: string; reflection: string; confidence: number | string; created_at: string }> }; outcomes: Outcome[]; workers: Worker[]; receipts: Receipt[]; metrics: Metrics };
type CouncilResult = { synthesis: string; members: Array<{ seat: string; purpose: string; provider: string; model: string; answer: string }>; sources: Array<{ title: string; url: string }> };

export default function AridonOnePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<'council' | 'outcome' | ''>('');
  const [councilObjective, setCouncilObjective] = useState('');
  const [council, setCouncil] = useState<CouncilResult | null>(null);
  const [outcome, setOutcome] = useState({ name: '', objective: '', successDefinition: '', unit: '', baseline: '', target: '', priority: 'high' });

  async function load(access = token) {
    if (!access) return;
    setError('');
    const response = await fetch(`/api/customer/aridon-one?slug=${encodeURIComponent(params.slug)}`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.error || 'Aridon One could not load.'); return; }
    setData(result);
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data: sessionData }) => {
      const access = sessionData.session?.access_token || '';
      if (!access) {
        router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/aridon-one`)}`);
        return;
      }
      setToken(access);
      void load(access);
    });
  }, [params.slug, router]);

  async function runCouncil() {
    if (!token || busy || councilObjective.trim().length < 8) return;
    setBusy('council'); setError(''); setNotice(''); setCouncil(null);
    try {
      const response = await fetch('/api/customer/aridon-one', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, mode: 'council', objective: councilObjective }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Aridon Council could not complete the review.');
      setCouncil(result.council || null);
      setNotice('Council completed. Eva saved the decision into executive memory.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Aridon Council could not complete the review.');
    } finally { setBusy(''); }
  }

  async function startOutcome() {
    if (!token || busy || outcome.objective.trim().length < 8) return;
    setBusy('outcome'); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/aridon-one', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: params.slug,
          mode: 'outcome',
          name: outcome.name,
          objective: outcome.objective,
          successDefinition: outcome.successDefinition,
          unit: outcome.unit,
          baseline: outcome.baseline,
          target: outcome.target,
          priority: outcome.priority,
          executive: 'Eva',
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Outcome Mode could not start.');
      setNotice(`Outcome Mode started. Eva's persistent worker is queued and the scheduler will keep the objective alive.`);
      setOutcome({ name: '', objective: '', successDefinition: '', unit: '', baseline: '', target: '', priority: 'high' });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Outcome Mode could not start.');
    } finally { setBusy(''); }
  }

  const enabledProviders = useMemo(() => (data?.router.providers || []).filter((provider) => provider.enabled), [data]);
  if (!data && !error) return <main style={loading}>Opening Aridon One…</main>;

  return <main style={page}>
    <style>{`*{box-sizing:border-box}button,input,textarea,select{font:inherit}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.three{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}@media(max-width:900px){.two,.three{grid-template-columns:1fr}}`}</style>
    <div style={shell}>
      <header style={header}>
        <div>
          <div style={eyebrow}>ARIDON ONE · AI OPERATING COMPANY</div>
          <h1 style={h1}>One command layer. Every useful brain. Work that survives the chat.</h1>
          <p style={lead}>Eva can route work across configured frontier models, convene a multi-model Council, launch persistent outcomes, remember decisions, and show proof instead of merely announcing that something is done.</p>
        </div>
        <div style={nav}>
          <Link href="/eva-chat" style={outline}>Eva</Link>
          <Link href={`/workspace/${params.slug}/mission-control`} style={outline}>Mission Control</Link>
          <Link href={`/workspace/${params.slug}/cloud-workers`} style={outline}>Cloud Workers</Link>
          <Link href={`/workspace/${params.slug}/action-center`} style={mint}>Action Center</Link>
        </div>
      </header>

      {error && <div style={errorBox}>{error}</div>}
      {notice && <div style={noticeBox}>{notice}</div>}

      <section style={metricGrid}>
        <Metric label="AI engines online" value={String(enabledProviders.length)} detail="Automatic routing" />
        <Metric label="Active outcomes" value={String(data?.metrics.activeOutcomes || 0)} detail="Persistent objectives" />
        <Metric label="Persistent workers" value={String(data?.metrics.activeWorkers || 0)} detail="Scheduled work" />
        <Metric label="Executive memories" value={String(data?.metrics.memoryItems || 0)} detail="Eva's durable context" />
        <Metric label="Verified receipts" value={String(data?.metrics.verifiedReceipts || 0)} detail="Proof-backed completion" />
        <Metric label="Needs approval" value={String(data?.metrics.awaitingApproval || 0)} detail="Owner stays in control" />
      </section>

      <section style={{...panel,marginTop:14}}>
        <div style={label}>INTELLIGENCE ROUTER</div>
        <div style={sectionHead}><div><h2 style={h2}>Use the best engine for the job.</h2><p style={muted}>Aridon owns the company memory, permissions, outcomes and execution layer. The model is replaceable.</p></div><span style={pill}>{enabledProviders.length} ONLINE</span></div>
        <div className="three">
          {(data?.router.providers || []).map((provider) => <div key={provider.provider} style={provider.enabled ? providerCard : {...providerCard,opacity:.5}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:8}}><strong>{provider.label}</strong><span style={provider.enabled ? online : offline}>{provider.enabled ? 'ONLINE' : 'NOT CONNECTED'}</span></div>
            <div style={modelName}>{provider.model}</div><p style={small}>{provider.specialty}</p>
          </div>)}
        </div>
      </section>

      <section className="two" style={{marginTop:14}}>
        <article style={darkPanel}>
          <div style={labelLight}>OUTCOME MODE</div>
          <h2 style={darkH2}>Give Eva the finish line, not another prompt.</h2>
          <p style={darkMuted}>This creates a measurable outcome and a persistent worker that wakes on Aridon's scheduler, keeps a checkpoint, and stops at owner approval gates for consequential actions.</p>
          <input style={darkInput} placeholder="Outcome name, e.g. Secure a geothermal pilot" value={outcome.name} onChange={(e)=>setOutcome({...outcome,name:e.target.value})}/>
          <textarea style={{...darkInput,minHeight:130}} placeholder="What result do you want Aridon to achieve?" value={outcome.objective} onChange={(e)=>setOutcome({...outcome,objective:e.target.value})}/>
          <textarea style={{...darkInput,minHeight:90}} placeholder="How will we know it succeeded?" value={outcome.successDefinition} onChange={(e)=>setOutcome({...outcome,successDefinition:e.target.value})}/>
          <div className="three">
            <input style={darkInput} placeholder="Metric unit" value={outcome.unit} onChange={(e)=>setOutcome({...outcome,unit:e.target.value})}/>
            <input style={darkInput} placeholder="Baseline" value={outcome.baseline} onChange={(e)=>setOutcome({...outcome,baseline:e.target.value})}/>
            <input style={darkInput} placeholder="Target" value={outcome.target} onChange={(e)=>setOutcome({...outcome,target:e.target.value})}/>
          </div>
          <select style={darkInput} value={outcome.priority} onChange={(e)=>setOutcome({...outcome,priority:e.target.value})}><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
          <button style={{...mintButton,opacity:busy||outcome.objective.trim().length<8?.55:1}} disabled={Boolean(busy)||outcome.objective.trim().length<8} onClick={()=>void startOutcome()}>{busy==='outcome'?'Starting Outcome Mode…':'Start Outcome Mode'}</button>
        </article>

        <article style={panel}>
          <div style={label}>COUNCIL MODE</div>
          <h2 style={h2}>Make the models disagree before Eva decides.</h2>
          <p style={muted}>Aridon assigns independent seats for research, strategy, building feasibility and market signal. Eva then synthesizes the strongest decision and stores it in executive memory.</p>
          <textarea style={input} placeholder="What hard decision should the Council attack?" value={councilObjective} onChange={(e)=>setCouncilObjective(e.target.value)}/>
          <button style={{...primaryButton,opacity:busy||councilObjective.trim().length<8?.55:1}} disabled={Boolean(busy)||councilObjective.trim().length<8} onClick={()=>void runCouncil()}>{busy==='council'?'Council is working…':'Convene Aridon Council'}</button>
          {council && <div style={councilBox}>
            <div style={miniLabel}>EVA'S SYNTHESIS</div><p style={{whiteSpace:'pre-wrap',lineHeight:1.6}}>{council.synthesis}</p>
            <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{council.members.map((member)=><span key={`${member.seat}-${member.provider}`} style={chip}>{member.seat}: {member.provider}/{member.model}</span>)}</div>
            {council.sources?.length>0 && <details style={{marginTop:10}}><summary style={{cursor:'pointer',fontWeight:900}}>Council sources ({council.sources.length})</summary><div style={{display:'grid',gap:5,marginTop:8}}>{council.sources.slice(0,10).map((source)=><a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={sourceLink}>{source.title || source.url}</a>)}</div></details>}
          </div>}
        </article>
      </section>

      <section className="two" style={{marginTop:14}}>
        <article style={panel}>
          <div style={label}>LIVE OUTCOMES</div><h2 style={h2}>Objectives with a pulse.</h2>
          {(data?.outcomes || []).length ? <div style={stack}>{data!.outcomes.slice(0,8).map((item)=><div key={item.id} style={row}>
            <div><strong>{item.name}</strong><div style={small}>{item.notes || 'Tracked by Aridon One'}</div></div>
            <div style={{textAlign:'right'}}><span style={status(item.status)}>{item.status.toUpperCase()}</span>{item.target_value!=null && <div style={small}>{item.current_value ?? item.baseline_value ?? '—'} / {item.target_value} {item.unit || ''}</div>}</div>
          </div>)}</div> : <Empty text="No persistent outcomes yet. Start one above."/>}
        </article>

        <article style={panel}>
          <div style={label}>PERSISTENT EXECUTIVES</div><h2 style={h2}>Workers that keep the thread.</h2>
          {(data?.workers || []).length ? <div style={stack}>{data!.workers.slice(0,8).map((worker)=><div key={worker.id} style={row}>
            <div><strong>{worker.name}</strong><div style={small}>{worker.executive} · {worker.cycle_count}/{worker.max_cycles} cycles · {worker.provider}</div></div>
            <span style={status(worker.status)}>{worker.status.replace('_',' ').toUpperCase()}</span>
          </div>)}</div> : <Empty text="No persistent workers yet."/>}
        </article>
      </section>

      <section className="two" style={{marginTop:14}}>
        <article style={panel}>
          <div style={label}>EXECUTIVE MEMORY</div><h2 style={h2}>Eva keeps the useful lessons.</h2>
          {(data?.memory.memories || []).length ? <div style={stack}>{data!.memory.memories.slice(0,10).map((memory)=><div key={memory.id} style={memoryCard}>
            <div style={{display:'flex',justifyContent:'space-between',gap:8}}><strong>{memory.memory_type.replaceAll('_',' ')}</strong><span style={small}>{Math.round(Number(memory.confidence||0)*100)}%</span></div>
            <p style={{...small,lineHeight:1.55,margin:'6px 0 0'}}>{memory.summary}</p>
          </div>)}</div> : <Empty text="Memory is ready. Council and Outcome Mode will start filling it."/>}
        </article>

        <article style={panel}>
          <div style={label}>COMPLETION RECEIPTS</div><h2 style={h2}>Proof over promises.</h2>
          {(data?.receipts || []).length ? <div style={stack}>{data!.receipts.slice(0,10).map((receipt)=><details key={receipt.id} style={receiptCard}>
            <summary style={{cursor:'pointer',fontWeight:900}}><span style={status(receipt.state)}>{receipt.state.replace('_',' ').toUpperCase()}</span> {receipt.objective.slice(0,100)}</summary>
            <div style={receiptStats}><span>Actions {receipt.totals.actions}</span><span>Completed {receipt.totals.completed}</span><span>Verified {receipt.totals.verified}</span><span>Approval {receipt.totals.pendingApproval}</span><span>Failed {receipt.totals.failed}</span></div>
            <div style={stack}>{receipt.proof.slice(0,10).map((proof,index)=><div key={index} style={proofRow}><span>{proof.verified?'✓':'○'}</span><div><strong>{proof.label}</strong><div style={small}>{proof.kind}</div></div></div>)}</div>
          </details>)}</div> : <Empty text="Receipts appear as Aridon completes mission work."/>}
        </article>
      </section>
    </div>
  </main>;
}

function Metric({label,value,detail}:{label:string;value:string;detail:string}) { return <div style={metric}><span style={metricLabel}>{label}</span><strong style={metricValue}>{value}</strong><span style={small}>{detail}</span></div>; }
function Empty({text}:{text:string}) { return <div style={empty}>{text}</div>; }
function status(value:string){const lower=value.toLowerCase();const good=['verified','completed','complete','done','success'].includes(lower);const wait=lower.includes('approval')||lower==='queued'||lower==='running'||lower==='tracking';return {display:'inline-block',padding:'5px 8px',borderRadius:999,fontSize:10,fontWeight:950,background:good?'#DDF4E7':wait?'#FFF1CE':'#E8EEF9',color:good?'#176C4A':wait?'#8A5A00':'#24416C'} as const;}

const page={minHeight:'100vh',background:'#F4F7F6',color:'#142036',padding:'26px 18px 70px',fontFamily:'Inter,ui-sans-serif,system-ui,Segoe UI,Arial'} as const;
const loading={...page,display:'grid',placeItems:'center',fontWeight:900} as const;
const shell={maxWidth:1280,margin:'0 auto'} as const;
const header={display:'flex',justifyContent:'space-between',gap:18,alignItems:'flex-start',flexWrap:'wrap',marginBottom:18} as const;
const nav={display:'flex',gap:8,flexWrap:'wrap'} as const;
const eyebrow={fontSize:12,fontWeight:950,letterSpacing:'.15em',color:'#407C67'} as const;
const h1={fontSize:'clamp(38px,5.7vw,70px)',lineHeight:.98,margin:'8px 0 12px',maxWidth:930,letterSpacing:'-.035em'} as const;
const lead={color:'#607084',lineHeight:1.65,maxWidth:920,margin:0,fontSize:16} as const;
const panel={background:'#fff',border:'1px solid #DCE5E1',borderRadius:20,padding:18,boxShadow:'0 12px 34px rgba(24,48,40,.06)'} as const;
const darkPanel={...panel,background:'#0D1728',borderColor:'#24334B',color:'#fff'} as const;
const label={fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#4B7B68'} as const;
const labelLight={...label,color:'#9EF0CF'} as const;
const h2={fontSize:25,margin:'7px 0 9px',letterSpacing:'-.02em'} as const;
const darkH2={...h2,color:'#fff',fontSize:30} as const;
const muted={color:'#66768A',lineHeight:1.55,margin:'4px 0 12px'} as const;
const darkMuted={...muted,color:'#AAB7C8'} as const;
const small={fontSize:12,color:'#748296'} as const;
const metricGrid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:9} as const;
const metric={...panel,padding:14,display:'grid',gap:3} as const;
const metricLabel={fontSize:10,fontWeight:950,letterSpacing:'.08em',textTransform:'uppercase',color:'#66768A'} as const;
const metricValue={fontSize:28,lineHeight:1} as const;
const sectionHead={display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:12} as const;
const providerCard={border:'1px solid #E0E7E4',borderRadius:15,padding:13,background:'#FBFCFC'} as const;
const modelName={fontSize:12,fontWeight:800,color:'#546579',marginTop:5} as const;
const online={fontSize:9,fontWeight:950,color:'#176C4A',background:'#DDF4E7',borderRadius:999,padding:'4px 7px'} as const;
const offline={...online,color:'#7A5960',background:'#F1E9EB'} as const;
const pill={fontSize:10,fontWeight:950,color:'#176C4A',background:'#DDF4E7',borderRadius:999,padding:'7px 10px'} as const;
const input={width:'100%',border:'1px solid #CCD8D3',borderRadius:12,padding:'12px 13px',minHeight:150,resize:'vertical',color:'#142036',background:'#fff',margin:'8px 0'} as const;
const darkInput={width:'100%',border:'1px solid #32455F',borderRadius:12,padding:'12px 13px',color:'#fff',background:'#16243A',margin:'7px 0',resize:'vertical'} as const;
const primaryButton={border:0,borderRadius:12,padding:'12px 15px',fontWeight:950,cursor:'pointer',background:'#142036',color:'#fff',width:'100%',marginTop:5} as const;
const mintButton={...primaryButton,background:'#9EF0CF',color:'#102033'} as const;
const outline={textDecoration:'none',color:'#274052',border:'1px solid #C9D5D1',borderRadius:999,padding:'9px 12px',fontSize:12,fontWeight:900,background:'#fff'} as const;
const mint={...outline,background:'#9EF0CF',borderColor:'#9EF0CF',color:'#102033'} as const;
const councilBox={marginTop:13,border:'1px solid #DCE5E1',borderRadius:14,padding:13,background:'#F8FBFA'} as const;
const miniLabel={fontSize:10,fontWeight:950,letterSpacing:'.1em',color:'#4B7B68'} as const;
const chip={fontSize:10,fontWeight:850,background:'#E8EEF9',color:'#24416C',borderRadius:999,padding:'5px 8px'} as const;
const sourceLink={fontSize:12,color:'#2C6A57',textDecoration:'none'} as const;
const stack={display:'grid',gap:8,marginTop:10} as const;
const row={display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',padding:'11px 0',borderBottom:'1px solid #EDF1EF'} as const;
const memoryCard={border:'1px solid #E4EAE7',borderRadius:13,padding:11,background:'#FBFCFC'} as const;
const receiptCard={border:'1px solid #E4EAE7',borderRadius:13,padding:11,background:'#FBFCFC'} as const;
const receiptStats={display:'flex',gap:10,flexWrap:'wrap',fontSize:11,color:'#66768A',margin:'10px 0'} as const;
const proofRow={display:'flex',gap:9,alignItems:'flex-start',fontSize:12,padding:'6px 0'} as const;
const empty={padding:'22px 4px',color:'#8090A0',fontSize:13} as const;
const errorBox={background:'#FBE7E7',color:'#8C2F39',border:'1px solid #EAC7CA',borderRadius:12,padding:12,marginBottom:12,fontWeight:800} as const;
const noticeBox={background:'#DDF4E7',color:'#176C4A',border:'1px solid #B9DFC9',borderRadius:12,padding:12,marginBottom:12,fontWeight:800} as const;
