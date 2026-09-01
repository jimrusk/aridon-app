'use client';

import Link from 'next/link';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Mode = 'text_to_video' | 'image_to_video' | 'edit' | 'extend';
type Resolution = '360p' | '720p' | '1080p' | '4k';

const panel: React.CSSProperties = { background: '#fff', border: '1px solid #d8e2dd', borderRadius: 18, padding: 22, boxShadow: '0 8px 30px rgba(12,30,24,.06)' };
const input: React.CSSProperties = { width: '100%', border: '1px solid #c9d6d0', borderRadius: 11, padding: '12px 13px', fontSize: 14, background: '#fff', boxSizing: 'border-box' };
const button: React.CSSProperties = { border: 0, borderRadius: 11, padding: '12px 16px', fontWeight: 900, cursor: 'pointer' };

const STARTERS = [
  ['Sentinel Ad', 'Create a cinematic business cybersecurity ad. A company office is operating normally when subtle digital warning signals begin appearing. Show Aridon Sentinel correlating the suspicious activity, containing the threat, preserving evidence, and keeping company leadership in control. Premium enterprise technology aesthetic, realistic people, readable on-screen text, confident pacing.'],
  ['Business OS', 'Create a premium product explainer showing a business owner overwhelmed by disconnected tools, then transitioning into Aridon Business OS coordinating decisions, finance, sales, projects, intelligence and controlled execution in one connected operating layer.'],
  ['Ag / Ranch', 'Create authentic cinematic footage of a working American farm and ranch at sunrise. Show practical technology helping with operations, land intelligence, finances and decisions without making the people or equipment feel futuristic or fake. Natural sound, grounded and trustworthy.'],
  ['Social Hook', 'Create a fast vertical social video with a strong first-second visual hook, clean readable text, natural camera movement, energetic pacing, and a clear final call to action.'],
];

