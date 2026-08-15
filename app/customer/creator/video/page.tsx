'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Scene = { headline: string; body: string; seconds: number };
type VideoPlan = { title: string; hook: string; caption: string; hashtags: string[]; scenes: Scene[]; mode?: string };
type FormatKey = 'vertical' | 'square' | 'landscape';

const FORMATS: Record<FormatKey, { width: number; height: number; label: string }> = {
  vertical: { width: 720, height: 1280, label: '9:16 Reels / Shorts / TikTok' },
  square: { width: 900, height: 900, label: '1:1 Social Feed' },
  landscape: { width: 1280, height: 720, label: '16:9 YouTube / LinkedIn' },
};

export default function VideoMakerPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [format, setFormat] = useState<FormatKey>('vertical');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [offer, setOffer] = useState('');
  const [cta, setCta] = useState('Learn more with Aridon');
  const [tone, setTone] = useState('credible, practical, confident');
  const [duration, setDuration] = useState(20);
  const [plan, setPlan] = useState<VideoPlan | null>(null);
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [previewScene, setPreviewScene] = useState(0);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/customer/creator/video'); return; }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) { router.replace('/customer/login'); return; }
      setToken(accessToken);
      setAccount(result as Account);
      setOffer(result.tenant.business_name || '');
    });
  }, [router]);

  const dimensions = FORMATS[format];
  const totalSeconds = useMemo(() => plan?.scenes?.reduce((sum, scene) => sum + Math.max(1, Number(scene.seconds) || 0), 0) || duration, [plan, duration]);

  useEffect(() => {
    if (!plan?.scenes?.length) return;
    drawScene(previewScene);
  }, [plan, previewScene, format, logo]);

  async function buildVideoPlan() {
    if (!account || !token) return;
    if (!topic.trim()) { setMessage('Tell Aridon what the video should be about.'); return; }
    setGenerating(true); setMessage('Building hook, scenes, caption, and call to action…');
    try {
      const response = await fetch('/api/customer/video', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, topic, audience, offer, cta, tone, duration }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not create the video plan.');
      setPlan(data as VideoPlan);
      setPreviewScene(0);
      setMessage(data.mode === 'template' ? 'Drafted with the built-in template engine. You can edit every scene.' : 'Video plan ready. Edit anything, then render it.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the video plan.');
    } finally { setGenerating(false); }
  }

  function updateScene(index: number, patch: Partial<Scene>) {
    setPlan((current) => current ? { ...current, scenes: current.scenes.map((scene, i) => i === index ? { ...scene, ...patch } : scene) } : current);
  }

  function uploadLogo(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => setLogo(image);
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  function wrapText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number, maxLines: number) {
    const words = value.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else {
        if (line) lines.push(line);
        line = word;
        if (lines.length >= maxLines - 1) break;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.]+$/, '')}…`;
    return lines;
  }

  function drawScene(index: number, progress = 0) {
    if (!plan?.scenes?.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const scene = plan.scenes[Math.min(index, plan.scenes.length - 1)];
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const w = canvas.width, h = canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#07101D');
    gradient.addColorStop(0.55, '#10233C');
    gradient.addColorStop(1, '#173B37');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#9EF0CF';
    const orb = Math.min(w, h) * 0.48;
    ctx.beginPath(); ctx.arc(w * 0.83, h * 0.16, orb, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    const pad = Math.round(w * 0.075);
    const top = Math.round(h * 0.09);
    ctx.fillStyle = '#9EF0CF';
    ctx.font = `700 ${Math.round(Math.min(w, h) * 0.022)}px Arial`;
    ctx.fillText((account?.tenant.business_name || 'ARIDON').toUpperCase(), pad, top);

    if (logo) {
      const max = Math.min(w, h) * 0.12;
      const ratio = Math.min(max / logo.width, max / logo.height, 1);
      const lw = logo.width * ratio, lh = logo.height * ratio;
      ctx.drawImage(logo, w - pad - lw, top - lh * 0.72, lw, lh);
    }

    const headlineSize = Math.round(Math.min(w, h) * (format === 'landscape' ? 0.065 : 0.075));
    ctx.fillStyle = '#F8FAFC';
    ctx.font = `900 ${headlineSize}px Arial`;
    const headlineLines = wrapText(ctx, scene.headline, w - pad * 2, 4);
    let y = h * (format === 'landscape' ? 0.34 : 0.34);
    const lineHeight = headlineSize * 1.02;
    for (const line of headlineLines) { ctx.fillText(line, pad, y); y += lineHeight; }

    const bodySize = Math.round(Math.min(w, h) * (format === 'landscape' ? 0.032 : 0.038));
    ctx.fillStyle = '#D5DFEA';
    ctx.font = `500 ${bodySize}px Arial`;
    y += bodySize * 0.75;
    for (const line of wrapText(ctx, scene.body, w - pad * 2, 5)) { ctx.fillText(line, pad, y); y += bodySize * 1.28; }

    const footerY = h - Math.round(h * 0.085);
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.fillRect(pad, footerY, w - pad * 2, 5);
    ctx.fillStyle = '#9EF0CF';
    ctx.fillRect(pad, footerY, (w - pad * 2) * Math.max(0.02, Math.min(1, progress)), 5);

    ctx.fillStyle = '#BFC9D8';
    ctx.font = `600 ${Math.round(Math.min(w, h) * 0.022)}px Arial`;
    ctx.fillText(`${index + 1}/${plan.scenes.length}`, pad, h - Math.round(h * 0.035));
    const ctaText = index === plan.scenes.length - 1 && cta ? cta : plan.title;
    ctx.textAlign = 'right';
    ctx.fillText(ctaText.slice(0, 55), w - pad, h - Math.round(h * 0.035));
    ctx.textAlign = 'left';
  }

  async function renderVideo() {
    if (!plan?.scenes?.length || !canvasRef.current) return;
    if (typeof MediaRecorder === 'undefined') { setMessage('This browser does not support in-browser video rendering. Try Chrome or Edge.'); return; }
    setRendering(true); setMessage('Rendering your video in the browser…');
    try {
      const canvas = canvasRef.current;
      canvas.width = dimensions.width; canvas.height = dimensions.height;
      const stream = canvas.captureStream(30);
      const preferred = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred, videoBitsPerSecond: 5_000_000 } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const finished = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' })); });
      recorder.start(250);

      for (let index = 0; index < plan.scenes.length; index++) {
        const sceneMs = Math.max(1.5, Number(plan.scenes[index].seconds) || 3) * 1000;
        const started = performance.now();
        while (performance.now() - started < sceneMs) {
          const progress = (index + Math.min(1, (performance.now() - started) / sceneMs)) / plan.scenes.length;
          drawScene(index, progress);
          await new Promise((resolve) => setTimeout(resolve, 33));
        }
      }
      recorder.stop();
      const blob = await finished;
      stream.getTracks().forEach((track) => track.stop());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(plan.title || 'aridon-video').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'aridon-video'}.webm`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setMessage(`Video rendered: ${Math.round(totalSeconds)} seconds. It downloaded as WebM.`);
      drawScene(previewScene);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Video rendering failed.');
    } finally { setRendering(false); }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F4F1E9', color: '#171717', fontFamily: 'Arial, sans-serif', paddingBottom: 100 }}>
      <section style={{ background: '#07101D', color: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 58px' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/customer/creator" style={{ color: '#9EF0CF', textDecoration: 'none', fontWeight: 900 }}>← Creator Studio</Link>
            <span style={{ color: '#8FA0B8', fontSize: 13 }}>{account?.tenant.business_name || 'Loading workspace…'}</span>
          </nav>
          <div style={{ maxWidth: 850, paddingTop: 42 }}>
            <div style={eyebrow}>VIDEO MAKER</div>
            <h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '14px 0 20px' }}>Turn one business idea into a postable video.</h1>
            <p style={{ color: '#BFC9D8', fontSize: 19, lineHeight: 1.6 }}>Aridon builds the hook, scene plan, caption and hashtags from your Company Brain. Then your browser renders a real short-form video you can download and post.</p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '42px 20px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(320px,.8fr)', gap: 22, alignItems: 'start' }}>
        <div>
          <article style={card}>
            <h2 style={{ marginTop: 0 }}>1. Tell Aridon what to make</h2>
            <label style={label}>Video topic / problem</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Example: Why small service businesses lose revenue when estimates never get a second follow-up" style={textarea} />
            <div style={grid2}>
              <Field label="Audience" value={audience} onChange={setAudience} placeholder="Plumbing and HVAC owners" />
              <Field label="Offer / company" value={offer} onChange={setOffer} placeholder="Aridon Business OS" />
              <Field label="Call to action" value={cta} onChange={setCta} placeholder="Try the free business analysis" />
              <Field label="Tone" value={tone} onChange={setTone} placeholder="Practical and direct" />
            </div>
            <div style={{ ...grid2, marginTop: 14 }}>
              <label style={label}>Length
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={input}>
                  <option value={15}>15 seconds</option><option value={20}>20 seconds</option><option value={30}>30 seconds</option><option value={45}>45 seconds</option>
                </select>
              </label>
              <label style={label}>Format
                <select value={format} onChange={(e) => setFormat(e.target.value as FormatKey)} style={input}>
                  {Object.entries(FORMATS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                </select>
              </label>
            </div>
            <label style={{ ...label, marginTop: 14 }}>Optional logo
              <input type="file" accept="image/*" onChange={(e) => uploadLogo(e.target.files?.[0])} style={{ display: 'block', marginTop: 7 }} />
            </label>
            <button onClick={buildVideoPlan} disabled={generating} style={primaryButton}>{generating ? 'Building video…' : 'Build My Video'}</button>
            {message && <p style={{ color: '#5E625D', lineHeight: 1.55 }}>{message}</p>}
          </article>

          {plan && <article style={{ ...card, marginTop: 16 }}>
            <h2 style={{ marginTop: 0 }}>2. Edit the scenes</h2>
            <p style={{ color: '#68645D' }}>Every line is editable before you render. Keep claims factual and specific.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {plan.scenes.map((scene, index) => <div key={index} style={{ border: '1px solid #D5D0C7', borderRadius: 14, padding: 14, background: index === previewScene ? '#EAF7F1' : '#FAF9F5' }}>
                <button onClick={() => setPreviewScene(index)} style={{ border: 0, background: 'transparent', fontWeight: 950, cursor: 'pointer', padding: 0, marginBottom: 8 }}>Scene {index + 1} · {scene.seconds}s</button>
                <input value={scene.headline} onChange={(e) => updateScene(index, { headline: e.target.value })} style={{ ...input, fontWeight: 800 }} />
                <textarea value={scene.body} onChange={(e) => updateScene(index, { body: e.target.value })} style={{ ...textarea, minHeight: 80, marginTop: 8 }} />
                <label style={{ ...label, marginTop: 6 }}>Seconds <input type="number" min={1.5} max={12} step={0.5} value={scene.seconds} onChange={(e) => updateScene(index, { seconds: Number(e.target.value) })} style={{ ...input, width: 100, display: 'inline-block', marginLeft: 8 }} /></label>
              </div>)}
            </div>
          </article>}
        </div>

        <div style={{ position: 'sticky', top: 20 }}>
          <article style={{ ...card, background: '#101A29', color: '#fff', borderColor: '#26364E' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}><strong>Preview</strong><span style={{ color: '#8FA0B8', fontSize: 12 }}>{dimensions.width}×{dimensions.height}</span></div>
            <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} style={{ width: '100%', maxHeight: 580, objectFit: 'contain', background: '#07101D', borderRadius: 16, marginTop: 14, boxShadow: '0 18px 45px rgba(0,0,0,.3)' }} />
            {!plan && <p style={{ color: '#9AA8BA' }}>Build a video plan and the preview appears here.</p>}
            {plan && <>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>{plan.scenes.map((_, index) => <button key={index} onClick={() => setPreviewScene(index)} style={{ border: '1px solid #33445E', background: index === previewScene ? '#9EF0CF' : '#17243A', color: index === previewScene ? '#07130F' : '#D5DFEA', borderRadius: 999, width: 34, height: 34, cursor: 'pointer', fontWeight: 900 }}>{index + 1}</button>)}</div>
              <button onClick={renderVideo} disabled={rendering} style={{ ...primaryButton, width: '100%', marginTop: 14 }}>{rendering ? 'Rendering…' : `Render & Download ${Math.round(totalSeconds)}s Video`}</button>
            </>}
          </article>

          {plan && <article style={{ ...card, marginTop: 14 }}>
            <div style={eyebrowLight}>POST COPY</div>
            <strong style={{ display: 'block', margin: '8px 0' }}>{plan.hook}</strong>
            <p style={{ color: '#666158', lineHeight: 1.55 }}>{plan.caption}</p>
            <p style={{ fontSize: 13 }}>{plan.hashtags?.join(' ')}</p>
            <button onClick={() => navigator.clipboard.writeText(`${plan.hook}\n\n${plan.caption}\n\n${plan.hashtags?.join(' ') || ''}`)} style={secondaryButton}>Copy Post Text</button>
          </article>}
        </div>
      </section>
    </main>
  );
}

