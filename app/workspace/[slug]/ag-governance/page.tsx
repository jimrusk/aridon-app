'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FileCheck2,
  Leaf,
  Plus,
  RefreshCw,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { getBrowserClient } from '../../../../lib/supabase';

type Goal = { id: string; name: string; category: string; target_year: number; progress: number; status: string; owner?: string | null; metric?: string | null; unit?: string | null };
type Supplier = { id: string; name: string; region?: string | null; crop?: string | null; assurance_score: number; evidence_status: string; audit_status: string; next_action?: string | null; next_due?: string | null };
type Action = { id: string; title: string; priority: string; status: string; owner?: string | null; due_date?: string | null; ai_generated: boolean; details?: string | null };
type Report = { id: string; title: string; reporting_period?: string | null; status: string; due_date?: string | null; evidence_complete: number; owner?: string | null };
type Finance = { id: string; program_name: string; budget: number; actual: number; forecast: number; contract_status: string; renewal_date?: string | null; approver?: string | null };
type Stakeholder = { id: string; name: string; organization?: string | null; stakeholder_type?: string | null; email?: string | null; region?: string | null; status: string; next_action_date?: string | null };
type Evidence = { id: string; title: string; evidence_type?: string | null; status: string; supplier_id?: string | null; goal_id?: string | null; reviewer?: string | null; expires_at?: string | null };

type GovernanceData = {
  tenant: { id: string; slug: string; business_name: string; primary_color?: string | null; accent_color?: string | null };
  role: string;
  goals: Goal[];
  suppliers: Supplier[];
  actions: Action[];
  reports: Report[];
  finance: Finance[];
  stakeholders: Stakeholder[];
  evidence: Evidence[];
};

type TabName = 'overview' | 'goals' | 'suppliers' | 'actions' | 'reports' | 'finance' | 'stakeholders';

