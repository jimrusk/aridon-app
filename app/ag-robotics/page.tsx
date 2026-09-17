'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getBrowserClient } from '../../lib/supabase';

type Bucket = 'partner' | 'sell_dealer' | 'pilot_campus' | 'invest_acquire';
type RobotCompany = {
  id: string;
  tenant_id: string;
  company_name: string;
  segment: string;
  crop_system: string;
  aridon_bucket: Bucket;
  priority: number;
  status: string;
  website?: string | null;
  country?: string | null;
  fit_summary?: string | null;
  next_action?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  outreach_status: string;
  source_url: string;
  classification_note: string;
};

type MePayload = { tenant?: { id?: string; slug?: string; business_name?: string }; error?: string };

const BUCKETS: Array<{ key: Bucket; title: string; subtitle: string }> = [
  { key: 'partner', title: 'PARTNER', subtitle: 'Integrations, APIs, strategic alliances' },
  { key: 'sell_dealer', title: 'SELL / DEALER', subtitle: 'Marketplace, dealer, referral, financing' },
  { key: 'pilot_campus', title: 'PILOT AT CAMPUS', subtitle: 'Southwest field + greenhouse demonstrations' },
  { key: 'invest_acquire', title: 'INVEST / ACQUIRE', subtitle: 'Strategic diligence watchlist, not assumed available' },
];

const STATUS_OPTIONS = ['target', 'researching', 'outreach_ready', 'contacted', 'replied', 'pilot_discussion', 'closed'];

