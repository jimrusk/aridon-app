'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Asset = { id: string; visual_project_id: string; asset_kind: string; signed_url?: string | null; variant_number?: number; status: string; model_used?: string | null };
type Project = { id: string; title: string; asset_type: string; status: string; storyboard_status: string; video_status?: string | null; assets: Asset[]; created_at: string };

export default function VisualReviewDesk() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/customer/visual/review'); return; }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) { router.replace('/customer/login'); return; }
      setAccount(result as Account); setToken(accessToken); await load(accessToken, result.tenant.slug);
    });
  }, [router]);

  async function load(accessToken = token, slug = account?.tenant.slug || '') {
    if (!accessToken || !slug) return;
    const response = await fetch(`/api/customer/visual?slug=${encodeURIComponent(slug)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || 'Could not load the Visual Review Desk.'); return; }
    const list = (data.projects || []) as Project[]; setProjects(list);
    if (!selectedId && list.length) setSelectedId(list[0].id);
  }

  const selected = useMemo(() => projects.find((item) => item.id === selectedId) || null, [projects, selectedId]);
  const assets = useMemo(() => (selected?.assets || []).filter((asset) => filter === 'all' || asset.status === filter), [selected, filter]);

  async function review(asset: Asset, status: 'approved' | 'rejected' | 'draft') {
    if (!account || !selected) return;
    const response = await fetch('/api/customer/visual', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: account.tenant.slug, projectId: selected.id, assetId: asset.id, assetStatus: status }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || 'Could not update this asset.'); return; }
    setMessage(status === 'approved' ? 'Approved for use. Nothing was published or sent.' : `Asset marked ${status}.`); await load();
  }

  async function download(asset: Asset) {
    if (!account) return;
    const response = await fetch('/api/customer/visual/download-url', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: account.tenant.slug, assetId: asset.id }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) { setMessage(data.error || 'Could not prepare the download.'); return; }
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  if (!account) return <main style={loading}>Opening Review Desk…</main>;

  return <main style={page}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <header style={header}><div><div style={eyebrow}>ARIDON · VISUAL REVIEW DESK</div><h1 style={{ fontSize: 'clamp(38px,7vw,64px)', lineHeight: 1, margin: '8px 0' }}>Keep the good. Kill the weak.</h1><p style={muted}>Every generated image and finished video stays a draft until the owner approves it.</p></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/customer/visual" style={nav}>Visual Studio</Link><Link href="/customer/creator" style={nav}>Creator Studio</Link><Link href="/customer/start" style={nav}>Main Room</Link></div></header>
      {message && <div style={notice}>{message}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,.28fr) minmax(0,1fr)', gap: 14 }} className="review-grid">
        <aside style={panel}><div style={eyebrow}>PROJECTS</div><div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{projects.length === 0 && <div style={empty}>No visual projects yet.</div>}{projects.map((project) => <button key={project.id} onClick={() => setSelectedId(project.id)} style={{ ...projectButton, borderColor: selectedId === project.id ? '#9EF0CF' : '#2B3A56' }}><strong>{project.title}</strong><span>{project.asset_type} · {project.assets?.length || 0} asset{project.assets?.length === 1 ? '' : 's'}</span></button>)}</div></aside>
        <section style={panel}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div><div style={eyebrow}>REVIEW</div><h2 style={{ margin: '6px 0', fontSize: 30 }}>{selected?.title || 'Select a project'}</h2></div><select value={filter} onChange={(e) => setFilter(e.target.value)} style={select}><option value="all">All assets</option><option value="draft">Drafts</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="failed">Failed</option></select></div>
          {!selected && <div style={empty}>Select a project to review its visuals.</div>}
          {selected && assets.length === 0 && <div style={empty}>No assets match this filter.</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 12, marginTop: 14 }}>{assets.map((asset) => <article key={asset.id} style={card}>{asset.asset_kind === 'video' && asset.signed_url ? <video src={asset.signed_url} controls playsInline style={preview} /> : asset.signed_url ? <img src={asset.signed_url} alt={`${asset.asset_kind} preview`} style={preview} /> : <div style={placeholder}>{['queued','in_progress'].includes(asset.status) ? 'Rendering…' : 'Preview unavailable'}</div>}<div style={{ padding: 13 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>{asset.asset_kind}{asset.variant_number ? ` #${asset.variant_number}` : ''}</strong><span style={{ ...pill, ...(asset.status === 'approved' ? approved : asset.status === 'rejected' ? rejected : {}) }}>{asset.status}</span></div>{asset.model_used && <div style={{ color: '#8192AA', fontSize: 10, marginTop: 5 }}>{asset.model_used}</div>}<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>{!['approved','queued','in_progress','failed'].includes(asset.status) && <button onClick={() => review(asset, 'approved')} style={primary}>✓ Approve</button>}{!['rejected','queued','in_progress','failed'].includes(asset.status) && <button onClick={() => review(asset, 'rejected')} style={secondary}>Reject</button>}{['approved','rejected'].includes(asset.status) && <button onClick={() => review(asset, 'draft')} style={secondary}>Return to Draft</button>}{asset.status === 'approved' && asset.signed_url && <button onClick={() => download(asset)} style={primary}>Download Final</button>}</div></div></article>)}</div>
        </section>
      </div>
      <section style={{ ...panel, marginTop: 14, borderColor: '#345D53' }}><strong style={{ color: '#9EF0CF' }}>Approval means “ready for use,” not “published.”</strong><p style={{ ...muted, marginBottom: 0 }}>Visual Studio does not post to social networks, send email, buy ads, or make external commitments from the Review Desk.</p></section>
    </div><style>{`@media(max-width:820px){.review-grid{grid-template-columns:1fr !important}}`}</style>
  </main>;
}

const loading = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#070C16', color: '#fff', fontFamily: 'Arial, sans-serif' };
const page = { minHeight: '100vh', background: 'radial-gradient(circle at 10% 0%,#1F2951 0,#0A1020 40%,#050811 100%)', color: '#F8FAFC', padding: '28px 18px 100px', fontFamily: 'Arial, sans-serif' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 18, marginBottom: 17 };
const eyebrow = { color: '#9EF0CF', fontWeight: 950, fontSize: 11, letterSpacing: '1.1px' };
const muted = { color: '#ABB8CC', lineHeight: 1.6, maxWidth: 760 };
const nav = { border: '1px solid #354661', color: '#EAF0F8', borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 850, textDecoration: 'none' };
const panel = { background: 'linear-gradient(180deg,rgba(18,27,47,.98),rgba(8,13,24,.98))', border: '1px solid #2A3A58', borderRadius: 18, padding: 18 };
const notice = { background: '#14233A', border: '1px solid #36557A', borderRadius: 11, padding: 11, color: '#E0E8F5', marginBottom: 13 };
const empty = { color: '#8E9FB6', border: '1px dashed #35445C', borderRadius: 11, padding: 14, marginTop: 12 };
const projectButton = { width: '100%', display: 'grid', gap: 5, textAlign: 'left' as const, background: '#0B1321', color: '#F7F9FC', border: '1px solid #2B3A56', borderRadius: 10, padding: 11, cursor: 'pointer' };
const select = { background: '#08101D', color: '#F6F8FC', border: '1px solid #354763', borderRadius: 9, padding: '9px 10px' };
const card = { overflow: 'hidden', border: '1px solid #2D3F5D', borderRadius: 14, background: '#080F1B' };
const preview = { width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' as const, display: 'block', background: '#050912' };
const placeholder = { aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', color: '#8797AE', background: '#07101D' };
const pill = { border: '1px solid #455975', borderRadius: 999, padding: '3px 7px', fontSize: 10, color: '#B5C2D5' };
const approved = { borderColor: '#47796C', color: '#9EF0CF' };
const rejected = { borderColor: '#74464B', color: '#F1A5A5' };
const primary = { border: 0, borderRadius: 8, background: '#9EF0CF', color: '#07130F', padding: '7px 9px', fontSize: 11, fontWeight: 900, cursor: 'pointer' };
const secondary = { border: '1px solid #42546F', borderRadius: 8, background: '#111A28', color: '#DCE4EF', padding: '7px 9px', fontSize: 11, fontWeight: 850, cursor: 'pointer' };
