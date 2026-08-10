'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Campaign = { id: string; title: string; campaign_type: string; goal?: string; status: string; output?: any };
type AssetStatus = 'draft' | 'approved' | 'rejected' | 'archived' | 'queued' | 'in_progress' | 'failed';
type Asset = {
  id: string; visual_project_id: string; asset_kind: 'image' | 'video' | 'thumbnail' | 'storyboard_frame';
  signed_url?: string | null; mime_type?: string | null; width?: number | null; height?: number | null;
  duration_seconds?: number | null; variant_number?: number; model_used?: string | null; status: AssetStatus; metadata?: any;
};
type Scene = {
  id?: string; visual_project_id?: string; scene_number: number; scene_title: string; narration: string;
  on_screen_text: string; visual_direction: string; duration_seconds: number; approved?: boolean;
};
type Project = {
  id: string; creator_project_id: string; title: string; asset_type: 'image' | 'video'; platform?: string | null;
  size?: string | null; style_notes?: string | null; must_include_text?: string | null; status: 'draft' | 'approved' | 'rejected' | 'archived';
  storyboard_status: 'not_started' | 'draft' | 'approved'; openai_video_id?: string | null; video_status?: string | null;
  video_progress?: number | null; video_model?: string | null; video_seconds?: string | null; video_size?: string | null;
  video_error?: string | null; assets: Asset[]; scenes: Scene[]; created_at: string;
};

const IMAGE_SIZES = [
  ['1024x1024', 'Square'], ['1536x1024', 'Landscape'], ['1024x1536', 'Portrait'],
];
const VIDEO_SIZES = [
  ['720x1280', 'Vertical'], ['1280x720', 'Landscape'], ['1024x1792', 'Tall HD'], ['1792x1024', 'Wide HD'],
];

