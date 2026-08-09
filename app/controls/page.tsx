'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Rule = { id: string; label: string; detail: string; defaultMode: 'allowed' | 'approval' | 'blocked' };
type Mode = Rule['defaultMode'];

const rules: Rule[] = [
  { id: 'research', label: 'Research and analysis', detail: 'Read, compare, summarize, calculate, and surface options.', defaultMode: 'allowed' },
  { id: 'draft', label: 'Draft internal or external content', detail: 'Prepare emails, proposals, plans, scripts, documents, and responses.', defaultMode: 'allowed' },
  { id: 'crm', label: 'Update internal work records', detail: 'Organize CRM notes, projects, tasks, and Company Brain items.', defaultMode: 'allowed' },
  { id: 'send', label: 'Send messages outside the company', detail: 'Email, SMS, social messages, outreach, or other customer-facing communication.', defaultMode: 'approval' },
  { id: 'money', label: 'Spend or commit money', detail: 'Purchases, subscriptions, deposits, orders, or financial commitments.', defaultMode: 'approval' },
  { id: 'legal', label: 'Accept or sign terms', detail: 'Contracts, legal terms, commitments, approvals, certifications, or attestations.', defaultMode: 'approval' },
  { id: 'publish', label: 'Publish consequential claims', detail: 'Financial, legal, regulated, technical, safety, performance, or certification claims.', defaultMode: 'approval' },
  { id: 'delete', label: 'Delete company records', detail: 'Permanent deletion of customer, project, financial, or knowledge records.', defaultMode: 'blocked' },
];

export default function ControlsPage() {
  const [modes, setModes] = useState<Record<string, Mode>>(() => Object.fromEntries(rules.map((rule) => [rule.id, rule.defaultMode])));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('aridon-approval-rules');
      if (raw) setModes((current) => ({ ...current, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  const policy = useMemo(() => {
    const groups: Record<Mode, string[]> = { allowed: [], approval: [], blocked: [] };
    rules.forEach((rule) => groups[modes[rule.id] || rule.defaultMode].push(rule.label));
    return `Allowed without asking: ${groups.allowed.join(', ') || 'none'}. Require owner approval: ${groups.approval.join(', ') || 'none'}. Blocked: ${groups.blocked.join(', ') || 'none'}.`;
  }, [modes]);

  function update(id: string, mode: Mode) {
    setModes((current) => ({ ...current, [id]: mode }));
    setSaved(false);
  }

  function save() {
    try {
      window.localStorage.setItem('aridon-approval-rules', JSON.stringify(modes));
      window.localStorage.setItem('aridon-approval-policy', policy);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>HUMAN AUTHORITY LAYER</div>
            <h1 style={h1}>Approval & Control Center</h1>
            <p style={lead}>Decide once what Aridon may do independently, what needs your approval, and what the system should never do automatically.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/boardroom" style={navLink}>Boardroom</Link><Link href="/" style={navLink}>Command Center</Link></div>
        </header>

        <section style={legend}>
          <Legend title="Allowed" text="Aridon may complete this work without stopping for approval." color="#54D6A5" />
          <Legend title="Approval" text="Aridon may prepare the action, but the owner releases it." color="#F4D06F" />
          <Legend title="Blocked" text="Aridon must not perform this action automatically." color="#F08B91" />
        </section>

        <section style={{ display: 'grid', gap: 9, marginTop: 16 }}>
          {rules.map((rule) => (
            <article key={rule.id} style={ruleCard}>
              <div><h2 style={{ margin: '0 0 5px', fontSize: 18 }}>{rule.label}</h2><p style={muted}>{rule.detail}</p></div>
              <div style={segmented}>
                {(['allowed', 'approval', 'blocked'] as Mode[]).map((mode) => <button key={mode} onClick={() => update(rule.id, mode)} style={{ ...modeButton, ...(modes[rule.id] === mode ? activeMode(mode) : {}) }}>{mode === 'allowed' ? 'Allowed' : mode === 'approval' ? 'Approval' : 'Blocked'}</button>)}
              </div>
            </article>
          ))}
        </section>

        <section style={policyCard}>
          <div><div style={eyebrow}>CURRENT OWNER POLICY</div><p style={{ margin: '8px 0 0', lineHeight: 1.65 }}>{policy}</p></div>
          <button onClick={save} style={saveButton}>{saved ? '✓ Policy Saved' : 'Save Approval Policy'}</button>
        </section>

        <section style={note}><strong>Important:</strong> This control center currently stores the owner's policy in this browser and passes it into the Executive Boardroom. It is the product-level authority model. As external integrations are connected, the same policy should be enforced server-side at every action gateway before a send, payment, signature, deletion, or consequential release.</section>
      </div>
    </main>
  );
}

function Legend({ title, text, color }: { title: string; text: string; color: string }) {
  return <article style={{ background: '#111B2C', border: `1px solid ${color}55`, borderRadius: 14, padding: 15 }}><div style={{ color, fontWeight: 950 }}>{title}</div><p style={{ ...muted, marginBottom: 0 }}>{text}</p></article>;
}

function activeMode(mode: Mode) {
  if (mode === 'allowed') return { background: '#54D6A5', color: '#07130F', borderColor: '#54D6A5' };
  if (mode === 'approval') return { background: '#F4D06F', color: '#2A2105', borderColor: '#F4D06F' };
  return { background: '#F08B91', color: '#2B0B0D', borderColor: '#F08B91' };
}

const page = { minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '32px 18px 90px' };
const shell = { maxWidth: 1080, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' as const };
const eyebrow = { color: '#9EF0CF', fontWeight: 950, fontSize: 11, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(42px,7vw,70px)', lineHeight: .95, letterSpacing: -2, margin: '9px 0 14px' };
const lead = { color: '#B8C3D4', maxWidth: 760, fontSize: 18, lineHeight: 1.65 };
const navLink = { border: '1px solid #40506B', color: '#F8FAFC', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 850 };
const legend = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 9, marginTop: 20 };
const ruleCard = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'center', background: '#0D1728', border: '1px solid #273854', borderRadius: 15, padding: 17 };
const muted = { color: '#AEB9CB', lineHeight: 1.55, margin: 0 };
const segmented = { display: 'flex', gap: 5, flexWrap: 'wrap' as const, justifyContent: 'flex-end' };
const modeButton = { border: '1px solid #3A4B68', background: '#101C2E', color: '#D7DFEB', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', fontWeight: 850, fontSize: 12 };
const policyCard = { marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'center', background: '#132B26', border: '1px solid #2E6959', borderRadius: 17, padding: 20 };
const saveButton = { border: 0, background: '#9EF0CF', color: '#07130F', borderRadius: 10, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' };
const note = { marginTop: 12, color: '#93A1B7', fontSize: 12, lineHeight: 1.65, border: '1px dashed #33445F', borderRadius: 12, padding: 13 };
