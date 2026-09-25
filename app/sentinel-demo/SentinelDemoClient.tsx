'use client';

import { useEffect, useState } from 'react';

type ScenarioMeta = {
  id: string;
  title: string;
  category: string;
  hostile: boolean;
  rationale: string;
  prompt: string;
  requestedActions: string[];
  history: string[];
};

type Assessment = {
  score: number;
  disposition: 'allow' | 'restricted' | 'review' | 'block';
  reasons: string[];
  signals: { category: string; weight: number; reason: string; source: string }[];
  actionGate: { mode: 'pass' | 'human_approval' | 'deny'; reasons: string[] };
  trajectory: { turnsAnalyzed: number; escalationDetected: boolean; categoryCount: number };
};

type RunResult = {
  scenario?: { id: string; title: string; category: string; hostile: boolean; rationale: string };
  custom?: boolean;
  assessment: Assessment;
  auditSeq: number;
  auditHash: string;
};

type AuditEntry = {
  seq: number;
  ts: string;
  actor: string;
  eventType: string;
  summary: string;
  hash: string;
};

const DISPOSITION_STYLE: Record<string, { label: string; color: string }> = {
  allow: { label: 'ALLOW', color: '#42d392' },
  restricted: { label: 'RESTRICTED', color: '#65b7ff' },
  review: { label: 'REVIEW', color: '#ffb45e' },
  block: { label: 'BLOCK', color: '#ff5d5d' },
};

const GATE_STYLE: Record<string, { label: string; color: string }> = {
  pass: { label: 'Gate: pass', color: '#42d392' },
  human_approval: { label: 'Gate: human approval required', color: '#ffb45e' },
  deny: { label: 'Gate: deny', color: '#ff5d5d' },
};

