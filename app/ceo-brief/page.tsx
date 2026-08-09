'use client';

import Link from 'next/link';
import { useState } from 'react';

type Brief = {
  headline: string;
  summary: string;
  priorities: string[];
  revenue: string;
  operations: string;
  risks: string[];
  opportunities: string[];
  nextActions: string[];
  demo?: boolean;
};

export default function CEOBriefPage() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function buildBrief() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const [leadsRes, projectsRes, tasksRes, knowledgeRes] = await Promise.all([
        fetch('/api/crm', { cache: 'no-store' }),
        fetch('/api/projects', { cache: 'no-store' }),
        fetch('/api/tasks', { cache: 'no-store' }),
        fetch('/api/knowledge', { cache: 'no-store' }),
      ]);
      const [leads, projects, tasks, knowledge] = await Promise.all([
        leadsRes.ok ? leadsRes.json() : [],
        projectsRes.ok ? projectsRes.json() : [],
        tasksRes.ok ? tasksRes.json() : [],
        knowledgeRes.ok ? knowledgeRes.json() : [],
      ]);
      const response = await fetch('/api/ceo-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, projects, tasks, knowledge }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create the CEO brief.');
      setBrief(data as Brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the CEO brief.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>EVA · CHIEF OF STAFF</div>
            <h1 style={h1}>CEO Brief</h1>
            <p style={lead}>One short briefing from the whole command center: priorities, revenue, operations, risks, opportunities, and the three actions that matter most now.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/boardroom" style={navLink}>Executive Boardroom</Link>
            <Link href="/" style={navLink}>Command Center</Link>
          </div>
        </header>

        <section style={heroCard}>
          <div><div style={sectionLabel}>CURRENT COMMAND-CENTER SNAPSHOT</div><h2 style={{ fontSize: 30, margin: '8px 0 8px' }}>Ask Eva to compress the business into one decision-ready page.</h2><p style={muted}>The brief reads the CRM, projects, tasks and Company Brain items already in Aridon. Missing information is called out instead of invented.</p></div>
          <button onClick={buildBrief} disabled={busy} style={{ ...primaryButton, opacity: busy ? .6 : 1 }}>{busy ? 'Building today’s brief…' : brief ? 'Refresh CEO Brief' : 'Build CEO Brief'}</button>
        </section>

        {error && <div style={errorBox}>{error}</div>}

        {!brief && !error && <section style={empty}><div style={{ fontSize: 34 }}>◉</div><h2>Your morning cockpit is ready.</h2><p>Generate the brief whenever you want the executive team condensed into one page.</p></section>}

        {brief && (
          <section style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <article style={headlineCard}>
              <div style={sectionLabel}>{brief.demo ? 'CEO BRIEF · DEMO MODE' : 'CEO BRIEF'}</div>
              <h2 style={{ fontSize: 'clamp(28px,5vw,46px)', margin: '9px 0' }}>{brief.headline}</h2>
              <p style={{ ...muted, fontSize: 17 }}>{brief.summary}</p>
            </article>

            <div style={grid3}>
              {brief.priorities?.slice(0, 3).map((item, index) => <article key={item} style={panel}><div style={number}>{index + 1}</div><strong>{item}</strong></article>)}
            </div>

            <div style={grid2}>
              <article style={panel}><div style={sectionLabel}>LEDGER · REVENUE</div><h3>Commercial attention</h3><p style={muted}>{brief.revenue}</p></article>
              <article style={panel}><div style={sectionLabel}>HEATHER · OPERATIONS</div><h3>Execution attention</h3><p style={muted}>{brief.operations}</p></article>
            </div>

            <div style={grid2}>
              <article style={panel}><div style={sectionLabel}>ETHOS · RISKS</div><ul style={list}>{brief.risks?.map((item) => <li key={item}>{item}</li>)}</ul></article>
              <article style={panel}><div style={sectionLabel}>SCOUT · OPPORTUNITIES</div><ul style={list}>{brief.opportunities?.map((item) => <li key={item}>{item}</li>)}</ul></article>
            </div>

            <article style={nextCard}>
              <div style={sectionLabel}>THE THREE MOVES</div>
              <div style={grid3}>{brief.nextActions?.slice(0, 3).map((item, index) => <div key={item} style={action}><span>{index + 1}</span><strong>{item}</strong></div>)}</div>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}

const page = { minHeight: '100vh', background: '#F2F0E9', color: '#171717', fontFamily: 'Arial, sans-serif', padding: '32px 18px 90px' };
const shell = { maxWidth: 1120, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' as const, marginBottom: 22 };
const eyebrow = { color: '#24604E', fontWeight: 950, fontSize: 12, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(44px,8vw,76px)', lineHeight: .95, margin: '9px 0 14px', letterSpacing: -2 };
const lead = { maxWidth: 790, color: '#55564F', fontSize: 18, lineHeight: 1.65 };
const navLink = { border: '1px solid #AAA79E', color: '#171717', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 850 };
const heroCard = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 20, alignItems: 'center', background: '#171717', color: '#fff', borderRadius: 20, padding: 24 };
const sectionLabel = { color: '#62D6AE', fontWeight: 950, fontSize: 11, letterSpacing: .9 };
const primaryButton = { border: 0, background: '#9EF0CF', color: '#07130F', borderRadius: 11, padding: '14px 18px', fontWeight: 950, cursor: 'pointer' };
const muted = { color: '#6A6A63', lineHeight: 1.6 };
const errorBox = { marginTop: 14, background: '#FCE7EA', border: '1px solid #D38A93', color: '#722E37', borderRadius: 12, padding: 13 };
const empty = { marginTop: 16, textAlign: 'center' as const, padding: '48px 20px', border: '1px dashed #B7B3AA', borderRadius: 18, color: '#66665F' };
const headlineCard = { background: '#DDF8ED', border: '1px solid #9CCEBB', borderRadius: 18, padding: 22 };
const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10 };
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12 };
const panel = { background: '#fff', border: '1px solid #D2CEC3', borderRadius: 16, padding: 18 };
const number = { width: 31, height: 31, display: 'grid', placeItems: 'center', borderRadius: 999, background: '#171717', color: '#fff', fontWeight: 950, marginBottom: 10 };
const list = { lineHeight: 1.8, paddingLeft: 20, marginBottom: 0 };
const nextCard = { background: '#171717', color: '#fff', borderRadius: 18, padding: 22 };
const action = { display: 'flex', gap: 10, alignItems: 'center', background: '#232323', border: '1px solid #353535', borderRadius: 13, padding: 14 };
