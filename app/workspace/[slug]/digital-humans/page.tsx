'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Payload = {
  businessName: string;
  status: { configured: boolean; provider: string; mode: string; agentId: string | null; clientKey: string | null; apiKeyConfigured: boolean };
  useCases: Array<{ id: string; name: string; description: string }>;
};

export default function DigitalHumansPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data: sessionData }) => {
      const token = sessionData.session?.access_token || '';
      if (!token) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/digital-humans`)}`); return; }
      try {
        const response = await fetch(`/api/customer/did?slug=${encodeURIComponent(params.slug)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load D-ID workspace.');
        setData(payload);
      } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load D-ID workspace.'); }
    });
  }, [params.slug, router]);

  if (!data) return <main style={page}><div style={shell}><h1 style={h1}>Digital Humans</h1><p style={lead}>{error || 'Loading D-ID integration…'}</p></div></main>;

  const ready = data.status.configured;

  return <main style={page}><div style={shell}>
    <header style={header}>
      <div><div style={eyebrow}>ARIDON · D-ID INTEGRATION</div><h1 style={h1}>Digital Humans</h1><p style={lead}>Turn Aridon executives and customer agents into real-time visual agents that can speak, listen, use company knowledge, and hand approved actions back into the Executive OS.</p></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href={`/workspace/${params.slug}/technology-radar`} style={outline}>Atlas Radar</Link><Link href={`/workspace/${params.slug}/executive-suite`} style={mint}>Executive Suite</Link></div>
    </header>

    <section style={heroGrid}>
      <article style={darkPanel}><div style={sectionLabel}>PROVIDER STATUS</div><h2 style={h2}>{ready ? 'D-ID is ready to stream' : 'D-ID integration is staged'}</h2><p style={body}>{ready ? 'Agent ID and client key are configured. The next step is binding individual executive identities to D-ID agents.' : 'The Aridon side is built. D-ID account credentials are the remaining gate before live avatar sessions can start.'}</p><div style={statusRow}><span style={{ ...badge, background: ready ? '#9EF0CF' : '#F5D77A' }}>{ready ? 'LIVE CONFIG' : 'CREDENTIALS NEEDED'}</span><span>Agents SDK</span><span>Real-time WebRTC</span></div></article>
      <article style={lightPanel}><div style={sectionLabel}>FIRST DEPLOYMENT</div><h2 style={h2}>Eva as the visual command advisor</h2><p style={bodyDark}>Eva should be the first D-ID agent. Her visual presence belongs in the CEO Brief, Boardroom, customer onboarding, and live command conversations. Once that path is stable, the same provider layer can power the other executives.</p></article>
    </section>

    <section style={{ ...lightPanel, marginTop: 14 }}><div style={sectionLabel}>WHAT WE WILL USE D-ID FOR</div><div style={cards}>{data.useCases.map((item) => <article key={item.id} style={card}><h3 style={{ margin: 0, fontSize: 20 }}>{item.name}</h3><p style={muted}>{item.description}</p></article>)}</div></section>

    <section style={heroGrid}>
      <article style={lightPanel}><div style={sectionLabel}>ACTION MODEL</div><h2 style={h2}>Avatar outside. Aridon brain inside.</h2><p style={bodyDark}>D-ID handles the real-time digital human layer. Aridon remains the system of record for identity, Company Brain, executive memory, approvals, actions, observability, and outcomes. That keeps us from locking the business brain inside a presentation vendor.</p></article>
      <article style={darkPanel}><div style={sectionLabel}>GUARDRAILS</div><h2 style={h2}>Human authority stays intact</h2><p style={body}>The avatar can converse, research, explain, qualify, and prepare actions. External messages, spending, legal commitments, destructive changes, and consequential claims remain behind Aridon's approval gates.</p></article>
    </section>

    <section style={{ ...lightPanel, marginTop: 14 }}><div style={sectionLabel}>CONNECTION CHECKLIST</div><div style={checklist}>
      <div style={check}><strong>Aridon provider layer</strong><span>Built</span></div>
      <div style={check}><strong>D-ID Agents API/SDK path</strong><span>Built to current Agents architecture</span></div>
      <div style={check}><strong>D-ID Studio account + API key</strong><span>{data.status.apiKeyConfigured ? 'Configured' : 'Needed'}</span></div>
      <div style={check}><strong>D-ID Agent ID + client key</strong><span>{ready ? 'Configured' : 'Needed'}</span></div>
      <div style={check}><strong>Allowed production domain</strong><span>{ready ? 'Verify in D-ID Studio' : 'Configure after credentials'}</span></div>
    </div></section>
  </div></main>;
}

const page = { minHeight: '100vh', background: '#07101D', color: '#F7FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 20px 72px' };
const shell = { maxWidth: 1200, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 22 };
const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(44px,7vw,76px)', lineHeight: .96, letterSpacing: -3, margin: '10px 0 14px' };
const h2 = { fontSize: 28, margin: '8px 0 14px' };
const lead = { color: '#B9C5D6', fontSize: 18, lineHeight: 1.6, maxWidth: 850, margin: 0 };
const heroGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14, marginTop: 14 };
const darkPanel = { background: '#101C2D', border: '1px solid #26364D', borderRadius: 18, padding: 20 };
const lightPanel = { background: '#F6F3EB', color: '#171717', border: '1px solid #D7D0C3', borderRadius: 18, padding: 20 };
const sectionLabel = { fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const body = { color: '#C3CCDA', lineHeight: 1.7, fontSize: 17 };
const bodyDark = { color: '#38342E', lineHeight: 1.7, fontSize: 17 };
const statusRow = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center', color: '#B9C5D6', fontSize: 12 };
const badge = { color: '#0B1612', borderRadius: 999, padding: '7px 10px', fontWeight: 950 };
const cards = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginTop: 14 };
const card = { background: '#fff', border: '1px solid #D9D1C4', borderRadius: 13, padding: 14 };
const muted = { color: '#69635B', lineHeight: 1.6 };
const checklist = { display: 'grid', gap: 8, marginTop: 12 };
const check = { display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid #D9D1C4' };
const mint = { background: '#9EF0CF', color: '#07130F', padding: '12px 16px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const outline = { border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
