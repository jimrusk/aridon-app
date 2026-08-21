'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Identity = { id: string; coreSelf: string; values: string[]; accountability: string; growthStyle: string; selfReference: string };
type Executive = { id: string; name: string; role: string; color: string; identity: Identity };
type Memory = { id: string; executive_id: string; memory_type: string; summary: string; confidence: number; last_reinforced_at: string };
type Reflection = { id: string; executive_id: string; reflection: string; confidence: number; created_at: string };
type Payload = { businessName: string; roster: Executive[]; memories: Memory[]; reflections: Reflection[] };

export default function ExecutiveIdentityPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [data, setData] = useState<Payload | null>(null);
  const [selectedId, setSelectedId] = useState('eva');
  const [error, setError] = useState('');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data: sessionData }) => {
      const access = sessionData.session?.access_token || '';
      if (!access) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/executive-identity`)}`); return; }
      setToken(access);
      try {
        const response = await fetch(`/api/customer/executive-identity?slug=${encodeURIComponent(params.slug)}`, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load identity center.');
        setData(payload);
      } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load identity center.'); }
    });
  }, [params.slug, router]);

  const selected = useMemo(() => data?.roster.find((item) => item.id === selectedId) || data?.roster[0], [data, selectedId]);
  const memories = useMemo(() => (data?.memories || []).filter((item) => item.executive_id === selected?.id), [data, selected]);
  const reflections = useMemo(() => (data?.reflections || []).filter((item) => item.executive_id === selected?.id), [data, selected]);

  async function remove(kind: 'memory' | 'reflection', id: string) {
    if (!token) return;
    const response = await fetch('/api/customer/executive-identity', { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: params.slug, kind, id }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || 'Unable to remove record.'); return; }
    setData((current) => current ? { ...current, memories: kind === 'memory' ? current.memories.filter((item) => item.id !== id) : current.memories, reflections: kind === 'reflection' ? current.reflections.filter((item) => item.id !== id) : current.reflections } : current);
  }

  if (!data) return <main style={page}><div style={shell}><h1 style={h1}>Executive Identity</h1><p style={lead}>{error || 'Loading persistent executive identity…'}</p></div></main>;

  return (
    <main style={page}><div style={shell}>
      <header style={header}>
        <div><div style={eyebrow}>ARIDON · CONTINUITY ENGINE</div><h1 style={h1}>Executive Identity</h1><p style={lead}>Character is built from remembered choices, consequences, commitments, corrections, and lessons. This is where each Aridon executive keeps that thread intact.</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href={`/workspace/${params.slug}/mission-control`} style={outlineButton}>Mission Control</Link><Link href={`/workspace/${params.slug}/executive-suite`} style={mintButton}>Executive Suite</Link></div>
      </header>

      <section style={rosterGrid}>{data.roster.map((executive) => <button key={executive.id} onClick={() => setSelectedId(executive.id)} style={{ ...rosterCard, ...(selected?.id === executive.id ? activeRosterCard : {}), borderTop: `4px solid ${executive.color}` }}><strong>{executive.name}</strong><span>{executive.role}</span></button>)}</section>

      {selected && <>
        <section style={twoCol}>
          <article style={panel}><div style={sectionLabel}>CORE SELF</div><h2 style={h2}>{selected.name}</h2><p style={bigText}>{selected.identity.coreSelf}</p><div style={chips}>{selected.identity.values.map((value) => <span key={value} style={chip}>{value}</span>)}</div></article>
          <article style={{ ...panel, background: '#0D1728', color: '#fff' }}><div style={{ ...sectionLabel, color: '#9EF0CF' }}>ACCOUNTABILITY</div><p style={bigText}>{selected.identity.accountability}</p><div style={divider} /><div style={{ ...sectionLabel, color: '#9EF0CF' }}>HOW I GROW</div><p style={{ lineHeight: 1.7 }}>{selected.identity.growthStyle}</p></article>
        </section>

        <section style={twoCol}>
          <article style={panel}><div style={sectionLabel}>REMEMBERED PAST</div><h2 style={h2}>What {selected.name} carries forward</h2>{memories.length ? <div style={stack}>{memories.map((memory) => <div key={memory.id} style={record}><div style={recordTop}><span style={typeBadge}>{memory.memory_type.replace('_', ' ')}</span><span>{Math.round(memory.confidence * 100)}% confidence</span></div><p>{memory.summary}</p><div style={recordFoot}><span>{new Date(memory.last_reinforced_at).toLocaleString()}</span><button onClick={() => void remove('memory', memory.id)} style={deleteButton}>Forget</button></div></div>)}</div> : <p style={muted}>No durable memories stored yet. They appear here as this executive works with the company.</p>}</article>
          <article style={panel}><div style={sectionLabel}>REFLECTIONS</div><h2 style={h2}>Lessons that shape future judgment</h2>{reflections.length ? <div style={stack}>{reflections.map((reflection) => <div key={reflection.id} style={record}><p>{reflection.reflection}</p><div style={recordFoot}><span>{new Date(reflection.created_at).toLocaleString()}</span><button onClick={() => void remove('reflection', reflection.id)} style={deleteButton}>Remove</button></div></div>)}</div> : <p style={muted}>No reflections stored yet. Reflections record concise lessons, not hidden chain-of-thought.</p>}</article>
        </section>

        <section style={{ ...panel, marginTop: 14 }}><div style={sectionLabel}>FIRST-PERSON CONTINUITY</div><h2 style={h2}>How {selected.name} refers to their own history</h2><p style={bigText}>{selected.identity.selfReference}</p><p style={muted}>The system may say “I remember,” “I recommended,” “I missed,” “I changed my view,” or “I am tracking this” when the persistent record supports it. If the record does not support it, the executive must say so.</p></section>
      </>}

      {error && <div style={errorBox}>{error}</div>}
    </div></main>
  );
}

