'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Worker = {
  id: string;
  name: string;
  objective: string;
  executive: string;
  mode: string;
  priority: string;
  status: string;
  provider: string;
  checkpoint?: any;
  result?: any;
  cycle_count: number;
  max_cycles: number;
  next_run_at?: string | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
};

type Event = {
  id: string;
  worker_id: string;
  event_type: string;
  message?: string | null;
  payload?: any;
  created_at: string;
};

type Data = {
  workers: Worker[];
  events: Event[];
  controlRole: boolean;
  role: string;
  browserProviderConfigured: boolean;
  schedulerConfigured: boolean;
};

const blank = { name: '', objective: '', mode: 'research', priority: 'medium', maxCycles: 6 };

export default function CloudWorkersPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [data, setData] = useState<Data | null>(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [commandId, setCommandId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load(access = token) {
    if (!access) return;
    setError('');
    const response = await fetch(`/api/customer/cloud-workers?slug=${encodeURIComponent(params.slug)}`, {
      headers: { Authorization: `Bearer ${access}` }, cache: 'no-store',
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.error || 'Cloud Workers could not load.'); return; }
    setData(result);
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data: sessionData }) => {
      const access = sessionData.session?.access_token || '';
      if (!access) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/cloud-workers`)}`); return; }
      setToken(access);
      void load(access);
    });
  }, [params.slug, router]);

  async function createWorker() {
    if (!token || busy || form.objective.trim().length < 4) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/cloud-workers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, command: 'create', ...form, runNow: true }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Eva could not start the worker.');
      setNotice(result.warning ? `Worker queued. First cycle note: ${result.warning}` : 'Eva started the worker and recorded its first checkpoint.');
      setForm(blank);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Eva could not start the worker.');
    } finally { setBusy(false); }
  }

  async function command(worker: Worker, commandName: string) {
    if (!token) return;
    setCommandId(worker.id); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/cloud-workers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, command: commandName, id: worker.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Cloud Worker command failed.');
      setNotice(commandName === 'run_now' ? 'Eva completed another worker cycle.' : `Worker ${commandName.replace('_', ' ')} command recorded.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Cloud Worker command failed.');
      await load();
    } finally { setCommandId(''); }
  }

  const eventMap = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const item of data?.events || []) map.set(item.worker_id, [...(map.get(item.worker_id) || []), item]);
    return map;
  }, [data]);

  if (!data && !error) return <main style={loading}>Opening Eva Cloud Workers…</main>;

  return (
    <main style={page}>
      <style>{`*{box-sizing:border-box}button,input,textarea,select{font:inherit}.worker-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:14px}@media(max-width:900px){.worker-grid{grid-template-columns:1fr}}`}</style>
      <div style={shell}>
        <header style={header}>
          <div><div style={eyebrow}>EVA · PERSISTENT CLOUD WORKERS</div><h1 style={h1}>Give Eva the outcome. Let the job survive the chat.</h1><p style={lead}>Workers keep a durable checkpoint, run in scheduled cycles, research the live web, create safe internal work, and hand consequential actions to Action Center for approval.</p></div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Link href="/eva-chat" style={outline}>Eva Workspace</Link>
            <Link href={`/workspace/${params.slug}/action-center`} style={outline}>Action Center</Link>
            <Link href={`/workspace/${params.slug}/mission-control`} style={mint}>Mission Control</Link>
          </div>
        </header>

        {error && <div style={errorBox}>{error}</div>}
        {notice && <div style={noticeBox}>{notice}</div>}

        <section style={statusGrid}>
          <Status label="Scheduler" value={data?.schedulerConfigured ? 'READY' : 'NEEDS CRON_SECRET'} good={Boolean(data?.schedulerConfigured)} />
          <Status label="Live web research" value="READY" good />
          <Status label="Interactive browser" value={data?.browserProviderConfigured ? 'PROVIDER READY' : 'SOCKET READY'} good={Boolean(data?.browserProviderConfigured)} />
          <Status label="Owner role" value={(data?.role || 'member').toUpperCase()} good={Boolean(data?.controlRole)} />
        </section>

        <section className="worker-grid">
          <article style={darkPanel}>
            <div style={labelLight}>NEW CLOUD WORKER</div>
            <h2 style={darkH2}>What should Eva keep working until it is finished?</h2>
            <input style={darkInput} placeholder="Optional worker name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/>
            <textarea style={{...darkInput,minHeight:180}} placeholder="Example: Research the ten best Southwest data-center infrastructure partners for the Farmington campus. Rank them, find public contact paths, draft the best outreach, and create the internal follow-up tasks." value={form.objective} onChange={(e)=>setForm({...form,objective:e.target.value})}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <select style={darkInput} value={form.mode} onChange={(e)=>setForm({...form,mode:e.target.value})}><option value="research">Research worker</option><option value="mixed">Mixed worker</option><option value="browser">Browser-oriented worker</option></select>
              <select style={darkInput} value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})}><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option><option value="urgent">Urgent</option></select>
            </div>
            <label style={smallLight}>Maximum autonomous cycles</label>
            <input style={darkInput} type="number" min={1} max={12} value={form.maxCycles} onChange={(e)=>setForm({...form,maxCycles:Number(e.target.value)||6})}/>
            <button onClick={()=>void createWorker()} disabled={busy || form.objective.trim().length<4} style={{...mintButton,opacity:busy||form.objective.trim().length<4?.55:1}}>{busy?'Eva is starting the worker…':'Start Worker Now'}</button>
            <p style={darkMuted}>Research and reversible internal work can proceed automatically. Email, calendar, money, contracts, publishing, security changes and destructive actions stay behind owner control.</p>
          </article>

          <section style={{display:'grid',gap:12}}>
            {(data?.workers || []).length ? data!.workers.map((worker)=><WorkerCard key={worker.id} worker={worker} events={eventMap.get(worker.id)||[]} controlRole={Boolean(data?.controlRole)} busy={commandId===worker.id} onCommand={(name)=>void command(worker,name)} />) : <article style={panel}><div style={label}>NO WORKERS YET</div><h2 style={h2}>The runway is empty.</h2><p style={muted}>Start the first persistent job on the left. Eva will leave checkpoints here instead of losing the thread when the chat closes.</p></article>}
          </section>
        </section>
      </div>
    </main>
  );
}

function WorkerCard({worker,events,controlRole,busy,onCommand}:{worker:Worker;events:Event[];controlRole:boolean;busy:boolean;onCommand:(name:string)=>void}) {
  const summary = worker.result?.summary || worker.checkpoint?.progress || '';
  const findings: string[] = Array.isArray(worker.result?.findings) ? worker.result.findings : [];
  const next: string[] = Array.isArray(worker.result?.nextSteps) ? worker.result.nextSteps : [];
  const sources: Array<{title?:string;url?:string}> = Array.isArray(worker.result?.sources) ? worker.result.sources : [];
  const terminal = ['completed','cancelled'].includes(worker.status);
  return <article style={panel}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'start',flexWrap:'wrap'}}>
      <div><div style={label}>{worker.mode.toUpperCase()} · {worker.provider}</div><h2 style={{...h2,marginBottom:4}}>{worker.name}</h2><p style={muted}>{worker.objective}</p></div>
      <span style={statusPill(worker.status)}>{worker.status.replace('_',' ').toUpperCase()}</span>
    </div>
    <div style={miniGrid}>
      <Mini label="Cycles" value={`${worker.cycle_count}/${worker.max_cycles}`} />
      <Mini label="Priority" value={worker.priority} />
      <Mini label="Next run" value={worker.next_run_at ? new Date(worker.next_run_at).toLocaleString() : '—'} />
    </div>
    {summary && <div style={resultBox}><strong>Latest checkpoint</strong><p>{summary}</p></div>}
    {findings.length>0 && <div><div style={miniLabel}>FINDINGS</div><ul style={list}>{findings.slice(0,6).map((item,index)=><li key={index}>{item}</li>)}</ul></div>}
    {next.length>0 && <div><div style={miniLabel}>NEXT STEPS</div><ul style={list}>{next.slice(0,5).map((item,index)=><li key={index}>{item}</li>)}</ul></div>}
    {sources.length>0 && <div><div style={miniLabel}>SOURCES USED</div><div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{sources.slice(0,6).map((source,index)=><a key={index} href={source.url} target="_blank" rel="noreferrer" style={sourceChip}>{source.title||source.url||'Source'}</a>)}</div></div>}
    {worker.error && <div style={errorBox}>{worker.error}</div>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
      {!terminal && worker.status!=='paused' && <button disabled={!controlRole||busy} onClick={()=>onCommand('run_now')} style={smallButton}>{busy?'Working…':'Run Next Cycle'}</button>}
      {!terminal && worker.status!=='paused' && <button disabled={!controlRole||busy} onClick={()=>onCommand('pause')} style={smallButton}>Pause</button>}
      {worker.status==='paused' && <button disabled={!controlRole||busy} onClick={()=>onCommand('resume')} style={smallButton}>Resume</button>}
      {!terminal && <button disabled={!controlRole||busy} onClick={()=>onCommand('cancel')} style={dangerButton}>Cancel</button>}
    </div>
    {events.length>0 && <details style={{marginTop:12}}><summary style={{cursor:'pointer',fontWeight:900}}>Worker log ({events.length})</summary><div style={{display:'grid',gap:7,marginTop:8}}>{events.slice(0,8).map((item)=><div key={item.id} style={eventRow}><strong>{item.event_type.replace('_',' ')}</strong><span>{item.message||''}</span><small>{new Date(item.created_at).toLocaleString()}</small></div>)}</div></details>}
  </article>;
}

function Status({label,value,good}:{label:string;value:string;good:boolean}) { return <div style={statusCard}><span>{label}</span><strong style={{color:good?'#176C4A':'#9B4B25'}}>{value}</strong></div>; }
function Mini({label,value}:{label:string;value:string}) { return <div style={mini}><span>{label}</span><strong>{value}</strong></div>; }
function statusPill(status:string){const good=status==='completed';const wait=status==='waiting_approval'||status==='paused';return {padding:'7px 10px',borderRadius:999,fontSize:11,fontWeight:950,background:good?'#DDF4E7':wait?'#FFF1CE':'#E8EEF9',color:good?'#176C4A':wait?'#8A5A00':'#24416C'} as const;}

const page={minHeight:'100vh',background:'#F4F7F6',color:'#142036',padding:'26px 18px 70px',fontFamily:'Inter,ui-sans-serif,system-ui,Segoe UI,Arial'} as const;
const loading={...page,display:'grid',placeItems:'center',fontWeight:900} as const;
const shell={maxWidth:1240,margin:'0 auto'} as const;
const header={display:'flex',justifyContent:'space-between',gap:18,alignItems:'flex-start',flexWrap:'wrap',marginBottom:18} as const;
const eyebrow={fontSize:12,fontWeight:950,letterSpacing:'.15em',color:'#407C67'} as const;
const h1={fontSize:'clamp(34px,5vw,62px)',lineHeight:1.02,margin:'8px 0 10px',maxWidth:850} as const;
const lead={color:'#607084',lineHeight:1.6,maxWidth:880,margin:0} as const;
const panel={background:'#fff',border:'1px solid #DCE5E1',borderRadius:20,padding:18,boxShadow:'0 12px 34px rgba(24,48,40,.06)'} as const;
const darkPanel={...panel,background:'#0D1728',borderColor:'#24334B',color:'#fff'} as const;
const darkH2={fontSize:28,margin:'7px 0 10px'} as const;
const label={fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#4B7B68'} as const;
const labelLight={...label,color:'#9EF0CF'} as const;
const h2={fontSize:24,margin:'7px 0 9px'} as const;
const muted={color:'#66768A',lineHeight:1.55,margin:'4px 0 10px'} as const;
const darkMuted={color:'#9EADC1',lineHeight:1.55,fontSize:13} as const;
const darkInput={width:'100%',background:'#101D31',border:'1px solid #30415D',color:'#fff',borderRadius:12,padding:'11px 12px',marginBottom:9} as const;
const mintButton={border:0,borderRadius:12,padding:'11px 15px',background:'#9EF0CF',color:'#102119',fontWeight:950,cursor:'pointer'} as const;
const outline={textDecoration:'none',border:'1px solid #B8C7C0',borderRadius:999,padding:'9px 12px',color:'#26384A',fontWeight:850} as const;
const mint={...outline,background:'#9EF0CF',borderColor:'#9EF0CF',color:'#11261E'} as const;
const statusGrid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:9,marginBottom:14} as const;
const statusCard={...panel,padding:'12px 14px',display:'grid',gap:4} as const;
const miniGrid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8,margin:'12px 0'} as const;
const mini={background:'#F7FAF9',border:'1px solid #E2EAE6',borderRadius:12,padding:'10px 11px',display:'grid',gap:3,fontSize:12} as const;
const miniLabel={fontSize:10,fontWeight:950,letterSpacing:'.12em',color:'#758699',marginTop:12} as const;
const resultBox={background:'#EDF8F3',border:'1px solid #C8E7D9',borderRadius:14,padding:'12px 13px',lineHeight:1.55} as const;
const list={margin:'7px 0 0',paddingLeft:20,color:'#53657A',lineHeight:1.55} as const;
const sourceChip={textDecoration:'none',fontSize:11,fontWeight:850,border:'1px solid #CFDBD6',borderRadius:999,padding:'6px 8px',color:'#315E4F',background:'#F7FBF9'} as const;
const smallButton={border:'1px solid #B9C7C1',background:'#fff',borderRadius:10,padding:'8px 10px',fontWeight:850,cursor:'pointer'} as const;
const dangerButton={...smallButton,borderColor:'#E3B9B9',color:'#9A3131'} as const;
const eventRow={display:'grid',gap:2,background:'#F7F9FA',borderRadius:10,padding:'9px 10px',color:'#526174',fontSize:12} as const;
const errorBox={background:'#FFF0F0',border:'1px solid #EABBBB',color:'#8E2F2F',borderRadius:12,padding:'10px 12px',marginBottom:10} as const;
const noticeBox={background:'#E8F7EF',border:'1px solid #B9E0CA',color:'#216044',borderRadius:12,padding:'10px 12px',marginBottom:10} as const;
const smallLight={display:'block',fontSize:11,color:'#AAB6C7',fontWeight:800,margin:'2px 0 5px'} as const;
