'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { executives } from '../../lib/executives';

type BoardroomResult = {
  summary: string;
  team: Array<{ name: string; role: string; position: string; actions: string[]; risks: string[] }>;
  decision: string;
  nextActions: string[];
  approvalGates: string[];
  demo?: boolean;
};

const examples = [
  'Should we hire another salesperson now or wait three months?',
  'We have ten warm leads but follow-up is inconsistent. What should the team do this week?',
  'Review our next product launch and tell me what could derail it before we spend more money.',
];

export default function BoardroomPage() {
  const [question, setQuestion] = useState(examples[0]);
  const [companyContext, setCompanyContext] = useState('');
  const [approvalPolicy, setApprovalPolicy] = useState('Research, analysis, internal planning, and drafting are allowed. External sends, spending, signatures, commitments, and consequential claims require my approval.');
  const [result, setResult] = useState<BoardroomResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('aridon-approval-policy');
      if (saved) setApprovalPolicy(saved);
    } catch {}
  }, []);

  const teamMap = useMemo(() => new Map(executives.map((executive) => [executive.name, executive])), []);

  async function runBoardroom() {
    if (question.trim().length < 8 || busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/boardroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, companyContext, approvalPolicy }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The boardroom could not complete this review.');
      setResult(data as BoardroomResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The boardroom could not complete this review.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>ARIDON EXECUTIVE OPERATING SYSTEM</div>
            <h1 style={h1}>Executive Boardroom</h1>
            <p style={lead}>Give the company one real decision. Eva routes it to the executives whose specialties matter, surfaces disagreement and risk, then returns one decision and an execution path.</p>
          </div>
          <div style={headerActions}>
            <Link href="/controls" style={secondaryLink}>Approval Center</Link>
            <Link href="/" style={secondaryLink}>Command Center</Link>
          </div>
        </header>

        <section style={roster}>
          {executives.map((executive) => (
            <div key={executive.id} style={{ ...rosterCard, borderColor: `${executive.color}66` }}>
              <span style={{ ...initial, background: `${executive.color}22`, color: executive.color }}>{executive.icon}</span>
              <div><strong>{executive.name}</strong><small>{executive.abbr} · {executive.role}</small></div>
            </div>
          ))}
        </section>

        <section style={inputGrid}>
          <div style={panel}>
            <div style={sectionLabel}>THE DECISION</div>
            <label style={label}>What should the executive team solve?<textarea style={textarea} value={question} onChange={(event) => setQuestion(event.target.value)} rows={6} /></label>
            <div style={chipRow}>{examples.map((example) => <button key={example} onClick={() => setQuestion(example)} style={chip}>{example}</button>)}</div>
            <label style={label}>Useful company context <span style={optional}>(optional)</span><textarea style={textarea} value={companyContext} onChange={(event) => setCompanyContext(event.target.value)} rows={4} placeholder="Budget, deadlines, customer situation, constraints, numbers, or background the team should know." /></label>
            <button onClick={runBoardroom} disabled={busy || question.trim().length < 8} style={{ ...primaryButton, opacity: busy || question.trim().length < 8 ? .55 : 1 }}>{busy ? 'Convening the executive team…' : 'Get the Executive Team on This'}</button>
            {error && <div style={errorBox}>{error}</div>}
          </div>

          <aside style={panel}>
            <div style={sectionLabel}>OWNER CONTROL</div>
            <h2 style={{ margin: '8px 0' }}>Your approval policy travels with the decision.</h2>
            <p style={muted}>Aridon can research, challenge, plan and draft without turning analysis into an uncontrolled external action.</p>
            <div style={policyBox}>{approvalPolicy}</div>
            <Link href="/controls" style={primaryLink}>Change Approval Rules</Link>
          </aside>
        </section>

        {!result && <section style={empty}><div style={{ fontSize: 34 }}>◆</div><h2>One question in. A leadership decision out.</h2><p>Finance, operations, revenue, strategy, technology, marketing, risk and executive coordination can all weigh in without making you manage eight separate chats.</p></section>}

        {result && (
          <section style={{ display: 'grid', gap: 16 }}>
            <div style={decisionCard}>
              <div style={sectionLabel}>{result.demo ? 'BOARDROOM DEMO MODE' : 'BOARDROOM SYNTHESIS'}</div>
              <h2 style={{ fontSize: 30, margin: '8px 0 10px' }}>{result.decision}</h2>
              <p style={{ ...muted, fontSize: 16 }}>{result.summary}</p>
            </div>

            <div style={resultGrid}>
              {result.team.map((member) => {
                const executive = teamMap.get(member.name);
                return (
                  <article key={`${member.name}-${member.role}`} style={{ ...panel, borderTop: `3px solid ${executive?.color || '#9EF0CF'}` }}>
                    <div style={memberHead}><span style={{ ...initial, background: `${executive?.color || '#9EF0CF'}22`, color: executive?.color || '#9EF0CF' }}>{executive?.icon || member.name.slice(0, 1)}</span><div><h3 style={{ margin: 0 }}>{member.name}</h3><small style={mutedSmall}>{member.role}</small></div></div>
                    <p style={{ lineHeight: 1.6 }}>{member.position}</p>
                    {!!member.actions?.length && <><strong>Recommended moves</strong><ul>{member.actions.map((item) => <li key={item}>{item}</li>)}</ul></>}
                    {!!member.risks?.length && <><strong>Watch-outs</strong><ul>{member.risks.map((item) => <li key={item}>{item}</li>)}</ul></>}
                  </article>
                );
              })}
            </div>

            <div style={resultGrid}>
              <article style={panel}><div style={sectionLabel}>NEXT ACTIONS</div><ol style={{ lineHeight: 1.8 }}>{result.nextActions?.map((item) => <li key={item}>{item}</li>)}</ol></article>
              <article style={panel}><div style={sectionLabel}>APPROVAL GATES</div><ul style={{ lineHeight: 1.8 }}>{result.approvalGates?.map((item) => <li key={item}>{item}</li>)}</ul></article>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const page = { minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '30px 18px 90px' };
const shell = { maxWidth: 1180, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' as const };
const headerActions = { display: 'flex', gap: 9, flexWrap: 'wrap' as const };
const eyebrow = { color: '#9EF0CF', fontWeight: 950, fontSize: 12, letterSpacing: 1.1 };
const h1 = { fontSize: 'clamp(42px,8vw,78px)', lineHeight: .95, margin: '10px 0 18px', letterSpacing: -2 };
const lead = { maxWidth: 800, color: '#BDC7D8', fontSize: 18, lineHeight: 1.65 };
const roster = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 8, margin: '24px 0' };
const rosterCard = { display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #283856', background: '#0D1728', borderRadius: 12, padding: '10px 12px' };
const initial = { width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', fontWeight: 950, flexShrink: 0 };
const inputGrid = { display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(280px,.65fr)', gap: 14, marginBottom: 18 };
const panel = { background: '#0D1728', border: '1px solid #263754', borderRadius: 18, padding: 20 };
const sectionLabel = { color: '#9EF0CF', fontWeight: 950, fontSize: 11, letterSpacing: .9 };
const label = { display: 'grid', gap: 7, fontWeight: 850, marginTop: 14 };
const optional = { color: '#8593AA', fontWeight: 500 };
const textarea = { width: '100%', boxSizing: 'border-box' as const, background: '#08111F', border: '1px solid #31415E', borderRadius: 12, color: '#F8FAFC', padding: 13, lineHeight: 1.55, font: 'inherit', resize: 'vertical' as const };
const chipRow = { display: 'flex', gap: 7, flexWrap: 'wrap' as const, marginTop: 10 };
const chip = { border: '1px solid #31415E', background: '#121F34', color: '#D7DEEA', borderRadius: 999, padding: '8px 10px', cursor: 'pointer', fontSize: 12 };
const primaryButton = { marginTop: 16, border: 0, background: '#9EF0CF', color: '#07130F', borderRadius: 11, padding: '14px 17px', fontWeight: 950, cursor: 'pointer', width: '100%' };
const primaryLink = { display: 'inline-block', marginTop: 12, background: '#9EF0CF', color: '#07130F', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 900 };
const secondaryLink = { border: '1px solid #3A4A67', color: '#EDF1F7', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 850 };
const policyBox = { background: '#08111F', border: '1px solid #31415E', borderRadius: 12, padding: 13, color: '#CAD3E2', lineHeight: 1.55 };
const muted = { color: '#AEB9CB', lineHeight: 1.6 };
const mutedSmall = { color: '#AEB9CB', lineHeight: 1.4 };
const errorBox = { marginTop: 12, background: '#31171B', border: '1px solid #6D313B', color: '#FFC3CB', borderRadius: 10, padding: 11 };
const empty = { textAlign: 'center' as const, padding: '42px 20px', border: '1px dashed #30415F', borderRadius: 18, color: '#B7C3D5' };
const decisionCard = { background: '#132B26', border: '1px solid #2E6959', borderRadius: 18, padding: 22 };
const resultGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 };
const memberHead = { display: 'flex', gap: 10, alignItems: 'center' };
