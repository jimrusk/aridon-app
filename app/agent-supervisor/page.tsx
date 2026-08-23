'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type Step = { order: number; specialist: string; task: string; suggestedTool: string; riskLevel: string; approvalRequired: boolean };
type Result = { step: Step; output: string; attempts: number; qualityScore?: number; qualityNotes?: string; routing?: { provider?: string; model?: string } };
type Run = {
  objective: string;
  plan: { successCriteria: string[]; steps: Step[] };
  results: Result[];
  final: string;
  approvalQueue: Array<{ order: number; specialist: string; task: string; riskLevel: string; status: string }>;
  status: string;
};

export default function AgentSupervisorPage() {
  const [objective, setObjective] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [run, setRun] = useState<Run | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!objective.trim()) return;
    setBusy(true);
    setError('');
    setRun(null);
    try {
      const response = await fetch('/api/supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective, context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Supervisor run failed.');
      setRun(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Supervisor run failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/model-router" style={navLink}>Model Router</Link>
            <Link href="/execution" style={navLink}>Execution Engine</Link>
            <Link href="/presentation-studio" style={navLink}>Presentation Studio</Link>
          </div>
        </nav>

        <div style={{ paddingTop: 64, maxWidth: 900 }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12, letterSpacing: 1.2 }}>ARIDON AGENT SUPERVISOR</div>
          <h1 style={{ fontSize: 'clamp(48px,7vw,82px)', lineHeight: 0.95, letterSpacing: -3.4, margin: '14px 0 18px' }}>
            Plan it. Delegate it. Judge it. Then decide.
          </h1>
          <p style={{ color: '#B8C4D5', fontSize: 20, lineHeight: 1.65 }}>
            This is the heavy-duty multi-agent lane for work that benefits from several specialists. Aridon creates a bounded plan, routes each assignment, checks quality, retries weak work once and holds consequential actions for human approval.
          </p>
        </div>

        <form onSubmit={submit} style={{ marginTop: 28, background: '#102033', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
          <label style={label}>OBJECTIVE</label>
          <textarea value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Example: Build the strongest go-to-market plan for the Aridon $198 Business Health Scan and identify the first three customer segments to target." style={{ ...input, minHeight: 120 }} />
          <label style={{ ...label, marginTop: 16 }}>CONTEXT / SOURCE MATERIAL</label>
          <textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="Paste company context, constraints, facts, notes or source material here. Leave blank for a general run." style={{ ...input, minHeight: 180 }} />
          <button disabled={busy || !objective.trim()} style={{ marginTop: 16, border: 0, borderRadius: 12, padding: '14px 18px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, cursor: busy ? 'wait' : 'pointer', opacity: busy || !objective.trim() ? 0.6 : 1 }}>
            {busy ? 'Supervisor is running…' : 'Run Aridon Supervisor'}
          </button>
          {error && <div style={{ marginTop: 14, color: '#FFD5A8' }}>{error}</div>}
        </form>

        {run && (
          <>
            <section style={{ marginTop: 18, background: '#F4F1E9', color: '#171717', borderRadius: 20, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 950 }}>SUPERVISOR PLAN</div>
              <h2 style={{ fontSize: 34, margin: '8px 0 16px' }}>{run.plan.steps.length} bounded specialist assignments</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="superGrid">
                {run.plan.steps.map((step) => (
                  <article key={step.order} style={{ background: '#fff', border: '1px solid #D5CEC2', borderRadius: 14, padding: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{step.order}. {step.specialist}</strong><span style={{ fontSize: 11, fontWeight: 950 }}>{step.riskLevel.toUpperCase()}</span></div>
                    <p style={{ color: '#5D5A54', lineHeight: 1.55 }}>{step.task}</p>
                    <div style={{ fontSize: 12, color: '#6B665E' }}>Tool lane: {step.suggestedTool} · Approval: {step.approvalRequired ? 'required' : 'not required'}</div>
                  </article>
                ))}
              </div>
            </section>

            <section style={{ marginTop: 18, background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
              <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>SPECIALIST RESULTS</div>
              <h2 style={{ fontSize: 34, margin: '8px 0 16px' }}>Quality-controlled handoffs</h2>
              {run.results.map((result) => (
                <article key={result.step.order} style={{ borderTop: '1px solid #263650', padding: '16px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <strong>{result.step.specialist} · {result.step.task}</strong>
                    <span style={{ color: '#9EF0CF', fontWeight: 900 }}>{result.qualityScore ?? 0}/100 · {result.attempts} attempt{result.attempts === 1 ? '' : 's'}</span>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#C6D1E2', lineHeight: 1.65 }}>{result.output}</p>
                  <div style={{ color: '#8FA0B8', fontSize: 12 }}>QC: {result.qualityNotes || 'No additional note'}{result.routing?.provider ? ` · Routed through ${result.routing.provider}/${result.routing.model}` : ''}</div>
                </article>
              ))}
            </section>

            <section style={{ marginTop: 18, background: '#F4F1E9', color: '#171717', borderRadius: 20, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 950 }}>FINAL SYNTHESIS</div>
              <div style={{ marginTop: 14, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#3F3C37' }}>{run.final}</div>
            </section>

            <section style={{ marginTop: 18, background: '#102033', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
              <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>APPROVAL GATE</div>
              <h2 style={{ fontSize: 32, margin: '8px 0 14px' }}>{run.approvalQueue.length ? `${run.approvalQueue.length} action(s) waiting for a human` : 'No consequential action was requested'}</h2>
              {run.approvalQueue.map((item) => (
                <div key={item.order} style={{ borderTop: '1px solid #2A3A57', padding: '12px 0', color: '#C6D1E2' }}>{item.specialist}: {item.task} · <strong>{item.status.replaceAll('_', ' ')}</strong></div>
              ))}
            </section>
          </>
        )}
      </section>
      <style>{`@media(max-width:820px){.superGrid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

const navLink = { color: '#DCE4EF', textDecoration: 'none', fontWeight: 850 };
const label = { display: 'block', color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 0.8, marginBottom: 8 } as const;
const input = { width: '100%', boxSizing: 'border-box' as const, borderRadius: 12, border: '1px solid #31425F', background: '#07101D', color: '#F8FAFC', padding: 14, fontFamily: 'Arial, sans-serif', fontSize: 15, lineHeight: 1.55, resize: 'vertical' as const };