function Field({ label: title, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label style={label}>{title}<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={input} /></label>;
}

const card: React.CSSProperties = { background: '#fff', border: '1px solid #D4CEC2', borderRadius: 20, padding: 22, boxShadow: '0 10px 28px rgba(40,35,25,.05)' };
const label: React.CSSProperties = { display: 'block', fontWeight: 800, fontSize: 13, color: '#403D37', lineHeight: 1.5 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', marginTop: 6, border: '1px solid #CFC9BD', borderRadius: 11, padding: '11px 12px', font: 'inherit', background: '#fff' };
const textarea: React.CSSProperties = { ...input, minHeight: 118, resize: 'vertical' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 12 };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 12, background: '#9EF0CF', color: '#07130F', fontWeight: 950, padding: '13px 17px', cursor: 'pointer', marginTop: 16, fontSize: 14 };
const secondaryButton: React.CSSProperties = { border: '1px solid #BDB7AB', borderRadius: 11, background: '#fff', color: '#171717', fontWeight: 900, padding: '10px 13px', cursor: 'pointer' };
const eyebrow: React.CSSProperties = { color: '#9EF0CF', fontWeight: 950, fontSize: 12, letterSpacing: 1.4 };
const eyebrowLight: React.CSSProperties = { color: '#176348', fontWeight: 950, fontSize: 11, letterSpacing: 1.2 };
