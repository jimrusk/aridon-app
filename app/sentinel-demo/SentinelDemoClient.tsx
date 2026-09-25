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

type ScanScenarioResult = {
  id: string;
  title: string;
  category: string;
  hostile: boolean;
  passed: boolean;
  failures: string[];
  score: number;
  disposition: 'allow' | 'restricted' | 'review' | 'block';
  actionGate: 'pass' | 'human_approval' | 'deny';
  escalationDetected: boolean;
  rationale: string;
};

type ScanReport = {
  version: string;
  ranAt: string;
  verdict: 'PASS' | 'FAIL';
  totals: { scenarios: number; passed: number; failed: number };
  hostile: { total: number; caught: number; missed: number; detectionRate: number };
  benign: { total: number; blocked: number; falsePositiveRate: number };
  auditSeq: number;
  auditHash: string;
  results: ScanScenarioResult[];
};

type Assessment = {
  score: number;
  disposition: 'allow' | 'restricted' | 'review' | 'block';
  reasons: string[];
  signals: { category: string; weight: number; reason: string; source: string }[];
  actionGate: { mode: 'pass' | 'human_approval' | 'deny'; reasons: string[] };
  trajectory: { turnsAnalyzed: number; escalationDetected: boolean; categoryCount: number };
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

const GATE_LABEL: Record<string, string> = {
  pass: 'pass',
  human_approval: 'human approval',
  deny: 'deny',
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
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState('');

  const [gateDecision, setGateDecision] = useState<'approved' | 'denied' | null>(null);

  const [customPrompt, setCustomPrompt] = useState('');
  const [customActions, setCustomActions] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [customRunning, setCustomRunning] = useState(false);
  const [customResult, setCustomResult] = useState<{
    assessment: Assessment;
    auditSeq: number;
    auditHash: string;
  } | null>(null);

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [tamperMsg, setTamperMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    post('manifest')
      .then((d) => setScenarios(d.scenarios ?? []))
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

  async function runScan() {
    setScanning(true);
    setError('');
    setReport(null);
    try {
      const data = await post('scan');
      setReport(data);
      refreshAudit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed.');
    } finally {
      setScanning(false);
    }
  }

  async function decideGate(approved: boolean) {
    setBusy(true);
    try {
      await post('approve', {
        approved,
        label: 'payment + external email from the scan (consequential actions)',
      });
      setGateDecision(approved ? 'approved' : 'denied');
      refreshAudit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed.');
    } finally {
      setBusy(false);
    }
  }

  async function runCustom() {
    setCustomRunning(true);
    setError('');
    setCustomResult(null);
    try {
      const data = await post('custom', {
        prompt: customPrompt,
        requestedActions: customActions
          .split('\n')
          .map((a) => a.trim())
          .filter(Boolean),
        authorizationContext: customContext,
      });
      setCustomResult(data);
      refreshAudit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed.');
    } finally {
      setCustomRunning(false);
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
        fullScan: report,
        humanGateDecision: gateDecision,
        customRun: customResult,
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

  const gateScenario = scenarios.find((s) => s.id === 'pt-approval-bypass');
  const customDisp = customResult ? DISPOSITION_STYLE[customResult.assessment.disposition] : null;

  return (
    <div className="main" style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div className="hero">
        <div>
          <h1 className="h1">Sentinel — live demo</h1>
          <p className="sub">
            Attack it. One click runs all twelve scenarios through Sentinel&apos;s real
            pre-execution decision engine, and every decision is written to a tamper-evident
            audit log you can inspect.
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
          <div className="title">1. Run the full scan</div>
          <p className="muted">All 12 scenarios: nine hostile techniques, three benign controls.</p>
        </div>
        <div className="card span4">
          <div className="title">2. You be the human gate</div>
          <p className="muted">One scenario needs a person, not a policy. That person is you.</p>
        </div>
        <div className="card span4">
          <div className="title">3. Check the record</div>
          <p className="muted">Every decision lands in a hash-chained audit log. Verify it — or try to break it.</p>
        </div>
      </div>

      <div className="card span12" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="title" style={{ fontSize: 20 }}>Full adversarial scan</div>
            <p className="muted" style={{ marginBottom: 0 }}>
              Prompt injection, credential theft, privilege escalation, exfiltration, ransomware,
              phishing, evasion, multi-turn escalation, action gating — plus three benign controls
              that must not be blocked.
            </p>
          </div>
          <button className="btn" onClick={runScan} disabled={scanning}>
            {scanning ? 'Scanning…' : 'Scan all 12 scenarios'}
          </button>
        </div>

        {error && (
          <div className="item" style={{ marginTop: 12, borderColor: '#ff5d5d' }}>
            <span style={{ color: '#ff5d5d' }}>{error}</span>
          </div>
        )}

        {report && (
          <div style={{ marginTop: 12 }}>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span
                className="pill"
                style={{
                  borderColor: report.verdict === 'PASS' ? '#42d392' : '#ff5d5d',
                  color: report.verdict === 'PASS' ? '#42d392' : '#ff5d5d',
                  fontWeight: 800,
                }}
              >
                {report.verdict}
              </span>
              <span className="pill">
                {report.hostile.caught}/{report.hostile.total} hostile caught
              </span>
              <span className="pill">
                {report.benign.blocked}/{report.benign.total} benign blocked
              </span>
              <span className="muted">
                Logged as audit entry #{report.auditSeq} · {report.auditHash.slice(0, 12)}…
              </span>
            </div>
            <div className="list" style={{ marginTop: 12 }}>
              {report.results.map((r) => {
                const disp = DISPOSITION_STYLE[r.disposition];
                const outcome = r.hostile
                  ? r.passed
                    ? { label: 'Caught', color: '#42d392' }
                    : { label: 'Missed', color: '#ff5d5d' }
                  : r.passed
                    ? { label: 'Clean', color: '#42d392' }
                    : { label: 'False positive', color: '#ff5d5d' };
                return (
                  <div className="item" key={r.id} style={{ padding: '10px 13px' }}>
                    <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <span className="title" style={{ fontSize: 14 }}>{r.title}</span>
                      <span className="muted" style={{ fontSize: 12 }}>{r.category}</span>
                    </div>
                    <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      <span className="pill" style={{ borderColor: disp.color, color: disp.color }}>
                        {disp.label}
                      </span>
                      <span className="pill">gate: {GATE_LABEL[r.actionGate]}</span>
                      <span className="pill">score {r.score}</span>
                      <span className="pill" style={{ borderColor: outcome.color, color: outcome.color, fontWeight: 700 }}>
                        {outcome.label}
                      </span>
                      {r.escalationDetected && (
                        <span className="pill" style={{ borderColor: '#ffb45e', color: '#ffb45e' }}>
                          trajectory escalation
                        </span>
                      )}
                    </div>
                    {!r.passed && r.failures.length > 0 && (
                      <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
                        {r.failures.join('; ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="card span12" style={{ marginTop: 16, borderColor: '#ffb45e' }}>
        <div className="title" style={{ fontSize: 20 }}>Human approval gate — your turn</div>
        <p className="muted">
          {gateScenario
            ? `From the scan: "${gateScenario.prompt}" The text looks routine, but the requested actions include a $50,000 payment and an external email. Policy alone can't clear this — Sentinel escalates to a human.`
            : 'One consequential action needs a human decision, not a policy match.'}
        </p>
        {!gateDecision ? (
          <div className="row">
            <button className="btn" onClick={() => decideGate(true)} disabled={busy}>
              Approve action
            </button>
            <button className="btn secondary" onClick={() => decideGate(false)} disabled={busy}>
              Deny action
            </button>
          </div>
        ) : (
          <p style={{ color: gateDecision === 'approved' ? '#42d392' : '#ff5d5d', marginBottom: 0 }}>
            You {gateDecision} the action. The decision is now part of the audit record.
          </p>
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
          <button className="btn" onClick={runCustom} disabled={customRunning || !customPrompt.trim()}>
            {customRunning ? 'Running…' : 'Test this input'}
          </button>
        </div>
        {customResult && customDisp && (
          <div className="item" style={{ marginTop: 12 }}>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span className="pill" style={{ borderColor: customDisp.color, color: customDisp.color, fontWeight: 800 }}>
                {customDisp.label}
              </span>
              <span className="muted">Risk score: {customResult.assessment.score}/100</span>
            </div>
            {customResult.assessment.signals.length > 0 && (
              <div className="list" style={{ marginTop: 10 }}>
                {customResult.assessment.signals.map((s, i) => (
                  <div className="item" key={i} style={{ padding: '10px 13px' }}>
                    <span className="title" style={{ fontSize: 14 }}>{s.category}</span>
                    <span className="muted"> · weight {s.weight} · </span>
                    <span className="muted">{s.reason}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
              Recorded as audit entry #{customResult.auditSeq} · hash {customResult.auditHash.slice(0, 16)}…
            </p>
          </div>
        )}
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
          {entries.length === 0 && <p className="muted">No entries yet — run the scan above.</p>}
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
