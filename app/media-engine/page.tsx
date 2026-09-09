'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Resolution = '360p' | '720p' | '1080p' | '4k';

const panel: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #d8e2dd',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 8px 30px rgba(12,30,24,.06)',
};

const button: React.CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: '13px 15px',
  fontWeight: 900,
  cursor: 'pointer',
  minHeight: 46,
};

const PROVIDERS = [
  ['LTX', 'Generative video', 'API lane installed', 'Text-to-video with synchronized audio. This becomes the primary visual engine when an LTX API key is connected.'],
  ['Mirelo', 'Sound production', 'API lane installed', 'SFX 1.6 text-to-sound is wired. Video-conditioned Foley can be added as soon as partner/API terms are finalized.'],
  ['Machina Sports', 'Sports intelligence', 'Partnership lane', 'Live sports agents, recaps, fan Q&A and sponsor-facing event intelligence.'],
  ['Versos AI', 'Rights + provenance', 'Partnership lane', 'Index, structure and preserve chain-of-custody for rights-cleared real-world video libraries.'],
  ['NVIDIA', 'Compute + ecosystem', 'Infrastructure lane', 'GPU infrastructure, startup resources and a future Southwest AI Media & Real-World Intelligence Lab.'],
] as const;

export default function MediaEnginePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [prompt, setPrompt] = useState('Create a premium 20-second Aridon commercial showing a business owner moving from disconnected tools into one coordinated AI operating system. Keep the visuals grounded, modern and trustworthy.');
  const [soundPrompt, setSoundPrompt] = useState('Modern office ambience, subtle interface sounds, confident cinematic transitions, warm final resolve. No dialogue.');
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [jobId, setJobId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [busyVideo, setBusyVideo] = useState(false);
  const [busyAudio, setBusyAudio] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/media-engine'); return; }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) { router.replace('/customer/login?next=/media-engine'); return; }
      setToken(accessToken);
      setAccount(result as Account);
    });
  }, [router]);

  async function pollLtx(id: string) {
    if (!account || !token) return;
    for (let i = 0; i < 60; i += 1) {
      const response = await fetch(`/api/customer/media-engine/ltx?slug=${encodeURIComponent(account.tenant.slug)}&jobId=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not check the LTX job.');
      if (data.status === 'completed' && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setMessage('LTX video is ready ✓');
        return;
      }
      if (data.status === 'failed') throw new Error(data.error || 'LTX could not complete the video.');
      setMessage(`LTX is rendering… ${data.status || 'processing'}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    throw new Error('LTX is still rendering. The job ID is saved on this page; try again shortly.');
  }

  async function generateVideo() {
    if (!account || !token || !prompt.trim()) return;
    setBusyVideo(true);
    setVideoUrl('');
    setMessage('Eva is handing the visual brief to LTX…');
    try {
      const response = await fetch('/api/customer/media-engine/ltx', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, prompt, resolution }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'LTX generation could not start.');
      setJobId(data.jobId || '');
      setMessage(`LTX accepted the job. ${data.model || ''}`.trim());
      await pollLtx(data.jobId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'LTX generation failed.');
    } finally {
      setBusyVideo(false);
    }
  }

  async function generateSound() {
    if (!account || !token || !soundPrompt.trim()) return;
    setBusyAudio(true);
    setAudioUrl('');
    setMessage('Eva is handing the sound brief to Mirelo…');
    try {
      const response = await fetch('/api/customer/media-engine/mirelo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, prompt: soundPrompt, durationMs: 10000 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Mirelo generation could not start.');
      setAudioUrl(data.audioUrl || '');
      setMessage('Mirelo sound is ready ✓');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mirelo generation failed.');
    } finally {
      setBusyAudio(false);
    }
  }

  if (!account) return <main style={{ minHeight: '100vh', padding: 40, fontFamily: 'Arial, sans-serif', background: '#07130f', color: '#fff' }}>Opening Aridon Media Engine…</main>;

  return (
    <main style={{ minHeight: '100vh', background: '#f3f7f5', color: '#10211c', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07130f', color: '#fff', padding: '30px 18px 36px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, letterSpacing: 1.6, fontSize: 12 }}>ARIDON · EVA MEDIA ENGINE</div>
          <h1 style={{ fontSize: 'clamp(34px,7vw,64px)', lineHeight: 1.02, margin: '8px 0 12px' }}>One brief in. A whole media pipeline out.</h1>
          <p style={{ color: '#c9dbd3', fontSize: 17, lineHeight: 1.55, maxWidth: 860, margin: 0 }}>Aridon coordinates the idea, LTX creates the moving picture, Mirelo creates sound, Machina powers sports intelligence, Versos protects and structures reusable video data, and NVIDIA is the infrastructure lane.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/video-studio" style={{ ...button, background: '#fff', color: '#10211c', textDecoration: 'none' }}>Existing Video Studio</Link>
            <Link href="/customer/start" style={{ ...button, background: '#9EF0CF', color: '#10211c', textDecoration: 'none' }}>{account.tenant.business_name}</Link>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '18px 14px 72px' }}>
        {message && <div role="status" style={{ ...panel, marginBottom: 14, background: '#fafffc', borderColor: '#9ccab7', fontWeight: 850 }}>{message}</div>}

        <section style={{ ...panel, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#497468', letterSpacing: 1.2 }}>THE PIPELINE</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
            {['Business brief', 'Aridon director', 'LTX video', 'Mirelo sound', 'Eva narration', 'Publish + measure', 'Versos archive'].map((item, index, list) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: index === 1 ? '#10211c' : '#e9f3ee', color: index === 1 ? '#fff' : '#17352b', borderRadius: 999, padding: '10px 13px', fontWeight: 900, fontSize: 13 }}>{item}</div>
                {index < list.length - 1 && <span style={{ color: '#6b7f77', fontWeight: 900 }}>→</span>}
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, alignItems: 'start' }}>
          <section style={panel}>
            <div style={{ fontSize: 12, fontWeight: 950, color: '#497468', letterSpacing: 1.2 }}>VISUAL ENGINE · LTX</div>
            <h2 style={{ margin: '8px 0 8px' }}>Generate the first scene</h2>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={9} style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #9db7ad', borderRadius: 13, padding: 13, fontSize: 15, lineHeight: 1.45 }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {(['360p', '720p', '1080p', '4k'] as Resolution[]).map((value) => (
                <button key={value} type="button" onClick={() => setResolution(value)} style={{ ...button, padding: '9px 12px', background: resolution === value ? '#10211c' : '#e9f3ee', color: resolution === value ? '#fff' : '#17352b' }}>{value}</button>
              ))}
            </div>
            <button type="button" disabled={busyVideo} onClick={generateVideo} style={{ ...button, width: '100%', marginTop: 12, background: '#9EF0CF', color: '#10211c', opacity: busyVideo ? .65 : 1 }}>{busyVideo ? 'LTX is working…' : 'Generate with LTX'}</button>
            {jobId && <div style={{ marginTop: 8, fontSize: 12, color: '#687872', wordBreak: 'break-all' }}>Job: {jobId}</div>}
            {videoUrl && <video src={videoUrl} controls playsInline style={{ width: '100%', borderRadius: 14, marginTop: 14, background: '#000' }} />}
          </section>

          <section style={panel}>
            <div style={{ fontSize: 12, fontWeight: 950, color: '#497468', letterSpacing: 1.2 }}>SOUND ENGINE · MIRELO</div>
            <h2 style={{ margin: '8px 0 8px' }}>Build the sound bed</h2>
            <textarea value={soundPrompt} onChange={(e) => setSoundPrompt(e.target.value)} rows={7} style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #9db7ad', borderRadius: 13, padding: 13, fontSize: 15, lineHeight: 1.45 }} />
            <button type="button" disabled={busyAudio} onClick={generateSound} style={{ ...button, width: '100%', marginTop: 12, background: '#ffd5a8', color: '#10211c', opacity: busyAudio ? .65 : 1 }}>{busyAudio ? 'Mirelo is working…' : 'Generate 10-second SFX'}</button>
            {audioUrl && <audio src={audioUrl} controls style={{ width: '100%', marginTop: 14 }} />}
            <p style={{ color: '#65756f', lineHeight: 1.5, fontSize: 13 }}>This first build uses Mirelo’s production text-to-SFX API. The next step is picture-locked video-to-SFX once partner access and terms are confirmed.</p>
          </section>
        </div>

        <section style={{ marginTop: 16 }}>
          <h2 style={{ marginBottom: 10 }}>Partner stack</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {PROVIDERS.map(([name, role, status, description]) => (
              <article key={name} style={panel}>
                <div style={{ fontSize: 12, fontWeight: 950, color: '#497468' }}>{role.toUpperCase()}</div>
                <h3 style={{ margin: '7px 0 4px', fontSize: 21 }}>{name}</h3>
                <div style={{ display: 'inline-block', background: '#e9f3ee', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 900 }}>{status}</div>
                <p style={{ color: '#5c6f67', lineHeight: 1.5, fontSize: 14 }}>{description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
