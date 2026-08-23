'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Provider = {
  provider: string;
  label: string;
  model: string;
  enabled: boolean;
  specialty: string;
};

type Route = { task: string; preferred: string; fallback: string };

type RouterStatus = {
  mode: string;
  providers: Provider[];
  routes: Route[];
};

const architecture = [
  ['1', 'Input & validation', 'Normalize requests, reject malformed input and apply size/permission limits before any model sees the work.'],
  ['2', 'Task classifier', 'Detect research, social intelligence, coding, multilingual, long-context, creative, private-local or general executive work.'],
  ['3', 'Best-model router', 'Send the job to the strongest configured provider for that task and fall back automatically if it fails.'],
  ['4', 'Company Brain & memory', 'Pull tenant context, company knowledge, uploaded files, executive memory and semantic retrieval into the task.'],
  ['5', 'Supervisor loop', 'Plan, delegate, inspect specialist output, retry weak work and stop when the definition of done is met.'],
  ['6', 'Approval-gated execution', 'Only approved tools can act. Consequential actions remain behind human approval gates.'],
  ['7', 'Observability', 'Track provider attempts, latency, fallbacks, usage events, audit records and final outcomes.'],
  ['8', 'Safe output', 'Return the answer, file, deck, report or queued action with the routing and approval state preserved.'],
];

export default function ModelRouterPage() {
  const [status, setStatus] = useState<RouterStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/model-router/status', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Status request failed (${response.status})`);
        return response.json();
      })
      .then(setStatus)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load router status.'));
  }, []);

  const enabled = status?.providers.filter((provider) => provider.enabled).length || 0;

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 20px 74px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/presentation-studio" style={{ color: '#DCE4EF', textDecoration: 'none', fontWeight: 850 }}>Presentation Studio</Link>
            <Link href="/facebook-launch" style={{ color: '#DCE4EF', textDecoration: 'none', fontWeight: 850 }}>Facebook Launch</Link>
            <Link href="/execution" style={{ color: '#DCE4EF', textDecoration: 'none', fontWeight: 850 }}>Execution Engine</Link>
          </div>
        </nav>

        <div style={{ paddingTop: 66 }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12, letterSpacing: 1.2 }}>ARIDON MODEL ROUTER</div>
          <h1 style={{ fontSize: 'clamp(48px,7vw,82px)', letterSpacing: -3.4, lineHeight: 0.95, margin: '14px 0 18px', maxWidth: 900 }}>
            One Aridon. The best available AI for each job.
          </h1>
          <p style={{ color: '#B8C4D5', fontSize: 20, lineHeight: 1.65, maxWidth: 840 }}>
            The user should not have to decide whether a task belongs in ChatGPT, Claude, Gemini, Grok, DeepSeek or a local model. Aridon classifies the work, routes it, preserves company context and falls back automatically.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '.78fr 1.22fr', gap: 18, marginTop: 30 }} className="routerGrid">
          <aside style={{ background: '#102033', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
            <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>ROUTER STATUS</div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <strong style={{ fontSize: 54 }}>{enabled}</strong>
              <span style={{ color: '#B8C4D5' }}>providers configured</span>
            </div>
            <div style={{ marginTop: 8, color: '#91A0B5', lineHeight: 1.5 }}>
              Mode: <strong style={{ color: '#fff' }}>{status?.mode || 'loading…'}</strong>
            </div>
            {error && <div style={{ marginTop: 14, color: '#FFD5A8' }}>{error}</div>}
          </aside>

          <section style={{ background: '#F4F1E9', color: '#171717', borderRadius: 20, padding: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 950 }}>PROVIDER POOL</div>
            <h2 style={{ fontSize: 34, margin: '8px 0 16px' }}>Use the specialists that are actually connected.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }} className="routerGrid">
              {(status?.providers || []).map((provider) => (
                <article key={provider.provider} style={{ background: '#fff', border: '1px solid #D5CEC2', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <strong>{provider.label}</strong>
                    <span style={{ fontSize: 11, fontWeight: 950, borderRadius: 999, padding: '5px 8px', background: provider.enabled ? '#DDF8EC' : '#EEEAE1' }}>
                      {provider.enabled ? 'CONNECTED' : 'NOT CONFIGURED'}
                    </span>
                  </div>
                  <div style={{ color: '#6B665E', fontSize: 12, marginTop: 8 }}>{provider.model}</div>
                  <p style={{ color: '#5D5A54', lineHeight: 1.5, marginBottom: 0 }}>{provider.specialty}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section style={{ marginTop: 18, background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>ROUTING TABLE</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 16px' }}>What Aridon does with each kind of work.</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
              <thead><tr><th style={th}>Task</th><th style={th}>First choice</th><th style={th}>Fallback</th></tr></thead>
              <tbody>{(status?.routes || []).map((route) => (
                <tr key={route.task}><td style={td}><strong>{route.task}</strong></td><td style={td}>{route.preferred}</td><td style={td}>{route.fallback}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        <section style={{ marginTop: 18, background: '#F4F1E9', color: '#171717', borderRadius: 20, padding: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 950 }}>FULL AGENT OPERATING LOOP</div>
          <h2 style={{ fontSize: 36, margin: '8px 0 18px' }}>The architecture behind the button.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="routerGrid">
            {architecture.map(([number, title, description]) => (
              <article key={number} style={{ background: '#fff', border: '1px solid #D5CEC2', borderRadius: 16, padding: 16, display: 'grid', gridTemplateColumns: '42px 1fr', gap: 10 }}>
                <strong style={{ color: '#0B8F69' }}>{number}</strong>
                <div><strong>{title}</strong><p style={{ color: '#5D5A54', lineHeight: 1.55, margin: '6px 0 0' }}>{description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 18, background: '#102033', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>PRIVACY / LOCAL MODE</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 12px' }}>Private jobs can stay on a local model.</h2>
          <p style={{ color: '#B8C4D5', lineHeight: 1.65, maxWidth: 860 }}>
            If an OpenAI-compatible local endpoint is configured, requests that explicitly ask to remain local or offline can be routed there first. That supports Ollama, LM Studio, vLLM and similar local deployments without changing the Aridon interface.
          </p>
        </section>
      </section>
      <style>{`@media(max-width:820px){.routerGrid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

const th = { textAlign: 'left' as const, padding: '12px 10px', color: '#9EF0CF', fontSize: 12, borderBottom: '1px solid #2A3A57' };
const td = { padding: '13px 10px', color: '#DCE4EF', borderBottom: '1px solid #22324A', lineHeight: 1.5 };
