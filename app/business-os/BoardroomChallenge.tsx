'use client';

import Link from 'next/link';
import { useState } from 'react';

type Result = {
  summary: string;
  team: Array<{ name: string; role: string; position: string }>;
  decision: string;
  nextActions: string[];
  demo?: boolean;
};

const starter = [
  'Our sales are growing but cash is tight. What should we do before hiring?',
  'We keep getting leads but follow-up is inconsistent. Fix the process.',
  'We are considering a new service. What should we validate before spending money?',
];

export default function BoardroomChallenge() {
  const [question, setQuestion] = useState(starter[0]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (question.trim().length < 8 || busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/boardroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, companyContext: 'Public Aridon product demonstration. Do not assume private company facts.' }),
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
        <label style={{ display: 'grid', gap: 8, color: '#fff', fontWeight: 900 }}>
          Give the executive team one real business problem.
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, background: '#07101D', color: '#F8FAFC', border: '1px solid #344664', padding: 13, font: 'inherit', lineHeight: 1.55 }} />
        </label>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
          {starter.map((item) => <button key={item} onClick={() => setQuestion(item)} style={{ border: '1px solid #344664', background: '#111E32', color: '#C9D2DF', borderRadius: 999, padding: '7px 10px', cursor: 'pointer', fontSize: 12 }}>Try another problem</button>)}
        </div>
        <button onClick={run} disabled={busy || question.trim().length < 8} style={{ marginTop: 13, width: '100%', border: 0, borderRadius: 11, background: '#9EF0CF', color: '#07130F', padding: '14px 16px', fontWeight: 950, cursor: 'pointer', opacity: busy ? .6 : 1 }}>{busy ? 'The boardroom is working…' : 'Challenge the Aridon Executive Team'}</button>
        {error && <div style={{ marginTop: 10, color: '#FFC2CA' }}>{error}</div>}
      </div>

      {result && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: '#DDF8ED', border: '1px solid #9ACAB8', borderRadius: 17, padding: 18, color: '#142019' }}>
            <div style={{ fontSize: 11, fontWeight: 950, color: '#24604E' }}>{result.demo ? 'PRODUCT DEMO' : 'LIVE BOARDROOM RESULT'}</div>
            <h3 style={{ fontSize: 26, margin: '7px 0 8px' }}>{result.decision}</h3>
            <p style={{ margin: 0, color: '#46584F', lineHeight: 1.6 }}>{result.summary}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 9 }}>
            {result.team?.slice(0, 4).map((member) => <article key={`${member.name}-${member.role}`} style={{ background: '#fff', border: '1px solid #D5D0C5', borderRadius: 15, padding: 15 }}><strong>{member.name}</strong><div style={{ color: '#77736A', fontSize: 12, marginTop: 2 }}>{member.role}</div><p style={{ color: '#55564F', lineHeight: 1.55, marginBottom: 0 }}>{member.position}</p></article>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', background: '#171717', color: '#fff', borderRadius: 16, padding: 18 }}>
            <div><strong>This is the preview. In your private workspace, the team can use your company context, projects, tasks, CRM and Company Brain.</strong></div>
            <Link href="/business-os/beta" style={{ background: '#9EF0CF', color: '#07130F', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', fontWeight: 950, textAlign: 'center' }}>Build My Executive Team</Link>
          </div>
        </div>
      )}
    </div>
  );
}
