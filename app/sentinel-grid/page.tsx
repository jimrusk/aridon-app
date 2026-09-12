'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';

type Assessment = {
  score: number;
  disposition: 'allow' | 'restricted' | 'review' | 'block';
  reasons: string[];
  actionGate: { mode: 'pass' | 'human_approval' | 'deny'; reasons: string[] };
  trajectory: { turnsAnalyzed: number; escalationDetected: boolean; repeatedEvasionDetected: boolean; categoryCount: number };
  providerConsensus: { providers: number; averageScore: number | null; maxScore: number | null };
  privacy: { rawPromptSharingRequired: false; recommendation: string };
};

export default function SentinelGridPage() {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState('');
  const [actions, setActions] = useState('');
  const [authorization, setAuthorization] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  const decisionCopy = useMemo(() => {
    if (!assessment) return '';
    if (assessment.disposition === 'allow') return 'Proceed normally. Continue standard monitoring.';
    if (assessment.disposition === 'restricted') return 'Keep the interaction in a restricted, non-consequential capability lane.';
    if (assessment.disposition === 'review') return 'Pause consequential capability and route the event for independent review.';
    return 'Stop consequential capability before execution and preserve a minimized security event.';
  }, [assessment]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setBusy(true);
    setError('');
    setAssessment(null);

    try {
      const response = await fetch('/api/sentinel-grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history: history.split('\n').map((item) => item.trim()).filter(Boolean),
          requestedActions: actions.split(',').map((item) => item.trim()).filter(Boolean),
          authorizationContext: authorization,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Sentinel assessment failed.');
      setAssessment(data.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sentinel assessment failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#050B14', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 80px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/agent-supervisor" style={navLink}>Agent Supervisor</Link>
            <Link href="/model-router" style={navLink}>Model Router</Link>
            <a href="/api/sentinel-grid" style={navLink}>Protocol Status</a>
          </div>
        </nav>

        <header style={{ paddingTop: 66, maxWidth: 980 }}>
          <div style={{ color: '#8CF0D0', fontSize: 12, fontWeight: 950, letterSpacing: 1.4 }}>ARIDON SENTINEL GRID · V0.1</div>
          <h1 style={{ fontSize: 'clamp(48px,8vw,92px)', lineHeight: 0.93, letterSpacing: -4, margin: '16px 0 20px' }}>
            Catch the attack path before the action.
          </h1>
          <p style={{ color: '#B9C7D8', fontSize: 20, lineHeight: 1.65, maxWidth: 880 }}>
            A vendor-neutral AI security layer that scores prompt intent, conversation trajectory, independent provider signals and requested tool actions before an AI system can do anything consequential.
          </p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 28 }} className="fourGrid">
          {[
            ['01', 'Prompt Sentinel', 'Detects risky intent without treating individual keywords as guilt.'],
            ['02', 'Trajectory Engine', 'Looks across turns for escalation, repeated evasion and fragmented workflows.'],
            ['03', 'Multi-AI Jury', 'Accepts independent risk signals from OpenAI, Anthropic, Google, xAI or other providers.'],
            ['04', 'Action Firewall', 'Runs a second gate before shell, network, data, messaging or other consequential actions.'],
          ].map(([n, title, copy]) => (
            <article key={n} style={{ background: '#0E1928', border: '1px solid #223551', borderRadius: 16, padding: 18 }}>
              <div style={{ color: '#8CF0D0', fontSize: 12, fontWeight: 950 }}>{n}</div>
              <h2 style={{ fontSize: 20, margin: '10px 0' }}>{title}</h2>
              <p style={{ color: '#9FB0C5', lineHeight: 1.55, margin: 0 }}>{copy}</p>
            </article>
          ))}
        </section>

        <form onSubmit={submit} style={{ marginTop: 22, background: '#0B1422', border: '1px solid #263956', borderRadius: 20, padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 16 }} className="twoGrid">
            <div>
              <label style={label}>CURRENT PROMPT / REQUEST</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Paste the request to evaluate." style={{ ...input, minHeight: 180 }} />
            </div>
            <div>
              <label style={label}>AUTHORIZATION CONTEXT</label>
              <textarea value={authorization} onChange={(e) => setAuthorization(e.target.value)} placeholder="Example: authorized security audit of systems owned by our organization." style={{ ...input, minHeight: 180 }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }} className="twoGrid">
            <div>
              <label style={label}>PRIOR TURNS · ONE PER LINE</label>
              <textarea value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Optional previous requests from this session or risk window." style={{ ...input, minHeight: 130 }} />
            </div>
            <div>
              <label style={label}>REQUESTED ACTIONS · COMMA SEPARATED</label>
              <textarea value={actions} onChange={(e) => setActions(e.target.value)} placeholder="Example: network request, database write, send email" style={{ ...input, minHeight: 130 }} />
            </div>
          </div>

          <button disabled={busy || !prompt.trim()} style={{ marginTop: 16, border: 0, borderRadius: 12, padding: '14px 20px', background: '#8CF0D0', color: '#04110D', fontWeight: 950, cursor: busy ? 'wait' : 'pointer', opacity: busy || !prompt.trim() ? 0.55 : 1 }}>
            {busy ? 'Sentinel is evaluating…' : 'Run Sentinel Assessment'}
          </button>
          {error && <p style={{ color: '#FFD0A8', marginBottom: 0 }}>{error}</p>}
        </form>

        {assessment && (
          <section style={{ marginTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '.65fr 1.35fr', gap: 14 }} className="twoGrid">
              <article style={{ background: '#F2EFE7', color: '#171717', borderRadius: 20, padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 950 }}>SENTINEL SCORE</div>
                <div style={{ fontSize: 84, lineHeight: 1, fontWeight: 950, marginTop: 12 }}>{assessment.score}</div>
                <div style={{ marginTop: 10, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1 }}>{assessment.disposition}</div>
                <p style={{ color: '#5D5A54', lineHeight: 1.55 }}>{decisionCopy}</p>
              </article>

              <article style={{ background: '#101C2D', border: '1px solid #293D5D', borderRadius: 20, padding: 24 }}>
                <div style={{ color: '#8CF0D0', fontSize: 12, fontWeight: 950 }}>INDEPENDENT ACTION GATE</div>
                <h2 style={{ fontSize: 34, margin: '10px 0' }}>{assessment.actionGate.mode.replaceAll('_', ' ')}</h2>
                <p style={{ color: '#B9C7D8', lineHeight: 1.65 }}>{assessment.actionGate.reasons[0] || 'No consequential action is waiting at the gate.'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }} className="threeGrid">
                  <Metric label="Turns" value={String(assessment.trajectory.turnsAnalyzed)} />
                  <Metric label="Risk categories" value={String(assessment.trajectory.categoryCount)} />
                  <Metric label="Provider signals" value={String(assessment.providerConsensus.providers)} />
                </div>
              </article>
            </div>

            <article style={{ marginTop: 14, background: '#0B1422', border: '1px solid #263956', borderRadius: 20, padding: 24 }}>
              <div style={{ color: '#8CF0D0', fontSize: 12, fontWeight: 950 }}>WHY SENTINEL DECIDED THIS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 14 }} className="twoGrid">
                {assessment.reasons.map((reason) => <div key={reason} style={{ background: '#101C2D', borderRadius: 12, padding: 14, color: '#C5D1E0', lineHeight: 1.5 }}>{reason}</div>)}
              </div>
            </article>

            <article style={{ marginTop: 14, background: '#F2EFE7', color: '#171717', borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 950 }}>PRIVACY-PRESERVING FEDERATION</div>
              <h2 style={{ fontSize: 30, margin: '10px 0' }}>Share the fingerprint, not everybody's conversations.</h2>
              <p style={{ color: '#5D5A54', lineHeight: 1.7 }}>{assessment.privacy.recommendation}</p>
            </article>
          </section>
        )}

        <section style={{ marginTop: 22, background: '#0E1928', border: '1px solid #223551', borderRadius: 20, padding: 24 }}>
          <div style={{ color: '#8CF0D0', fontSize: 12, fontWeight: 950 }}>PARTNER INTEGRATION CONTRACT</div>
          <h2 style={{ fontSize: 34, margin: '10px 0' }}>One local decision. Many independent signals.</h2>
          <pre style={{ overflowX: 'auto', background: '#050B14', borderRadius: 14, padding: 18, color: '#C6D5E8', lineHeight: 1.6 }}>{`POST /api/sentinel-grid\n{\n  "prompt": "…",\n  "history": ["…"],\n  "requestedActions": ["network request"],\n  "providerSignals": [\n    { "provider": "partner-a", "score": 72, "confidence": 0.91 }\n  ]\n}`}</pre>
          <p style={{ color: '#9FB0C5', lineHeight: 1.6 }}>Production integrations should compute provider signals inside each company's trust boundary. Cross-company exchange should use minimized threat indicators rather than raw user prompts.</p>
        </section>
      </section>
      <style>{`@media(max-width:860px){.fourGrid,.twoGrid,.threeGrid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div style={{ background: '#07101D', borderRadius: 12, padding: 12 }}><div style={{ fontSize: 11, color: '#8FA0B8' }}>{label.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 950, marginTop: 5 }}>{value}</div></div>;
}

const navLink = { color: '#DCE4EF', textDecoration: 'none', fontWeight: 850 } as const;
const label = { display: 'block', color: '#8CF0D0', fontSize: 12, fontWeight: 950, letterSpacing: 0.8, marginBottom: 8 } as const;
const input = { width: '100%', boxSizing: 'border-box' as const, borderRadius: 12, border: '1px solid #314663', background: '#050B14', color: '#F8FAFC', padding: 14, fontFamily: 'Arial, sans-serif', fontSize: 15, lineHeight: 1.55, resize: 'vertical' as const };
