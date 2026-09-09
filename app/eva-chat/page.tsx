'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EVA_AVATAR } from '../../lib/evaIdentity';
import { getBrowserClient } from '../../lib/supabase';

type Message = { role: 'user' | 'assistant'; content: string };
type Account = { tenant: { slug: string; business_name: string } };
type EvaWorkResponse = {
  reply?: string;
  workSummary?: string;
  status?: string;
  queuedActions?: Array<{ id?: string; title?: string; adapter_key?: string; approval_required?: boolean; status?: string }>;
  autoExecuted?: Array<{ id?: string; title?: string; status?: string }>;
  approvalQueue?: Array<{ id?: string; title?: string; adapter_key?: string; status?: string }>;
  sources?: Array<{ title?: string; url?: string }>;
  error?: string;
};

export default function EvaChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I am here. Work Mode is on. Give me the outcome you want and I will take it as far as Aridon can actually execute it.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [accessError, setAccessError] = useState('');
  const [workMode, setWorkMode] = useState(true);
  const [lastStatus, setLastStatus] = useState('');

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

  function summarizeWork(data: EvaWorkResponse) {
    const lines: string[] = [];
    if (data.reply) lines.push(data.reply);
    if (data.workSummary && data.workSummary !== data.reply) lines.push(`\nWork completed:\n${data.workSummary}`);

    const auto = data.autoExecuted || [];
    if (auto.length) {
      lines.push(`\nDone automatically:\n${auto.map((item) => `• ${item.title || 'Internal task'}`).join('\n')}`);
    }

    const approvals = data.approvalQueue || [];
    if (approvals.length) {
      lines.push(`\nReady for your approval:\n${approvals.map((item) => `• ${item.title || 'External action'}`).join('\n')}`);
      lines.push('\nOpen Action Center to approve and execute those external actions.');
    }

    const sources = data.sources || [];
    if (sources.length) {
      lines.push(`\nSources:\n${sources.slice(0, 6).map((source) => `• ${source.title || source.url}${source.url ? ` — ${source.url}` : ''}`).join('\n')}`);
    }

    return lines.join('\n').trim() || 'Eva completed the work run.';
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || !token || !account) return;

    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setLastStatus('');

    try {
      if (workMode) {
        const response = await fetch('/api/customer/eva-work', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            slug: account.tenant.slug,
            objective: text,
          }),
        });
        const data = await response.json().catch(() => ({})) as EvaWorkResponse;
        if (!response.ok) throw new Error(data?.error || 'Eva Work could not complete the request.');
        setLastStatus(data.status || 'completed');
        setMessages([...next, { role: 'assistant', content: summarizeWork(data) }]);
      } else {
        const response = await fetch('/api/customer/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            slug: account.tenant.slug,
            executive: 'Eva',
            researchWeb: true,
            messages: next.slice(-20),
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || 'Eva chat could not complete the request.');
        setLastStatus('answered');
        setMessages([...next, { role: 'assistant', content: data.reply || 'I am here.' }]);
      }
    } catch (error) {
      setLastStatus('error');
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Eva could not complete the request.',
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
              <h1 style={{ margin: '2px 0 4px', fontSize: '34px' }}>Eva Command Workspace</h1>
              <div style={{ color: '#9BA8C6' }}>GPT‑5.6 · live research · persistent missions · Action Fabric</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
            <Link href={`/workspace/${account.tenant.slug}/action-center`} style={{ color: '#101421', background: '#9EF0CF', borderRadius: '999px', padding: '10px 14px', fontWeight: 900, textDecoration: 'none' }}>Action Center</Link>
            <Link href={`/workspace/${account.tenant.slug}/mission-control`} style={{ color: '#F5F7FB', border: '1px solid #39415B', borderRadius: '999px', padding: '10px 14px', fontWeight: 800, textDecoration: 'none' }}>Mission Control</Link>
            <Link href={`/workspace/${account.tenant.slug}`} style={{ color: '#F5F7FB', border: '1px solid #39415B', borderRadius: '999px', padding: '10px 14px', fontWeight: 800, textDecoration: 'none' }}>Company Home</Link>
          </div>
        </header>

        <section style={{ marginBottom: '12px', background: 'rgba(18,24,41,.78)', border: '1px solid #26314F', borderRadius: '16px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 900 }}>{workMode ? 'Work Mode' : 'Chat Mode'}</div>
            <div style={{ color: '#9BA8C6', fontSize: '13px', marginTop: '3px' }}>
              {workMode
                ? 'Eva researches, creates persistent work, executes safe internal tasks, and queues external actions for approval.'
                : 'Eva answers conversationally with live web research enabled.'}
            </div>
          </div>
          <button
            onClick={() => setWorkMode((value) => !value)}
            disabled={busy}
            style={{ border: 0, borderRadius: '999px', padding: '10px 16px', background: workMode ? '#D45A2A' : '#233454', color: '#fff', fontWeight: 900, cursor: busy ? 'wait' : 'pointer' }}
          >
            {workMode ? 'Switch to Chat' : 'Switch to Work'}
          </button>
        </section>

        <section style={{ background: 'linear-gradient(180deg,rgba(24,32,54,.94),rgba(15,19,33,.94))', border: '1px solid #26314F', borderRadius: '22px', padding: '18px', boxShadow: '0 18px 60px rgba(0,0,0,.28)' }}>
          <div style={{ minHeight: '440px', maxHeight: '62vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '6px' }}>
            {messages.map((message, index) => (
              <div key={index} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%', display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
                {message.role === 'assistant' && <img src={EVA_AVATAR} alt="" aria-hidden="true" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #D45A2A', flexShrink: 0 }} />}
                <div style={{ background: message.role === 'user' ? '#233454' : '#181F33', border: message.role === 'assistant' ? '1px solid #26314F' : 'none', padding: '13px 15px', borderRadius: '16px', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.content}</div>
              </div>
            ))}
            {busy && <div style={{ color: '#9BA8C6', paddingLeft: '44px' }}>{workMode ? 'Eva is working the mission…' : 'Eva is researching and thinking…'}</div>}
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
              placeholder={workMode ? 'Tell Eva what outcome you want. Example: Research this company, build the approach, and prepare the next actions.' : 'Ask Eva anything…'}
              style={{ flex: 1, minHeight: '88px', resize: 'vertical', background: '#0B1020', color: '#fff', border: '1px solid #26314F', borderRadius: '14px', padding: '12px' }}
            />
            <button onClick={send} disabled={busy || !input.trim()} style={{ minWidth: '110px', border: 0, borderRadius: '14px', background: '#D45A2A', color: '#fff', fontWeight: 900, cursor: busy ? 'wait' : 'pointer', opacity: busy || !input.trim() ? .55 : 1 }}>{workMode ? 'Work' : 'Send'}</button>
          </div>
          {lastStatus && <div style={{ marginTop: '9px', color: lastStatus === 'error' ? '#FF9B9B' : '#8FA2C7', fontSize: '12px' }}>Last run: {lastStatus.replaceAll('_', ' ')}</div>}
        </section>
      </div>
    </main>
  );
}
