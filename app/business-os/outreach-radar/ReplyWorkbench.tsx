'use client';

import { useState } from 'react';

type Result = { reply?: string; fitScore?: number; reason?: string; risk?: string; error?: string };

export default function ReplyWorkbench() {
  const [platform, setPlatform] = useState('Reddit');
  const [postText, setPostText] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!postText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/outreach-radar/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, postText, postUrl }),
      });
      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ error: 'Unable to generate the reply right now.' });
    } finally {
      setLoading(false);
    }
  }

  async function copyReply() {
    if (result?.reply) await navigator.clipboard.writeText(result.reply);
  }

  return (
    <section style={{ marginTop: 56, background: '#fff', border: '1px solid #D4CEC2', borderRadius: 20, padding: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 950, color: '#176348', letterSpacing: 1 }}>LIVE REPLY WORKBENCH</div>
      <h2 style={{ fontSize: 34, margin: '8px 0 8px' }}>Paste a public post. Aridon scores the fit and drafts the reply.</h2>
      <p style={{ color: '#666158', lineHeight: 1.6 }}>Use this while platform connections are being approved. Nothing is posted automatically from this screen.</p>
      <div style={{ display: 'grid', gap: 10 }}>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={inputStyle}>
          <option>Reddit</option><option>LinkedIn</option><option>Facebook</option><option>Instagram</option><option>Other</option>
        </select>
        <input value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="Post URL (optional)" style={inputStyle} />
        <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Paste the owner's post or question here..." rows={7} style={{ ...inputStyle, resize: 'vertical' }} />
        <button onClick={generate} disabled={loading || !postText.trim()} style={{ border: 0, borderRadius: 12, background: '#07101D', color: '#fff', padding: '14px 18px', fontWeight: 900, cursor: 'pointer', opacity: loading ? .65 : 1 }}>{loading ? 'Scoring…' : 'Score + Draft Reply'}</button>
      </div>
      {result && <div style={{ marginTop: 18, background: '#F4F1E9', borderRadius: 14, padding: 18 }}>
        {result.error ? <strong>{result.error}</strong> : <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}><strong>Fit: {result.fitScore ?? 0}/100</strong><span>Risk: {result.risk || 'review'}</span></div>
          <div style={{ color: '#666158', lineHeight: 1.55, marginBottom: 14 }}>{result.reason}</div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, background: '#fff', padding: 16, borderRadius: 12 }}>{result.reply}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={copyReply} style={secondaryButton}>Copy Reply</button>
            {postUrl && <a href={postUrl} target="_blank" rel="noreferrer" style={{ ...secondaryButton, textDecoration: 'none' }}>Open Original Post</a>}
          </div>
        </>}
      </div>}
    </section>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #CFC9BD', borderRadius: 12, padding: '13px 14px', fontSize: 15, fontFamily: 'inherit', background: '#fff' };
const secondaryButton: React.CSSProperties = { border: '1px solid #AFA99D', borderRadius: 10, background: '#fff', color: '#171717', padding: '10px 14px', fontWeight: 850, cursor: 'pointer', display: 'inline-block' };