export default function AgRoboticsPage() {
  const [rows, setRows] = useState<RobotCompany[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Loading the Aridon Ag Robotics pipeline…');
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const db = getBrowserClient();
      const session = await db.auth.getSession();
      const access = session.data.session?.access_token || '';
      if (!access) {
        setMessage('Sign in to Aridon to open the robotics pipeline.');
        setLoading(false);
        return;
      }
      setToken(access);
      const me = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' });
      const mePayload = (await me.json().catch(() => ({}))) as MePayload;
      if (!me.ok || !mePayload.tenant?.id) throw new Error(mePayload.error || 'Could not open your Aridon workspace.');
      const id = mePayload.tenant.id;
      setTenantId(id);
      const result = await db
        .from('customer_ag_robotics_companies')
        .select('*')
        .eq('tenant_id', id)
        .order('priority', { ascending: true })
        .order('company_name', { ascending: true });
      if (result.error) throw result.error;
      setRows((result.data || []) as RobotCompany[]);
      setMessage(`${result.data?.length || 0} priority companies loaded from the 2026 Crop Robotics Landscape.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load the robotics pipeline.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function updateRow(id: string, patch: Partial<RobotCompany>) {
    if (!tenantId || !token) return;
    setSavingId(id);
    try {
      const db = getBrowserClient();
      const result = await db
        .from('customer_ag_robotics_companies')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select('*')
        .single();
      if (result.error) throw result.error;
      setRows((current) => current.map((row) => row.id === id ? (result.data as RobotCompany) : row));
      setMessage(`${(result.data as RobotCompany).company_name} updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update that company.');
    } finally {
      setSavingId('');
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.company_name, row.segment, row.crop_system, row.fit_summary, row.next_action].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [rows, query]);

  const priorityOne = rows.filter((row) => row.priority === 1).length;
  const contacted = rows.filter((row) => ['contacted','replied','pilot_discussion'].includes(row.status)).length;

  return (
    <main style={page}>
      <section style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>ARIDON AG · ROBOTICS COMMAND</div>
            <h1 style={h1}>From 400+ robots to an Aridon pipeline.</h1>
            <p style={lead}>A working target database for partnerships, equipment sales, Southwest pilots, and strategic investment diligence.</p>
          </div>
          <div style={nav}>
            <Link href="/dashboard" style={ghost}>Workspace</Link>
            <Link href="/aridon-browser" style={ghost}>Aridon Browser</Link>
          </div>
        </header>

        <section style={statsGrid}>
          <Metric label="Priority companies" value={rows.length} />
          <Metric label="Priority 1" value={priorityOne} />
          <Metric label="Contacted / active" value={contacted} />
          <Metric label="Landscape" value="400+" />
        </section>

        <div style={notice}>
          <strong>{loading ? 'Loading…' : 'LIVE PIPELINE'}</strong>
          <span>{message}</span>
          <span style={small}>The four buckets are Aridon strategy classifications, not claims that a company has agreed to partner, sell through us, take investment, or be acquired.</span>
        </div>

        <section style={toolbar}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, segment, crop system…" style={searchInput} />
          <button type="button" onClick={() => void load()} style={refresh}>Refresh</button>
          <a href="https://www.mixingbowlhub.com/landscape/the-2026-crop-robotics-landscape-where-the-vision-meets-the-dirt" target="_blank" rel="noreferrer" style={sourceLink}>2026 source landscape ↗</a>
        </section>

        <section style={board}>
          {BUCKETS.map((bucket) => {
            const bucketRows = filtered.filter((row) => row.aridon_bucket === bucket.key);
            return (
              <div key={bucket.key} style={column}>
                <div style={columnHeader}>
                  <div>
                    <div style={columnTitle}>{bucket.title}</div>
                    <div style={columnSubtitle}>{bucket.subtitle}</div>
                  </div>
                  <div style={countBadge}>{bucketRows.length}</div>
                </div>

                <div style={cards}>
                  {bucketRows.map((row) => (
                    <article key={row.id} style={{ ...card, borderColor: row.priority === 1 ? '#79efbb' : '#2d4351' }}>
                      <div style={cardTop}>
                        <div>
                          <div style={company}>{row.company_name}</div>
                          <div style={meta}>{row.segment} · {row.crop_system}</div>
                        </div>
                        <div style={priorityBadge}>P{row.priority}</div>
                      </div>

                      <p style={bodyText}>{row.fit_summary}</p>
                      <div style={nextBox}><strong>Next:</strong> {row.next_action}</div>

                      <label style={label}>Status</label>
                      <select
                        style={select}
                        value={row.status}
                        disabled={savingId === row.id}
                        onChange={(e) => void updateRow(row.id, { status: e.target.value })}
                      >
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                      </select>

                      <label style={label}>Move bucket</label>
                      <select
                        style={select}
                        value={row.aridon_bucket}
                        disabled={savingId === row.id}
                        onChange={(e) => void updateRow(row.id, { aridon_bucket: e.target.value as Bucket })}
                      >
                        {BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.title}</option>)}
                      </select>

                      <div style={cardFooter}>{savingId === row.id ? 'Saving…' : row.outreach_status.replaceAll('_',' ')}</div>
                    </article>
                  ))}
                  {!bucketRows.length ? <div style={empty}>No matching companies.</div> : null}
                </div>
              </div>
            );
          })}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div style={metric}><div style={metricValue}>{value}</div><div style={metricLabel}>{label}</div></div>;
}