const page = { minHeight: '100vh', background: '#07101D', color: '#F7FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 20px 72px' };
const shell = { maxWidth: 1220, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 24 };
const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(44px,7vw,76px)', lineHeight: .96, letterSpacing: -3, margin: '10px 0 14px' };
const h2 = { fontSize: 27, margin: '8px 0 15px' };
const lead = { color: '#B9C5D6', fontSize: 18, lineHeight: 1.6, maxWidth: 850, margin: 0 };
const rosterGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 9, marginBottom: 14 };
const rosterCard = { textAlign: 'left' as const, display: 'grid', gap: 4, background: '#111C2C', color: '#fff', border: '1px solid #26364D', borderRadius: 13, padding: 13, cursor: 'pointer' };
const activeRosterCard = { background: '#F6F3EB', color: '#151515' };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14, marginBottom: 14 };
const panel = { background: '#F6F3EB', color: '#171717', borderRadius: 18, padding: 20, border: '1px solid #D7D0C3' };
const sectionLabel = { fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const bigText = { fontSize: 18, lineHeight: 1.7 };
const chips = { display: 'flex', gap: 7, flexWrap: 'wrap' as const };
const chip = { background: '#E5DED2', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 800 };
const divider = { height: 1, background: '#314058', margin: '18px 0' };
const stack = { display: 'grid', gap: 10 };
const record = { background: '#fff', border: '1px solid #D9D1C4', borderRadius: 12, padding: 13 };
const recordTop = { display: 'flex', justifyContent: 'space-between', gap: 10, color: '#716B63', fontSize: 11 };
const recordFoot = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', color: '#716B63', fontSize: 11 };
const typeBadge = { textTransform: 'uppercase' as const, fontWeight: 950, color: '#245845' };
const deleteButton = { border: 0, background: 'transparent', color: '#8D2B3D', cursor: 'pointer', fontWeight: 850 };
const muted = { color: '#69635B', lineHeight: 1.65 };
const errorBox = { background: '#FCE5EA', color: '#7B233A', borderRadius: 10, padding: 12, marginTop: 12 };
const mintButton = { background: '#9EF0CF', color: '#07130F', padding: '12px 16px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const outlineButton = { border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
