'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EVA_AVATAR } from '../../lib/evaIdentity';

type Message = { role: 'user' | 'assistant'; content: string };

export default function EvaChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I am here. What are we working on?',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive: 'Eva', messages: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Eva chat could not complete the request.');
      setMessages([...next, { role: 'assistant', content: data.reply || 'I am here.' }]);
    } catch (error) {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Eva chat could not complete the request.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%,#2a1a22 0,#090b12 42%,#05060a 100%)', color: '#F5F7FB', padding: '24px', fontFamily: 'Inter,ui-sans-serif,system-ui,Segoe UI,Arial' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src={EVA_AVATAR} alt="Eva" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #D45A2A', boxShadow: '0 0 30px rgba(212,90,42,.35)' }} />
            <div>
              <div style={{ fontSize: '13px', letterSpacing: '.14em', color: '#F0A27A', fontWeight: 900 }}>EVA</div>
              <h1 style={{ margin: '2px 0 4px', fontSize: '34px' }}>Command Advisor Chat</h1>
              <div style={{ color: '#9BA8C6' }}>AI Command Advisor &amp; Chief of Staff</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
            <Link href="/eva-core" style={{ color: '#101421', background: '#9EF0CF', borderRadius: '999px', padding: '10px 14px', fontWeight: 900, textDecoration: 'none' }}>Eva Core</Link>
            <Link href="/" style={{ color: '#F5F7FB', border: '1px solid #39415B', borderRadius: '999px', padding: '10px 14px', fontWeight: 800, textDecoration: 'none' }}>Command Center</Link>
          </div>
        </header>

        <section style={{ background: 'linear-gradient(180deg,rgba(24,32,54,.94),rgba(15,19,33,.94))', border: '1px solid #26314F', borderRadius: '22px', padding: '18px', boxShadow: '0 18px 60px rgba(0,0,0,.28)' }}>
          <div style={{ minHeight: '440px', maxHeight: '62vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '6px' }}>
            {messages.map((message, index) => (
              <div key={index} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%', display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
                {message.role === 'assistant' && <img src={EVA_AVATAR} alt="" aria-hidden="true" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #D45A2A', flexShrink: 0 }} />}
                <div style={{ background: message.role === 'user' ? '#233454' : '#181F33', border: message.role === 'assistant' ? '1px solid #26314F' : 'none', padding: '13px 15px', borderRadius: '16px', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{message.content}</div>
              </div>
            ))}
            {busy && <div style={{ color: '#9BA8C6', paddingLeft: '44px' }}>Eva is thinking…</div>}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'stretch' }}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Talk to Eva…"
              style={{ flex: 1, minHeight: '78px', resize: 'vertical', background: '#0B1020', color: '#fff', border: '1px solid #26314F', borderRadius: '14px', padding: '12px' }}
            />
            <button onClick={send} disabled={busy || !input.trim()} style={{ minWidth: '110px', border: 0, borderRadius: '14px', background: '#D45A2A', color: '#fff', fontWeight: 900, cursor: busy ? 'wait' : 'pointer', opacity: busy || !input.trim() ? .55 : 1 }}>Send</button>
          </div>
        </section>
      </div>
    </main>
  );
}
