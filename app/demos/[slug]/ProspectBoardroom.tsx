'use client';

import { useState } from 'react';

type Result = {
  summary: string;
  team: Array<{ name: string; role: string; position: string }>;
  decision: string;
  nextActions: string[];
  approvalGates?: string[];
  demo?: boolean;
};

type Props = {
  companyName: string;
  companyContext: string;
  starterQuestions: string[];
};

export default function ProspectBoardroom({ companyName, companyContext, starterQuestions }: Props) {
  const [question, setQuestion] = useState(starterQuestions[0] || 'What should this business prioritize next?');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (busy || question.trim().length < 8) return;
    setBusy(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/boardroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          companyContext: `Unofficial Aridon prospect demonstration for ${companyName}. Use only this public-information context and do not invent private company facts. ${companyContext}`,
          approvalPolicy: 'Research, analysis and drafting are allowed. External sends, spending, signatures, commitments and consequential claims require human approval.',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The executive team could not complete this challenge.');
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The executive team could not complete this challenge.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: '#0C1525', border: '1px solid #2A3A57', borderRadius: 20, padding: 20 }}>
        <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 900, letterSpacing: '.08em' }}>LIVE EXECUTIVE BOARDROOM PREVIEW</div>
        <h2 style={{ margin: '8px 0 6px', color: '#fff', fontSize: 26 }}>Ask the team a real {companyName} business question.</h2>
        <p style={{ margin: '0 0 14px', color: '#AFC0D8', lineHeight: 1.55 }}>The answer is generated from public website context only. A private workspace can use approved internal company information, projects, CRM, tasks and policies.</p>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, background: '#07101D', color: '#F8FAFC', border: '1px solid #344664', padding: 13, font: 'inherit', lineHeight: 1.55 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
          {starterQuestions.map((item) => (
            <button key={item} onClick={() => setQuestion(item)} style={{ border: '1px solid #344664', background: '#111E32', color: '#C9D2DF', borderRadius: 999, padding: '7px 10px', cursor: 'pointer', fontSize: 12 }}>Try this question</button>
          ))}
        </div>
        <button onClick={run} disabled={busy || question.trim().length < 8} style={{ marginTop: 13, width: '100%', border: 0, borderRadius: 11, background: '#9EF0CF', color: '#07130F', padding: '14px 16px', fontWeight: 950, cursor: 'pointer', opacity: busy ? .65 : 1 }}>{busy ? 'The boardroom is working…' : 'Run the Aridon Executive Team'}</button>
        {error && <div style={{ marginTop: 10, color: '#FFC2CA' }}>{error}</div>}
      </div>

      {result && (
        <div style={{ display: 'grid', gap: 12 }}>
          <section style={{ background: '#E5F8F0', border: '1px solid #A8D6C4', borderRadius: 17, padding: 18, color: '#142019' }}>
            <div style={{ fontSize: 11, fontWeight: 950, color: '#24604E' }}>{result.demo ? 'DEMO RESPONSE' : 'LIVE BOARDROOM RESULT'}</div>
            <h3 style={{ fontSize: 24, margin: '7px 0 8px' }}>{result.decision}</h3>
            <p style={{ margin: 0, color: '#46584F', lineHeight: 1.6 }}>{result.summary}</p>
          </section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 9 }}>
            {result.team?.slice(0, 6).map((member) => (
              <article key={`${member.name}-${member.role}`} style={{ background: '#fff', border: '1px solid #D9D5CD', borderRadius: 15, padding: 15 }}>
                <strong>{member.name}</strong>
                <div style={{ color: '#77736A', fontSize: 12, marginTop: 2 }}>{member.role}</div>
                <p style={{ color: '#55564F', lineHeight: 1.55, marginBottom: 0 }}>{member.position}</p>
              </article>
            ))}
          </div>
          {result.nextActions?.length > 0 && (
            <section style={{ background: '#fff', border: '1px solid #D9D5CD', borderRadius: 15, padding: 16 }}>
              <strong>Recommended next actions</strong>
              <ul style={{ marginBottom: 0, color: '#55564F', lineHeight: 1.7 }}>
                {result.nextActions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