export default function AgGovernanceWorkspace({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<TabName>('overview');

  async function token() {
    const { data: sessionData } = await getBrowserClient().auth.getSession();
    return sessionData.session?.access_token || '';
  }

  async function load() {
    setError('');
    const accessToken = await token();
    if (!accessToken) {
      router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/ag-governance`)}`);
      return;
    }
    const response = await fetch(`/api/customer/ag-governance?slug=${encodeURIComponent(params.slug)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      await getBrowserClient().auth.signOut();
      router.replace('/customer/login');
      return;
    }
    if (!response.ok) {
      setError(result.error || 'Unable to load agriculture governance.');
      setLoading(false);
      return;
    }
    setData(result as GovernanceData);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [params.slug]);

  async function mutate(method: 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown>, query?: string) {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const accessToken = await token();
      if (!accessToken) throw new Error('Customer login required.');
      const response = await fetch(`/api/customer/ag-governance${query || ''}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to save.');
      await load();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function installStarter() {
    const result = await mutate('POST', { slug: params.slug, entity: 'starter' });
    if (result) setNotice(result.seeded ? 'Starter governance framework installed.' : 'Starter framework was already installed.');
  }

  async function update(entity: string, id: string, changes: Record<string, unknown>) {
    const result = await mutate('PATCH', { slug: params.slug, entity, id, data: changes });
    if (result) setNotice('Updated.');
  }

  if (loading) return <main style={loadingStyle}>Opening Sustainable Agriculture Governance…</main>;
  if (!data) return <main style={loadingStyle}><div style={{ maxWidth: 600, textAlign: 'center' }}><h1>We could not open this governance workspace.</h1><p style={{ color: '#B7C2D5' }}>{error}</p><Link href={`/workspace/${params.slug}`} style={{ color: '#A9E67A', fontWeight: 900 }}>Back to company home</Link></div></main>;

  const openActions = data.actions.filter((x) => !['done', 'completed', 'closed'].includes((x.status || '').toLowerCase()));
  const missingEvidence = data.evidence.filter((x) => !['approved', 'verified', 'complete'].includes((x.status || '').toLowerCase())).length;
  const suppliersNeedingAction = data.suppliers.filter((x) => x.assurance_score < 80 || x.evidence_status !== 'complete').length;
  const avgProgress = data.goals.length ? Math.round(data.goals.reduce((sum, g) => sum + Number(g.progress || 0), 0) / data.goals.length) : 0;
  const highRiskGoals = data.goals.filter((x) => ['at_risk', 'action_needed', 'off_track'].includes((x.status || '').toLowerCase())).length;
  const accent = data.tenant.accent_color || '#A9E67A';

  return (
    <main style={{ minHeight: '100vh', background: '#F1F5F0', color: '#17384A', fontFamily: 'Arial,sans-serif', paddingBottom: 90 }}>
      <header style={{ background: 'linear-gradient(135deg,#062A46,#0A533E 72%,#397245)', color: '#fff', padding: '20px 18px 28px' }}>
        <div style={{ maxWidth: 1240, margin: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div><div style={{ color: accent, fontSize: 11, fontWeight: 950, letterSpacing: 1.2 }}>ARIDON AG ENTERPRISE</div><strong style={{ fontSize: 23 }}>{data.tenant.business_name}</strong><div style={{ color: '#CFE1DA', fontSize: 13, marginTop: 3 }}>Sustainable Agriculture Governance OS</div></div>
            <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href={`/workspace/${params.slug}`} style={headerLink}>Company Home</Link><Link href="/ag/governance" style={headerLink}>Public Demo</Link><button onClick={() => void load()} style={headerButton}><RefreshCw size={14} /> Refresh</button></nav>
          </div>
          <div style={{ marginTop: 24 }}><div style={{ color: accent, fontSize: 11, fontWeight: 950 }}>ENTERPRISE CONTROL ROOM</div><h1 style={{ fontSize: 'clamp(36px,6vw,62px)', lineHeight: 1, margin: '8px 0 10px', letterSpacing: -2 }}>Govern the goal. Prove the progress.</h1><p style={{ color: '#DCEBE4', lineHeight: 1.6, maxWidth: 820, margin: 0 }}>Run sustainable sourcing, regenerative agriculture, producer livelihoods, assurance, reporting, stakeholder execution and program spend from one accountable system.</p></div>
        </div>
      </header>

      <section style={{ maxWidth: 1240, margin: '-14px auto 0', padding: '0 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))', gap: 10 }}>
          <Metric icon={Target} label="Goal trajectory" value={`${avgProgress}%`} sub={`${data.goals.length} active goals`} />
          <Metric icon={Users} label="Suppliers needing action" value={String(suppliersNeedingAction)} sub={`${data.suppliers.length} tracked`} />
          <Metric icon={FileCheck2} label="Missing evidence" value={String(missingEvidence)} sub={`${data.evidence.length} evidence records`} />
          <Metric icon={AlertTriangle} label="High-risk goals" value={String(highRiskGoals)} sub="Needs intervention" />
          <Metric icon={ClipboardCheck} label="Open actions" value={String(openActions.length)} sub={`${data.reports.length} reports tracked`} />
        </div>
      </section>

      <section style={{ maxWidth: 1240, margin: '14px auto 0', padding: '0 18px' }}>
        {error && <Banner tone="error">{error}</Banner>}
        {notice && <Banner tone="success">{notice}</Banner>}
        {data.goals.length === 0 && <div style={{ background: '#E4F1E1', border: '1px solid #CBE0C8', borderRadius: 18, padding: 20, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center' }} className="starter"><div><div style={{ color: '#2E7D32', fontSize: 11, fontWeight: 950 }}>NEW GOVERNANCE WORKSPACE</div><h2 style={{ margin: '6px 0' }}>Install the enterprise starter framework</h2><p style={{ color: '#607284', margin: 0, lineHeight: 1.55 }}>Creates Sustainable Sourcing, Regenerate/Restore/Protect and Producer Livelihood goals, plus first actions and the annual reporting package.</p></div><button disabled={saving} onClick={() => void installStarter()} style={primaryButton}>{saving ? 'Installing…' : 'Install Starter Framework'}</button></div>}
      </section>

      <section style={{ maxWidth: 1240, margin: '14px auto 0', padding: '0 18px' }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', background: '#fff', border: '1px solid #DCE7DF', borderRadius: 15, padding: 8 }}>
          {(['overview','goals','suppliers','actions','reports','finance','stakeholders'] as TabName[]).map((name) => <button key={name} onClick={() => setTab(name)} style={{ ...tabButton, ...(tab === name ? activeTab : {}) }}>{pretty(name)}</button>)}
        </div>
      </section>

      <section style={{ maxWidth: 1240, margin: '14px auto 0', padding: '0 18px' }}>
        {tab === 'overview' && <Overview data={data} openActions={openActions} update={update} saving={saving} />}
        {tab === 'goals' && <GoalsPanel data={data} mutate={mutate} update={update} saving={saving} />}
        {tab === 'suppliers' && <SuppliersPanel data={data} mutate={mutate} update={update} saving={saving} />}
        {tab === 'actions' && <ActionsPanel data={data} mutate={mutate} update={update} saving={saving} />}
        {tab === 'reports' && <ReportsPanel data={data} mutate={mutate} update={update} saving={saving} />}
        {tab === 'finance' && <FinancePanel data={data} mutate={mutate} saving={saving} />}
        {tab === 'stakeholders' && <StakeholdersPanel data={data} mutate={mutate} saving={saving} />}
      </section>
      <style>{`@media(max-width:760px){.starter{grid-template-columns:1fr !important}.two-col{grid-template-columns:1fr !important}.three-col{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Overview({ data, openActions, update, saving }: { data: GovernanceData; openActions: Action[]; update: (e:string,id:string,c:Record<string,unknown>)=>Promise<void>; saving:boolean }) {
  const nextActions = openActions.slice(0, 5);
  const totalBudget = data.finance.reduce((sum, x) => sum + Number(x.budget || 0), 0);
  const totalActual = data.finance.reduce((sum, x) => sum + Number(x.actual || 0), 0);
  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(310px,.65fr)', gap: 14 }} className="two-col">
    <div style={panel}><div style={eyebrow}>GOAL GOVERNANCE</div><h2 style={h2}>Enterprise agriculture portfolio</h2>{data.goals.length === 0 ? <Empty text="Install the starter framework or add the first enterprise goal."/> : <div style={{ display: 'grid', gap: 11 }}>{data.goals.map((g) => <div key={g.id} style={softRow}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><strong>{g.name}</strong><div style={muted}>{g.owner ? `Owner: ${g.owner}` : 'Owner not assigned'} · Target {g.target_year}</div></div><div style={{ textAlign: 'right' }}><strong style={{ fontSize: 22 }}>{Number(g.progress).toFixed(0)}%</strong><div style={{ ...muted, color: statusColor(g.status) }}>{pretty(g.status)}</div></div></div><div style={track}><div style={{ ...bar, width: `${Math.max(0, Math.min(100, Number(g.progress || 0)))}%` }} /></div></div>)}</div>}</div>
    <aside style={{ ...panel, background: '#0D314C', color: '#fff' }}><div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#A9E67A', fontSize: 11, fontWeight: 950 }}><Bot size={20}/>ARIDON AI GOVERNANCE MANAGER</div><h2 style={{ ...h2, color: '#fff' }}>What needs attention now?</h2>{nextActions.length === 0 ? <p style={{ color: '#D7E5EE' }}>No open governance actions. Add an action or install the starter framework.</p> : <div style={{ display: 'grid', gap: 9 }}>{nextActions.map((a) => <div key={a.id} style={{ background: '#153F5C', borderRadius: 11, padding: 11 }}><div style={{ fontSize: 11, color: '#A9E67A', fontWeight: 900 }}>{pretty(a.priority)} PRIORITY {a.ai_generated ? '· AI GENERATED' : ''}</div><strong style={{ display: 'block', marginTop: 5 }}>{a.title}</strong><div style={{ color: '#D7E5EE', fontSize: 12, lineHeight: 1.45, marginTop: 4 }}>{a.owner || 'Unassigned'}{a.due_date ? ` · Due ${a.due_date}` : ''}</div><button disabled={saving} onClick={() => void update('action', a.id, { status: 'completed' })} style={smallLightButton}><CheckCircle2 size={13}/> Mark complete</button></div>)}</div>}</aside>
    <div style={{ ...panel, gridColumn: '1/-1' }}><div style={eyebrow}>PROGRAM FINANCIAL GOVERNANCE</div><h2 style={h2}>Budget, spend and forecast</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 }}><Money label="Program budget" value={totalBudget}/><Money label="Actual spend" value={totalActual}/><Money label="Remaining" value={totalBudget-totalActual}/><Money label="Contracts tracked" value={data.finance.length} plain/></div></div>
  </div>;
}

function GoalsPanel({ data, mutate, update, saving }: PanelProps) {
  const [form, setForm] = useState({ name:'', owner:'', progress:'0', status:'planning', metric:'', unit:'%' });
  async function submit(e:FormEvent){e.preventDefault(); const result=await mutate('POST',{slug:data.tenant.slug,entity:'goal',data:{...form,progress:Number(form.progress),target_year:2030}}); if(result)setForm({name:'',owner:'',progress:'0',status:'planning',metric:'',unit:'%'});}
  return <div style={{ display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(290px,.6fr)',gap:14 }} className="two-col"><div style={panel}><div style={eyebrow}>GOAL GOVERNANCE</div><h2 style={h2}>Goals, owners and trajectory</h2><div style={{display:'grid',gap:10}}>{data.goals.map(g=><div key={g.id} style={softRow}><div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}><div><strong>{g.name}</strong><div style={muted}>{g.metric||'Metric not set'} {g.unit?`(${g.unit})`:''} · {g.owner||'Unassigned'}</div></div><div style={{display:'flex',gap:6,alignItems:'center'}}><input aria-label={`${g.name} progress`} type="number" min="0" max="100" defaultValue={Number(g.progress)} onBlur={(e)=>void update('goal',g.id,{progress:Number(e.target.value)})} style={tinyInput}/><select defaultValue={g.status} onChange={(e)=>void update('goal',g.id,{status:e.target.value})} style={tinyInput}><option value="planning">Planning</option><option value="on_track">On track</option><option value="watch">Watch</option><option value="at_risk">At risk</option><option value="action_needed">Action needed</option></select></div></div></div>)}</div></div><form onSubmit={submit} style={panel}><div style={eyebrow}><Plus size={14}/> ADD GOAL</div><h3 style={{fontSize:22,margin:'7px 0 12px'}}>Create a governed target</h3><Field label="Goal name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={input}/></Field><Field label="Owner"><input value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} style={input}/></Field><Field label="Metric"><input value={form.metric} onChange={e=>setForm({...form,metric:e.target.value})} style={input}/></Field><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><Field label="Progress %"><input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:e.target.value})} style={input}/></Field><Field label="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={input}><option value="planning">Planning</option><option value="on_track">On track</option><option value="watch">Watch</option><option value="at_risk">At risk</option></select></Field></div><button disabled={saving} style={primaryButton}>Add Goal</button></form></div>;
}

function SuppliersPanel({ data, mutate, update, saving }: PanelProps) {
  const [form,setForm]=useState({name:'',region:'',crop:'',assurance_score:'0',evidence_status:'not_started'});
  async function submit(e:FormEvent){e.preventDefault();const r=await mutate('POST',{slug:data.tenant.slug,entity:'supplier',data:{...form,assurance_score:Number(form.assurance_score)}});if(r)setForm({name:'',region:'',crop:'',assurance_score:'0',evidence_status:'not_started'});}
  return <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(290px,.6fr)',gap:14}} className="two-col"><div style={panel}><div style={eyebrow}>SUSTAINABLE FARMING ASSURANCE</div><h2 style={h2}>Supplier & producer readiness</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}><thead><tr>{['Supplier','Region','Score','Evidence','Audit','Action'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{data.suppliers.map(s=><tr key={s.id}><td style={td}><strong>{s.name}</strong><div style={muted}>{s.crop||'Crop not set'}</div></td><td style={td}>{s.region||'—'}</td><td style={td}><input type="number" min="0" max="100" defaultValue={s.assurance_score} onBlur={e=>void update('supplier',s.id,{assurance_score:Number(e.target.value)})} style={tinyInput}/></td><td style={td}><select defaultValue={s.evidence_status} onChange={e=>void update('supplier',s.id,{evidence_status:e.target.value})} style={tinyInput}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="complete">Complete</option><option value="expired">Expired</option></select></td><td style={td}>{pretty(s.audit_status)}</td><td style={td}>{s.next_action||'—'}</td></tr>)}</tbody></table>{data.suppliers.length===0&&<Empty text="No suppliers or producer groups have been added yet."/>}</div></div><form onSubmit={submit} style={panel}><div style={eyebrow}><Plus size={14}/> ADD SUPPLIER</div><h3 style={{fontSize:22,margin:'7px 0 12px'}}>Track assurance readiness</h3><Field label="Supplier / producer group"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={input}/></Field><Field label="Region"><input value={form.region} onChange={e=>setForm({...form,region:e.target.value})} style={input}/></Field><Field label="Crop"><input value={form.crop} onChange={e=>setForm({...form,crop:e.target.value})} style={input}/></Field><Field label="Assurance score"><input type="number" min="0" max="100" value={form.assurance_score} onChange={e=>setForm({...form,assurance_score:e.target.value})} style={input}/></Field><button disabled={saving} style={primaryButton}>Add Supplier</button></form></div>;
}

function ActionsPanel({ data, mutate, update, saving }: PanelProps) {
  const [form,setForm]=useState({title:'',owner:'',priority:'medium',due_date:'',details:''});
  async function submit(e:FormEvent){e.preventDefault();const r=await mutate('POST',{slug:data.tenant.slug,entity:'action',data:{...form,status:'open',ai_generated:false,due_date:form.due_date||null}});if(r)setForm({title:'',owner:'',priority:'medium',due_date:'',details:''});}
  return <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(290px,.6fr)',gap:14}} className="two-col"><div style={panel}><div style={eyebrow}>ACTION CONTROL</div><h2 style={h2}>Accountable execution queue</h2><div style={{display:'grid',gap:9}}>{data.actions.map(a=><div key={a.id} style={softRow}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'start'}}><div><div style={{fontSize:11,fontWeight:900,color:a.ai_generated?'#2E7D32':'#607284'}}>{pretty(a.priority)} {a.ai_generated?'· AI GENERATED':''}</div><strong>{a.title}</strong><div style={muted}>{a.owner||'Unassigned'}{a.due_date?` · Due ${a.due_date}`:''}</div></div><select defaultValue={a.status} onChange={e=>void update('action',a.id,{status:e.target.value})} style={tinyInput}><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option></select></div></div>)}</div></div><form onSubmit={submit} style={panel}><div style={eyebrow}><Plus size={14}/> ADD ACTION</div><h3 style={{fontSize:22,margin:'7px 0 12px'}}>Assign the next move</h3><Field label="Action"><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={input}/></Field><Field label="Owner"><input value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} style={input}/></Field><Field label="Priority"><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} style={input}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></Field><Field label="Due date"><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} style={input}/></Field><button disabled={saving} style={primaryButton}>Add Action</button></form></div>;
}

function ReportsPanel({ data, mutate, update, saving }: PanelProps) {
  const [form,setForm]=useState({title:'',reporting_period:String(new Date().getFullYear()),due_date:'',owner:''});
  async function submit(e:FormEvent){e.preventDefault();const r=await mutate('POST',{slug:data.tenant.slug,entity:'report',data:{...form,status:'planning',evidence_complete:0,due_date:form.due_date||null}});if(r)setForm({title:'',reporting_period:String(new Date().getFullYear()),due_date:'',owner:''});}
  return <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(290px,.6fr)',gap:14}} className="two-col"><div style={panel}><div style={eyebrow}>REPORTING ENGINE</div><h2 style={h2}>Goal-delivery packages</h2><div style={{display:'grid',gap:10}}>{data.reports.map(r=><div key={r.id} style={softRow}><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><strong>{r.title}</strong><div style={muted}>{r.reporting_period||'Period not set'} · {r.owner||'Unassigned'}{r.due_date?` · Due ${r.due_date}`:''}</div></div><div style={{display:'flex',gap:6}}><input type="number" min="0" max="100" defaultValue={r.evidence_complete} onBlur={e=>void update('report',r.id,{evidence_complete:Number(e.target.value)})} style={tinyInput}/><select defaultValue={r.status} onChange={e=>void update('report',r.id,{status:e.target.value})} style={tinyInput}><option value="planning">Planning</option><option value="draft">Draft</option><option value="review">Review</option><option value="approved">Approved</option><option value="submitted">Submitted</option></select></div></div><div style={track}><div style={{...bar,width:`${r.evidence_complete}%`}}/></div></div>)}</div></div><form onSubmit={submit} style={panel}><div style={eyebrow}><Plus size={14}/> ADD REPORT</div><h3 style={{fontSize:22,margin:'7px 0 12px'}}>Create reporting package</h3><Field label="Report title"><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={input}/></Field><Field label="Reporting period"><input value={form.reporting_period} onChange={e=>setForm({...form,reporting_period:e.target.value})} style={input}/></Field><Field label="Owner"><input value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} style={input}/></Field><Field label="Due date"><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} style={input}/></Field><button disabled={saving} style={primaryButton}>Add Report</button></form></div>;
}

function FinancePanel({ data, mutate, saving }: PanelProps) {
  const [form,setForm]=useState({program_name:'',budget:'0',actual:'0',forecast:'0',contract_status:'not_started',renewal_date:'',approver:''});
  async function submit(e:FormEvent){e.preventDefault();const r=await mutate('POST',{slug:data.tenant.slug,entity:'finance',data:{...form,budget:Number(form.budget),actual:Number(form.actual),forecast:Number(form.forecast),renewal_date:form.renewal_date||null}});if(r)setForm({program_name:'',budget:'0',actual:'0',forecast:'0',contract_status:'not_started',renewal_date:'',approver:''});}
  return <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(290px,.6fr)',gap:14}} className="two-col"><div style={panel}><div style={eyebrow}>FINANCIAL GOVERNANCE</div><h2 style={h2}>Program spend, contracts and approvals</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}><thead><tr>{['Program','Budget','Actual','Forecast','Contract','Renewal'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{data.finance.map(f=><tr key={f.id}><td style={td}><strong>{f.program_name}</strong><div style={muted}>{f.approver?`Approver: ${f.approver}`:'Approver not set'}</div></td><td style={td}>{money(f.budget)}</td><td style={td}>{money(f.actual)}</td><td style={td}>{money(f.forecast)}</td><td style={td}>{pretty(f.contract_status)}</td><td style={td}>{f.renewal_date||'—'}</td></tr>)}</tbody></table>{data.finance.length===0&&<Empty text="No program budgets or contracts have been added yet."/>}</div></div><form onSubmit={submit} style={panel}><div style={eyebrow}><Plus size={14}/> ADD PROGRAM</div><h3 style={{fontSize:22,margin:'7px 0 12px'}}>Track financial delivery</h3><Field label="Program name"><input required value={form.program_name} onChange={e=>setForm({...form,program_name:e.target.value})} style={input}/></Field>{(['budget','actual','forecast'] as const).map(k=><Field key={k} label={pretty(k)}><input type="number" min="0" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} style={input}/></Field>)}<Field label="Contract status"><select value={form.contract_status} onChange={e=>setForm({...form,contract_status:e.target.value})} style={input}><option value="not_started">Not started</option><option value="drafting">Drafting</option><option value="approval">Approval</option><option value="active">Active</option><option value="renewal">Renewal</option></select></Field><Field label="Approver"><input value={form.approver} onChange={e=>setForm({...form,approver:e.target.value})} style={input}/></Field><button disabled={saving} style={primaryButton}>Add Program</button></form></div>;
}

function StakeholdersPanel({ data, mutate, saving }: PanelProps) {
  const [form,setForm]=useState({name:'',organization:'',stakeholder_type:'producer',email:'',region:'',next_action_date:''});
  async function submit(e:FormEvent){e.preventDefault();const r=await mutate('POST',{slug:data.tenant.slug,entity:'stakeholder',data:{...form,status:'active',next_action_date:form.next_action_date||null}});if(r)setForm({name:'',organization:'',stakeholder_type:'producer',email:'',region:'',next_action_date:''});}
  return <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(290px,.6fr)',gap:14}} className="two-col"><div style={panel}><div style={eyebrow}>STAKEHOLDER COMMAND</div><h2 style={h2}>Internal and external engagement</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:10}}>{data.stakeholders.map(s=><div key={s.id} style={softRow}><strong>{s.name}</strong><div style={muted}>{s.organization||'Independent'} · {pretty(s.stakeholder_type||'stakeholder')}</div><div style={{fontSize:13,marginTop:6}}>{s.email||'No email'}</div><div style={{...muted,marginTop:4}}>{s.region||'Region not set'}{s.next_action_date?` · Next action ${s.next_action_date}`:''}</div></div>)}</div>{data.stakeholders.length===0&&<Empty text="No stakeholders have been added yet."/>}</div><form onSubmit={submit} style={panel}><div style={eyebrow}><Plus size={14}/> ADD STAKEHOLDER</div><h3 style={{fontSize:22,margin:'7px 0 12px'}}>Add to the accountable network</h3><Field label="Name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={input}/></Field><Field label="Organization"><input value={form.organization} onChange={e=>setForm({...form,organization:e.target.value})} style={input}/></Field><Field label="Type"><select value={form.stakeholder_type} onChange={e=>setForm({...form,stakeholder_type:e.target.value})} style={input}><option value="producer">Producer</option><option value="supplier">Supplier</option><option value="internal_team">Internal team</option><option value="auditor">Auditor</option><option value="ngo">NGO</option><option value="government">Government</option><option value="partner">Partner</option></select></Field><Field label="Email"><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={input}/></Field><Field label="Region"><input value={form.region} onChange={e=>setForm({...form,region:e.target.value})} style={input}/></Field><button disabled={saving} style={primaryButton}>Add Stakeholder</button></form></div>;
}

type PanelProps = { data: GovernanceData; mutate: (m:'POST'|'PATCH'|'DELETE',b?:Record<string,unknown>,q?:string)=>Promise<any>; update: (e:string,id:string,c:Record<string,unknown>)=>Promise<void>; saving:boolean };

function Metric({icon:Icon,label,value,sub}:{icon:any;label:string;value:string;sub:string}){return <div style={{background:'#fff',border:'1px solid #DCE7DF',borderRadius:15,padding:16,boxShadow:'0 7px 24px #173B2A0E'}}><Icon size={20} color="#2E7D32"/><div style={{fontSize:11,color:'#607284',fontWeight:900,marginTop:8}}>{label}</div><div style={{fontSize:28,fontWeight:950,margin:'3px 0'}}>{value}</div><div style={muted}>{sub}</div></div>}
function Money({label,value,plain}:{label:string;value:number;plain?:boolean}){return <div style={{background:'#F5F8F5',borderRadius:13,padding:15}}><div style={muted}>{label}</div><strong style={{fontSize:24,display:'block',marginTop:5}}>{plain?value:money(value)}</strong></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label style={{display:'grid',gap:5,marginBottom:10,fontSize:12,fontWeight:850,color:'#526B79'}}>{label}{children}</label>}
function Empty({text}:{text:string}){return <div style={{padding:18,border:'1px dashed #C9D7CD',borderRadius:12,color:'#607284',textAlign:'center'}}>{text}</div>}
function Banner({tone,children}:{tone:'error'|'success';children:React.ReactNode}){return <div style={{background:tone==='error'?'#FDECEC':'#E7F5E5',color:tone==='error'?'#8A1F1F':'#245E29',border:`1px solid ${tone==='error'?'#F3C4C4':'#C8E2C5'}`,borderRadius:12,padding:'11px 13px',marginBottom:10,fontWeight:850}}>{children}</div>}

function pretty(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
function statusColor(status:string){const s=status.toLowerCase();if(['on_track','approved','complete','completed'].includes(s))return '#2E7D32';if(['at_risk','action_needed','blocked','off_track'].includes(s))return '#A23A2A';return '#A45B00'}
function money(value:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value||0))}

const loadingStyle={minHeight:'100vh',background:'#0B1020',color:'#F8FAFC',display:'grid',placeItems:'center',padding:24,fontFamily:'Arial,sans-serif'};
const headerLink={border:'1px solid rgba(255,255,255,.28)',color:'#fff',borderRadius:9,padding:'9px 11px',fontSize:12,fontWeight:850,textDecoration:'none'};
const headerButton={...headerLink,background:'transparent',display:'flex',gap:5,alignItems:'center',cursor:'pointer'};
const panel={background:'#fff',border:'1px solid #DCE7DF',borderRadius:18,padding:20};
const softRow={background:'#F6F9F5',borderRadius:13,padding:14};
const eyebrow={display:'flex',gap:6,alignItems:'center',color:'#2E7D32',fontSize:11,fontWeight:950};
const h2={fontSize:28,margin:'6px 0 14px'};
const muted={fontSize:12,color:'#607284',lineHeight:1.45};
const track={height:8,background:'#DDE7DF',borderRadius:999,overflow:'hidden',marginTop:10};
const bar={height:'100%',background:'#4A873E',borderRadius:999};
const input={width:'100%',boxSizing:'border-box' as const,border:'1px solid #C9D7CD',borderRadius:9,padding:'10px 11px',fontSize:14,background:'#fff',color:'#17384A'};
const tinyInput={border:'1px solid #C9D7CD',borderRadius:8,padding:'7px 8px',fontSize:12,background:'#fff',color:'#17384A',maxWidth:125};
const primaryButton={border:0,background:'#0A533E',color:'#fff',borderRadius:10,padding:'11px 14px',fontWeight:950,cursor:'pointer'};
const smallLightButton={marginTop:8,border:'1px solid #6B8798',background:'transparent',color:'#E7F0F5',borderRadius:8,padding:'7px 9px',fontSize:11,fontWeight:900,display:'flex',gap:5,alignItems:'center',cursor:'pointer'};
const tabButton={border:0,background:'transparent',color:'#607284',borderRadius:9,padding:'9px 11px',fontSize:12,fontWeight:900,cursor:'pointer'};
const activeTab={background:'#E3EFE3',color:'#0A533E'};
const th={textAlign:'left' as const,fontSize:11,color:'#607284',padding:'10px 12px',background:'#EDF3EE'};
const td={padding:'12px',borderTop:'1px solid #E7ECE8',fontSize:13,verticalAlign:'top' as const};
