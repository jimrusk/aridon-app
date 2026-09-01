'use client';

import Link from 'next/link';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Mode = 'text_to_video' | 'image_to_video' | 'edit' | 'extend';
type Resolution = '360p' | '720p' | '1080p' | '4k';

const SENTINEL_SCRIPT = 'Create a 30-second Sentinel commercial. Start in a normal company office. A stolen credential gets through. Individual security systems begin showing small warnings, but Sentinel recognizes that they are one coordinated attack. Freeze the attempted data export, preserve the evidence, then show the CEO reviewing the incident before outside escalation. End with: You may not be able to stop every attack from starting. You can change what happens after it starts.';

const STARTERS = [
  ['Sentinel Ad', SENTINEL_SCRIPT],
  ['Business OS', 'Create a premium product explainer showing a business owner overwhelmed by disconnected tools, then transitioning into Aridon Business OS coordinating decisions, finance, sales, projects, intelligence and controlled execution in one connected operating layer.'],
  ['Ag / Ranch', 'Create authentic cinematic footage of a working American farm and ranch at sunrise. Show practical technology helping with operations, land intelligence, finances and decisions without making the people or equipment feel futuristic or fake. Natural sound, grounded and trustworthy.'],
  ['Social Hook', 'Create a fast vertical social video with a strong first-second visual hook, clean readable text, natural camera movement, energetic pacing, and a clear final call to action.'],
] as const;

const panel: React.CSSProperties = {
  background: '#fff', border: '1px solid #d8e2dd', borderRadius: 18, padding: 20,
  boxShadow: '0 8px 30px rgba(12,30,24,.06)',
};

const button: React.CSSProperties = {
  border: 0, borderRadius: 12, padding: '13px 15px', fontWeight: 900, cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 46,
};

