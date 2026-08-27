'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Connector = { id: string; name: string; status: 'connected' | 'ready' | 'missing'; purpose: string };
type Action = { id?: string; run_id?: string; channel: string; action_type?: string; actionType?: string; title: string; detail: string; risk: 'low' | 'medium' | 'high'; approval_required?: boolean; approvalRequired?: boolean; status: string };
type Report = {
  healthScore: number;
  headline: string;
  summary: string;
  priorities: string[];
  opportunities: string[];
  actions: Action[];
  connectors: Connector[];
  website: { url: string; reachable: boolean; statusCode: number | null; title: string | null; metaDescription: string | null; canonical: string | null; h1Count: number; noindex: boolean; textCharacters: number; error?: string };
  generatedAt: string;
  persisted?: boolean;
  runId?: string | null;
};
type HistoryRun = { id: string; created_at: string; trigger: string; business_name: string; health_score: number | null; report: any; snapshot: any };

export default function MarketingAutopilotPage() {
  const [website, setWebsite] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [runs, setRuns] = useState<HistoryRun[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/marketing-autopilot', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'History could not be loaded.');
      setRuns(Array.isArray(data.runs) ? data.runs : []);
      setActions(Array.isArray(data.actions) ? data.actions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'History could not be loaded.');
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const approvalQueue = useMemo(() => actions.filter((action) => Boolean(action.approval_required) && action.status === 'queued'), [actions]);
  const lastRun = runs[0];

  async function runNow() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/marketing-autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: 'Aridon', ...(website.trim() ? { website: website.trim() } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Autopilot run failed.');
      setReport(data);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Autopilot run failed.');
    } finally {
      setBusy(false);
    }
  }

  async function reviewAction(id: string | undefined, status: 'approved' | 'rejected') {
    if (!id) return;
    setError('');
    try {
      const response = await fetch('/api/marketing-autopilot', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Approval could not be saved.');
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval could not be saved.');
    }
  }

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>ARIDON · MARKETING AUTOPILOT</div>
            <h1 style={hero}>A marketing engine that wakes up, finds the next move, and builds the work.</h1>
            <p style={lead}>Aridon now runs the Helena-style loop inside the existing Growth Command system: scan, diagnose, prioritize, draft, queue, measure, repeat. Research and draft creation can happen automatically. Publishing, outbound messages, paid-media changes and consequential production edits stay behind approval gates.</p>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Link href="/business-os/growth-command" style={ghostButton}>Growth Command</Link>
            <Link href="/growth-desk" style={ghostButton}>Growth Desk</Link>
          </div>
        </header>

        <section style={runPanel}>
          <div>
            <div style={eyebrow}>RUN THE LOOP NOW</div>
            <h2 style={{ margin: '6px 0 7px', fontSize: 27 }}>Audit Aridon or any public website.</h2>
            <p style={muted}>Leave the URL blank to use Aridon&apos;s configured production URL. The daily scheduled run uses the same engine.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,1fr) auto', gap: 9, alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={smallLabel}>Website</span>
              <input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://your-company.com" style={input} />
            </label>
            <button onClick={runNow} disabled={busy} style={{ ...primaryButton, border: 0, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .7 : 1 }}>
              {busy ? 'Autopilot Running…' : 'Run Autopilot'}
            </button>
          </div>
          {error ? <div style={errorBox}>{error}</div> : null}
        </section>

        <section style={metricGrid}>
          <Metric title="Latest score" value={String(report?.healthScore ?? lastRun?.health_score ?? '—')} sub="Evidence-based marketing health" />
          <Metric title="Approval queue" value={String(approvalQueue.length)} sub="External/high-impact actions waiting" />
          <Metric title="Stored runs" value={String(runs.length)} sub="Recent optimization history" />
          <Metric title="Daily loop" value="ON" sub="Vercel scheduled runner included" />
        </section>

        {report ? <ReportView report={report} /> : (
          <section style={card}>
            <div style={eyebrow}>READY</div>
            <h2 style={{ margin: '7px 0 8px', fontSize: 28 }}>Run the first live optimization cycle.</h2>
            <p style={muted}>The report will show the website evidence Aridon actually observed, the priorities it chose, which work can proceed automatically and what requires your approval.</p>
          </section>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 14, marginTop: 15 }}>
          <article style={card}>
            <div style={eyebrow}>APPROVAL QUEUE</div>
            <h2 style={sectionTitle}>Human control stays where it matters.</h2>
            <div style={{ display: 'grid', gap: 9 }}>
              {approvalQueue.length ? approvalQueue.slice(0, 10).map((action) => (
                <div key={action.id || `${action.channel}-${action.title}`} style={queueItem}>
                  <div>
                    <div style={{ fontSize: 11, color: '#79E0BC', fontWeight: 900 }}>{action.channel} · {action.risk.toUpperCase()}</div>
                    <strong style={{ display: 'block', marginTop: 4 }}>{action.title}</strong>
                    <div style={{ color: '#AEB9CB', fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>{action.detail}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    <button onClick={() => reviewAction(action.id, 'approved')} style={approveButton}>Approve</button>
                    <button onClick={() => reviewAction(action.id, 'rejected')} style={rejectButton}>Reject</button>
                  </div>
                </div>
              )) : <div style={emptyState}>No approval-gated actions are waiting.</div>}
            </div>
          </article>

          <article style={card}>
            <div style={eyebrow}>RUN HISTORY</div>
            <h2 style={sectionTitle}>The loop remembers.</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {runs.length ? runs.slice(0, 8).map((run) => (
                <div key={run.id} style={historyRow}>
                  <div><strong>{run.business_name}</strong><div style={{ color: '#8392A6', fontSize: 11, marginTop: 2 }}>{new Date(run.created_at).toLocaleString()} · {run.trigger}</div></div>
                  <div style={{ fontSize: 24, fontWeight: 950 }}>{run.health_score ?? '—'}</div>
                </div>
              )) : <div style={emptyState}>No stored Autopilot runs yet.</div>}
            </div>
          </article>
        </section>

        <section style={{ ...card, marginTop: 15 }}>
          <div style={eyebrow}>AUTONOMY POLICY</div>
          <h2 style={sectionTitle}>Fast where reversible. Gated where consequential.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10 }}>
            <Policy title="Automatic" items={['Website diagnostics', 'SEO and competitor analysis', 'Opportunity scoring', 'Content and campaign drafts', 'Conversion hypotheses', 'Daily optimization report']} />
            <Policy title="Approval required" items={['External messages', 'Publishing to public channels', 'Changing paid-ad spend', 'Pausing or launching ads', 'Material production-site edits', 'Legal or financial commitments']} />
          </div>
        </section>
      </div>
    </main>
  );
}

