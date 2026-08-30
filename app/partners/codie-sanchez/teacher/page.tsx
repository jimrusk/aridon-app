'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useRef, useState } from 'react';
import { codieModules } from '../../../../lib/codieCurriculum';

type Message = { role: 'user' | 'assistant'; content: string };
type Source = { title: string; url: string };
const card: React.CSSProperties = { background: '#0D1728', border: '1px solid #2B3D5B', borderRadius: 18, padding: 18 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#07101D', color: '#F8FAFC', border: '1px solid #3B4D6C', borderRadius: 11, padding: '12px 13px', fontSize: 15, outline: 0 };

export default function CodieTeachingStudio() {
  const [moduleId, setModuleId] = useState(codieModules[0].id);
  const [question, setQuestion] = useState('Teach me this lesson and then give me a practical exercise.');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const module = useMemo(() => codieModules.find((item) => item.id === moduleId) || codieModules[0], [moduleId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || busy) return;
    setBusy(true); setError('');
    const next: Message[] = [...messages, { role: 'user', content: prompt }];
    setMessages(next); setQuestion('');
    try {
      const response = await fetch('/api/partners/codie-sanchez/teacher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId, messages: next }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'The lesson could not be generated.');
      setMessages([...next, { role: 'assistant', content: payload.reply }]);
      setSources(payload.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The lesson could not be generated.');
    } finally { setBusy(false); }
  }

  async function speak(text: string) {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setSpeaking(true);
      const response = await fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ executive: 'Contrarian Curriculum Tutor', text: text.slice(0, 3800) }) });
      if (!response.ok) throw new Error('Synthetic teaching voice is unavailable.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (err) { setSpeaking(false); setError(err instanceof Error ? err.message : 'Voice playback failed.'); }
  }

  function changeModule(id: string) { setModuleId(id); setMessages([]); setSources([]); setQuestion('Teach me this lesson and then give me a practical exercise.'); }
  const latestTutor = [...messages].reverse().find((message) => message.role === 'assistant');

  return <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: '24px 18px 70px' }}><div style={{ maxWidth: 1220, margin: '0 auto' }}>
    <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><Link href="/partners/codie-sanchez" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950 }}>← CODIE PARTNER DEMO</Link><div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}><Link href="/acquisitions" style={outline}>Open Buyer Room</Link><Link href="/business-os/growth-command" style={outline}>Growth Command</Link></div></nav>

    <header style={{ padding: '48px 0 22px', maxWidth: 950 }}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON · AI TEACHING STUDIO</div><h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '12px 0 16px' }}>Teach the framework. Apply it to the learner’s real deal.</h1><p style={{ color: '#B9C5D6', lineHeight: 1.65, fontSize: 18 }}>This prototype tutor uses summaries of public Contrarian Thinking, Codie Sanchez, newsletter and YouTube materials. It is not Codie Sanchez and it does not clone her voice. It uses a generic synthetic demo voice. With explicit partner authorization, the visual/voice layer can be replaced with approved assets without changing the curriculum engine underneath.</p></header>

    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,.72fr) minmax(0,1.28fr)', gap: 15, alignItems: 'start' }} className="teacher-grid">
      <aside style={{ display: 'grid', gap: 12 }}>
        <section style={{ ...card, background: 'linear-gradient(160deg,#162237,#0B1524)' }}><div style={{ width: 118, height: 118, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 14px', border: '1px solid #536886', background: '#111D2F', fontSize: 38, fontWeight: 950 }}>AI</div><div style={{ textAlign: 'center' }}><strong style={{ fontSize: 21 }}>Contrarian Curriculum Tutor</strong><div style={{ color: '#9EF0CF', fontSize: 12, marginTop: 5 }}>Source-grounded demo · synthetic voice</div></div>{latestTutor ? <button onClick={() => speak(latestTutor.content)} disabled={speaking} style={{ marginTop: 14, width: '100%', border: 0, borderRadius: 10, padding: '11px 12px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, cursor: 'pointer' }}>{speaking ? 'Speaking…' : '▶ Read Latest Lesson Aloud'}</button> : null}</section>
        <section style={card}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>CURRICULUM</div><div style={{ display: 'grid', gap: 7, marginTop: 10 }}>{codieModules.map((item, index) => <button key={item.id} onClick={() => changeModule(item.id)} style={{ textAlign: 'left', border: item.id === moduleId ? '1px solid #9EF0CF' : '1px solid #2F4260', borderRadius: 11, padding: '10px 11px', background: item.id === moduleId ? '#122B26' : '#091321', color: '#F8FAFC', cursor: 'pointer' }}><strong>{index + 1}. {item.title}</strong><div style={{ color: '#94A4BA', fontSize: 11, marginTop: 4 }}>{item.promise}</div></button>)}</div></section>
      </aside>

      <section style={{ display: 'grid', gap: 12 }}>
        <article style={{ ...card, background: '#102033' }}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>CURRENT LESSON</div><h2 style={{ margin: '7px 0 8px', fontSize: 28 }}>{module.title}</h2><p style={{ color: '#C3CFDE', lineHeight: 1.6 }}>{module.promise}</p><div style={{ display: 'grid', gap: 8 }}>{module.lessons.map((lesson) => <div key={lesson} style={{ borderTop: '1px solid #2B405F', paddingTop: 8, color: '#DCE5F0', lineHeight: 1.5 }}>✓ {lesson}</div>)}</div><div style={{ marginTop: 13, color: '#9EF0CF', lineHeight: 1.5 }}><strong>Aridon extension:</strong> {module.aridonExtension}</div></article>

        <section style={{ ...card, minHeight: 360 }}><div style={{ color: '#C5B8FF', fontSize: 11, fontWeight: 950 }}>TEACHING CONVERSATION</div>{messages.length === 0 ? <div style={{ color: '#8FA0B8', lineHeight: 1.6, padding: '34px 0' }}>Start with the lesson, ask for a quiz, or paste a hypothetical acquisition and ask the tutor to apply the framework.</div> : <div style={{ display: 'grid', gap: 10, marginTop: 13 }}>{messages.map((message, index) => <div key={index} style={{ justifySelf: message.role === 'user' ? 'end' : 'stretch', maxWidth: message.role === 'user' ? '84%' : '100%', background: message.role === 'user' ? '#173149' : '#0A1423', border: '1px solid #2D405F', borderRadius: 13, padding: 13, color: '#E9EFF7', whiteSpace: 'pre-wrap', lineHeight: 1.58 }}><div style={{ color: message.role === 'user' ? '#B9CFFF' : '#9EF0CF', fontSize: 10, fontWeight: 950, marginBottom: 5 }}>{message.role === 'user' ? 'LEARNER' : 'ARIDON TUTOR'}</div>{message.content}</div>)}</div>}</section>

        <form onSubmit={submit} style={{ ...card, display: 'grid', gap: 9 }}><textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} placeholder="Ask the tutor to explain a concept, quiz you, or apply it to a business..." style={{ ...input, resize: 'vertical' }} /><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button disabled={busy} style={{ border: 0, borderRadius: 10, padding: '11px 14px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Teaching…' : 'Ask Tutor'}</button><button type="button" onClick={() => setQuestion('Quiz me on this module with 5 practical questions. Do not give me the answers until I respond.')} style={secondary}>Build Quiz</button><button type="button" onClick={() => setQuestion('I found a business I may want to buy. Show me exactly what information I should collect before deciding whether to move it into full underwriting.')} style={secondary}>Apply to a Deal</button></div>{error ? <div style={{ color: '#FFB5C0' }}>{error}</div> : null}</form>

        {sources.length ? <section style={card}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>SOURCE BASIS FOR THIS MODULE</div><div style={{ display: 'grid', gap: 7, marginTop: 10 }}>{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={{ color: '#C7D6EA' }}>{source.title}</a>)}</div></section> : null}
      </section>
    </div>
    <p style={{ color: '#7F8EA5', fontSize: 12, lineHeight: 1.6, marginTop: 18 }}>The tutor is educational decision support. It is not Codie Sanchez, and it does not provide legal, tax, accounting, investment or lender approval. Real acquisitions should be independently verified.</p>
    <style>{`@media(max-width:860px){.teacher-grid{grid-template-columns:1fr !important}}`}</style>
  </div></main>;
}

const outline: React.CSSProperties = { border: '1px solid #52627A', color: '#EDF3FA', textDecoration: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 900 };
const secondary: React.CSSProperties = { border: '1px solid #425574', borderRadius: 10, padding: '10px 12px', background: '#13223A', color: '#F8FAFC', fontWeight: 900, cursor: 'pointer' };
