'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type MissionData = {
  businessName: string;
  plan?: string;
  telemetry: Record<string, number>;
  taskPressure: Array<{ id: string; title: string; owner?: string | null; priority?: string | null; status?: string | null }>;
  projectPulse: Array<{ id: string; name: string; status?: string | null }>;
  recentActivity: Array<{ id: string; summary: string; webResearch: boolean; createdAt?: string | null }>;
  system: Record<string, boolean>;
};

const systemLabels: Record<string, string> = {
  companyBrain: 'Company Brain', boardroom: 'Executive Boardroom', execution: 'Execution Team', ceoBrief: 'CEO Brief',
  approvalPolicy: 'Approval Controls', voiceRoom: 'Hands-Free Voice', liveWebResearch: 'Live Web Research',
  growthCommand: 'Growth Command', benchmarkLab: 'Benchmark Lab',
};

export default function MissionControl({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [data, setData] = useState<MissionData | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true); setError('');
    try {
      const db = getBrowserClient();
      const { data: sessionData } = await db.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/mission-control`)}`); return; }
      const response = await fetch(`/api/customer/mission-control?slug=${encodeURIComponent(params.slug)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Mission Control could not load.');
      setData(result);
    } catch (err) { setError(err instanceof Error ? err.message : 'Mission Control could not load.'); }
    finally { setRefreshing(false); }
  }

  useEffect(() => { void load(); }, [params.slug]);

  if (!data && !error) return <main style={loading}>Opening Mission Control…</main>;

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div><div style={eyebrow}>ARIDON · LIVE COMPANY COMMAND</div><h1 style={h1}>Mission Control</h1><p style={lead}>{data?.businessName || 'Your company'} · One view of executive activity, operating pressure, company memory, and the systems Aridon can use right now.</p></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => void load()} style={outlineButton}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
            <Link href={`/workspace/${params.slug}/executive-suite`} style={mintButton}>Executive Suite</Link>
          </div>
        </header>

        {error && <div style={errorBox}>{error}</div>}
        {data && <>
          <section style={metricGrid}>
            <Metric label="Active projects" value={data.telemetry.activeProjects || 0} />
            <Metric label="Open tasks" value={data.telemetry.openTasks || 0} />
            <Metric label="Completed tasks" value={data.telemetry.completedTasks || 0} />
            <Metric label="Executive runs" value={data.telemetry.executiveRuns || 0} />
            <Metric label="Web research runs" value={data.telemetry.webResearchRuns || 0} />
            <Metric label="Brain items" value={data.telemetry.companyBrainItems || 0} />
          </section>

          <section style={twoCol}>
            <article style={panel}>
              <div style={sectionLabel}>SYSTEM STATUS</div><h2 style={h2}>What Aridon can command now</h2>
              <div style={statusGrid}>{Object.entries(data.system).map(([key, on]) => <div key={key} style={statusRow}><span style={statusDot(on)} /> <strong>{systemLabels[key] || key}</strong><span style={{ marginLeft: 'auto', color: on ? '#1D7A56' : '#8A5A00', fontSize: 12, fontWeight: 900 }}>{on ? 'READY' : 'NEEDS CONNECTION'}</span></div>)}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
                <Link href={`/workspace/${params.slug}/benchmark`} style={darkButton}>Open Benchmark Lab</Link>
                <Link href="/business-os/growth-command" style={outlineDark}>Growth Command</Link>
                <Link href="/customer/start" style={outlineDark}>Voice Main Room</Link>
              </div>
            </article>

            <article style={panel}>
              <div style={sectionLabel}>RECENT EXECUTIVE ACTIVITY</div><h2 style={h2}>What the team has been doing</h2>
              {data.recentActivity.length ? data.recentActivity.map((item) => <div key={item.id} style={activityRow}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{item.webResearch ? 'Web-backed executive run' : 'Executive run'}</strong><small>{formatDate(item.createdAt)}</small></div><p>{item.summary}</p></div>) : <p style={muted}>No executive activity has been logged yet.</p>}
            </article>
          </section>

          <section style={twoCol}>
            <article style={panel}><div style={sectionLabel}>TASK PRESSURE</div><h2 style={h2}>Work that can become a bottleneck</h2>{data.taskPressure.length ? data.taskPressure.map((task) => <div key={task.id} style={listRow}><strong>{task.title}</strong><span>{[task.owner, task.priority, task.status].filter(Boolean).join(' · ')}</span></div>) : <p style={muted}>No task pressure detected.</p>}</article>
            <article style={panel}><div style={sectionLabel}>PROJECT PULSE</div><h2 style={h2}>Where the company is moving</h2>{data.projectPulse.length ? data.projectPulse.map((project) => <div key={project.id} style={listRow}><strong>{project.name}</strong><span>{project.status || 'active'}</span></div>) : <p style={muted}>No projects are stored yet.</p>}</article>
          </section>

          <section style={{ ...panel, background: '#0D1728', color: '#fff' }}>
            <div style={{ ...sectionLabel, color: '#9EF0CF' }}>THE ARIDON LOOP</div>
            <h2 style={{ ...h2, fontSize: 36 }}>Discover → Analyze → Debate → Decide → Execute → Measure → Learn</h2>
            <p style={{ color: '#BBC7D7', lineHeight: 1.65, maxWidth: 900 }}>Mission Control is the measurement layer. It does not invent success. It surfaces actual workspace activity and makes the next gap visible so the executive team can improve the company and the system itself.</p>
          </section>
        </>}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <article style={metric}><div style={{ color: '#8FA0B8', fontSize: 11, fontWeight: 900 }}>{label.toUpperCase()}</div><div style={{ fontSize: 38, fontWeight: 950, marginTop: 5 }}>{value}</div></article>; }
function formatDate(value?: string | null) { if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(); }
function statusDot(on: boolean) { return { width: 10, height: 10, borderRadius: 999, background: on ? '#42D392' : '#F4D06F', flex: '0 0 auto' }; }
const page = { minHeight: '100vh', background: '#07101D', color: '#F7FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 20px 72px' };
const shell = { maxWidth: 1220, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 28 };
const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(46px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '10px 0 14px' };
const h2 = { fontSize: 27, margin: '8px 0 16px' };
const lead = { color: '#B9C5D6', fontSize: 18, lineHeight: 1.6, maxWidth: 820, margin: 0 };
const metricGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 16 };
const metric = { background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 15, padding: 16 };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14, marginBottom: 14 };
const panel = { background: '#F6F3EB', color: '#171717', borderRadius: 18, padding: 20, border: '1px solid #D7D0C3' };
const sectionLabel = { fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const statusGrid = { display: 'grid', gap: 7 };
const statusRow = { display: 'flex', gap: 9, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #E6E0D6' };
const activityRow = { borderTop: '1px solid #E6E0D6', padding: '12px 0' };
const listRow = { borderTop: '1px solid #E6E0D6', padding: '11px 0', display: 'grid', gap: 4 };
const muted = { color: '#6B665D', lineHeight: 1.6 };
const mintButton = { background: '#9EF0CF', color: '#07130F', padding: '12px 16px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const outlineButton = { background: 'transparent', border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, fontWeight: 900, cursor: 'pointer' };
const darkButton = { background: '#171717', color: '#fff', padding: '11px 14px', borderRadius: 10, textDecoration: 'none', fontWeight: 900 };
const outlineDark = { border: '1px solid #8D877C', color: '#171717', padding: '10px 13px', borderRadius: 10, textDecoration: 'none', fontWeight: 900 };
const errorBox = { background: '#3B1F28', color: '#FFD8E0', border: '1px solid #7C4353', borderRadius: 12, padding: 14, marginBottom: 14 };
const loading = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#07101D', color: '#fff', fontFamily: 'Arial, sans-serif' };