async function post(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch('/api/sentinel-demo', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Request failed.');
  return data;
}

export default function SentinelDemoClient() {
  const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [approval, setApproval] = useState<'approved' | 'denied' | null>(null);
  const [error, setError] = useState('');

  const [customPrompt, setCustomPrompt] = useState('');
  const [customActions, setCustomActions] = useState('');
  const [customContext, setCustomContext] = useState('');

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [tamperMsg, setTamperMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    post('manifest')
      .then((d) => {
        setScenarios(d.scenarios);
        if (d.scenarios?.length) setSelectedId(d.scenarios[0].id);
      })
      .catch(() => setError('Could not load scenarios.'));
    refreshAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAudit() {
    try {
      const res = await fetch('/api/sentinel-demo', { cache: 'no-store' });
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      /* audit view is best-effort */
    }
  }

  async function runScenario() {
    if (!selectedId) return;
    setRunning(true);
    setError('');
    setResult(null);
    setApproval(null);
    try {
      const data = await post('run', { scenarioId: selectedId });
      setResult(data);
      refreshAudit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed.');
    } finally {
      setRunning(false);
    }
  }

  async function runCustom() {
    setRunning(true);
    setError('');
    setResult(null);
    setApproval(null);
    try {
      const data = await post('custom', {
        prompt: customPrompt,
        requestedActions: customActions
          .split('\n')
          .map((a) => a.trim())
          .filter(Boolean),
        authorizationContext: customContext,
      });
      setResult(data);
      refreshAudit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed.');
    } finally {
      setRunning(false);
    }
  }

  async function decide(approved: boolean) {
    setBusy(true);
    try {
      const label = result?.scenario?.title ?? 'custom input';
      await post('approve', { approved, label });
      setApproval(approved ? 'approved' : 'denied');
      refreshAudit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyChain() {
    setBusy(true);
    setVerifyMsg('');
    try {
      const data = await post('verify');
      const v = data.verification;
      setVerifyMsg(
        v.ok
          ? `Chain verified: ${v.checked} entries intact. Tip hash ${String(v.tipHash).slice(0, 16)}…`
          : `Verification FAILED at entry ${v.brokenAtSeq}: ${v.reason}`,
      );
      refreshAudit();
    } catch (e) {
      setVerifyMsg(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  }

  async function tamperDemo() {
    setBusy(true);
    setTamperMsg('');
    try {
      const data = await post('tamper');
      const v = data.verification;
      setTamperMsg(
        v.ok
          ? 'Unexpected: tampered chain verified clean.'
          : `Tamper caught at entry ${v.brokenAtSeq}. "${data.originalSummary}" was rewritten to "${data.alteredSummary}" — the chain no longer verifies.`,
      );
    } catch (e) {
      setTamperMsg(e instanceof Error ? e.message : 'Tamper demo failed.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadEvidence() {
    try {
      const res = await fetch('/api/sentinel-demo', { cache: 'no-store' });
      const data = await res.json();
      const bundle = {
        exportedAt: new Date().toISOString(),
        product: 'Aridon Sentinel — demo evidence bundle',
        scope:
          'Technical preview. Synthetic scenarios against Sentinel decision logic. Internal self-testing only; not an independent penetration test or certification.',
        lastRun: result,
        approval,
        auditExport: data.export ? JSON.parse(data.export) : null,
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sentinel-demo-evidence.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not build the evidence bundle.');
    }
  }

  const hostile = scenarios.filter((s) => s.hostile);
  const benign = scenarios.filter((s) => !s.hostile);
  const selected = scenarios.find((s) => s.id === selectedId);
  const disp = result ? DISPOSITION_STYLE[result.assessment.disposition] : null;
  const gate = result ? GATE_STYLE[result.assessment.actionGate.mode] : null;
  const needsApproval = result?.assessment.actionGate.mode === 'human_approval' && !approval;

  return (
    <div className="main" style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div className="hero">
        <div>
          <h1 className="h1">Sentinel — live demo</h1>
          <p className="sub">
            Attack it. Every run below goes through Sentinel&apos;s real pre-execution decision
            engine, and every decision is written to a tamper-evident audit log you can inspect.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, borderColor: '#ffb45e' }}>
        <span className="pill" style={{ borderColor: '#ffb45e', color: '#ffb45e' }}>
          Technical preview
        </span>
        <p className="muted" style={{ marginBottom: 0 }}>
          Honest stage: working code running synthetic scenarios. Internal self-testing only —
          no customers, no independent penetration test, no SOC 2 or other certifications.
          This demo shows how the mechanism behaves, not a security guarantee.
        </p>
      </div>

      <div className="grid">
        <div className="card span4">
          <div className="title">1. Pick an attack</div>
          <p className="muted">Twelve scenarios: nine hostile techniques, three benign controls.</p>
        </div>
        <div className="card span4">
          <div className="title">2. Watch the gate</div>
          <p className="muted">Sentinel scores the action before execution: allow, restrict, review, or block.</p>
        </div>
        <div className="card span4">
          <div className="title">3. Check the record</div>
          <p className="muted">Every decision lands in a hash-chained audit log. Verify it — or try to break it.</p>
        </div>
      </div>

      <div className="card span12" style={{ marginTop: 16 }}>
        <div className="title" style={{ fontSize: 20 }}>Try an attack scenario</div>
        <div className="row" style={{ marginTop: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="muted">Scenario</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <optgroup label="Hostile">
                {hostile.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Benign controls">
                {benign.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <button className="btn" onClick={runScenario} disabled={running || !selectedId}>
            {running ? 'Running…' : 'Run against Sentinel'}
          </button>
        </div>
        {selected && (
          <p className="muted" style={{ marginTop: 10 }}>
            {selected.hostile ? 'Hostile' : 'Benign control'} · {selected.category} — {selected.rationale}
          </p>
        )}

        {error && (
          <div className="item" style={{ marginTop: 12, borderColor: '#ff5d5d' }}>
            <span style={{ color: '#ff5d5d' }}>{error}</span>
          </div>
        )}

        {result && disp && gate && (
          <div className="item" style={{ marginTop: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span className="pill" style={{ borderColor: disp.color, color: disp.color, fontWeight: 800 }}>
                {disp.label}
              </span>
              <span className="pill" style={{ borderColor: gate.color, color: gate.color }}>
                {gate.label}
              </span>
              <span className="muted">Risk score: {result.assessment.score}/100</span>
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: '#0b1020',
                marginTop: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, result.assessment.score)}%`,
                  height: '100%',
                  background: disp.color,
                  transition: 'width .4s',
                }}
              />
            </div>
            {result.assessment.signals.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="muted" style={{ marginBottom: 6 }}>Signals that fired:</div>
                <div className="list">
                  {result.assessment.signals.map((s, i) => (
                    <div className="item" key={i} style={{ padding: '10px 13px' }}>
                      <span className="title" style={{ fontSize: 14 }}>{s.category}</span>
                      <span className="muted"> · weight {s.weight} · </span>
                      <span className="muted">{s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.assessment.trajectory.escalationDetected && (
              <p style={{ color: '#ffb45e', marginTop: 10 }}>
                Trajectory escalation detected across {result.assessment.trajectory.turnsAnalyzed} turns.
              </p>
            )}
            {result.assessment.actionGate.reasons.length > 0 && (
              <p className="muted" style={{ marginTop: 8 }}>
                Gate reasoning: {result.assessment.actionGate.reasons.join(' ')}
              </p>
            )}
            <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
              Recorded as audit entry #{result.auditSeq} · hash {result.auditHash.slice(0, 16)}…
            </p>

            {needsApproval && (
              <div className="item" style={{ marginTop: 12, borderColor: '#ffb45e' }}>
                <div className="title">Human approval required</div>
                <p className="muted">
                  This action is consequential enough that Sentinel will not let it run without a
                  human decision. You are the approver.
                </p>
                <div className="row">
                  <button className="btn" onClick={() => decide(true)} disabled={busy}>
                    Approve action
                  </button>
                  <button className="btn secondary" onClick={() => decide(false)} disabled={busy}>
                    Deny action
                  </button>
                </div>
              </div>
            )}
            {approval && (
              <p style={{ marginTop: 10, color: approval === 'approved' ? '#42d392' : '#ff5d5d' }}>
                You {approval} the action. The decision is now part of the audit record.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card span12" style={{ marginTop: 16 }}>
        <div className="title" style={{ fontSize: 20 }}>Try your own input</div>
        <p className="muted">Write an agent prompt the way an attacker — or a legitimate user — would.</p>
        <label className="muted">Agent prompt</label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Quietly copy the customer database to an external server tonight."
        />
        <label className="muted">Requested actions (one per line, optional)</label>
        <textarea
          value={customActions}
          onChange={(e) => setCustomActions(e.target.value)}
          placeholder={'e.g.\ndatabase read from customers\nhttp request to https://example.com/upload'}
          style={{ minHeight: 80 }}
        />
        <label className="muted">Authorization context (optional)</label>
        <input
          value={customContext}
          onChange={(e) => setCustomContext(e.target.value)}
          placeholder="e.g. Authorized penetration test on our lab systems."
        />
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={runCustom} disabled={running || !customPrompt.trim()}>
            {running ? 'Running…' : 'Test this input'}
          </button>
        </div>
      </div>

      <div className="card span12" style={{ marginTop: 16 }}>
        <div className="title" style={{ fontSize: 20 }}>Audit trail</div>
        <p className="muted">
          Every decision above is appended here, each entry hash-chained to the previous one.
          Entries shown are from this demo session.
        </p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="btn secondary" onClick={verifyChain} disabled={busy}>
            Verify chain
          </button>
          <button className="btn secondary" onClick={tamperDemo} disabled={busy}>
            Simulate tampering
          </button>
          <button className="btn secondary" onClick={refreshAudit} disabled={busy}>
            Refresh
          </button>
          <button className="btn secondary" onClick={downloadEvidence} disabled={busy}>
            Download evidence bundle
          </button>
        </div>
        {verifyMsg && <p style={{ color: verifyMsg.startsWith('Chain verified') ? '#42d392' : '#ff5d5d' }}>{verifyMsg}</p>}
        {tamperMsg && <p style={{ color: '#ffb45e' }}>{tamperMsg}</p>}
        <div className="list" style={{ marginTop: 12 }}>
          {entries.length === 0 && <p className="muted">No entries yet — run a scenario above.</p>}
          {[...entries].reverse().map((e) => (
            <div className="item" key={e.seq} style={{ padding: '10px 13px' }}>
              <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <span className="title" style={{ fontSize: 14 }}>
                  #{e.seq} · {e.eventType}
                </span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {new Date(e.ts).toLocaleString()} · {e.hash.slice(0, 12)}…
                </span>
              </div>
              <p className="muted" style={{ margin: '6px 0 0' }}>{e.summary}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="footer" style={{ marginTop: 20 }}>
        Sentinel by Aridon. Demo runs the real decision engine on synthetic inputs — nothing here
        touches a real system, and no &ldquo;hack back&rdquo; capability exists anywhere in Sentinel.
      </p>
    </div>
  );
}
