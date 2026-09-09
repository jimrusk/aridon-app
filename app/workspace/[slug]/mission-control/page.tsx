'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Outcome = {
  id: string;
  category?: string | null;
  name: string;
  baseline_value?: number | null;
  current_value?: number | null;
  target_value?: number | null;
  unit?: string | null;
  status?: string | null;
  notes?: string | null;
  updated_at?: string | null;
};

type MissionRun = {
  id: string;
  objective: string;
  status?: string | null;
  plan?: any;
  final_output?: string | null;
  routing?: any;
  created_at?: string | null;
  completed_at?: string | null;
};

type Action = {
  id: string;
  executive: string;
  title: string;
  expected_outcome?: string | null;
  risk_level?: string | null;
  approval_required: boolean;
  status?: string | null;
  created_at?: string | null;
};

type Memory = {
  id: string;
  executive_id: string;
  memory_type?: string | null;
  summary: string;
  confidence?: number | null;
  source?: string | null;
  last_reinforced_at?: string | null;
};

type IndustryPack = { id: string; name: string; description: string };

type MissionData = {
  businessName: string;
  plan?: string;
  role?: string;
  telemetry: Record<string, number>;
  taskPressure: Array<{ id: string; title: string; owner?: string | null; priority?: string | null; status?: string | null }>;
  projectPulse: Array<{ id: string; name: string; status?: string | null }>;
  recentActivity: Array<{ id: string; summary: string; webResearch: boolean; createdAt?: string | null }>;
  outcomes: Outcome[];
  missionRuns: MissionRun[];
  actionQueue: Action[];
  memories: Memory[];
  industryPacks: IndustryPack[];
  system: Record<string, boolean>;
};

type MissionResult = {
  missionTitle?: string;
  objective?: string;
  industryPack?: string;
  executiveLead?: string;
  supportingExecutives?: string[];
  outcomeMetric?: { name?: string; unit?: string; baseline?: string; target?: string };
  successDefinition?: string;
  phases?: Array<{ name?: string; purpose?: string; actions?: string[] }>;
  immediateActions?: Array<{ owner?: string; action?: string; approvalRequired?: boolean; reason?: string }>;
  approvalGates?: string[];
  risks?: string[];
  nextDecision?: string;
};

const systemLabels: Record<string, string> = {
  companyBrain: 'Company Brain', boardroom: 'Executive Boardroom', execution: 'Execution Team', ceoBrief: 'CEO Brief',
  approvalPolicy: 'Approval Controls', voiceRoom: 'Hands-Free Voice', liveWebResearch: 'Live Web Research',
  growthCommand: 'Growth Command', benchmarkLab: 'Benchmark Lab', outcomeEngine: 'Outcome Engine',
  actionCenter: 'Action Center', industryRouting: 'Industry Routing',
};