function ReportView({ report }: { report: Report }) {
  return (
    <section style={{ ...card, marginTop: 15, background: '#0D1926' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start', flexWrap: 'wrap' }}>
        <div>
          <div style={eyebrow}>LATEST LIVE RUN</div>
          <h2 style={{ margin: '7px 0 6px', fontSize: 30 }}>{report.headline}</h2>
          <p style={muted}>{report.summary}</p>
        </div>
        <div style={scoreCircle}>{report.healthScore}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10, marginTop: 16 }}>
        <div style={innerCard}><div style={smallLabel}>PRIORITIES</div>{report.priorities.map((item) => <div key={item} style={listRow}>→ {item}</div>)}</div>
        <div style={innerCard}><div style={smallLabel}>OPPORTUNITIES</div>{report.opportunities.map((item) => <div key={item} style={listRow}>✦ {item}</div>)}</div>
      </div>

      <div style={{ ...innerCard, marginTop: 10 }}>
        <div style={smallLabel}>WEBSITE EVIDENCE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8, marginTop: 8 }}>
          <Evidence name="Reachable" value={report.website.reachable ? `Yes · ${report.website.statusCode}` : 'No'} />
          <Evidence name="Page title" value={report.website.title || 'Missing'} />
          <Evidence name="Meta description" value={report.website.metaDescription ? 'Present' : 'Missing'} />
          <Evidence name="Canonical" value={report.website.canonical ? 'Present' : 'Missing'} />
          <Evidence name="H1 count" value={String(report.website.h1Count)} />
          <Evidence name="Indexing" value={report.website.noindex ? 'NOINDEX' : 'Indexable signal'} />
        </div>
        {report.website.error ? <div style={{ color: '#FFB4A8', fontSize: 12, marginTop: 10 }}>{report.website.error}</div> : null}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={smallLabel}>CHANNEL CONNECTIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 8, marginTop: 8 }}>
          {report.connectors.map((connector) => <div key={connector.id} style={connectorCard}><strong>{connector.name}</strong><span style={{ color: connector.status === 'connected' ? '#9EF0CF' : '#FFD59A', fontSize: 11, fontWeight: 900 }}>{connector.status.toUpperCase()}</span><small style={{ color: '#8FA1B6', lineHeight: 1.4 }}>{connector.purpose}</small></div>)}
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value, sub }: { title: string; value: string; sub: string }) { return <div style={metricCard}><div style={smallLabel}>{title}</div><div style={{ fontSize: 32, fontWeight: 950, marginTop: 3 }}>{value}</div><div style={{ color: '#8FA1B6', fontSize: 11, marginTop: 2 }}>{sub}</div></div>; }
function Evidence({ name, value }: { name: string; value: string }) { return <div style={{ background: '#09121C', border: '1px solid #26374B', borderRadius: 10, padding: 10 }}><div style={{ color: '#8192A7', fontSize: 10, fontWeight: 900 }}>{name}</div><div style={{ marginTop: 3, fontWeight: 850, fontSize: 13, overflowWrap: 'anywhere' }}>{value}</div></div>; }
function Policy({ title, items }: { title: string; items: string[] }) { return <div style={innerCard}><strong style={{ fontSize: 18 }}>{title}</strong><div style={{ display: 'grid', gap: 6, marginTop: 9 }}>{items.map((item) => <div key={item} style={{ color: '#B9C5D3', fontSize: 13 }}>✓ {item}</div>)}</div></div>; }

