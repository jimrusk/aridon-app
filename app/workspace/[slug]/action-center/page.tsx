'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';
import { benchmarkScenarios } from '../../../../lib/aridonBenchmark';

type Action = {
  id: string;
  executive: string;
  action_type: string;
  adapter_key: string;
  title: string;
  payload?: Record<string, unknown>;
  rationale?: string | null;
  expected_outcome?: string | null;
  risk_level: string;
  approval_required: boolean;
  status: string;
  approved_at?: string | null;
  executed_at?: string | null;
  attempt_count?: number;
  result?: Record<string, unknown>;
  error?: string | null;
  created_at: string;
};

type Execution = {
  id: string;
  action_id: string;
  adapter_key: string;
  attempt_no: number;
  status: string;
  output?: Record<string, unknown>;
  error?: string | null;
  started_at: string;
  finished_at?: string | null;
};

type Adapter = {
  key: string;
  label: string;
  category: 'internal' | 'external' | 'manual';
  requiresApproval: boolean;
  description: string;
};

type CompetitorRun = { id: string; competitor_name: string; scenario_title: string; overall_score: number; verdict?: string; created_at: string };
type ConnectionStatus = { configured?: boolean; connected?: boolean; email?: string; missing?: string[] };

type ActionForm = {
  executive: string;
  adapterKey: string;
  title: string;
  rationale: string;
  expectedOutcome: string;
  riskLevel: string;
  owner: string;
  priority: string;
  to: string;
  subject: string;
  body: string;
  summary: string;
  start: string;
  end: string;
  timeZone: string;
  location: string;
  attendees: string;
};

const initialForm: ActionForm = {
  executive: 'Eva',
  adapterKey: 'internal_task',
  title: '',
  rationale: '',
  expectedOutcome: '',
  riskLevel: 'medium',
  owner: 'Eva',
  priority: 'medium',
  to: '',
  subject: '',
  body: '',
  summary: '',
  start: '',
  end: '',
  timeZone: 'America/Denver',
  location: '',
  attendees: '',
};

