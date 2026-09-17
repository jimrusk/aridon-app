'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBrowserClient } from '../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Exploration = {
  engine?: 'aridon' | 'browserbase';
  ran?: boolean;
  visited?: Array<{ url: string; title: string }>;
  findings?: string[];
  blockedActions?: string[];
  finalPage?: { url: string; title: string; excerpt: string };
  error?: string;
};

export default function AridonBrowserPage() {
  const [token, setToken] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [url, setUrl] = useState('https://www.google.com');
  const [objective, setObjective] = useState('Find the information I asked for and summarize the useful facts.');
  const [status, setStatus] = useState('Connecting to Aridon…');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Exploration | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const db = getBrowserClient();
        const session = await db.auth.getSession();
        const access = session.data.session?.access_token || '';
        if (!access) {
          setStatus('Sign in to Aridon to use Aridon Browser.');
          return;
        }
        const response = await fetch('/api/customer/me', {
          headers: { Authorization: `Bearer ${access}` },
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.tenant?.slug) throw new Error(payload.error || 'Could not open your Aridon workspace.');
        setToken(access);
        setAccount(payload as Account);
        setStatus(`Ready · ${payload.tenant.business_name || 'Aridon'} · Aridon-owned Chromium`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Aridon Browser could not connect.');
      }
    })();
  }, []);

  async function run() {
    if (!token || !account) {
      setStatus('Sign in to Aridon first.');
      return;
    }
    if (!url.trim() || !objective.trim()) {
      setStatus('Enter a website and tell Eva what to do.');
      return;
    }
    setBusy(true);
    setResult(null);
    setStatus('Eva is browsing with Aridon’s own Chromium engine…');
    try {
      const response = await fetch('/api/customer/aridon-browser', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, url: url.trim(), objective: objective.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok && !payload.exploration) throw new Error(payload.error || 'Aridon Browser failed.');
      const exploration = payload.exploration as Exploration;
      setResult(exploration);
      setStatus(exploration.error ? `Finished with a warning: ${exploration.error}` : `Finished · ${exploration.engine === 'browserbase' ? 'fallback browser' : 'Aridon-owned Chromium'}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Aridon Browser failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <section style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>ARIDON BROWSER · EVA</div>
            <h1 style={h1}>Our browser. Our rules.</h1>
            <p style={lead}>A built-in web worker powered by Aridon’s own server-side Chromium. No TinyFish subscription is required for this page.</p>
          </div>
          <div style={nav}>
            <Link href="/eva-chat" style={ghost}>Eva Chat</Link>
            <Link href="/eva-phone" style={primary}>Eva Phone</Link>
          </div>
        </header>

        <div style={statusBar}>{status}</div>

        <section style={card}>
          <label style={label}>Website</label>
          <input style={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          <label style={label}>What should Eva do?</label>
          <textarea style={textarea} value={objective} onChange={(e) => setObjective(e.target.value)} rows={5} placeholder="Find the pricing, contact person, requirements, or anything else you need." />
          <button style={{ ...primaryButton, opacity: busy ? 0.6 : 1 }} onClick={() => void run()} disabled={busy}>
            {busy ? 'Eva is browsing…' : 'Run Aridon Browser'}
          </button>
          <p style={small}>The browser can inspect pages, follow ordinary links, search/filter, and read dynamic content. It will stop before payments, messages, purchases, contracts, security changes, secret entry, CAPTCHA, or MFA.</p>
        </section>

        {result && (
          <section style={card}>
            <div style={eyebrow}>RESULT</div>
            <h2 style={h2}>{result.finalPage?.title || 'Browser findings'}</h2>
            {result.visited?.length ? (
              <div style={miniBlock}>
                <strong>Visited</strong>
                {result.visited.map((item, index) => <div key={`${item.url}-${index}`} style={line}>{item.title || item.url}<br /><span style={small}>{item.url}</span></div>)}
              </div>
            ) : null}
            {result.findings?.length ? (
              <div style={miniBlock}>
                <strong>Findings</strong>
                {result.findings.map((item, index) => <div key={index} style={line}>• {item}</div>)}
              </div>
            ) : null}
            {result.blockedActions?.length ? (
              <div style={miniBlock}>
                <strong>Protected actions</strong>
                {result.blockedActions.map((item, index) => <div key={index} style={line}>• {item}</div>)}
              </div>
            ) : null}
            {result.finalPage?.excerpt ? (
              <details style={details}>
                <summary>Show page text Eva inspected</summary>
                <pre style={pre}>{result.finalPage.excerpt}</pre>
              </details>
            ) : null}
          </section>
        )}
      </section>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', background: '#07110f', color: '#effff8', padding: '24px 14px 60px', fontFamily: 'Inter, system-ui, sans-serif' };
const shell: React.CSSProperties = { width: 'min(980px, 100%)', margin: '0 auto', display: 'grid', gap: 18 };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap', padding: '16px 4px' };
const eyebrow: React.CSSProperties = { color: '#73f2bd', fontSize: 12, fontWeight: 800, letterSpacing: 1.6 };
const h1: React.CSSProperties = { fontSize: 'clamp(32px, 7vw, 64px)', lineHeight: 0.96, margin: '10px 0 14px', letterSpacing: -2 };
const h2: React.CSSProperties = { fontSize: 26, margin: '8px 0 16px' };
const lead: React.CSSProperties = { color: '#b7cbc2', maxWidth: 700, fontSize: 17, lineHeight: 1.55, margin: 0 };
const nav: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const ghost: React.CSSProperties = { color: '#dff9ed', border: '1px solid #315047', borderRadius: 12, padding: '10px 14px', textDecoration: 'none' };
const primary: React.CSSProperties = { color: '#06110d', background: '#73f2bd', borderRadius: 12, padding: '10px 14px', textDecoration: 'none', fontWeight: 800 };
const statusBar: React.CSSProperties = { border: '1px solid #29483e', background: '#0d1b17', borderRadius: 14, padding: '12px 14px', color: '#c7ddd4' };
const card: React.CSSProperties = { border: '1px solid #29483e', background: '#0b1814', borderRadius: 20, padding: 'clamp(16px, 4vw, 28px)', display: 'grid', gap: 12, boxShadow: '0 18px 60px rgba(0,0,0,.24)' };
const label: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: '#d9eee6', marginTop: 4 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#07110f', color: '#effff8', border: '1px solid #315047', borderRadius: 12, padding: '14px 15px', fontSize: 16, outline: 'none' };
const textarea: React.CSSProperties = { ...input, resize: 'vertical', minHeight: 120, fontFamily: 'inherit' };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 14, background: '#73f2bd', color: '#06110d', padding: '14px 18px', fontWeight: 900, fontSize: 16, cursor: 'pointer', marginTop: 4 };
const small: React.CSSProperties = { color: '#8fa9a0', fontSize: 12, lineHeight: 1.55 };
const miniBlock: React.CSSProperties = { background: '#07110f', border: '1px solid #203b32', borderRadius: 14, padding: 14, display: 'grid', gap: 8 };
const line: React.CSSProperties = { color: '#dcefe8', lineHeight: 1.5, overflowWrap: 'anywhere' };
const details: React.CSSProperties = { color: '#bcd2c9', cursor: 'pointer' };
const pre: React.CSSProperties = { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: '#06100d', borderRadius: 12, padding: 14, color: '#bcd2c9', maxHeight: 420, overflow: 'auto' };