const page = { minHeight: '100vh', background: '#07101A', color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 18px 110px' };
const shell = { maxWidth: 1180, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 16 };
const eyebrow = { color: '#79E0BC', fontSize: 11, letterSpacing: 1.2, fontWeight: 950 };
const hero = { fontSize: 'clamp(40px,6vw,66px)', lineHeight: .99, letterSpacing: -2, margin: '8px 0 12px', maxWidth: 900 };
const lead = { maxWidth: 930, color: '#B8C5D5', lineHeight: 1.65, fontSize: 17 };
const muted = { color: '#AEB9CB', lineHeight: 1.6, margin: 0 };
const runPanel = { background: 'linear-gradient(135deg,#12263A,#10281F)', border: '1px solid #2A4359', borderRadius: 18, padding: 18, display: 'grid', gap: 15 };
const input = { width: '100%', boxSizing: 'border-box' as const, background: '#07111B', color: '#fff', border: '1px solid #40546A', borderRadius: 10, padding: '12px 13px', outline: 'none', fontSize: 14 };
const primaryButton = { background: '#9EF0CF', color: '#07130F', borderRadius: 10, padding: '12px 15px', fontWeight: 950 };
const ghostButton = { border: '1px solid #334155', color: '#F8FAFC', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 850 };
const metricGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 14 };
const metricCard = { background: '#0D1723', border: '1px solid #243449', borderRadius: 14, padding: 14 };
const card = { background: '#0D1723', border: '1px solid #243449', borderRadius: 17, padding: 18 };
const innerCard = { background: '#09131F', border: '1px solid #26374B', borderRadius: 13, padding: 14 };
const sectionTitle = { margin: '7px 0 13px', fontSize: 27 };
const smallLabel = { color: '#79E0BC', fontSize: 10, fontWeight: 950, letterSpacing: .8 };
const listRow = { color: '#C6D0DC', lineHeight: 1.5, marginTop: 7, fontSize: 13 };
const queueItem = { background: '#09131F', border: '1px solid #2B3C50', borderRadius: 12, padding: 12, display: 'grid', gap: 10 };
const historyRow = { background: '#09131F', border: '1px solid #2B3C50', borderRadius: 11, padding: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 };
const emptyState = { color: '#8192A7', border: '1px dashed #34465A', borderRadius: 11, padding: 14, fontSize: 13 };
const approveButton = { background: '#9EF0CF', color: '#07130F', border: 0, borderRadius: 8, padding: '8px 10px', fontWeight: 900, cursor: 'pointer' };
const rejectButton = { background: '#2A1720', color: '#FFC2CB', border: '1px solid #6A3341', borderRadius: 8, padding: '8px 10px', fontWeight: 900, cursor: 'pointer' };
const scoreCircle = { width: 74, height: 74, borderRadius: '50%', border: '5px solid #9EF0CF', display: 'grid', placeItems: 'center', fontSize: 27, fontWeight: 950, flex: '0 0 auto' };
const connectorCard = { background: '#09131F', border: '1px solid #26374B', borderRadius: 11, padding: 11, display: 'grid', gap: 4 };
const errorBox = { background: '#351922', color: '#FFC5CD', border: '1px solid #793447', borderRadius: 10, padding: 11, fontSize: 13 };