export default function ActionCenter({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [actions, setActions] = useState<Action[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [controlRole, setControlRole] = useState(false);
  const [role, setRole] = useState('member');
  const [runs, setRuns] = useState<CompetitorRun[]>([]);
  const [google, setGoogle] = useState<ConnectionStatus>({});
  const [microsoft, setMicrosoft] = useState<ConnectionStatus>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [executingId, setExecutingId] = useState('');
  const [actionForm, setActionForm] = useState<ActionForm>(initialForm);
  const [comp, setComp] = useState({ competitorName: '', scenarioId: benchmarkScenarios[0].id as string, answer: '' });
  const [compResult, setCompResult] = useState<{ run?: CompetitorRun } | null>(null);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const access = data.session?.access_token || '';
      if (!access) {
        router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/action-center`)}`);
        return;
      }
      setToken(access);
      await load(access);
    });
  }, [params.slug, router]);

  const selectedAdapter = useMemo(
    () => adapters.find((adapter) => adapter.key === actionForm.adapterKey),
    [adapters, actionForm.adapterKey],
  );

  async function load(access = token) {
    if (!access) return;
    setError('');
    const headers = { Authorization: `Bearer ${access}` };
    const [actionResponse, competitorResponse, googleResponse, microsoftResponse] = await Promise.all([
      fetch(`/api/customer/action-queue?slug=${encodeURIComponent(params.slug)}`, { headers, cache: 'no-store' }),
      fetch(`/api/customer/competitor-benchmark?slug=${encodeURIComponent(params.slug)}`, { headers, cache: 'no-store' }),
      fetch('/api/gmail/status', { cache: 'no-store' }),
      fetch('/api/microsoft365/status', { cache: 'no-store' }),
    ]);
    const actionData = await actionResponse.json().catch(() => ({}));
    const competitorData = await competitorResponse.json().catch(() => ({}));
    const googleData = await googleResponse.json().catch(() => ({}));
    const microsoftData = await microsoftResponse.json().catch(() => ({}));
    if (!actionResponse.ok || !competitorResponse.ok) {
      setError(actionData.error || competitorData.error || 'Unable to load Action Center.');
      return;
    }
    setActions(actionData.actions || []);
    setExecutions(actionData.executions || []);
    setAdapters(actionData.adapters || []);
    setControlRole(Boolean(actionData.controlRole));
    setRole(actionData.role || 'member');
    setRuns(competitorData.runs || []);
    setGoogle(googleData || {});
    setMicrosoft(microsoftData || {});
  }

  function buildPayload() {
    if (actionForm.adapterKey === 'internal_task') {
      return { title: actionForm.title, owner: actionForm.owner || actionForm.executive, priority: actionForm.priority };
    }
    if (actionForm.adapterKey === 'email_send') {
      return { to: actionForm.to.trim(), subject: actionForm.subject.trim(), body: actionForm.body.trim() };
    }
    if (actionForm.adapterKey === 'calendar_create') {
      const attendees = actionForm.attendees.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
      return {
        summary: actionForm.summary.trim() || actionForm.title.trim(),
        description: actionForm.rationale.trim(),
        location: actionForm.location.trim(),
        start: actionForm.start ? new Date(actionForm.start).toISOString() : '',
        end: actionForm.end ? new Date(actionForm.end).toISOString() : '',
        timeZone: actionForm.timeZone.trim(),
        attendees,
      };
    }
    return {};
  }

  async function propose() {
    if (!actionForm.title.trim()) {
      setError('Give the action a clear title first.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/customer/action-queue', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: params.slug,
          executive: actionForm.executive,
          actionType: actionForm.adapterKey,
          adapterKey: actionForm.adapterKey,
          title: actionForm.title,
          rationale: actionForm.rationale,
          expectedOutcome: actionForm.expectedOutcome,
          riskLevel: actionForm.riskLevel,
          payload: buildPayload(),
          approvalRequired: actionForm.adapterKey !== 'internal_task',
          source: 'action-center',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to propose action.');
      setNotice(data.action?.status === 'approved' ? 'Action created and ready to execute.' : 'Action added to the owner approval queue.');
      setActionForm({ ...initialForm, executive: actionForm.executive, adapterKey: actionForm.adapterKey, owner: actionForm.owner });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to propose action.');
    } finally {
      setBusy(false);
    }
  }

  async function change(id: string, status: string) {
    setError('');
    setNotice('');
    const response = await fetch('/api/customer/action-queue', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: params.slug, id, status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || 'Unable to update action.');
      return;
    }
    setNotice(status === 'approved' ? 'Action approved. It is now eligible for execution.' : status === 'rejected' ? 'Action rejected.' : 'Action completed.');
    await load();
  }

  async function execute(id: string) {
    setExecutingId(id);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/customer/action-queue/execute', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Action execution failed.');
      setNotice(data.alreadyCompleted ? 'That action had already completed.' : 'Action executed and the result was recorded.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Action execution failed.');
      await load();
    } finally {
      setExecutingId('');
    }
  }

  async function scoreCompetitor() {
    setCompResult(null);
    setError('');
    const response = await fetch('/api/customer/competitor-benchmark', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: params.slug, ...comp }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || 'Comparison failed.');
      return;
    }
    setCompResult(data);
    await load();
  }

  function adapterLabel(action: Action) {
    return adapters.find((adapter) => adapter.key === action.adapter_key)?.label || action.adapter_key || 'Manual';
  }

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>ARIDON · ACTION FABRIC V1</div>
            <h1 style={h1}>Action Center</h1>
            <p style={lead}>Turn an approved decision into a real, auditable action. Aridon can create internal tasks now and execute approved email or calendar work through the connected Google or Microsoft account.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={`/workspace/${params.slug}/mission-control`} style={outline}>Mission Control</Link>
            <Link href="/executive-ops/control-center" style={mint}>Connections & controls</Link>
          </div>
        </header>

        {error && <div style={errorBox}>{error}</div>}
        {notice && <div style={noticeBox}>{notice}</div>}

        <section style={connectionGrid}>
          <div style={darkPanel}>
            <div style={labelLight}>EXECUTION CONTROL</div>
            <strong style={{ fontSize: 20 }}>{controlRole ? 'Owner/Admin execution enabled' : 'Approval view only'}</strong>
            <p style={darkMuted}>Signed-in role: {role}. External actions still require approval and obey the Executive Operations emergency stop.</p>
          </div>
          <div style={darkPanel}>
            <div style={labelLight}>GOOGLE WORKSPACE</div>
            <strong>{google.connected ? `Connected · ${google.email || 'Google account'}` : google.configured ? 'Ready to connect' : 'Needs configuration'}</strong>
            <p style={darkMuted}>Gmail send + Google Calendar write</p>
            {!google.connected && google.configured && <a href={`/api/gmail/connect?returnTo=${encodeURIComponent(`/workspace/${params.slug}/action-center`)}`} style={smallDark}>Connect Google</a>}
          </div>
          <div style={darkPanel}>
            <div style={labelLight}>MICROSOFT 365</div>
            <strong>{microsoft.connected ? `Connected · ${microsoft.email || 'Microsoft account'}` : microsoft.configured ? 'Ready to connect' : 'Needs configuration'}</strong>
            <p style={darkMuted}>Outlook send + Microsoft Calendar write</p>
            {!microsoft.connected && microsoft.configured && <a href={`/api/microsoft365/connect?returnTo=${encodeURIComponent(`/workspace/${params.slug}/action-center`)}`} style={smallDark}>Connect Microsoft</a>}
          </div>
        </section>

        <section style={grid}>
          <article style={panel}>
            <div style={label}>CREATE AN EXECUTABLE ACTION</div>
            <h2 style={sectionTitle}>What should Aridon do?</h2>
            <select style={input} value={actionForm.adapterKey} onChange={(event) => setActionForm({ ...actionForm, adapterKey: event.target.value })}>
              {(adapters.length ? adapters : [
                { key: 'internal_task', label: 'Create internal task' },
                { key: 'email_send', label: 'Send approved email' },
                { key: 'calendar_create', label: 'Create approved calendar event' },
                { key: 'manual', label: 'Manual / not connected yet' },
              ]).map((adapter) => <option key={adapter.key} value={adapter.key}>{adapter.label}</option>)}
            </select>
            {selectedAdapter && <p style={muted}>{selectedAdapter.description}</p>}
            <input style={input} placeholder="Action title" value={actionForm.title} onChange={(event) => setActionForm({ ...actionForm, title: event.target.value })} />
            <input style={input} placeholder="Executive owner, for example Eva or Ledger" value={actionForm.executive} onChange={(event) => setActionForm({ ...actionForm, executive: event.target.value })} />

            {actionForm.adapterKey === 'internal_task' && <>
              <input style={input} placeholder="Task owner" value={actionForm.owner} onChange={(event) => setActionForm({ ...actionForm, owner: event.target.value })} />
              <select style={input} value={actionForm.priority} onChange={(event) => setActionForm({ ...actionForm, priority: event.target.value })}>
                <option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option><option value="urgent">Urgent</option>
              </select>
            </>}

            {actionForm.adapterKey === 'email_send' && <>
              <input style={input} type="email" placeholder="Recipient email" value={actionForm.to} onChange={(event) => setActionForm({ ...actionForm, to: event.target.value })} />
              <input style={input} placeholder="Email subject" value={actionForm.subject} onChange={(event) => setActionForm({ ...actionForm, subject: event.target.value })} />
              <textarea style={{ ...input, minHeight: 150 }} placeholder="Email body" value={actionForm.body} onChange={(event) => setActionForm({ ...actionForm, body: event.target.value })} />
            </>}

            {actionForm.adapterKey === 'calendar_create' && <>
              <input style={input} placeholder="Event title" value={actionForm.summary} onChange={(event) => setActionForm({ ...actionForm, summary: event.target.value })} />
              <div style={twoCol}><label style={fieldLabel}>Start<input style={input} type="datetime-local" value={actionForm.start} onChange={(event) => setActionForm({ ...actionForm, start: event.target.value })} /></label><label style={fieldLabel}>End<input style={input} type="datetime-local" value={actionForm.end} onChange={(event) => setActionForm({ ...actionForm, end: event.target.value })} /></label></div>
              <input style={input} placeholder="Time zone, for example America/Denver" value={actionForm.timeZone} onChange={(event) => setActionForm({ ...actionForm, timeZone: event.target.value })} />
              <input style={input} placeholder="Location" value={actionForm.location} onChange={(event) => setActionForm({ ...actionForm, location: event.target.value })} />
              <textarea style={{ ...input, minHeight: 80 }} placeholder="Attendee emails, separated by commas or lines" value={actionForm.attendees} onChange={(event) => setActionForm({ ...actionForm, attendees: event.target.value })} />
            </>}

            <textarea style={{ ...input, minHeight: 90 }} placeholder="Why this action matters" value={actionForm.rationale} onChange={(event) => setActionForm({ ...actionForm, rationale: event.target.value })} />
            <input style={input} placeholder="Expected outcome" value={actionForm.expectedOutcome} onChange={(event) => setActionForm({ ...actionForm, expectedOutcome: event.target.value })} />
            <select style={input} value={actionForm.riskLevel} onChange={(event) => setActionForm({ ...actionForm, riskLevel: event.target.value })}>
              <option value="low">Low risk</option><option value="medium">Medium risk</option><option value="high">High risk</option>
            </select>
            <button style={primary} onClick={() => void propose()} disabled={busy}>{busy ? 'Creating action…' : 'Create action'}</button>
          </article>

          <article style={panel}>
            <div style={label}>ACTION FABRIC RULES</div>
            <h2 style={sectionTitle}>What happens next</h2>
            <ol style={rulesList}>
              <li>Eva or another executive proposes a structured action.</li>
              <li>External sends and calendar commitments enter the approval queue.</li>
              <li>An owner or admin approves the exact action and payload.</li>
              <li>Action Fabric claims the action once, executes the connected adapter, and records the attempt.</li>
              <li>The queue stores success, failure, or a blocked reason so nothing disappears into a black box.</li>
            </ol>
            <div style={result}><strong>Available now</strong><p style={muted}>Internal tasks · Gmail / Outlook sends · Google / Microsoft calendar events · manual controlled steps</p></div>
          </article>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={label}>LIVE APPROVAL + EXECUTION QUEUE</div>
          <h2 style={sectionTitle}>Decisions waiting to move</h2>
          {actions.length === 0 ? <p style={muted}>No actions yet. Create one above or let Mission Control propose the next step.</p> : actions.map((action) => {
            const executable = action.adapter_key !== 'manual';
            const retryable = ['blocked', 'failed'].includes(action.status) && Boolean(action.approved_at);
            return <div key={action.id} style={row}>
              <div style={{ flex: '1 1 560px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><strong>{action.title}</strong><span style={badge}>{action.status}</span><span style={badgeSoft}>{adapterLabel(action)}</span></div>
                <div style={muted}>{action.executive} · risk {action.risk_level} · attempts {action.attempt_count || 0}</div>
                {action.rationale && <div style={muted}>Why: {action.rationale}</div>}
                {action.expected_outcome && <div style={muted}>Expected: {action.expected_outcome}</div>}
                {action.error && <div style={inlineError}>Blocked/failed: {action.error}</div>}
                {action.status === 'completed' && action.result && <div style={inlineSuccess}>Result: {summarizeResult(action.result)}</div>}
              </div>
              {controlRole && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {action.status === 'proposed' && <><button style={small} onClick={() => void change(action.id, 'approved')}>Approve</button><button style={small} onClick={() => void change(action.id, 'rejected')}>Reject</button></>}
                {action.status === 'approved' && executable && <button style={executeButton} disabled={executingId === action.id} onClick={() => void execute(action.id)}>{executingId === action.id ? 'Executing…' : 'Execute now'}</button>}
                {retryable && executable && <button style={executeButton} disabled={executingId === action.id} onClick={() => void execute(action.id)}>{executingId === action.id ? 'Retrying…' : 'Retry execution'}</button>}
                {action.status === 'approved' && !executable && <button style={small} onClick={() => void change(action.id, 'completed')}>Mark manual step complete</button>}
              </div>}
            </div>;
          })}
        </section>

        <section style={gridLower}>
          <article style={panel}>
            <div style={label}>EXECUTION LEDGER</div>
            <h2 style={sectionTitle}>Immutable attempts</h2>
            {executions.length === 0 ? <p style={muted}>No execution attempts yet.</p> : executions.slice(0, 20).map((execution) => <div key={execution.id} style={rowCompact}>
              <div><strong>{execution.adapter_key}</strong><div style={muted}>Attempt {execution.attempt_no} · {execution.status}</div>{execution.error && <div style={inlineError}>{execution.error}</div>}</div>
              <div style={muted}>{new Date(execution.started_at).toLocaleString()}</div>
            </div>)}
          </article>

          <article style={panel}>
            <div style={label}>SAME-RUBRIC COMPETITOR TEST</div>
            <h2 style={sectionTitle}>Keep proving the advantage</h2>
            <input style={input} placeholder="Competitor/product name" value={comp.competitorName} onChange={(event) => setComp({ ...comp, competitorName: event.target.value })} />
            <select style={input} value={comp.scenarioId} onChange={(event) => setComp({ ...comp, scenarioId: event.target.value })}>{benchmarkScenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.title}</option>)}</select>
            <textarea style={{ ...input, minHeight: 150 }} placeholder="Paste the competitor's visible answer" value={comp.answer} onChange={(event) => setComp({ ...comp, answer: event.target.value })} />
            <button style={primary} onClick={() => void scoreCompetitor()}>Score under Aridon rubric</button>
            {compResult?.run && <div style={result}><strong>{compResult.run.competitor_name}: {compResult.run.overall_score}/100</strong><p>{compResult.run.verdict}</p></div>}
            {runs.slice(0, 5).map((run) => <div key={run.id} style={rowCompact}><div><strong>{run.competitor_name}</strong><div style={muted}>{run.scenario_title}</div></div><strong>{run.overall_score}/100</strong></div>)}
          </article>
        </section>
      </div>
    </main>
  );
}