function ChoiceButton({ selected, children, onClick }: { selected: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      style={{
        ...button,
        flex: '1 1 130px',
        background: selected ? '#10211c' : '#edf3f0',
        color: selected ? '#fff' : '#17352b',
        border: selected ? '2px solid #10211c' : '2px solid #d7e3de',
      }}
    >
      {children}
    </button>
  );
}

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
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
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

  function loadPrompt(value: string, label: string) {
    setPrompt(value);
    setMode('text_to_video');
    setMessage(`${label} loaded into the box ✓`);
    window.setTimeout(() => promptRef.current?.focus(), 50);
  }

  async function pasteFromClipboard() {
    try {
      if (!navigator.clipboard?.readText) throw new Error('Clipboard permission is blocked in this browser.');
      const value = await navigator.clipboard.readText();
      if (!value.trim()) throw new Error('Your clipboard is empty.');
      setPrompt(value);
      setMessage('Clipboard pasted into the video box ✓');
      window.setTimeout(() => promptRef.current?.focus(), 50);
    } catch (error) {
      setMessage(`${error instanceof Error ? error.message : 'Clipboard could not be read.'} You can still tap “Load Sentinel script” or type directly in the box.`);
    }
  }

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
    setMessage(`${file.name} is ready as a private reference ✓`);
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
    throw new Error('The video is still processing. Reload Video Studio to check again.');
  }

  async function generate(nextMode?: Mode) {
    if (!account || !token || !prompt.trim()) { setMessage('Load a script or type what you want the video to show first.'); return; }
    const requestedMode = nextMode || mode;
    if ((requestedMode === 'edit' || requestedMode === 'extend') && !interactionId && !mediaData) {
      setMessage('Generate a video first, or attach a short source video to edit.'); return;
    }
    setBusy(true);
    setMessage('Eva is handing the scene to Gemini Omni…');
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
      setMessage('Video ready. Play it below or describe an edit ✓');
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
      <section style={{ background: '#07130f', color: '#fff', padding: '30px 18px 34px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, letterSpacing: 1.6, fontSize: 12 }}>ARIDON · EVA VIDEO STUDIO</div>
          <h1 style={{ fontSize: 'clamp(34px,7vw,62px)', lineHeight: 1.02, margin: '8px 0 12px' }}>Make the video without fighting the controls.</h1>
          <p style={{ color: '#c9dbd3', fontSize: 17, lineHeight: 1.55, maxWidth: 780, margin: 0 }}>Powered by {model}. Load a script, choose big tap controls, generate a draft, then tell Eva what to change.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            <Link href="/customer/creator" style={{ ...button, background: '#fff', color: '#10211c', textDecoration: 'none' }}>Creator Studio</Link>
            <Link href="/customer/start" style={{ ...button, background: '#9EF0CF', color: '#10211c', textDecoration: 'none' }}>{account.tenant.business_name}</Link>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '18px 14px 72px' }}>
        {message && <div role="status" style={{ ...panel, marginBottom: 14, background: '#fafffc', borderColor: '#9ccab7', fontWeight: 850 }}>{message}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, alignItems: 'start' }}>
          <section style={panel}>
            <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: '#497468' }}>1 · SCRIPT</div>
            <h2 style={{ margin: '8px 0 10px' }}>What should the video show?</h2>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <button type="button" onClick={() => loadPrompt(SENTINEL_SCRIPT, 'Sentinel commercial')} style={{ ...button, background: '#10211c', color: '#fff', flex: '1 1 190px' }}>Load Sentinel script</button>
              <button type="button" onClick={pasteFromClipboard} style={{ ...button, background: '#9EF0CF', color: '#10211c', flex: '1 1 190px' }}>Paste from clipboard</button>
            </div>

            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
              {STARTERS.slice(1).map(([label, text]) => (
                <button key={label} type="button" onClick={() => loadPrompt(text, label)} style={{ ...button, padding: '10px 12px', background: '#e8f2ed', color: '#17352b', flex: '1 1 120px' }}>{label}</button>
              ))}
            </div>

            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={10}
              autoCapitalize="sentences"
              spellCheck
              style={{ width: '100%', border: '2px solid #9db7ad', borderRadius: 13, padding: 14, fontSize: 16, lineHeight: 1.5, background: '#fff', color: '#10211c', boxSizing: 'border-box', resize: 'vertical', WebkitUserSelect: 'text', userSelect: 'text', touchAction: 'auto' }}
              placeholder="Tap Load Sentinel script, paste, or type your video idea here…"
            />
            <div style={{ fontSize: 12, color: '#687872', marginTop: 6 }}>{prompt.length ? `${prompt.length} characters loaded` : 'The box is empty.'}</div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#497468', marginBottom: 7 }}>2 · FORMAT</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <ChoiceButton selected={aspectRatio === '16:9'} onClick={() => setAspectRatio('16:9')}>Landscape 16:9</ChoiceButton>
                <ChoiceButton selected={aspectRatio === '9:16'} onClick={() => setAspectRatio('9:16')}>Vertical 9:16</ChoiceButton>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#497468', marginBottom: 7 }}>3 · QUALITY</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['360p', '720p', '1080p', '4k'] as Resolution[]).map((value) => (
                  <ChoiceButton key={value} selected={resolution === value} onClick={() => setResolution(value)}>{value === '360p' ? 'Draft 360p' : value.toUpperCase()}</ChoiceButton>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#497468', marginBottom: 7 }}>4 · MODE</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <ChoiceButton selected={mode === 'text_to_video'} onClick={() => setMode('text_to_video')}>Text → video</ChoiceButton>
                <ChoiceButton selected={mode === 'image_to_video'} onClick={() => setMode('image_to_video')}>Image → video</ChoiceButton>
                <ChoiceButton selected={mode === 'edit'} onClick={() => setMode('edit')}>Edit video</ChoiceButton>
                <ChoiceButton selected={mode === 'extend'} onClick={() => setMode('extend')}>Extend</ChoiceButton>
              </div>
            </div>

            <div style={{ marginTop: 16, border: '1px dashed #9eb7ad', borderRadius: 14, padding: 14, background: '#f7fbf9' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Optional image or short video</div>
              <input type="file" accept="image/*,video/mp4,video/webm" onChange={pickMedia} style={{ maxWidth: '100%' }} />
              {mediaName && <div style={{ marginTop: 8, fontWeight: 800, fontSize: 13 }}>{mediaName} · {mediaMime}</div>}
              <p style={{ margin: '8px 0 0', color: '#687872', fontSize: 12 }}>Direct reference uploads are capped at 2 MB in this build.</p>
            </div>

            <div style={{ marginTop: 12, padding: 10, borderRadius: 11, background: '#edf3f0', fontSize: 13, fontWeight: 850 }}>
              Selected: {aspectRatio} · {resolution} · {mode.replaceAll('_', ' ')}
            </div>

            <button type="button" disabled={busy} onClick={() => generate()} style={{ ...button, marginTop: 14, width: '100%', background: busy ? '#b5c4bd' : '#10211c', color: '#fff', fontSize: 17, minHeight: 54 }}>{busy ? 'Generating…' : 'Generate video'}</button>
          </section>

          <section style={panel}>
            <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: '#497468' }}>5 · REVIEW</div>
            <h2 style={{ margin: '8px 0 12px' }}>{videoUrl ? 'Your generated video' : 'The finished video appears here'}</h2>
            {videoUrl ? (
              <video src={videoUrl} controls playsInline style={{ width: '100%', borderRadius: 14, background: '#06100d', maxHeight: 570 }} />
            ) : (
              <div style={{ minHeight: 280, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#0c1d17', color: '#c7dad2', textAlign: 'center', padding: 24 }}>
                <div><div style={{ fontSize: 48 }}>▶</div><strong>Start with a 360p draft.</strong><p style={{ maxWidth: 330, lineHeight: 1.5 }}>Once the scene looks right, choose HD or 4K for the keeper.</p></div>
              </div>
            )}

            {videoUrl && (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button type="button" onClick={saveVideo} style={{ ...button, background: '#9EF0CF', color: '#10211c' }}>Save MP4</button>
                  <button type="button" disabled={busy} onClick={() => generate('edit')} style={{ ...button, background: '#e8f2ed', color: '#10211c' }}>Apply prompt as edit</button>
                  <button type="button" disabled={busy} onClick={() => generate('extend')} style={{ ...button, background: '#e8f2ed', color: '#10211c' }}>Extend scene</button>
                </div>
                <p style={{ color: '#687872', fontSize: 13, lineHeight: 1.5 }}>For an edit, replace the script with a simple instruction such as “Make the lighting warmer. Keep everything else the same.”</p>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
