'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EVA_AVATAR } from '../../lib/evaIdentity';
import { getBrowserClient } from '../../lib/supabase';

type Message = { role: 'user' | 'assistant'; content: string };
type Account = { tenant: { slug: string; business_name: string } };
type Worker = { id: string; name?: string; status?: string; result?: any; error?: string };

const EVA_POLICY = `You are working in the background for Eva while Eva remains in the live customer conversation. Complete the objective as far as the connected Aridon system permits. Use company context and prior information before asking for anything. Make reasonable reversible decisions yourself. Research missing public facts. Do not invent completed external actions. Return a concise decision-ready result, completed work, and only genuine blockers or approvals.`;

function workerText(worker: Worker) {
  const result = worker?.result || {};
  if (typeof result === 'string') return result;
  return result.answer || result.final_output || result.summary || result.workSummary || result.output || result.text || (worker.error ? `Background work stopped: ${worker.error}` : 'Background work completed.');
}

export default function EvaChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'I am here. Tell me what you need. I will stay with you while my team handles longer work in the background.' }]);
  const [input, setInput] = useState('');
  const [token, setToken] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [accessError, setAccessError] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [activeWorkers, setActiveWorkers] = useState<Record<string, string>>({});
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/eva-chat'); return; }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) { setAccessError(result.error || 'Your Aridon workspace could not be opened.'); return; }
      setToken(accessToken); setAccount(result as Account);
      try {
        const h = await fetch(`/api/customer/assistant?slug=${encodeURIComponent(result.tenant.slug)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
        const d = await h.json().catch(() => ({}));
        if (h.ok && Array.isArray(d.history) && d.history.length) {
          const restored = d.history.slice(-24).map((x: any) => ({ role: x.role === 'assistant' ? 'assistant' as const : 'user' as const, content: typeof x.content === 'string' ? x.content : '' })).filter((x: Message) => x.content.trim());
          if (restored.length) setMessages(restored);
        }
      } catch { /* live conversation still works */ }
    });
  }, [router]);

  async function pollWorker(workerId: string, label: string) {
    if (!account || !token) return;
    for (let i = 0; i < 150; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const r = await fetch(`/api/customer/cloud-workers?slug=${encodeURIComponent(account.tenant.slug)}&workerId=${encodeURIComponent(workerId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const d = await r.json().catch(() => ({}));
        const worker = Array.isArray(d.workers) ? d.workers[0] as Worker : null;
        if (!worker) continue;
        if (worker.status === 'completed') {
          setActiveWorkers((current) => { const next = { ...current }; delete next[workerId]; return next; });
          setMessages((current) => [...current, { role: 'assistant', content: `My background team finished ${label}.\n\n${workerText(worker)}` }]);
          return;
        }
        if (worker.status === 'failed' || worker.status === 'cancelled') {
          setActiveWorkers((current) => { const next = { ...current }; delete next[workerId]; return next; });
          setMessages((current) => [...current, { role: 'assistant', content: worker.error ? `The background job hit a real blocker: ${worker.error}` : 'That background job stopped before completion. I can keep working on the rest.' }]);
          return;
        }
      } catch { /* keep polling; worker persists server-side */ }
    }
  }

  async function handOff(text: string, conversation: Message[]) {
    if (!account || !token) return;
    const recent = conversation.slice(-18).map((m) => `${m.role === 'user' ? 'CUSTOMER' : 'EVA'}: ${m.content}`).join('\n\n');
    const objective = `${EVA_POLICY}\n\nACTIVE CONVERSATION\n${recent}\n\nCURRENT REQUEST\n${text}`;
    const response = await fetch('/api/customer/cloud-workers', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slug: account.tenant.slug, command: 'create', name: `Eva background · ${text.slice(0, 72)}`, objective, mode: 'research', priority: 'high', maxCycles: 6, runNow: false }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.worker?.id) throw new Error(data.error || 'Background handoff could not be queued.');
    const workerId = data.worker.id as string;
    setActiveWorkers((current) => ({ ...current, [workerId]: text.slice(0, 72) }));
    void fetch('/api/customer/cloud-workers', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slug: account.tenant.slug, command: 'run_now', id: workerId }),
    }).catch(() => undefined);
    void pollWorker(workerId, `the work on “${text.slice(0, 60)}${text.length > 60 ? '…' : ''}”`);
  }

  async function send() {
    const text = input.trim();
    if (!text || !token || !account) return;
    const next = [...messagesRef.current, { role: 'user' as const, content: text }];
    setMessages(next); setInput('');

    const substantial = /\b(research|find|search|build|create|design|compare|analy[sz]e|contact|send|email|schedule|plan|investigate|check|follow up|execute|do it|handle|run|prepare|develop|fix|update)\b/i.test(text) || text.length > 180;
    if (substantial) {
      setMessages((current) => [...current, { role: 'assistant', content: 'I have it. I’m handing the longer work to my background team now, and I’m staying here with you. What else do you want to cover while they work?' }]);
      try { await handOff(text, next); }
      catch (error) { setMessages((current) => [...current, { role: 'assistant', content: error instanceof Error ? `I stayed with the conversation, but the background handoff hit this blocker: ${error.message}` : 'The background handoff hit a blocker.' }]); }
      return;
    }

    setChatBusy(true);
    try {
      const response = await fetch('/api/customer/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug: account.tenant.slug, executive: 'Eva', researchWeb: false, messages: next.slice(-20) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Eva could not answer.');
      setMessages((current) => [...current, { role: 'assistant', content: data.reply || 'I am here.' }]);
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', content: error instanceof Error ? error.message : 'Eva could not answer.' }]);
    } finally { setChatBusy(false); }
  }

  if (accessError) return <main style={{ minHeight: '100vh', background: '#090b12', color: '#fff', display: 'grid', placeItems: 'center', padding: 24 }}><div><h1>Eva could not open your workspace.</h1><p>{accessError}</p></div></main>;
  if (!account || !token) return <main style={{ minHeight: '100vh', background: '#090b12', color: '#fff', display: 'grid', placeItems: 'center' }}>Opening Eva…</main>;

  const workerCount = Object.keys(activeWorkers).length;
  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%,#2a1a22 0,#090b12 42%,#05060a 100%)', color: '#F5F7FB', padding: 24, fontFamily: 'Inter,ui-sans-serif,system-ui,Segoe UI,Arial' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><img src={EVA_AVATAR} alt="Eva" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '3px solid #D45A2A' }} /><div><div style={{ color: '#F0A27A', fontWeight: 900 }}>EVA · {account.tenant.business_name.toUpperCase()}</div><h1 style={{ margin: '3px 0' }}>Live Command</h1><div style={{ color: '#9BA8C6' }}>Talk now · background delegation · persistent workers</div></div></div>
          <div style={{ display: 'flex', gap: 8 }}><Link href={`/workspace/${account.tenant.slug}/mission-control`} style={{ color: '#fff' }}>Mission Control</Link><Link href={`/workspace/${account.tenant.slug}/action-center`} style={{ color: '#9EF0CF' }}>Action Center</Link></div>
        </header>
        <div style={{ marginBottom: 12, padding: '10px 14px', border: '1px solid #26314F', borderRadius: 14, background: 'rgba(18,24,41,.8)', color: workerCount ? '#9EF0CF' : '#9BA8C6' }}>{workerCount ? `${workerCount} background ${workerCount === 1 ? 'job is' : 'jobs are'} working. Eva remains available.` : 'Eva is ready. Longer work is automatically handed off instead of blocking the conversation.'}</div>
        <section style={{ border: '1px solid #26314F', borderRadius: 22, background: 'rgba(15,19,33,.95)', padding: 18 }}>
          <div style={{ minHeight: 440, maxHeight: '62vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%', display: 'flex', gap: 9 }}>
              {m.role === 'assistant' && <img src={EVA_AVATAR} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, background: m.role === 'user' ? '#233454' : '#181F33', border: '1px solid #26314F', borderRadius: 16, padding: '12px 14px' }}>{m.content}</div>
            </div>)}
            {chatBusy && <div style={{ color: '#9BA8C6', paddingLeft: 43 }}>Eva is answering…</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Talk to Eva. Longer work will be handed off automatically." style={{ flex: 1, minHeight: 82, background: '#0B1020', color: '#fff', border: '1px solid #26314F', borderRadius: 14, padding: 12 }} /><button onClick={() => void send()} disabled={!input.trim()} style={{ minWidth: 105, border: 0, borderRadius: 14, background: '#D45A2A', color: '#fff', fontWeight: 900, opacity: input.trim() ? 1 : .5 }}>Send</button></div>
        </section>
      </div>
    </main>
  );
}
