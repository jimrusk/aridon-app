'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

const tabs = ['Boardroom', 'Execution', 'CEO Brief', 'Company Brain', 'Approval'] as const;
type Tab = (typeof tabs)[number];
type BrainItem = { id: string; title: string; category?: string | null; content?: string | null; created_at?: string | null };

type BoardroomResult = {
  summary: string;
  team: Array<{ name: string; role: string; position: string; actions?: string[]; risks?: string[] }>;
  decision: string;
  nextActions: string[];
  approvalGates: string[];
};

type ExecutionResult = {
  projectName: string;
  objective: string;
  assignments: Array<{ executive: string; responsibility: string; deliverable: string }>;
  workplan: Array<{ step: number; owner: string; action: string; doneWhen: string }>;
  draftDeliverables: Array<{ title: string; content: string }>;
  assumptions: string[];
  risks: string[];
  approvalGates: string[];
};

type Brief = {
  headline: string;
  summary: string;
  priorities: string[];
  revenue: string;
  operations: string;
  risks: string[];
  opportunities: string[];
  nextActions: string[];
};

const defaultPolicy = 'Research, analysis, internal planning, and drafting are allowed. External sends, spending, signatures, commitments, consequential claims, and permanent deletion require owner approval.';

function tabFromQuery(value: string | null): Tab {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'execution') return 'Execution';
  if (normalized === 'brief' || normalized === 'ceo-brief') return 'CEO Brief';
  if (normalized === 'brain' || normalized === 'company-brain') return 'Company Brain';
  if (normalized === 'approval' || normalized === 'controls') return 'Approval';
  return 'Boardroom';
}

