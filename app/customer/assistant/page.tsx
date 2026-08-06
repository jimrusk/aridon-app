'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type Message = { role: 'user' | 'assistant'; content: string; sources?: Array<{ title: string; url: string }> };

type Account = {
  email: string;
  tenant: { slug: string; business_name: string; industry?: string | null; subscription_status?: string | null };
};

const quickPrompts = [
  'What should I focus on today?',
  'Review my open work and tell me what is at risk.',
  'Help me draft a customer follow-up.',
  'Research a competitor and tell me where we can win.',
  'Challenge an idea before I spend money on it.',
  'Help me turn this goal into an execution plan.',
];

export default function CustomerEvaPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I’m Eva, your AI business partner inside this company workspace. Ask me about priorities, customers, projects, competitors, research, writing, decisions, or execution. I’m designed to be available whenever you need the workspace.',
    },
  ]);
  const [input, setInput] = useState('');
  const [researchWeb, setResearchWeb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login');
        return;
      }
      setToken(accessToken);
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'Unable to open Eva.');
        return;
      }
      setAccount(result as Account);
    });
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const canSend = useMemo(() => Boolean(input.trim() && token && account && !loading), [input, token, account, loading]);

  async function send(event?: FormEvent, promptOverride?: string) {
    event?.preventDefault();
    const text = (promptOverride ?? input).trim();
    if (!text || !token || !account || loading) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    const response = await fetch('/api/customer/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        slug: account.tenant.slug,
        researchWeb,
        messages: nextMessages.slice(-20).map(({ role, content }) => ({ role, content })),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || 'Eva could not answer right now.');
      setLoading(false);
      return;
    }

    setMessages((current) => [
      ...current,
      { role: 'assistant', content: data.reply || 'I did not receive a readable response.', sources: Array.isArray(data.sources) ? data.sources : [] },
    ]);
    setLoading(false);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#08101D', color: '#F7FAFC', padding: '22px 14px 110px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1.1px' }}>EVA · 24/7 AI BUSINESS DESK</div>
            <h1 style={{ margin: '7px 0 4px', fontSize: 'clamp(30px,6vw,48px)' }}>{account?.tenant.business_name || 'Your Company'} Business Partner</h1>
            <div style={{ color: '#91A0B9', fontSize: '13px' }}>Tenant-aware help for decisions, research, writing and execution.</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {account?.tenant.slug && <Link href={`/workspace/${account.tenant.slug}`} style={topLink}>Workspace</Link>}
            <Link href="/customer/account" style={topLink}>Account</Link>
          </div>
        </header>

        <section style={{ background: '#0F1727', border: '1px solid #263551', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,.24)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #25324A', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div><strong style={{ color: '#9EF0CF' }}>Ask Eva</strong><span style={{ color: '#8494AE', fontSize: '12px', marginLeft: '8px' }}>AI support designed for always-on access</span></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#C8D2E3', fontSize: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={researchWeb} onChange={(event) => setResearchWeb(event.target.checked)} /> Research the live web when useful
            </label>
          </div>

          <div style={{ minHeight: '470px', maxHeight: '66vh', overflowY: 'auto', padding: '18px', display: 'grid', gap: '13px' }}>
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} style={{ justifySelf: message.role === 'user' ? 'end' : 'start', width: 'min(820px, 94%)', background: message.role === 'user' ? '#17304A' : '#111D30', border: `1px solid ${message.role === 'user' ? '#315A7C' : '#2A3A56'}`, borderRadius: '16px', padding: '14px 15px' }}>
                <div style={{ color: message.role === 'user' ? '#A8D8FF' : '#9EF0CF', fontSize: '11px', fontWeight: 950, letterSpacing: '.7px', marginBottom: '6px' }}>{message.role === 'user' ? 'YOU' : 'EVA'}</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.62, color: '#E6ECF5' }}>{message.content}</div>
                {message.sources && message.sources.length > 0 && (
                  <div style={{ marginTop: '11px', display: 'grid', gap: '5px' }}>
                    <div style={{ color: '#8EA0BB', fontSize: '11px', fontWeight: 900 }}>SOURCES</div>
                    {message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={{ color: '#9BCBFF', fontSize: '12px', wordBreak: 'break-word' }}>{source.title}</a>)}
                  </div>
                )}
              </article>
            ))}
            {loading && <div style={{ justifySelf: 'start', color: '#AAB6CA', background: '#111D30', border: '1px solid #2A3A56', borderRadius: '14px', padding: '12px 14px' }}>Eva is working on it…</div>}
            <div ref={bottomRef} />
          </div>

          <div style={{ borderTop: '1px solid #25324A', padding: '14px' }}>
            <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', paddingBottom: '10px' }}>
              {quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => send(undefined, prompt)} disabled={!token || !account || loading} style={{ flex: '0 0 auto', border: '1px solid #34445F', background: '#0A1322', color: '#C9D4E5', borderRadius: '999px', padding: '8px 11px', fontSize: '12px', cursor: 'pointer' }}>{prompt}</button>)}
            </div>
            {error && <div style={{ background: '#2B1718', border: '1px solid #6B353B', color: '#F1B9B1', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>{error}</div>}
            <form onSubmit={(event) => send(event)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '9px' }} className="eva-form">
              <textarea rows={3} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question, paste a problem, or tell Eva what you need finished…" style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: '#08101D', color: '#F7FAFC', border: '1px solid #34445F', borderRadius: '12px', padding: '12px 13px', fontSize: '15px', lineHeight: 1.5 }} />
              <button disabled={!canSend} style={{ border: 0, borderRadius: '12px', background: '#9EF0CF', color: '#07130F', padding: '0 20px', fontWeight: 950, minHeight: '48px', cursor: canSend ? 'pointer' : 'not-allowed', opacity: canSend ? 1 : .5 }}>{loading ? 'Working…' : 'Send'}</button>
            </form>
            <p style={{ color: '#73839D', fontSize: '11px', lineHeight: 1.5, margin: '9px 2px 0' }}>Eva is an AI assistant, not a human support agent. Availability depends on the hosted service and connected providers. Company context is limited to your authenticated tenant and the information stored in it.</p>
          </div>
        </section>
      </div>
      <style>{`@media(max-width:700px){.eva-form{grid-template-columns:1fr !important}.eva-form button{padding:13px !important}}`}</style>
    </main>
  );
}

const topLink = { border: '1px solid #3B4B67', color: '#E5EBF5', borderRadius: '10px', padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: '13px' };