export default function VisualStudioPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ creatorProjectId: '', title: '', assetType: 'image' as 'image' | 'video', platform: 'social media', size: '1024x1024', styleNotes: '', mustIncludeText: '' });
  const [variants, setVariants] = useState(3);
  const [videoSeconds, setVideoSeconds] = useState('8');
  const [videoModel, setVideoModel] = useState('sora-2');
  const [scenes, setScenes] = useState<Scene[]>([]);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/customer/visual'); return; }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) { router.replace('/customer/login'); return; }
      setAccount(result as Account); setToken(accessToken);
      await loadAll(accessToken, result.tenant.slug);
    });
  }, [router]);

  async function loadAll(accessToken = token, slug = account?.tenant.slug || '') {
    if (!accessToken || !slug) return;
    const response = await fetch(`/api/customer/visual?slug=${encodeURIComponent(slug)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || 'Could not load Visual Studio.'); return; }
    const list = (data.projects || []) as Project[];
    setProjects(list); setCampaigns(data.approvedCampaigns || []);
    const nextId = selectedId && list.some((item) => item.id === selectedId) ? selectedId : list[0]?.id || '';
    setSelectedId(nextId);
    const nextProject = list.find((item) => item.id === nextId);
    if (nextProject) setScenes(nextProject.scenes || []);
    if (!form.creatorProjectId && data.approvedCampaigns?.length) {
      const first = data.approvedCampaigns[0] as Campaign;
      setForm((current) => ({ ...current, creatorProjectId: first.id, title: `${first.title} Visuals` }));
    }
  }

  const selected = useMemo(() => projects.find((item) => item.id === selectedId) || null, [projects, selectedId]);

  useEffect(() => {
    if (selected) setScenes(selected.scenes || []);
  }, [selectedId, projects]);

  useEffect(() => {
    if (!selected || !['queued', 'in_progress'].includes(selected.video_status || '')) return;
    const timer = window.setInterval(() => void refreshVideo(selected.id), 10000);
    return () => window.clearInterval(timer);
  }, [selected?.id, selected?.video_status]);

  function chooseType(assetType: 'image' | 'video') {
    setForm((current) => ({ ...current, assetType, size: assetType === 'image' ? '1024x1024' : '720x1280', platform: assetType === 'image' ? 'social media' : 'short-form video' }));
  }

  async function createProject() {
    if (!account || !token) return;
    if (!form.creatorProjectId || !form.title.trim()) { setMessage('Choose an approved campaign and give this visual project a title.'); return; }
    setBusy('create'); setMessage('Opening the visual project…');
    try {
      const response = await fetch('/api/customer/visual', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: account.tenant.slug, ...form }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.project) throw new Error(data.error || 'Could not create the visual project.');
      setMessage(form.assetType === 'image' ? 'Visual project ready. Generate image options below.' : 'Video project ready. Build the storyboard below.');
      await loadAll(); setSelectedId(data.project.id);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not create the visual project.'); }
    finally { setBusy(''); }
  }

  async function renderImages() {
    if (!selected || !account || !token) return;
    setBusy('image'); setMessage('Oracle is directing the image set. This can take a little while…');
    try {
      const response = await fetch('/api/customer/visual/render-image', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: account.tenant.slug, projectId: selected.id, size: selected.size || '1024x1024', variants }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not render the image set.');
      setMessage(`${data.assets?.length || 0} image option${data.assets?.length === 1 ? '' : 's'} created. Review them before approving.`);
      await loadAll();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not render the image set.'); }
    finally { setBusy(''); }
  }

  async function buildStoryboard() {
    if (!selected || !account || !token) return;
    setBusy('storyboard'); setMessage('Oracle is building the storyboard with the executive review rules applied…');
    try {
      const response = await fetch('/api/customer/visual/storyboard', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: account.tenant.slug, projectId: selected.id, seconds: videoSeconds }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not build the storyboard.');
      setScenes(data.scenes || []); setMessage('Storyboard draft built. Edit anything you want, then approve it before rendering video.');
      await loadAll();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not build the storyboard.'); }
    finally { setBusy(''); }
  }

  function editScene(index: number, field: keyof Scene, value: string | number) {
    setScenes((current) => current.map((scene, i) => i === index ? { ...scene, [field]: value } : scene));
  }

  async function saveStoryboard(approve: boolean) {
    if (!selected || !account || !token) return;
    setBusy('save-storyboard'); setMessage(approve ? 'Saving and approving the storyboard…' : 'Saving storyboard edits…');
    try {
      const response = await fetch('/api/customer/visual/storyboard', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: account.tenant.slug, projectId: selected.id, scenes, approve }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save the storyboard.');
      setMessage(approve ? 'Storyboard approved for rendering. No video has been sent or published.' : 'Storyboard edits saved.');
      await loadAll();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save the storyboard.'); }
    finally { setBusy(''); }
  }

  async function renderVideo() {
    if (!selected || !account || !token) return;
    setBusy('video'); setMessage('Starting the Sora render…');
    try {
      const response = await fetch('/api/customer/visual/render-video', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: account.tenant.slug, projectId: selected.id, seconds: selected.video_seconds || videoSeconds, size: selected.video_size || selected.size || '720x1280', model: videoModel }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not start the video render.');
      setMessage('Video render started. Visual Studio will keep checking the job while this page is open.');
      await loadAll();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not start the video render.'); }
    finally { setBusy(''); }
  }

  async function refreshVideo(projectId = selected?.id || '') {
    if (!projectId || !account || !token) return;
    const response = await fetch(`/api/customer/visual/render-video?slug=${encodeURIComponent(account.tenant.slug)}&projectId=${encodeURIComponent(projectId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || 'Could not refresh video status.'); return; }
    if (data.job?.status === 'completed') setMessage('Video render completed. Review it below before approving.');
    else if (data.job?.status === 'failed') setMessage(data.job?.error?.message || 'The video render failed.');
    await loadAll();
  }

  async function reviewAsset(asset: Asset, status: 'approved' | 'rejected' | 'draft') {
    if (!selected || !account || !token) return;
    const response = await fetch('/api/customer/visual', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: account.tenant.slug, projectId: selected.id, assetId: asset.id, assetStatus: status }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || 'Could not update the asset.'); return; }
    setMessage(status === 'approved' ? 'Asset approved for use. It has not been published or sent anywhere.' : `Asset marked ${status}.`);
    await loadAll();
  }

  async function downloadAsset(asset: Asset) {
    if (!account || !token) return;
    const response = await fetch('/api/customer/visual/download-url', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: account.tenant.slug, assetId: asset.id }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) { setMessage(data.error || 'Could not prepare the download.'); return; }
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  if (!account) return <main style={loadingStyle}>Opening Visual Studio…</main>;

  return <main style={pageStyle}>
    <div style={{ maxWidth: 1220, margin: '0 auto' }}>
      <header style={headerStyle}>
        <div><div style={eyebrow}>ARIDON · VISUAL STUDIO</div><h1 style={{ fontSize: 'clamp(40px,7vw,68px)', lineHeight: .96, margin: '8px 0 12px' }}>Approved idea → finished visual.</h1><p style={lead}>Start from an approved Creator Studio campaign, generate image options or an approved storyboard, then keep every visual behind owner review.</p></div>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/customer/start" style={navLink}>Main Room</Link><Link href="/customer/creator" style={navLink}>Creator Studio</Link><Link href="/customer/visual/review" style={{ ...navLink, borderColor: '#9EF0CF', color: '#9EF0CF' }}>Review Desk</Link></nav>
      </header>

      {message && <div style={messageStyle}>{message}</div>}

      <section style={panelStyle}>
        <div style={step}>1</div><h2 style={sectionTitle}>Start from an approved campaign</h2>
        {campaigns.length === 0 ? <div style={emptyStyle}>No approved Creator Studio campaigns are available yet. Approve a campaign first, then return here.</div> : <>
          <div style={formGrid}>
            <label style={labelStyle}>Approved campaign<select value={form.creatorProjectId} onChange={(e) => { const campaign = campaigns.find((item) => item.id === e.target.value); setForm({ ...form, creatorProjectId: e.target.value, title: campaign ? `${campaign.title} Visuals` : form.title }); }} style={inputStyle}>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}</select></label>
            <label style={labelStyle}>Visual project title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} /></label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}><button onClick={() => chooseType('image')} style={{ ...choiceButton, ...(form.assetType === 'image' ? choiceActive : {}) }}>▧ Images</button><button onClick={() => chooseType('video')} style={{ ...choiceButton, ...(form.assetType === 'video' ? choiceActive : {}) }}>▶ Video</button></div>
          <div style={formGrid}>
            <label style={labelStyle}>Destination<input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="LinkedIn, website, vertical video…" style={inputStyle} /></label>
            <label style={labelStyle}>Format<select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} style={inputStyle}>{(form.assetType === 'image' ? IMAGE_SIZES : VIDEO_SIZES).map(([value, label]) => <option key={value} value={value}>{label} · {value}</option>)}</select></label>
            <label style={labelStyle}>Visual direction<textarea value={form.styleNotes} onChange={(e) => setForm({ ...form, styleNotes: e.target.value })} placeholder="Premium industrial photography, clean modern office, cinematic Southwest landscape…" style={textareaStyle} /></label>
            <label style={labelStyle}>Must-include text<textarea value={form.mustIncludeText} onChange={(e) => setForm({ ...form, mustIncludeText: e.target.value })} placeholder="Optional. Only put exact text here that must appear in the visual." style={textareaStyle} /></label>
          </div>
          <button onClick={createProject} disabled={Boolean(busy)} style={{ ...primaryButton, marginTop: 15 }}>{busy === 'create' ? 'Opening project…' : `Create ${form.assetType === 'image' ? 'Image' : 'Video'} Project`}</button>
        </>}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(250px,.32fr) minmax(0,1fr)', gap: 14, marginTop: 16 }} className="visual-grid">
        <aside style={panelStyle}><div style={eyebrow}>VISUAL PROJECTS</div><div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{projects.length === 0 && <div style={emptyStyle}>No visual projects yet.</div>}{projects.map((project) => <button key={project.id} onClick={() => setSelectedId(project.id)} style={{ ...historyButton, borderColor: selectedId === project.id ? '#9EF0CF' : '#2A3956' }}><strong>{project.title}</strong><span>{project.asset_type} · {project.status}{project.video_status ? ` · ${project.video_status}` : ''}</span></button>)}</div></aside>

        <div style={panelStyle}>
          <div style={step}>2</div><h2 style={sectionTitle}>{selected ? selected.title : 'Build the visual'}</h2>
          {!selected && <div style={emptyStyle}>Create or select a Visual Studio project.</div>}

          {selected?.asset_type === 'image' && <>
            <p style={muted}>Generate multiple branded options, compare them, then approve only the version you want to use.</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}><label style={labelStyle}>Options<select value={variants} onChange={(e) => setVariants(Number(e.target.value))} style={{ ...inputStyle, width: 130 }}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label><button onClick={renderImages} disabled={Boolean(busy)} style={primaryButton}>{busy === 'image' ? 'Rendering images…' : 'Generate Image Options'}</button></div>
            <AssetGallery assets={selected.assets.filter((asset) => asset.asset_kind === 'image')} onReview={reviewAsset} onDownload={downloadAsset} />
          </>}

          {selected?.asset_type === 'video' && <>
            <p style={muted}>Build and approve the storyboard before Sora is allowed to render. Current single-clip choices are 4, 8, or 12 seconds.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}><label style={labelStyle}>Runtime<select value={videoSeconds} onChange={(e) => setVideoSeconds(e.target.value)} style={{ ...inputStyle, width: 150 }}><option value="4">4 seconds</option><option value="8">8 seconds</option><option value="12">12 seconds</option></select></label><button onClick={buildStoryboard} disabled={Boolean(busy)} style={primaryButton}>{busy === 'storyboard' ? 'Building storyboard…' : selected.storyboard_status === 'not_started' ? 'Build Storyboard' : 'Rebuild Storyboard'}</button></div>

            {scenes.length > 0 && <div style={{ marginTop: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}><div><strong style={{ fontSize: 20 }}>Storyboard</strong><div style={{ color: selected.storyboard_status === 'approved' ? '#9EF0CF' : '#F2D18A', fontSize: 12, marginTop: 3 }}>{selected.storyboard_status.toUpperCase()}</div></div><div style={{ display: 'flex', gap: 8 }}><button onClick={() => saveStoryboard(false)} disabled={Boolean(busy)} style={secondaryButton}>Save Edits</button><button onClick={() => saveStoryboard(true)} disabled={Boolean(busy)} style={primaryButton}>✓ Approve Storyboard</button></div></div><div style={{ display: 'grid', gap: 10, marginTop: 12 }}>{scenes.map((scene, index) => <SceneEditor key={scene.id || index} scene={scene} index={index} onChange={editScene} />)}</div></div>}

            {selected.storyboard_status === 'approved' && <div style={renderBox}><strong>Storyboard approved. Ready for video.</strong><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end', marginTop: 10 }}><label style={labelStyle}>Render model<select value={videoModel} onChange={(e) => setVideoModel(e.target.value)} style={{ ...inputStyle, width: 190 }}><option value="sora-2">Sora 2</option><option value="sora-2-pro">Sora 2 Pro</option></select></label><button onClick={renderVideo} disabled={Boolean(busy) || ['queued', 'in_progress'].includes(selected.video_status || '')} style={primaryButton}>{busy === 'video' ? 'Starting render…' : 'Render Approved Video'}</button><button onClick={() => refreshVideo()} style={secondaryButton}>Refresh Status</button></div></div>}

            {selected.video_status && <div style={progressBox}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>Video: {selected.video_status}</strong><span>{selected.video_progress || 0}%</span></div><div style={track}><div style={{ ...bar, width: `${Math.max(2, selected.video_progress || 0)}%` }} /></div>{selected.video_error && <div style={{ color: '#F5A5A5', marginTop: 8 }}>{selected.video_error}</div>}</div>}
            <AssetGallery assets={selected.assets.filter((asset) => asset.asset_kind === 'video' || asset.asset_kind === 'thumbnail')} onReview={reviewAsset} onDownload={downloadAsset} />
          </>}
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 16, borderColor: '#356055' }}><strong style={{ color: '#9EF0CF' }}>Owner-control rule</strong><p style={{ ...muted, marginBottom: 0 }}>Visual Studio may generate drafts and render approved storyboards. Nothing is posted, emailed, advertised, purchased, or externally committed from this screen. Final download requires an approved asset.</p></section>
    </div>
    <style>{`@media(max-width:850px){.visual-grid{grid-template-columns:1fr !important}}`}</style>
  </main>;
}