function summarizeResult(result: Record<string, unknown>) {
  if (result.sent) return `${String(result.provider || 'connected provider')} email sent${result.to ? ` to ${String(result.to)}` : ''}`;
  if (result.created && result.eventId) return `${String(result.provider || 'connected provider')} calendar event created`;
  if (result.created && result.task && typeof result.task === 'object') return 'Internal task created';
  if (result.manual) return 'Manual step completed';
  return 'Execution completed and result recorded';
}

const page = { minHeight: '100vh', background: '#07101D', color: '#F7FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 20px 72px' };
const shell = { maxWidth: 1180, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 24 };
const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(46px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '10px 0 14px' };
const lead = { color: '#B9C5D6', fontSize: 18, lineHeight: 1.6, maxWidth: 880 };
const connectionGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginBottom: 14 };
const darkPanel = { background: '#0D1828', border: '1px solid #263A55', borderRadius: 16, padding: 16, display: 'grid', gap: 8 };
const labelLight = { color: '#9EF0CF', fontSize: 10, fontWeight: 950, letterSpacing: 1 };
const darkMuted = { color: '#9CACBF', fontSize: 12, lineHeight: 1.5, margin: 0 };
const smallDark = { color: '#9EF0CF', fontSize: 12, fontWeight: 900, textDecoration: 'none' };
const grid = { display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(300px,.65fr)', gap: 14 };
const gridLower = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14, marginTop: 14 };
const panel = { background: '#F6F3EB', color: '#171717', borderRadius: 18, padding: 20, border: '1px solid #D7D0C3' };
const label = { fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const sectionTitle = { margin: '8px 0 12px', fontSize: 26 };
const input = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #C9C1B4', borderRadius: 9, padding: 11, font: 'inherit', marginTop: 8, background: '#fff', color: '#171717' };
const fieldLabel = { fontSize: 12, fontWeight: 850 };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginTop: 8 };
const primary = { marginTop: 12, background: '#171717', color: '#fff', border: 0, borderRadius: 10, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' };
const executeButton = { border: 0, background: '#0F6B4F', color: '#fff', borderRadius: 8, padding: '8px 11px', fontWeight: 900, cursor: 'pointer' };
const row = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: '14px 0', borderTop: '1px solid #DED7CB', flexWrap: 'wrap' as const };
const rowCompact = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #DED7CB', flexWrap: 'wrap' as const };
const muted = { color: '#6A655D', fontSize: 12, lineHeight: 1.5 };
const small = { border: '1px solid #BFB7AA', background: '#fff', borderRadius: 8, padding: '7px 9px', fontWeight: 850, cursor: 'pointer' };
const result = { background: '#E6F4EE', padding: 12, borderRadius: 10, marginTop: 12 };
const mint = { background: '#9EF0CF', color: '#07130F', padding: '12px 16px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const outline = { border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
const errorBox = { background: '#FCE5EA', color: '#7B233A', borderRadius: 10, padding: 12, marginBottom: 14 };
const noticeBox = { background: '#DDF4E8', color: '#174B38', borderRadius: 10, padding: 12, marginBottom: 14 };
const inlineError = { color: '#8A2E3F', fontSize: 12, marginTop: 5 };
const inlineSuccess = { color: '#176246', fontSize: 12, marginTop: 5, fontWeight: 800 };
const badge = { background: '#ECE5D9', borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' as const };
const badgeSoft = { background: '#E2EEEA', borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 850 };
const rulesList = { paddingLeft: 22, lineHeight: 1.7, color: '#4F4A43' };