export default function VideoStudioPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<Resolution>('360p');
  const [mode, setMode] = useState<Mode>('text_to_video');
  const [mediaName, setMediaName] = useState('');
  const [mediaMime, setMediaMime] = useState('');
  const [mediaData, setMediaData] = useState('');
  const [interactionId, setInteractionId] = useState('');
  const [fileId, setFileId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [model, setModel] = useState('gemini-omni-1.1-flash');
  const objectUrlRef = useRef('');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/video-studio'); return; }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) { router.replace('/customer/login?next=/video-studio'); return; }
      setToken(accessToken);
      setAccount(result as Account);
    });
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
  }, [router]);

  async function pickMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setMessage('Use an image or a short video file.'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Keep direct reference uploads under 2 MB. Generated videos can still be edited and extended without re-uploading them.'); return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setMediaName(file.name);
    setMediaMime(file.type);
    setMediaData(dataUrl.split(',')[1] || '');
    setMode(file.type.startsWith('video/') ? 'edit' : 'image_to_video');
    setMessage(`${file.name} is ready as a private reference for this generation.`);
  }

  async function getVideoBlob(id: string) {
    if (!account || !token) return;
    const url = `/api/customer/video-studio?slug=${encodeURIComponent(account.tenant.slug)}&fileId=${encodeURIComponent(id)}&download=1`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) throw new Error('The generated video could not be opened.');
    const blob = await response.blob();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const localUrl = URL.createObjectURL(blob);
    objectUrlRef.current = localUrl;
    setVideoUrl(localUrl);
  }

  async function pollUntilReady(id: string) {
    if (!account || !token) return;
    for (let i = 0; i < 48; i += 1) {
      const response = await fetch(`/api/customer/video-studio?slug=${encodeURIComponent(account.tenant.slug)}&fileId=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not check video status.');
      if (data.state === 'ACTIVE') { await getVideoBlob(id); return; }
      if (data.state === 'FAILED') throw new Error(data.error || 'Gemini Omni could not complete this video.');
      setMessage(`Gemini Omni is rendering ${resolution} video… ${data.state || 'PROCESSING'}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    throw new Error('The video is still processing. Use Generate again or reload Video Studio to continue.');
  }

  async function generate(nextMode?: Mode) {
    if (!account || !token || !prompt.trim()) { setMessage('Tell Eva what video you want first.'); return; }
    const requestedMode = nextMode || mode;
    if ((requestedMode === 'edit' || requestedMode === 'extend') && !interactionId && !mediaData) {
      setMessage('Generate a video first, or attach a short source video to edit.'); return;
    }
    setBusy(true); setMessage('Eva is handing the scene to Gemini Omni…');
    if (!nextMode) { setVideoUrl(''); setFileId(''); }
    try {
      const response = await fetch('/api/customer/video-studio', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: account.tenant.slug,
          prompt,
          mode: requestedMode,
          aspectRatio,
          resolution,
          previousInteractionId: (requestedMode === 'edit' || requestedMode === 'extend') ? interactionId : '',
          mediaData: interactionId ? '' : mediaData,
          mediaMime: interactionId ? '' : mediaMime,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Video generation failed.');
      setModel(data.model || model);
      setInteractionId(data.interactionId || interactionId);
      setFileId(data.fileId);
      setMessage('Generation accepted. Aridon is waiting for the finished MP4…');
      await pollUntilReady(data.fileId);
      setMessage('Video ready. You can play it, save the MP4, or describe an edit. ✓');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Video Studio could not complete the request.');
    } finally {
      setBusy(false);
    }
  }

  function saveVideo() {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `aridon-video-${fileId || 'omni'}.mp4`;
    a.click();
  }

  if (!account) return <main style={{ minHeight: '100vh', padding: 40, fontFamily: 'Arial, sans-serif', background: '#07130f', color: '#fff' }}>Opening Aridon Video Studio…</main>;

  return (
    <main style={{ minHeight: '100vh', background: '#f3f7f5', color: '#10211c', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07130f', color: '#fff', padding: '36px 20px 42px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><div style={{ color: '#9EF0CF', fontWeight: 950, letterSpacing: 1.6, fontSize: 12 }}>ARIDON · EVA VIDEO STUDIO</div><h1 style={{ fontSize: 'clamp(38px,6vw,66px)', lineHeight: 1, margin: '9px 0 12px' }}>Describe it. Generate it. Fix it by talking to Eva.</h1><p style={{ color: '#c9dbd3', fontSize: 18, lineHeight: 1.55, maxWidth: 800, margin: 0 }}>Powered by {model}. Create ads, explainers and social clips, animate reference images, then refine generated footage conversationally.</p></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/customer/creator" style={{ ...button, background: '#fff', color: '#10211c', textDecoration: 'none' }}>Creator Studio</Link><Link href="/customer/start" style={{ ...button, background: '#9EF0CF', color: '#10211c', textDecoration: 'none' }}>{account.tenant.business_name}</Link></div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '22px 20px 70px' }}>
        {message && <div style={{ ...panel, marginBottom: 16, background: '#fafffc', borderColor: '#9ccab7', fontWeight: 800 }}>{message}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.08fr) minmax(320px,.92fr)', gap: 18, alignItems: 'start' }}>
          <section style={panel}>
            <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1.3, color: '#497468' }}>1 · START WITH A CONCEPT</div>
            <h2 style={{ margin: '8px 0 12px' }}>What should the video show?</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>{STARTERS.map(([label, text]) => <button key={label} onClick={() => { setPrompt(text); setMode('text_to_video'); }} style={{ ...button, background: '#e8f2ed', color: '#17352b' }}>{label}</button>)}</div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={9} style={{ ...input, resize: 'vertical', lineHeight: 1.55 }} placeholder="Example: Create a 9:16 Sentinel ad. Start with a normal office, then show subtle signs of a cyberattack. Sentinel detects the pattern, contains the export attempt, preserves evidence, and the CEO retains the human override…" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 14 }}>
              <label style={{ fontWeight: 850, fontSize: 13 }}>Format<select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} style={{ ...input, marginTop: 6 }}><option value="16:9">Landscape 16:9</option><option value="9:16">Vertical 9:16</option></select></label>
              <label style={{ fontWeight: 850, fontSize: 13 }}>Quality<select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} style={{ ...input, marginTop: 6 }}><option value="360p">Draft · 360p</option><option value="720p">Standard · 720p</option><option value="1080p">HD · 1080p</option><option value="4k">4K upscale</option></select></label>
              <label style={{ fontWeight: 850, fontSize: 13 }}>Generation mode<select value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={{ ...input, marginTop: 6 }}><option value="text_to_video">Text → video</option><option value="image_to_video">Image → video</option><option value="edit">Edit video</option><option value="extend">Extend video</option></select></label>
            </div>

            <div style={{ marginTop: 16, border: '1px dashed #9eb7ad', borderRadius: 14, padding: 14, background: '#f7fbf9' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Optional reference image or short video</div>
              <p style={{ margin: '0 0 10px', color: '#63736d', fontSize: 13 }}>Reference images can drive image-to-video. Direct reference uploads are capped at 2 MB in this build to stay inside Vercel's function payload limit. Videos generated here can be edited and extended conversationally without re-uploading.</p>
              <input type="file" accept="image/*,video/mp4,video/webm" onChange={pickMedia} />
              {mediaName && <div style={{ marginTop: 8, fontWeight: 800, fontSize: 13 }}>{mediaName} · {mediaMime}</div>}
            </div>

            <button disabled={busy} onClick={() => generate()} style={{ ...button, marginTop: 16, width: '100%', background: busy ? '#b5c4bd' : '#10211c', color: '#fff', fontSize: 16 }}>{busy ? 'Generating…' : resolution === '360p' ? 'Generate draft video' : `Generate ${resolution} video`}</button>
          </section>

          <section style={panel}>
            <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1.3, color: '#497468' }}>2 · REVIEW AND REFINE</div>
            <h2 style={{ margin: '8px 0 12px' }}>{videoUrl ? 'Your generated video' : 'The finished video appears here'}</h2>
            {videoUrl ? <video src={videoUrl} controls playsInline style={{ width: '100%', borderRadius: 14, background: '#06100d', maxHeight: 570 }} /> : <div style={{ minHeight: 300, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#0c1d17', color: '#c7dad2', textAlign: 'center', padding: 24 }}><div><div style={{ fontSize: 52 }}>▶</div><strong>Generate a draft first.</strong><p style={{ maxWidth: 330, lineHeight: 1.5 }}>360p is the economical sketchpad. Once the scene is right, switch to HD or 4K.</p></div></div>}

            {videoUrl && <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}><button onClick={saveVideo} style={{ ...button, background: '#9EF0CF', color: '#10211c' }}>Save MP4</button><button disabled={busy} onClick={() => generate('edit')} style={{ ...button, background: '#e8f2ed', color: '#10211c' }}>Apply prompt as edit</button><button disabled={busy} onClick={() => generate('extend')} style={{ ...button, background: '#e8f2ed', color: '#10211c' }}>Extend scene</button></div>
              <p style={{ color: '#687872', fontSize: 13, lineHeight: 1.5 }}>For an edit, replace the prompt with something simple such as: “Make the lighting warmer. Keep everything else the same.” For an extension: “Continue the same scene for the next beat.”</p>
            </>}
          </section>
        </div>

        <section style={{ ...panel, marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1.3, color: '#497468' }}>BUILT FOR ARIDON</div>
          <h2 style={{ margin: '8px 0 10px' }}>One studio, all the campaigns.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 }}>{['Sentinel security ads', 'Business OS explainers', 'Ag & ranch content', 'LinkedIn video', 'Facebook / Instagram', 'Vertical social clips', 'Customer product videos', 'Image animation'].map((item) => <div key={item} style={{ border: '1px solid #dce5e1', borderRadius: 12, padding: 13, fontWeight: 850 }}>{item}</div>)}</div>
          <p style={{ marginBottom: 0, marginTop: 14, color: '#687872', fontSize: 12 }}>Google Gemini Omni generated videos include SynthID provenance watermarking. The Google API key stays server-side and is never sent to the browser.</p>
        </section>
      </div>
    </main>
  );
}