export default function MissionControl({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [data, setData] = useState<MissionData | null>(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);
  const [objective, setObjective] = useState('');
  const [successDefinition, setSuccessDefinition] = useState('');
  const [mission, setMission] = useState<MissionResult | null>(null);

  async function load(accessToken?: string) {
    setRefreshing(true); setError('');
    try {
      const db = getBrowserClient();
      const access = accessToken || token || (await db.auth.getSession()).data.session?.access_token || '';
      if (!access) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/mission-control`)}`); return; }
      setToken(access);
      const response = await fetch(`/api/customer/mission-control?slug=${encodeURIComponent(params.slug)}`, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Mission Control could not load.');
      setData(result);
    } catch (err) { setError(err instanceof Error ? err.message : 'Mission Control could not load.'); }
    finally { setRefreshing(false); }
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data: sessionData }) => {
      const access = sessionData.session?.access_token || '';
      if (!access) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/mission-control`)}`); return; }
      setToken(access);
      void load(access);
    });
  }, [params.slug, router]);

  async function runMission() {
    if (!token || running || objective.trim().length < 12) return;
    setRunning(true); setError(''); setMission(null);
    try {
      const response = await fetch('/api/customer/mission-control', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, objective, successDefinition }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Eva could not build this mission.');
      setMission(result.mission || null);
      await load(token);
    } catch (err) { setError(err instanceof Error ? err.message : 'Eva could not build this mission.'); }
    finally { setRunning(false); }
  }

  const pending = useMemo(() => (data?.actionQueue || []).filter((item) => item.approval_required && !['approved', 'completed', 'executed', 'rejected', 'cancelled'].includes(String(item.status || '').toLowerCase())), [data]);

  if (!data && !error) return <main style={loading}>Opening Mission Control…</main>;

  return (
    <main style={page}>
      <style>{`
        *{box-sizing:border-box} button,input,textarea{font:inherit}
        .mission-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:14px}
        .two-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .pack-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        @media(max-width:900px){.mission-grid,.two-grid{grid-template-columns:1fr}.pack-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:560px){.pack-grid{grid-template-columns:1fr}}
      `}</style>
      <div style={shell}>
        <header style={header}>
          <div><div style={eyebrow}>ARIDON · OBJECTIVE TO OUTCOME</div><h1 style={h1}>Mission Control</h1><p style={lead}>{data?.businessName || 'Your company'} · Give Eva the result you want. Aridon routes the work, measures the outcome, and keeps external actions behind owner controls.</p></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => void load()} style={outlineButton}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
            <Link href={`/workspace/${params.slug}/action-center`} style={outlineLink}>Approval Queue</Link>
            <Link href={`/workspace/${params.slug}/executive-suite`} style={mintButton}>Executive Suite</Link>
          </div>
        </header>

        {error && <div style={errorBox}>{error}</div>}
        {data && <>
          <section style={metricGrid}>
            <Metric label="Active projects" value={data.telemetry.activeProjects || 0} />
            <Metric label="Tracked outcomes" value={data.telemetry.trackedOutcomes || 0} />
            <Metric label="Mission runs" value={data.telemetry.missionRuns || 0} />
            <Metric label="Pending approvals" value={data.telemetry.pendingApprovals || 0} alert={Boolean(data.telemetry.pendingApprovals)} />
            <Metric label="Executive memories" value={data.telemetry.executiveMemories || 0} />
            <Metric label="Web research runs" value={data.telemetry.webResearchRuns || 0} />
          </section>

          <section className="mission-grid" style={{ marginBottom: 14 }}>
            <article style={{ ...panel, background: '#0D1728', color: '#fff', borderColor: '#2A3A57' }}>
              <div style={{ ...sectionLabel, color: '#9EF0CF' }}>EVA · ORCHESTRATOR</div>
              <h2 style={{ ...h2, fontSize: 34 }}>What do you want accomplished?</h2>
              <p style={{ color: '#B9C5D6', lineHeight: 1.6, marginTop: -5 }}>Describe the finished result. Eva will choose the industry pack, executive lead, supporting team, measurable outcome and approval gates.</p>
              <textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={6} placeholder="Example: Build a qualified sponsor pipeline for the Southwest Technology Campus and get the ten best targets ready for owner-approved outreach." style={darkTextarea} />
              <textarea value={successDefinition} onChange={(event) => setSuccessDefinition(event.target.value)} rows={3} placeholder="Optional: What does success look like? Example: 10 qualified sponsors with fit, contact path, ask, next step and evidence." style={darkTextarea} />
              <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                <button onClick={() => void runMission()} disabled={running || objective.trim().length < 12} style={{ ...mintAction, opacity: running || objective.trim().length < 12 ? .55 : 1 }}>{running ? 'Eva is building the mission…' : 'Build Mission'}</button>
                <span style={{ color: '#8FA0B8', fontSize: 12 }}>Planning can run automatically. External sends, spending and commitments still require the configured controls.</span>
              </div>
            </article>

            <article style={panel}>
              <div style={sectionLabel}>OWNER CONTROL</div><h2 style={h2}>Autonomy without losing the keys</h2>
              <div style={controlRow}><strong>Research and analysis</strong><span style={readyPill}>READY</span></div>
              <div style={controlRow}><strong>Internal planning and drafts</strong><span style={readyPill}>READY</span></div>
              <div style={controlRow}><strong>External communication</strong><span style={approvalPill}>APPROVAL</span></div>
              <div style={controlRow}><strong>Spending and commitments</strong><span style={approvalPill}>APPROVAL</span></div>
              <div style={controlRow}><strong>Destructive or permanent changes</strong><span style={approvalPill}>APPROVAL</span></div>
              <Link href={`/workspace/${params.slug}/executive-suite?tab=approval`} style={{ ...darkButton, display: 'inline-block', marginTop: 14 }}>Edit approval policy</Link>
            </article>
          </section>

          {mission && <section style={{ ...panel, marginBottom: 14, background: '#E7F5EE', borderColor: '#AED9C5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div><div style={sectionLabel}>NEW MISSION</div><h2 style={{ ...h2, fontSize: 34, marginBottom: 5 }}>{mission.missionTitle || 'Mission ready'}</h2><p style={{ ...muted, maxWidth: 860 }}>{mission.successDefinition || mission.objective}</p></div>
              <div style={{ display: 'grid', gap: 5, alignContent: 'start' }}><span style={darkPill}>{packName(data.industryPacks, mission.industryPack)}</span><span style={darkPill}>Lead: {mission.executiveLead || 'Eva'}</span></div>
            </div>
            {mission.outcomeMetric?.name && <div style={missionMetric}><strong>{mission.outcomeMetric.name}</strong><span>{[mission.outcomeMetric.baseline && `Baseline ${mission.outcomeMetric.baseline}`, mission.outcomeMetric.target && `Target ${mission.outcomeMetric.target}`, mission.outcomeMetric.unit].filter(Boolean).join(' · ')}</span></div>}
            <div className="two-grid" style={{ marginTop: 12 }}>
              <div><div style={miniLabel}>EXECUTIVE TEAM</div><p style={muted}><strong>{mission.executiveLead || 'Eva'}</strong>{mission.supportingExecutives?.length ? ` + ${mission.supportingExecutives.join(', ')}` : ''}</p><div style={miniLabel}>NEXT DECISION</div><p style={muted}>{mission.nextDecision || 'Review the plan and move approved work forward.'}</p></div>
              <div><div style={miniLabel}>APPROVAL GATES</div>{mission.approvalGates?.length ? <ul style={compactList}>{mission.approvalGates.map((item) => <li key={item}>{item}</li>)}</ul> : <p style={muted}>No special gates beyond the workspace approval policy.</p>}</div>
            </div>
            {mission.phases?.length ? <div style={{ marginTop: 12 }}><div style={miniLabel}>MISSION PHASES</div><div style={phaseGrid}>{mission.phases.map((phase, index) => <article key={`${index}-${phase.name}`} style={phaseCard}><strong>{index + 1}. {phase.name || 'Phase'}</strong><p>{phase.purpose}</p>{phase.actions?.length ? <ul style={compactList}>{phase.actions.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul> : null}</article>)}</div></div> : null}
          </section>}

          <section style={{ ...panel, marginBottom: 14 }}>
            <div style={sectionLabel}>INDUSTRY PACKS</div><h2 style={h2}>One Aridon brain, specialized operating knowledge</h2>
            <div className="pack-grid">{data.industryPacks.map((pack) => <article key={pack.id} style={packCard}><strong>{pack.name}</strong><p>{pack.description}</p></article>)}</div>
          </section>

          <section className="two-grid" style={{ marginBottom: 14 }}>
            <article style={panel}>
              <div style={sectionLabel}>OUTCOME ENGINE</div><h2 style={h2}>Prove that the work changed something</h2>
              {data.outcomes.length ? data.outcomes.slice(0, 8).map((outcome) => <OutcomeRow key={outcome.id} outcome={outcome} />) : <p style={muted}>No outcomes are being tracked yet. Building a Mission Control mission can create the first one.</p>}
            </article>
            <article style={panel}>
              <div style={sectionLabel}>APPROVAL QUEUE</div><h2 style={h2}>Decisions still owned by a human</h2>
              {pending.length ? pending.slice(0, 8).map((item) => <div key={item.id} style={listRow}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{item.title}</strong><span style={approvalPill}>APPROVAL</span></div><span>{item.executive} · risk {item.risk_level || 'medium'}</span></div>) : <p style={muted}>No owner approvals are waiting right now.</p>}
              <Link href={`/workspace/${params.slug}/action-center`} style={{ ...darkButton, display: 'inline-block', marginTop: 12 }}>Open Action Center</Link>
            </article>
          </section>

          <section className="two-grid" style={{ marginBottom: 14 }}>
            <article style={panel}>
              <div style={sectionLabel}>MISSION HISTORY</div><h2 style={h2}>What Eva has orchestrated</h2>
              {data.missionRuns.length ? data.missionRuns.slice(0, 8).map((run) => <div key={run.id} style={activityRow}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{run.plan?.missionTitle || run.objective}</strong><small>{formatDate(run.created_at)}</small></div><p>{run.final_output || run.objective}</p><span style={subtlePill}>{packName(data.industryPacks, run.routing?.industryPack)}</span></div>) : <p style={muted}>No Mission Control runs yet.</p>}
            </article>
            <article style={panel}>
              <div style={sectionLabel}>COMPANY BRAIN SIGNALS</div><h2 style={h2}>What the executive team is retaining</h2>
              {data.memories.length ? data.memories.slice(0, 8).map((item) => <div key={item.id} style={activityRow}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{item.executive_id}</strong><small>{item.memory_type || 'memory'}</small></div><p>{item.summary}</p></div>) : <p style={muted}>No executive memories have been reinforced yet.</p>}
            </article>
          </section>

          <section className="two-grid" style={{ marginBottom: 14 }}>
            <article style={panel}>
              <div style={sectionLabel}>SYSTEM STATUS</div><h2 style={h2}>What Aridon can use now</h2>
              <div style={statusGrid}>{Object.entries(data.system).map(([key, on]) => <div key={key} style={statusRow}><span style={statusDot(on)} /><strong>{systemLabels[key] || key}</strong><span style={{ marginLeft: 'auto', color: on ? '#1D7A56' : '#8A5A00', fontSize: 12, fontWeight: 900 }}>{on ? 'READY' : 'NEEDS CONNECTION'}</span></div>)}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}><Link href={`/workspace/${params.slug}/systems`} style={darkButton}>Systems Fabric</Link><Link href={`/workspace/${params.slug}/benchmark`} style={outlineDark}>Benchmark Lab</Link><Link href={`/workspace/${params.slug}/technology-radar`} style={outlineDark}>Technology Radar</Link></div>
            </article>
            <article style={panel}>
              <div style={sectionLabel}>OPERATING PRESSURE</div><h2 style={h2}>Where attention can jam</h2>
              {data.taskPressure.length ? data.taskPressure.slice(0, 8).map((task) => <div key={task.id} style={listRow}><strong>{task.title}</strong><span>{[task.owner, task.priority, task.status].filter(Boolean).join(' · ')}</span></div>) : <p style={muted}>No task pressure detected.</p>}
            </article>
          </section>

          <section style={{ ...panel, background: '#0D1728', color: '#fff', borderColor: '#2A3A57' }}>
            <div style={{ ...sectionLabel, color: '#9EF0CF' }}>THE ARIDON LOOP</div>
            <h2 style={{ ...h2, fontSize: 36 }}>Goal → Route → Work → Approve → Measure → Learn</h2>
            <p style={{ color: '#BBC7D7', lineHeight: 1.65, maxWidth: 920 }}>The moat is not a prettier chat box. It is the feedback loop between company memory, specialized agents, controlled actions and measured results. Every completed mission should make the next mission smarter.</p>
          </section>
        </>}
      </div>
    </main>
  );
}

