'use client';

import { FormEvent, useMemo, useState } from 'react';

type Issue = {
  code: string;
  severity: 'info' | 'caution' | 'stop';
  points: number;
  message: string;
  recommendation: string;
};

type Report = {
  policyVersion: string;
  score: number;
  status: 'green' | 'caution' | 'stop';
  action: 'send' | 'review' | 'stop';
  summary: string;
  issues: Issue[];
};

type Result = {
  report: Report;
  dns: null | {
    domain: string;
    spf: string;
    dkim: string;
    dmarc: string;
    dkimSelector: string | null;
    note: string;
  };
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 14,
  background: '#fff',
};

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 13,
  fontWeight: 800,
  color: '#334155',
};

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function DeliverabilityCommandCenter() {
  const [form, setForm] = useState({
    sender: '',
    recipient: '',
    subject: '',
    body: '',
    dkimSelector: '',
    recipientStatus: 'unknown',
    bounceRate: '',
    complaintRate: '',
    dailyVolume: '',
    previousDailyVolume: '',
    warmupDays: '',
    providerCount: '1',
    outreach: true,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const statusColor = useMemo(() => {
    if (!result) return '#334155';
    if (result.report.status === 'green') return '#147a52';
    if (result.report.status === 'caution') return '#a15c00';
    return '#b42318';
  }, [result]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/deliverability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: form.sender,
          recipient: form.recipient,
          subject: form.subject,
          body: form.body,
          dkimSelector: form.dkimSelector || undefined,
          recipientStatus: form.recipientStatus,
          bounceRate: numberOrUndefined(form.bounceRate),
          complaintRate: numberOrUndefined(form.complaintRate),
          dailyVolume: numberOrUndefined(form.dailyVolume),
          previousDailyVolume: numberOrUndefined(form.previousDailyVolume),
          warmupDays: numberOrUndefined(form.warmupDays),
          providerCount: numberOrUndefined(form.providerCount),
          outreach: form.outreach,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Preflight failed.');
      setResult(data as Result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Preflight failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f6f8f7', color: '#14231f', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#10211c', color: '#fff', padding: '54px 20px 46px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color: '#9EF0CF' }}>ARIDON DELIVERABILITY SENTINEL</div>
          <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(34px, 6vw, 64px)', lineHeight: 1.02 }}>Protect the inbox before we press send.</h1>
          <p style={{ margin: 0, maxWidth: 820, color: '#d7e5df', fontSize: 18, lineHeight: 1.55 }}>
            Preflight outbound email for sender authentication, list quality, bounce and complaint risk, volume spikes, warmup, provider concentration, and message-level warning signs.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 60px', display: 'grid', gap: 22 }}>
        <section style={{ background: '#fff', border: '1px solid #dce5e1', borderRadius: 18, padding: 22, boxShadow: '0 8px 30px rgba(16,33,28,0.05)' }}>
          <h2 style={{ marginTop: 0 }}>Run a send preflight</h2>
          <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
              <label style={labelStyle}>Sender email<input style={fieldStyle} value={form.sender} onChange={(e) => update('sender', e.target.value)} placeholder="eva@yourdomain.com" /></label>
              <label style={labelStyle}>Recipient email<input style={fieldStyle} required value={form.recipient} onChange={(e) => update('recipient', e.target.value)} placeholder="person@company.com" /></label>
              <label style={labelStyle}>Recipient quality<select style={fieldStyle} value={form.recipientStatus} onChange={(e) => update('recipientStatus', e.target.value)}><option value="verified">Verified</option><option value="unknown">Unknown</option><option value="catch_all">Catch-all</option><option value="invalid">Invalid</option></select></label>
              <label style={labelStyle}>DKIM selector, optional<input style={fieldStyle} value={form.dkimSelector} onChange={(e) => update('dkimSelector', e.target.value)} placeholder="google, selector1, default" /></label>
            </div>

            <label style={labelStyle}>Subject<input style={fieldStyle} required value={form.subject} onChange={(e) => update('subject', e.target.value)} /></label>
            <label style={labelStyle}>Message<textarea style={{ ...fieldStyle, minHeight: 150, resize: 'vertical' }} required value={form.body} onChange={(e) => update('body', e.target.value)} /></label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              <label style={labelStyle}>Bounce rate %<input style={fieldStyle} inputMode="decimal" value={form.bounceRate} onChange={(e) => update('bounceRate', e.target.value)} placeholder="0.8" /></label>
              <label style={labelStyle}>Complaint rate %<input style={fieldStyle} inputMode="decimal" value={form.complaintRate} onChange={(e) => update('complaintRate', e.target.value)} placeholder="0.03" /></label>
              <label style={labelStyle}>Planned daily volume<input style={fieldStyle} inputMode="numeric" value={form.dailyVolume} onChange={(e) => update('dailyVolume', e.target.value)} placeholder="100" /></label>
              <label style={labelStyle}>Previous daily volume<input style={fieldStyle} inputMode="numeric" value={form.previousDailyVolume} onChange={(e) => update('previousDailyVolume', e.target.value)} placeholder="75" /></label>
              <label style={labelStyle}>Warmup days<input style={fieldStyle} inputMode="numeric" value={form.warmupDays} onChange={(e) => update('warmupDays', e.target.value)} placeholder="21" /></label>
              <label style={labelStyle}>Sending providers<input style={fieldStyle} inputMode="numeric" value={form.providerCount} onChange={(e) => update('providerCount', e.target.value)} /></label>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800 }}>
              <input type="checkbox" checked={form.outreach} onChange={(e) => update('outreach', e.target.checked)} />
              This is outbound prospecting / commercial outreach
            </label>

            <button disabled={loading} style={{ justifySelf: 'start', border: 0, borderRadius: 10, padding: '12px 18px', background: '#10211c', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>
              {loading ? 'Running preflight…' : 'Run Deliverability Sentinel'}
            </button>
          </form>
          {error ? <p style={{ color: '#b42318', fontWeight: 800 }}>{error}</p> : null}
        </section>

        {result ? (
          <section style={{ background: '#fff', border: `2px solid ${statusColor}`, borderRadius: 18, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.2, color: statusColor }}>{result.report.status.toUpperCase()} · {result.report.action.toUpperCase()}</div>
                <h2 style={{ margin: '6px 0' }}>Score {result.report.score}/100</h2>
                <p style={{ margin: 0, color: '#475569' }}>{result.report.summary}</p>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Policy {result.report.policyVersion}</div>
            </div>

            {result.dns ? (
              <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#f8fafc', display: 'grid', gap: 8 }}>
                <strong>Domain record check: {result.dns.domain}</strong>
                <div>SPF: <b>{result.dns.spf}</b> · DKIM: <b>{result.dns.dkim}</b> · DMARC: <b>{result.dns.dmarc}</b></div>
                <small style={{ color: '#64748b' }}>{result.dns.note}</small>
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
              {result.report.issues.length ? result.report.issues.map((issue) => (
                <article key={issue.code} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 12, color: issue.severity === 'stop' ? '#b42318' : '#a15c00' }}>{issue.severity} · -{issue.points}</div>
                  <div style={{ fontWeight: 800, marginTop: 5 }}>{issue.message}</div>
                  <div style={{ color: '#475569', marginTop: 4 }}>{issue.recommendation}</div>
                </article>
              )) : <div style={{ fontWeight: 800, color: '#147a52' }}>No material warning signals were found in the supplied data.</div>}
            </div>
          </section>
        ) : null}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
          {[
            ['GREEN', 'Send conditions look healthy. Normal approval controls still apply.'],
            ['CAUTION', 'Review the warning, slow down if needed, and fix the weak signal before scaling.'],
            ['STOP', 'Aridon blocks the send when the supplied signals show a serious deliverability or reputation risk.'],
          ].map(([title, copy]) => <div key={title} style={{ background: '#fff', border: '1px solid #dce5e1', borderRadius: 14, padding: 18 }}><strong>{title}</strong><p style={{ marginBottom: 0, color: '#475569', lineHeight: 1.5 }}>{copy}</p></div>)}
        </section>

        <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
          Deliverability Sentinel is a preventive risk control, not a guarantee of inbox placement. DNS checks verify record presence, not message-level SPF/DKIM/DMARC alignment. Aridon does not use domain or provider rotation to evade anti-spam controls.
        </p>
      </div>
    </main>
  );
}