const page: React.CSSProperties = { minHeight:'100vh', background:'#07110f', color:'#effff8', padding:'24px 14px 70px', fontFamily:'Inter, system-ui, sans-serif' };
const shell: React.CSSProperties = { width:'min(1480px, 100%)', margin:'0 auto', display:'grid', gap:18 };
const header: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:18, alignItems:'flex-start', flexWrap:'wrap', padding:'12px 4px' };
const eyebrow: React.CSSProperties = { color:'#79efbb', fontSize:12, fontWeight:900, letterSpacing:1.7 };
const h1: React.CSSProperties = { fontSize:'clamp(34px, 6vw, 66px)', lineHeight:.98, letterSpacing:-2.2, margin:'10px 0 14px', maxWidth:900 };
const lead: React.CSSProperties = { color:'#b7cbc2', maxWidth:820, fontSize:17, lineHeight:1.55, margin:0 };
const nav: React.CSSProperties = { display:'flex', gap:9, flexWrap:'wrap' };
const ghost: React.CSSProperties = { color:'#e5fff4', border:'1px solid #315047', borderRadius:12, padding:'10px 14px', textDecoration:'none', fontWeight:800 };
const statsGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 };
const metric: React.CSSProperties = { border:'1px solid #29483e', background:'#0d1b17', borderRadius:16, padding:'14px 16px' };
const metricValue: React.CSSProperties = { fontSize:28, fontWeight:950, color:'#79efbb' };
const metricLabel: React.CSSProperties = { color:'#9fb9af', fontSize:12, marginTop:4, fontWeight:800, textTransform:'uppercase', letterSpacing:.8 };
const notice: React.CSSProperties = { border:'1px solid #29483e', background:'#0d1b17', borderRadius:15, padding:'13px 15px', display:'grid', gap:4, color:'#dff6ed' };
const small: React.CSSProperties = { color:'#8fa9a0', fontSize:12, lineHeight:1.45 };
const toolbar: React.CSSProperties = { display:'flex', gap:9, alignItems:'center', flexWrap:'wrap' };
const searchInput: React.CSSProperties = { flex:'1 1 320px', background:'#07110f', color:'#effff8', border:'1px solid #315047', borderRadius:12, padding:'12px 14px', fontSize:16, outline:'none' };
const refresh: React.CSSProperties = { border:'1px solid #315047', background:'#0d1b17', color:'#e5fff4', borderRadius:12, padding:'12px 14px', fontWeight:900, cursor:'pointer' };
const sourceLink: React.CSSProperties = { color:'#79efbb', textDecoration:'none', fontWeight:900, padding:'10px 4px' };
const board: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(4, minmax(270px, 1fr))', gap:12, overflowX:'auto', alignItems:'start', paddingBottom:10 };
const column: React.CSSProperties = { minWidth:270, border:'1px solid #223b33', background:'#091713', borderRadius:18, padding:11, display:'grid', gap:10 };
const columnHeader: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start', padding:'4px 4px 7px' };
const columnTitle: React.CSSProperties = { fontSize:14, fontWeight:950, color:'#dff9ed', letterSpacing:.5 };
const columnSubtitle: React.CSSProperties = { fontSize:11, lineHeight:1.35, color:'#809b91', marginTop:4 };
const countBadge: React.CSSProperties = { background:'#79efbb', color:'#06110d', minWidth:30, height:30, borderRadius:999, display:'grid', placeItems:'center', fontWeight:950, fontSize:12 };
const cards: React.CSSProperties = { display:'grid', gap:9 };
const card: React.CSSProperties = { border:'1px solid #2d4351', background:'#0d1c18', borderRadius:15, padding:12, display:'grid', gap:9, boxShadow:'0 12px 26px rgba(0,0,0,.16)' };
const cardTop: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:9, alignItems:'flex-start' };
const company: React.CSSProperties = { fontWeight:950, fontSize:16, color:'#f0fff8' };
const meta: React.CSSProperties = { fontSize:11, color:'#8ea69e', lineHeight:1.35, marginTop:3 };
const priorityBadge: React.CSSProperties = { border:'1px solid #3b5d50', borderRadius:999, padding:'4px 7px', color:'#bff8dd', fontWeight:900, fontSize:11, whiteSpace:'nowrap' };
const bodyText: React.CSSProperties = { margin:0, color:'#bed1c9', fontSize:12.5, lineHeight:1.45 };
const nextBox: React.CSSProperties = { background:'#07130f', border:'1px solid #233f35', borderRadius:10, padding:'8px 9px', color:'#cfe8de', fontSize:12, lineHeight:1.4 };
const label: React.CSSProperties = { color:'#8fa9a0', fontWeight:900, fontSize:10, letterSpacing:.7, textTransform:'uppercase' };
const select: React.CSSProperties = { width:'100%', background:'#07110f', color:'#effff8', border:'1px solid #315047', borderRadius:9, padding:'9px 10px', fontSize:13 };
const cardFooter: React.CSSProperties = { fontSize:10, color:'#6f8d81', textTransform:'uppercase', letterSpacing:.6 };
const empty: React.CSSProperties = { color:'#708b80', fontSize:12, padding:12, textAlign:'center' };