function Metric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) { return <article style={{ ...metric, borderColor: alert ? '#8E6B34' : '#2A3A57' }}><div style={{ color: '#8FA0B8', fontSize: 11, fontWeight: 900 }}>{label.toUpperCase()}</div><div style={{ fontSize: 38, fontWeight: 950, marginTop: 5, color: alert ? '#F4D06F' : '#F7FAFC' }}>{value}</div></article>; }
function formatDate(value?: string | null) { if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(); }
function statusDot(on: boolean) { return { width: 10, height: 10, borderRadius: 999, background: on ? '#42D392' : '#F4D06F', flex: '0 0 auto' }; }
function packName(packs: IndustryPack[], id?: string | null) { return packs.find((pack) => pack.id === id)?.name || id || 'Business Core'; }
function progress(outcome: Outcome) {
  const baseline = Number(outcome.baseline_value); const current = Number(outcome.current_value); const target = Number(outcome.target_value);
  if (![baseline, current, target].every(Number.isFinite) || target === baseline) return null;
  return Math.max(0, Math.min(100, ((current - baseline) / (target - baseline)) * 100));
}
function OutcomeRow({ outcome }: { outcome: Outcome }) {
  const pct = progress(outcome);
  const values = [outcome.current_value != null ? `Current ${outcome.current_value}${outcome.unit ? ` ${outcome.unit}` : ''}` : '', outcome.target_value != null ? `Target ${outcome.target_value}${outcome.unit ? ` ${outcome.unit}` : ''}` : '', outcome.status || 'tracking'].filter(Boolean).join(' · ');
  return <div style={outcomeRow}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{outcome.name}</strong><small>{outcome.category || 'outcome'}</small></div><span>{values}</span>{pct != null && <div style={track}><div style={{ ...fill, width: `${pct}%` }} /></div>}</div>;
}

