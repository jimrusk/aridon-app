'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EVA_AVATAR } from '../../lib/evaIdentity';
import { getBrowserClient } from '../../lib/supabase';

type Message = { role: 'user' | 'assistant'; content: string };
type Account = { tenant: { slug: string; business_name: string } };

export default function EvaChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I am here. What are we working on?',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/eva-chat');
        return;
      }

      const response = await fetch('/api/customer/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) {
        setAccessError(result.error || 'Your Aridon workspace could not be opened.');
        return;
      }

      setToken(accessToken);
      setAccount(result as Account);
    });
  }, [router]);

  async function send() {
    const text = input.trim();
    if (!text || busy || !token || !account) return;

    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);

    try {
      const response = await fetch('/api/customer/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug: account.tenant.slug,
          executive: 'Eva',
          researchWeb: false,
          messages: next.slice(-20),
        }),
      });
      const data = await response.json().catch(() => ({}));
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

  if (accessError) {
    return (
      <main style={{ minHeight: '100vh', background: '#090b12', color: '#F5F7FB', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Inter,ui-sans-serif,system-ui,Segoe UI,Arial' }}>
        <div style={{ maxWidth: '540px', textAlign: 'center' }}>
          <h1>Eva could not open your Aridon workspace.</h1>
          <p style={{ color: '#AAB6CA', lineHeight: 1.6 }}>{accessError}</p>
          <Link href="/customer/login?next=/eva-chat" style={{ color: '#101421', background: '#9EF0CF', borderRadius: '999px', padding: '10px 14px', fontWeight: 900, textDecoration: 'none', display: 'inline-block' }}>Sign in again</Link>
        </div>
      </main>
    );
  }

  if (!account || !token) {
    return <main style={{ minHeight: '100vh', background: '#090b12', color: '#F5F7FB', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Inter,ui-sans-serif,system-ui,Segoe UI,Arial' }}>Opening Eva with your Aridon owner access…</main>;
  }

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%,#2a1a22 0,#090b12 42%,#05060a 100%)', color: '#F5F7FB', padding: '24px', fontFamily: 'Inter,ui-sans-serif,system-ui,Segoe UI,Arial' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src={EVA_AVATAR} alt="Eva" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #D45A2A', boxShadow: '0 0 30px rgba(212,90,42,.35)' }} />
            <div>
              <div style={{ fontSize: '13px', letterSpacing: '.14em', color: '#F0A27A', fontWeight: 900 }}>EVA · {account.tenant.business_name.toUpperCase()}</div>
              <h1 style={{ margin: '2px 0 4px', fontSize: '34px' }}>Command Advisor Chat</h1>
              <div style={{ color: '#9BA8C6' }}>Authenticated to your private Aridon workspace</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
            <Link href="/customer/start" style={{ color: '#101421', background: '#9EF0CF', borderRadius: '999px', padding: '10px 14px', fontWeight: 900, textDecoration: 'none' }}>Main Room</Link>
            <Link href={`/workspace/${account.tenant.slug}`} style={{ color: '#F5F7FB', border: '1px solid #39415B', borderRadius: '999px', padding: '10px 14px', fontWeight: 800, textDecoration: 'none' }}>Company Home</Link>
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
