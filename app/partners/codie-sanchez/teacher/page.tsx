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
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const module = useMemo(() => codieModules.find((item) => item.id === moduleId) || codieModules[0], [moduleId]);
  const latestTutor = [...messages].reverse().find((message) => message.role === 'assistant');
  const teacherState = listening ? 'Listening' : speaking ? 'Speaking' : busy ? 'Thinking' : 'Ready';

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
      setBusy(false);
      if (autoSpeak) await speak(payload.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The lesson could not be generated.');
      setBusy(false);
    }
  }

  async function speak(text: string) {
    try {
      stopSpeaking();
      setSpeaking(true);
      const response = await fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ executive: 'Contrarian Curriculum Tutor', text: text.slice(0, 3800) }) });
      if (!response.ok) throw new Error('Synthetic teaching voice is unavailable.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); audioRef.current = null; URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(false); audioRef.current = null; URL.revokeObjectURL(url); };
      await audio.play();
    } catch (err) { setSpeaking(false); setError(err instanceof Error ? err.message : 'Voice playback failed.'); }
  }

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeaking(false);
  }

  function startListening() {
    setError('');
    if (typeof window === 'undefined') return;
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice questions are not supported by this browser yet. You can still type your question.');
      return;
    }
    stopSpeaking();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setListening(true);
    let finalText = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = String(event.results[i][0]?.transcript || '');
        if (event.results[i].isFinal) finalText += `${text} `;
        else interim += text;
      }
      setQuestion((finalText + interim).trim());
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      if (event?.error !== 'no-speech' && event?.error !== 'aborted') setError('I could not hear that clearly. Try again or type the question.');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function changeModule(id: string) { stopSpeaking(); setModuleId(id); setMessages([]); setSources([]); setQuestion('Teach me this lesson and then give me a practical exercise.'); }

  return <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: '24px 18px 70px' }}><div style={{ maxWidth: 1220, margin: '0 auto' }}>
    <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><Link href="/partners/codie-sanchez" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950 }}>← CODIE PARTNER DEMO</Link><div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}><Link href="/acquisitions" style={outline}>Open Buyer Room</Link><Link href="/business-os/growth-command" style={outline}>Growth Command</Link></div></nav>

    <header style={{ padding: '48px 0 22px', maxWidth: 950 }}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON · LIVE AI TEACHING STUDIO</div><h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '12px 0 16px' }}>Ask a question. Hear the answer. Apply it to a real deal.</h1><p style={{ color: '#B9C5D6', lineHeight: 1.65, fontSize: 18 }}>The teacher can answer follow-up questions, teach the source-grounded curriculum, quiz the learner, take spoken questions and read its answers aloud. The animated teacher below is a generic Aridon demo persona, not Codie Sanchez. If Codie authorizes her likeness and an approved voice, those assets can replace the demo layer.</p></header>

    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(290px,.78fr) minmax(0,1.22fr)', gap: 15, alignItems: 'start' }} className="teacher-grid">
      <aside style={{ display: 'grid', gap: 12 }}>
        <section style={{ ...card, background: 'radial-gradient(circle at 50% 18%,#203B4A 0,#162237 42%,#0B1524 100%)', overflow: 'hidden' }}>
          <div className={`teacher-stage ${speaking ? 'is-speaking' : ''} ${busy ? 'is-thinking' : ''} ${listening ? 'is-listening' : ''}`} aria-label={`AI teacher is ${teacherState.toLowerCase()}`}>
            <div className="teacher-halo" />
            <div className="teacher-portrait-wrap"><img className="teacher-portrait" src="/executives/oracle.jpg" alt="Generic Aridon teaching avatar" /><div className="teacher-mouth"><i /><i /><i /><i /><i /></div></div>
            <div className="teacher-shadow" />
          </div>
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}><strong style={{ fontSize: 22 }}>Contrarian Curriculum Tutor</strong><div style={{ color: '#9EF0CF', fontSize: 12, marginTop: 5 }}>Generic animated demo teacher · synthetic voice</div><div style={{ display: 'inline-flex', gap: 7, alignItems: 'center', marginTop: 10, padding: '6px 10px', borderRadius: 999, background: '#091321', border: '1px solid #2F4260', fontSize: 11, fontWeight: 900 }}><span className={`status-dot ${speaking || listening || busy ? 'active' : ''}`} />{teacherState}</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 14 }}>
            <button onClick={startListening} disabled={listening || busy} style={primaryButton}>{listening ? '🎙 Listening…' : '🎙 Talk to Teacher'}</button>
            {speaking ? <button onClick={stopSpeaking} style={secondaryButton}>■ Stop Voice</button> : <button onClick={() => latestTutor && speak(latestTutor.content)} disabled={!latestTutor} style={{ ...secondaryButton, opacity: latestTutor ? 1 : .45 }}>▶ Speak Answer</button>}
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, color: '#AEBBD0', fontSize: 12, cursor: 'pointer' }}><input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} /> Automatically speak every answer</label>
        </section>
        <section style={card}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>CURRICULUM</div><div style={{ display: 'grid', gap: 7, marginTop: 10 }}>{codieModules.map((item, index) => <button key={item.id} onClick={() => changeModule(item.id)} style={{ textAlign: 'left', border: item.id === moduleId ? '1px solid #9EF0CF' : '1px solid #2F4260', borderRadius: 11, padding: '10px 11px', background: item.id === moduleId ? '#122B26' : '#091321', color: '#F8FAFC', cursor: 'pointer' }}><strong>{index + 1}. {item.title}</strong><div style={{ color: '#94A4BA', fontSize: 11, marginTop: 4 }}>{item.promise}</div></button>)}</div></section>
      </aside>

      <section style={{ display: 'grid', gap: 12 }}>
        <article style={{ ...card, background: '#102033' }}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>CURRENT LESSON</div><h2 style={{ margin: '7px 0 8px', fontSize: 28 }}>{module.title}</h2><p style={{ color: '#C3CFDE', lineHeight: 1.6 }}>{module.promise}</p><div style={{ display: 'grid', gap: 8 }}>{module.lessons.map((lesson) => <div key={lesson} style={{ borderTop: '1px solid #2B405F', paddingTop: 8, color: '#DCE5F0', lineHeight: 1.5 }}>✓ {lesson}</div>)}</div><div style={{ marginTop: 13, color: '#9EF0CF', lineHeight: 1.5 }}><strong>Aridon extension:</strong> {module.aridonExtension}</div></article>

        <section style={{ ...card, minHeight: 360 }}><div style={{ color: '#C5B8FF', fontSize: 11, fontWeight: 950 }}>LIVE TEACHING CONVERSATION</div>{messages.length === 0 ? <div style={{ color: '#8FA0B8', lineHeight: 1.6, padding: '34px 0' }}>Ask anything about the lesson, request a quiz, or describe a business you are evaluating. The tutor keeps the conversation context and can answer follow-up questions.</div> : <div style={{ display: 'grid', gap: 10, marginTop: 13 }}>{messages.map((message, index) => <div key={index} style={{ justifySelf: message.role === 'user' ? 'end' : 'stretch', maxWidth: message.role === 'user' ? '84%' : '100%', background: message.role === 'user' ? '#173149' : '#0A1423', border: '1px solid #2D405F', borderRadius: 13, padding: 13, color: '#E9EFF7', whiteSpace: 'pre-wrap', lineHeight: 1.58 }}><div style={{ color: message.role === 'user' ? '#B9CFFF' : '#9EF0CF', fontSize: 10, fontWeight: 950, marginBottom: 5 }}>{message.role === 'user' ? 'LEARNER' : 'ARIDON TUTOR'}</div>{message.content}{message.role === 'assistant' ? <button onClick={() => speak(message.content)} style={{ display: 'block', marginTop: 9, border: '1px solid #304968', background: '#102033', color: '#CDE8DA', borderRadius: 8, padding: '6px 9px', cursor: 'pointer', fontWeight: 850, fontSize: 11 }}>▶ Hear this answer</button> : null}</div>)}</div>}</section>

        <form onSubmit={submit} style={{ ...card, display: 'grid', gap: 9 }}><textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} placeholder="Ask the teacher a question, request a quiz, or describe a business..." style={{ ...input, resize: 'vertical' }} /><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button disabled={busy} style={primaryButton}>{busy ? 'Thinking…' : 'Ask Teacher'}</button><button type="button" onClick={startListening} disabled={listening || busy} style={secondaryButton}>{listening ? 'Listening…' : '🎙 Speak Question'}</button><button type="button" onClick={() => setQuestion('Quiz me on this module with 5 practical questions. Do not give me the answers until I respond.')} style={secondaryButton}>Build Quiz</button><button type="button" onClick={() => setQuestion('I found a business I may want to buy. Show me exactly what information I should collect before deciding whether to move it into full underwriting.')} style={secondaryButton}>Apply to a Deal</button></div>{error ? <div style={{ color: '#FFB5C0' }}>{error}</div> : null}</form>

        {sources.length ? <section style={card}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>SOURCE BASIS FOR THIS MODULE</div><div style={{ display: 'grid', gap: 7, marginTop: 10 }}>{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={{ color: '#C7D6EA' }}>{source.title}</a>)}</div></section> : null}
      </section>
    </div>
    <p style={{ color: '#7F8EA5', fontSize: 12, lineHeight: 1.6, marginTop: 18 }}>The tutor is educational decision support. It is not Codie Sanchez and does not provide legal, tax, accounting, investment or lender approval. A Codie-specific likeness or voice should only be activated with her explicit authorization.</p>
    <style>{`
      @media(max-width:860px){.teacher-grid{grid-template-columns:1fr !important}}
      .teacher-stage{height:260px;position:relative;display:grid;place-items:center;margin:-8px -8px 12px;perspective:900px;overflow:hidden}
      .teacher-halo{position:absolute;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(158,240,207,.22),rgba(158,240,207,0) 68%);animation:haloPulse 4s ease-in-out infinite}
      .teacher-portrait-wrap{position:relative;width:178px;height:210px;border-radius:82px 82px 42px 42px;overflow:hidden;border:1px solid rgba(205,232,218,.45);box-shadow:0 22px 55px rgba(0,0,0,.42);transform-origin:50% 78%;animation:teacherIdle 5.4s ease-in-out infinite}
      .teacher-portrait{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.13);transform-origin:50% 42%;filter:saturate(.92) contrast(1.03)}
      .teacher-shadow{position:absolute;bottom:8px;width:150px;height:22px;border-radius:50%;background:rgba(0,0,0,.38);filter:blur(9px);animation:shadowIdle 5.4s ease-in-out infinite}
      .teacher-mouth{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:3px;align-items:flex-end;height:24px;padding:5px 8px;border-radius:999px;background:rgba(5,12,21,.72);border:1px solid rgba(158,240,207,.28);opacity:.2;transition:opacity .2s ease}
      .teacher-mouth i{display:block;width:3px;height:5px;border-radius:3px;background:#9EF0CF}
      .is-speaking .teacher-mouth{opacity:1}
      .is-speaking .teacher-mouth i:nth-child(1){animation:voiceBar .42s ease-in-out infinite alternate}.is-speaking .teacher-mouth i:nth-child(2){animation:voiceBar .31s .08s ease-in-out infinite alternate}.is-speaking .teacher-mouth i:nth-child(3){animation:voiceBar .5s .04s ease-in-out infinite alternate}.is-speaking .teacher-mouth i:nth-child(4){animation:voiceBar .28s .12s ease-in-out infinite alternate}.is-speaking .teacher-mouth i:nth-child(5){animation:voiceBar .38s .02s ease-in-out infinite alternate}
      .is-speaking .teacher-portrait-wrap{animation:teacherTalk 1.15s ease-in-out infinite}
      .is-thinking .teacher-portrait-wrap{animation:teacherThink 2.2s ease-in-out infinite}
      .is-listening .teacher-portrait-wrap{animation:teacherListen 1.8s ease-in-out infinite}
      .is-speaking .teacher-halo,.is-listening .teacher-halo{animation:haloActive 1.25s ease-in-out infinite}
      .status-dot{width:7px;height:7px;border-radius:50%;background:#708099;box-shadow:0 0 0 0 rgba(158,240,207,0)}.status-dot.active{background:#9EF0CF;animation:statusPulse 1.1s ease-out infinite}
      @keyframes teacherIdle{0%,100%{transform:translateY(3px) rotate(-.8deg)}50%{transform:translateY(-7px) rotate(.8deg)}}
      @keyframes teacherTalk{0%,100%{transform:translateY(-3px) rotate(-1deg) scale(1.01)}25%{transform:translateY(-8px) rotate(.7deg) scale(1.018)}50%{transform:translateY(-4px) rotate(1.2deg) scale(1.01)}75%{transform:translateY(-9px) rotate(-.5deg) scale(1.02)}}
      @keyframes teacherThink{0%,100%{transform:translateY(-2px) rotate(-1deg)}50%{transform:translateY(-6px) rotate(2.2deg)}}
      @keyframes teacherListen{0%,100%{transform:translateY(-4px) rotate(.4deg) scale(1.01)}50%{transform:translateY(-8px) rotate(-.4deg) scale(1.025)}}
      @keyframes shadowIdle{0%,100%{transform:scaleX(1);opacity:.7}50%{transform:scaleX(.86);opacity:.46}}
      @keyframes haloPulse{0%,100%{transform:scale(.94);opacity:.65}50%{transform:scale(1.07);opacity:1}}
      @keyframes haloActive{0%,100%{transform:scale(.95);opacity:.65}50%{transform:scale(1.15);opacity:1}}
      @keyframes voiceBar{from{height:4px}to{height:18px}}
      @keyframes statusPulse{0%{box-shadow:0 0 0 0 rgba(158,240,207,.45)}100%{box-shadow:0 0 0 8px rgba(158,240,207,0)}}
      @media (prefers-reduced-motion: reduce){.teacher-portrait-wrap,.teacher-shadow,.teacher-halo,.teacher-mouth i,.status-dot{animation:none !important}}
    `}</style>
  </div></main>;
}

const outline: React.CSSProperties = { border: '1px solid #52627A', color: '#EDF3FA', textDecoration: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 900 };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 10, padding: '11px 14px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, cursor: 'pointer' };
const secondaryButton: React.CSSProperties = { border: '1px solid #425574', borderRadius: 10, padding: '10px 12px', background: '#13223A', color: '#F8FAFC', fontWeight: 900, cursor: 'pointer' };