function SceneEditor({ scene, index, onChange }: { scene: Scene; index: number; onChange: (index: number, field: keyof Scene, value: string | number) => void }) {
  return <div style={sceneCard}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>Scene {index + 1}: {scene.scene_title}</strong><label style={{ fontSize: 11, color: '#9AABBF' }}>seconds <input type="number" min={1} max={12} value={scene.duration_seconds} onChange={(e) => onChange(index, 'duration_seconds', Number(e.target.value))} style={{ ...inputStyle, width: 66, padding: 6, marginLeft: 5 }} /></label></div><label style={labelStyle}>Visual direction<textarea value={scene.visual_direction} onChange={(e) => onChange(index, 'visual_direction', e.target.value)} style={textareaStyle} /></label><div style={formGrid}><label style={labelStyle}>On-screen text<input value={scene.on_screen_text} onChange={(e) => onChange(index, 'on_screen_text', e.target.value)} style={inputStyle} /></label><label style={labelStyle}>Narration / audio intent<input value={scene.narration} onChange={(e) => onChange(index, 'narration', e.target.value)} style={inputStyle} /></label></div></div>;
}

function AssetGallery({ assets, onReview, onDownload }: { assets: Asset[]; onReview: (asset: Asset, status: 'approved' | 'rejected' | 'draft') => void; onDownload: (asset: Asset) => void }) {
  if (!assets.length) return <div style={{ ...emptyStyle, marginTop: 16 }}>No rendered assets yet.</div>;
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginTop: 16 }}>{assets.map((asset) => <article key={asset.id} style={assetCard}>{asset.asset_kind === 'image' && asset.signed_url ? <img src={asset.signed_url} alt={`Visual variant ${asset.variant_number || 1}`} style={previewImage} /> : asset.asset_kind === 'video' && asset.signed_url ? <video src={asset.signed_url} controls playsInline style={previewImage} /> : asset.asset_kind === 'thumbnail' && asset.signed_url ? <img src={asset.signed_url} alt="Video thumbnail" style={previewImage} /> : <div style={assetPlaceholder}>{asset.status === 'queued' || asset.status === 'in_progress' ? 'Rendering…' : 'Preview unavailable'}</div>}<div style={{ padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>{asset.asset_kind === 'image' ? `Option ${asset.variant_number || 1}` : asset.asset_kind === 'video' ? 'Video' : 'Thumbnail'}</strong><span style={{ ...pill, ...(asset.status === 'approved' ? approvedPill : asset.status === 'rejected' ? rejectedPill : {}) }}>{asset.status}</span></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>{asset.status !== 'approved' && !['queued', 'in_progress', 'failed'].includes(asset.status) && <button onClick={() => onReview(asset, 'approved')} style={tinyPrimary}>✓ Approve</button>}{asset.status !== 'rejected' && !['queued', 'in_progress', 'failed'].includes(asset.status) && <button onClick={() => onReview(asset, 'rejected')} style={tinyButton}>Reject</button>}{['approved', 'rejected'].includes(asset.status) && <button onClick={() => onReview(asset, 'draft')} style={tinyButton}>Draft</button>}{asset.status === 'approved' && asset.signed_url && <button onClick={() => onDownload(asset)} style={tinyPrimary}>Download Final</button>}</div></div></article>)}</div>;
}

const loadingStyle = { minHeight: '100vh', background: '#070C16', color: '#F8FAFC', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const pageStyle = { minHeight: '100vh', background: 'radial-gradient(circle at 10% 0%,#202957 0,#0B1020 38%,#050811 100%)', color: '#F8FAFC', padding: '28px 18px 100px', fontFamily: 'Arial, sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' as const, marginBottom: 18 };
const eyebrow = { color: '#9EF0CF', fontWeight: 950, fontSize: 11, letterSpacing: '1.2px' };
const lead = { color: '#B8C4D7', lineHeight: 1.65, maxWidth: 780, fontSize: 17, margin: 0 };
const muted = { color: '#AAB7CA', lineHeight: 1.6 };
const navLink = { border: '1px solid #354461', color: '#E8EEF7', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 };
const panelStyle = { background: 'linear-gradient(180deg,rgba(18,27,47,.98),rgba(8,13,24,.98))', border: '1px solid #2A3A58', borderRadius: 18, padding: 20, boxShadow: '0 18px 50px rgba(0,0,0,.2)' };
const messageStyle = { background: '#14233A', border: '1px solid #36557A', color: '#DFE8F5', padding: '11px 13px', borderRadius: 11, marginBottom: 14, lineHeight: 1.5 };
const step = { width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 9, background: '#9EF0CF', color: '#07130F', fontWeight: 950 };
const sectionTitle = { margin: '10px 0 8px', fontSize: 28 };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 11, marginTop: 12 };
const labelStyle = { display: 'grid', gap: 6, color: '#D6DFEC', fontSize: 12, fontWeight: 850 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#080F1C', color: '#F8FAFC', border: '1px solid #344561', borderRadius: 10, padding: '10px 11px', fontSize: 14 };
const textareaStyle = { ...inputStyle, minHeight: 90, resize: 'vertical' as const, lineHeight: 1.5 };
const primaryButton = { border: 0, borderRadius: 10, padding: '11px 14px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, cursor: 'pointer' };
const secondaryButton = { border: '1px solid #455774', borderRadius: 10, padding: '10px 13px', background: '#101A2B', color: '#E6EDF7', fontWeight: 850, cursor: 'pointer' };
const choiceButton = { ...secondaryButton, minWidth: 120, fontSize: 15 };
const choiceActive = { background: '#213C37', borderColor: '#9EF0CF', color: '#9EF0CF' };
const emptyStyle = { color: '#8FA0B7', border: '1px dashed #34435A', borderRadius: 12, padding: 15, lineHeight: 1.5 };
const historyButton = { width: '100%', textAlign: 'left' as const, display: 'grid', gap: 5, background: '#0B1321', border: '1px solid #2A3956', color: '#F6F8FC', padding: 11, borderRadius: 10, cursor: 'pointer' };
const sceneCard = { border: '1px solid #2D405E', background: '#0B1424', borderRadius: 13, padding: 13, display: 'grid', gap: 10 };
const renderBox = { marginTop: 16, border: '1px solid #3A655A', background: '#10231F', borderRadius: 13, padding: 14 };
const progressBox = { marginTop: 14, border: '1px solid #354968', background: '#0D1728', borderRadius: 13, padding: 13 };
const track = { height: 8, background: '#25334A', borderRadius: 999, overflow: 'hidden', marginTop: 8 };
const bar = { height: '100%', background: '#9EF0CF', borderRadius: 999, transition: 'width .3s ease' };
const assetCard = { overflow: 'hidden', border: '1px solid #2E405E', background: '#090F1B', borderRadius: 14 };
const previewImage = { width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' as const, display: 'block', background: '#060A12' };
const assetPlaceholder = { aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', color: '#8FA0B7', background: '#07101D' };
const pill = { border: '1px solid #465977', borderRadius: 999, padding: '3px 7px', fontSize: 10, color: '#B8C5D8' };
const approvedPill = { color: '#9EF0CF', borderColor: '#497E70' };
const rejectedPill = { color: '#F1A7A7', borderColor: '#76454B' };
const tinyButton = { border: '1px solid #40516B', background: '#111A28', color: '#DCE5F0', borderRadius: 8, padding: '7px 9px', fontSize: 11, fontWeight: 850, cursor: 'pointer' };
const tinyPrimary = { ...tinyButton, background: '#9EF0CF', color: '#07130F', borderColor: '#9EF0CF' };