const page = { minHeight: '100vh', background: '#07101D', color: '#F7FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 20px 72px' };
const shell = { maxWidth: 1260, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 28 };
const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(46px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '10px 0 14px' };
const h2 = { fontSize: 27, margin: '8px 0 16px' };
const lead = { color: '#B9C5D6', fontSize: 18, lineHeight: 1.6, maxWidth: 870, margin: 0 };
const metricGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 16 };
const metric = { background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 15, padding: 16 };
const panel = { background: '#F6F3EB', color: '#171717', borderRadius: 18, padding: 20, border: '1px solid #D7D0C3' };
const sectionLabel = { fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const miniLabel = { fontSize: 10, fontWeight: 950, letterSpacing: 1, marginTop: 8 };
const statusGrid = { display: 'grid', gap: 7 };
const statusRow = { display: 'flex', gap: 9, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #E6E0D6' };
const activityRow = { borderTop: '1px solid #E6E0D6', padding: '12px 0' };
const listRow = { borderTop: '1px solid #E6E0D6', padding: '11px 0', display: 'grid', gap: 4 };
const outcomeRow = { borderTop: '1px solid #E6E0D6', padding: '12px 0', display: 'grid', gap: 5 };
const muted = { color: '#6B665D', lineHeight: 1.6 };
const mintButton = { background: '#9EF0CF', color: '#07130F', padding: '12px 16px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const outlineButton = { background: 'transparent', border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, fontWeight: 900, cursor: 'pointer' };
const outlineLink = { border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
const darkButton = { background: '#171717', color: '#fff', padding: '11px 14px', borderRadius: 10, textDecoration: 'none', fontWeight: 900 };
const outlineDark = { border: '1px solid #8D877C', color: '#171717', padding: '10px 13px', borderRadius: 10, textDecoration: 'none', fontWeight: 900 };
const errorBox = { background: '#3B1F28', color: '#FFD8E0', border: '1px solid #7C4353', borderRadius: 12, padding: 14, marginBottom: 14 };
const loading = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#07101D', color: '#fff', fontFamily: 'Arial, sans-serif' };
const darkTextarea = { width: '100%', marginTop: 9, border: '1px solid #324763', background: '#07101D', color: '#F7FAFC', borderRadius: 12, padding: 13, resize: 'vertical' as const, lineHeight: 1.55 };
const mintAction = { background: '#9EF0CF', color: '#07130F', border: 0, borderRadius: 10, padding: '12px 16px', fontWeight: 950, cursor: 'pointer' };
const controlRow = { borderTop: '1px solid #E1DBCF', padding: '11px 0', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' };
const readyPill = { background: '#DDF5EA', color: '#176B4A', borderRadius: 999, padding: '5px 8px', fontSize: 10, fontWeight: 950 };
const approvalPill = { background: '#F8E9C7', color: '#76500B', borderRadius: 999, padding: '5px 8px', fontSize: 10, fontWeight: 950, whiteSpace: 'nowrap' as const };
const darkPill = { background: '#171717', color: '#fff', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 900 };
const subtlePill = { display: 'inline-block', background: '#ECE7DD', color: '#5B554B', borderRadius: 999, padding: '4px 7px', fontSize: 10, fontWeight: 900 };
const missionMetric = { marginTop: 12, border: '1px solid #BBDACB', background: '#F7FFFB', borderRadius: 12, padding: 13, display: 'grid', gap: 4 };
const compactList = { margin: '7px 0 0', paddingLeft: 18, lineHeight: 1.55 };
const phaseGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 9, marginTop: 8 };
const phaseCard = { background: '#F7FFFB', border: '1px solid #BBDACB', borderRadius: 11, padding: 12 };
const packCard = { border: '1px solid #DDD5C9', borderRadius: 12, padding: 13, background: '#FBF9F4' };
const track = { height: 7, background: '#DED8CE', borderRadius: 999, overflow: 'hidden' };
const fill = { height: '100%', background: '#171717', borderRadius: 999 };