export default function ExecutiveSuite({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => tabFromQuery(searchParams.get('tab')));
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const [businessName, setBusinessName] = useState('Your company');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [question, setQuestion] = useState('What should we focus on next to improve revenue without creating operational chaos?');
  const [boardroom, setBoardroom] = useState<BoardroomResult | null>(null);

  const [objective, setObjective] = useState('Finish the highest-value business priority with a clear owner, deliverables, and approval gates.');
  const [requestedOutputs, setRequestedOutputs] = useState('Executive brief\nAction plan\nCustomer or stakeholder draft\nRisk and approval checklist');
  const [execution, setExecution] = useState<ExecutionResult | null>(null);

  const [brief, setBrief] = useState<Brief | null>(null);
  const [brain, setBrain] = useState<BrainItem[]>([]);
  const [brainForm, setBrainForm] = useState({ title: '', category: 'company knowledge', content: '' });
  const [policy, setPolicy] = useState(defaultPolicy);
  const [policySaved, setPolicySaved] = useState(false);

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token || '';
      if (!accessToken) {
        router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/executive-suite`)}`);
        return;
      }
      setToken(accessToken);
      try {
        const workspaceResponse = await fetch(`/api/customer/workspace?slug=${encodeURIComponent(params.slug)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
        const workspace = await workspaceResponse.json().catch(() => ({}));
        if (!workspaceResponse.ok) throw new Error(workspace.error || 'Unable to open the workspace.');
        setBusinessName(workspace.tenant?.business_name || 'Your company');
        const [brainResponse, policyResponse] = await Promise.all([
          fetch(`/api/customer/brain?slug=${encodeURIComponent(params.slug)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }),
          fetch(`/api/customer/approval-policy?slug=${encodeURIComponent(params.slug)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }),
        ]);
        if (brainResponse.ok) {
          const brainData = await brainResponse.json();
          setBrain(brainData.items || []);
        }
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          setPolicy(policyData.policy || defaultPolicy);
        }
        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to open the Executive Suite.');
        setReady(true);
      }
    });
  }, [params.slug, router]);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  function chooseTab(next: Tab) {
    setTab(next);
    const query = next === 'CEO Brief' ? 'brief' : next === 'Company Brain' ? 'brain' : next.toLowerCase();
    router.replace(`/workspace/${params.slug}/executive-suite?tab=${query}`, { scroll: false });
    setError('');
  }

  async function runBoardroom() {
    if (!token || question.trim().length < 8 || busy) return;
    setBusy(true); setError(''); setBoardroom(null);
    try {
      const response = await fetch('/api/customer/boardroom', { method: 'POST', headers: authHeaders, body: JSON.stringify({ slug: params.slug, question }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The Boardroom could not complete this review.');
      setBoardroom(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'The Boardroom could not complete this review.'); }
    finally { setBusy(false); }
  }

  async function runExecution() {
    if (!token || objective.trim().length < 12 || busy) return;
    setBusy(true); setError(''); setExecution(null);
    try {
      const outputs = requestedOutputs.split('\n').map((item) => item.trim()).filter(Boolean);
      const response = await fetch('/api/customer/execution', { method: 'POST', headers: authHeaders, body: JSON.stringify({ slug: params.slug, objective, outputs }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The Execution Team could not complete this run.');
      setExecution(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'The Execution Team could not complete this run.'); }
    finally { setBusy(false); }
  }

  async function buildBrief() {
    if (!token || busy) return;
    setBusy(true); setError(''); setBrief(null);
    try {
      const response = await fetch('/api/customer/ceo-brief', { method: 'POST', headers: authHeaders, body: JSON.stringify({ slug: params.slug }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The CEO Brief could not be generated.');
      setBrief(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'The CEO Brief could not be generated.'); }
    finally { setBusy(false); }
  }

  async function addBrainItem() {
    if (!token || !brainForm.title.trim() || !brainForm.content.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/customer/brain', { method: 'POST', headers: authHeaders, body: JSON.stringify({ slug: params.slug, ...brainForm }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to add this Company Brain item.');
      setBrain((current) => [data.item, ...current]);
      setBrainForm({ title: '', category: 'company knowledge', content: '' });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to add this Company Brain item.'); }
    finally { setBusy(false); }
  }

  async function savePolicy() {
    if (!token || policy.trim().length < 20 || busy) return;
    setBusy(true); setError(''); setPolicySaved(false);
    try {
      const response = await fetch('/api/customer/approval-policy', { method: 'POST', headers: authHeaders, body: JSON.stringify({ slug: params.slug, policy }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save the approval policy.');
      setPolicy(data.policy || policy);
      setPolicySaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save the approval policy.'); }
    finally { setBusy(false); }
  }

  if (!ready) return <main style={loading}>Opening the Executive Suite…</main>;

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div><div style={eyebrow}>ARIDON EXECUTIVE OPERATING SYSTEM</div><h1 style={h1}>Executive Suite</h1><p style={lead}>{businessName} · Company Brain, Boardroom, execution, approval controls, and CEO Brief in one private workspace.</p></div>
          <Link href={`/workspace/${params.slug}`} style={backLink}>← Company Home</Link>
        </header>

        <nav style={tabBar} aria-label="Executive Suite tools">
          {tabs.map((item) => <button key={item} onClick={() => chooseTab(item)} style={{ ...tabButton, ...(tab === item ? activeTab : {}) }}>{item}</button>)}
        </nav>

        {error && <div style={errorBox}>{error}</div>}

        {tab === 'Boardroom' && <section style={panel}><div style={sectionLabel}>MULTI-EXECUTIVE DECISION</div><h2>Put the right executives on one business question.</h2><textarea style={textarea} rows={6} value={question} onChange={(event) => setQuestion(event.target.value)} /><button style={primaryButton} onClick={runBoardroom} disabled={busy}>{busy ? 'Convening the team…' : 'Get the Executive Team on This'}</button>{boardroom && <div style={resultStack}><article style={decision}><strong>Recommended decision</strong><h3>{boardroom.decision}</h3><p>{boardroom.summary}</p></article><div style={cardGrid}>{boardroom.team?.map((member) => <article style={subCard} key={`${member.name}-${member.role}`}><strong>{member.name}</strong><small>{member.role}</small><p>{member.position}</p>{member.actions?.length ? <ul>{member.actions.map((item) => <li key={item}>{item}</li>)}</ul> : null}</article>)}</div><article style={subCard}><strong>Next actions</strong><ol>{boardroom.nextActions?.map((item) => <li key={item}>{item}</li>)}</ol><strong>Approval gates</strong><ul>{boardroom.approvalGates?.map((item) => <li key={item}>{item}</li>)}</ul></article></div>}</section>}

        {tab === 'Execution' && <section style={panel}><div style={sectionLabel}>FINISHED-PROJECT EXECUTION</div><h2>Describe what should be finished, not which AI button to press.</h2><label style={field}>Finished-project objective<textarea style={textarea} rows={5} value={objective} onChange={(event) => setObjective(event.target.value)} /></label><label style={field}>Requested outputs, one per line<textarea style={textarea} rows={5} value={requestedOutputs} onChange={(event) => setRequestedOutputs(event.target.value)} /></label><button style={primaryButton} onClick={runExecution} disabled={busy}>{busy ? 'Execution Team working…' : 'Run the Execution Team'}</button>{execution && <div style={resultStack}><article style={decision}><strong>{execution.projectName}</strong><p>{execution.objective}</p></article><div style={cardGrid}>{execution.assignments?.map((item) => <article style={subCard} key={`${item.executive}-${item.deliverable}`}><strong>{item.executive}</strong><p>{item.responsibility}</p><small>Deliverable: {item.deliverable}</small></article>)}</div><article style={subCard}><strong>Workplan</strong><ol>{execution.workplan?.map((step) => <li key={`${step.step}-${step.action}`}><b>{step.owner}:</b> {step.action} <span style={muted}>Done when: {step.doneWhen}</span></li>)}</ol></article>{execution.draftDeliverables?.map((draft) => <article style={subCard} key={draft.title}><strong>{draft.title}</strong><pre style={draftText}>{draft.content}</pre></article>)}</div>}</section>}

        {tab === 'CEO Brief' && <section style={panel}><div style={sectionLabel}>EVA · CHIEF OF STAFF</div><h2>Compress the company into one owner briefing.</h2><button style={primaryButton} onClick={buildBrief} disabled={busy}>{busy ? 'Building the brief…' : brief ? 'Refresh CEO Brief' : 'Build CEO Brief'}</button>{brief && <div style={resultStack}><article style={decision}><h3>{brief.headline}</h3><p>{brief.summary}</p></article><div style={cardGrid}>{brief.priorities?.slice(0, 3).map((item, index) => <article style={subCard} key={item}><strong>Priority {index + 1}</strong><p>{item}</p></article>)}</div><div style={cardGrid}><article style={subCard}><strong>Revenue</strong><p>{brief.revenue}</p></article><article style={subCard}><strong>Operations</strong><p>{brief.operations}</p></article></div><div style={cardGrid}><article style={subCard}><strong>Risks</strong><ul>{brief.risks?.map((item) => <li key={item}>{item}</li>)}</ul></article><article style={subCard}><strong>Opportunities</strong><ul>{brief.opportunities?.map((item) => <li key={item}>{item}</li>)}</ul></article></div><article style={subCard}><strong>The three moves</strong><ol>{brief.nextActions?.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ol></article></div>}</section>}

        {tab === 'Company Brain' && <section style={split}><div style={panel}><div style={sectionLabel}>SHARED COMPANY MEMORY</div><h2>What the executive team should know.</h2>{brain.length === 0 ? <p style={muted}>No Company Brain items are stored yet.</p> : <div style={resultStack}>{brain.map((item) => <article style={subCard} key={item.id}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{item.title}</strong><small>{item.category || 'company knowledge'}</small></div><p style={{ whiteSpace: 'pre-wrap' }}>{item.content || ''}</p></article>)}</div>}</div><aside style={panel}><div style={sectionLabel}>ADD KNOWLEDGE</div><label style={field}>Title<input style={input} value={brainForm.title} onChange={(event) => setBrainForm({ ...brainForm, title: event.target.value })} /></label><label style={field}>Category<input style={input} value={brainForm.category} onChange={(event) => setBrainForm({ ...brainForm, category: event.target.value })} /></label><label style={field}>Content<textarea style={textarea} rows={9} value={brainForm.content} onChange={(event) => setBrainForm({ ...brainForm, content: event.target.value })} /></label><button style={primaryButton} onClick={addBrainItem} disabled={busy}>Add to Company Brain</button></aside></section>}

        {tab === 'Approval' && <section style={panel}><div style={sectionLabel}>OWNER AUTHORITY LAYER</div><h2>Tell Aridon where autonomy stops.</h2><p style={muted}>This policy is stored inside your Company Brain and is included when the Boardroom and Execution Team reason about consequential actions.</p><textarea style={textarea} rows={9} value={policy} onChange={(event) => { setPolicy(event.target.value); setPolicySaved(false); }} /><button style={primaryButton} onClick={savePolicy} disabled={busy}>{policySaved ? '✓ Approval Policy Saved' : busy ? 'Saving…' : 'Save Approval Policy'}</button><div style={policyExamples}><strong>Good default:</strong> let Aridon research, analyze, plan, draft, organize, and prepare. Require the owner to release external messages, money, signatures, legal commitments, consequential claims, and destructive actions.</div></section>}
      </div>
    </main>
  );
}

const loading = { minHeight: '100vh', background: '#07101D', color: '#F8FAFC', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const page = { minHeight: '100vh', background: '#07101D', color: '#F8FAFC', padding: '28px 18px 100px', fontFamily: 'Arial, sans-serif' };
const shell = { maxWidth: 1120, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' as const };
const eyebrow = { color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(42px,7vw,70px)', margin: '8px 0 10px', lineHeight: .95, letterSpacing: -2 };
const lead = { color: '#B8C3D4', lineHeight: 1.6, maxWidth: 780 };
const backLink = { border: '1px solid #40506B', color: '#F8FAFC', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 850 };
const tabBar = { display: 'flex', gap: 7, flexWrap: 'wrap' as const, margin: '22px 0 14px' };
const tabButton = { border: '1px solid #3A4A67', background: '#0D1728', color: '#D8E0EC', borderRadius: 999, padding: '10px 13px', cursor: 'pointer', fontWeight: 900 };
const activeTab = { background: '#9EF0CF', color: '#07130F', borderColor: '#9EF0CF' };
const panel = { background: '#0D1728', border: '1px solid #273854', borderRadius: 18, padding: 20 };
const sectionLabel = { color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: .9 };
const field = { display: 'grid', gap: 7, marginTop: 13, fontWeight: 850 };
const textarea = { width: '100%', boxSizing: 'border-box' as const, background: '#07111F', color: '#F8FAFC', border: '1px solid #354662', borderRadius: 11, padding: 12, lineHeight: 1.55, font: 'inherit', resize: 'vertical' as const };
const input = { ...textarea, resize: 'none' as const };
const primaryButton = { marginTop: 14, border: 0, background: '#9EF0CF', color: '#07130F', borderRadius: 10, padding: '13px 16px', fontWeight: 950, cursor: 'pointer' };
const errorBox = { marginBottom: 13, background: '#32171B', border: '1px solid #6B323A', color: '#FFC2CB', borderRadius: 11, padding: 12 };
const resultStack = { display: 'grid', gap: 10, marginTop: 14 };
const decision = { background: '#153029', border: '1px solid #346B5D', borderRadius: 14, padding: 16 };
const cardGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 9 };
const subCard = { background: '#111E31', border: '1px solid #2C3C57', borderRadius: 14, padding: 15 };
const muted = { color: '#AEB9CB', lineHeight: 1.55 };
const draftText = { whiteSpace: 'pre-wrap' as const, fontFamily: 'Arial, sans-serif', color: '#DCE4EF', lineHeight: 1.6, marginBottom: 0 };
const split = { display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(300px,.65fr)', gap: 12 };
const policyExamples = { marginTop: 14, border: '1px dashed #3B4B67', borderRadius: 11, padding: 13, color: '#AEB9CB', lineHeight: 1.6 };
