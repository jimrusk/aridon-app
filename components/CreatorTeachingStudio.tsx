'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

export type CreatorTeachingModule = {
  id: string;
  title: string;
  promise: string;
  lessons: string[];
  aridonExtension: string;
};

type Message = { role: 'user' | 'assistant'; content: string };
type Source = { title: string; url: string };
type DidConfig = { configured: boolean; provider: 'D-ID'; mode: 'agents-sdk'; agentId: string | null; clientKey: string | null };

type Props = {
  creatorSlug: string;
  partnerHref: string;
  displayName: string;
  brandLabel: string;
  tutorName: string;
  tutorVoiceId: string;
  headline: string;
  disclosure: string;
  modules: CreatorTeachingModule[];
  apiPath: string;
  fallbackPortrait?: string;
  accent?: string;
  secondaryAccent?: string;
  realWorldHref?: string;
  realWorldLabel?: string;
  realWorldPrompt?: string;
};

const card: React.CSSProperties = { background: '#0D1728', border: '1px solid #2B3D5B', borderRadius: 18, padding: 18 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#07101D', color: '#F8FAFC', border: '1px solid #3B4D6C', borderRadius: 11, padding: '12px 13px', fontSize: 15, outline: 0 };
const outline: React.CSSProperties = { border: '1px solid #52627A', color: '#EDF3FA', textDecoration: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 900 };
const secondary: React.CSSProperties = { border: '1px solid #425574', borderRadius: 10, padding: '10px 12px', background: '#13223A', color: '#F8FAFC', fontWeight: 900, cursor: 'pointer' };

export default function CreatorTeachingStudio({
  creatorSlug,
  partnerHref,
  displayName,
  brandLabel,
  tutorName,
  tutorVoiceId,
  headline,
  disclosure,
  modules,
  apiPath,
  fallbackPortrait = '/executives/oracle.jpg',
  accent = '#9EF0CF',
  secondaryAccent = '#C5B8FF',
  realWorldHref,
  realWorldLabel,
  realWorldPrompt,
}: Props) {
  const [moduleId, setModuleId] = useState(modules[0]?.id || 'intro');
  const [question, setQuestion] = useState('Teach me this lesson and then give me a practical exercise.');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [error, setError] = useState('');
  const [didConfig, setDidConfig] = useState<DidConfig | null>(null);
  const [didReady, setDidReady] = useState(false);
  const [didStatus, setDidStatus] = useState('Checking live avatar…');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const didManagerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const module = useMemo(() => modules.find((item) => item.id === moduleId) || modules[0], [moduleId, modules]);
  const latestTutor = [...messages].reverse().find((message) => message.role === 'assistant');

  useEffect(() => {
    let cancelled = false;
    let manager: any = null;

    async function initDigitalHuman() {
      try {
        const response = await fetch(`/api/creator-teacher/digital-human?creator=${encodeURIComponent(creatorSlug)}`, { cache: 'no-store' });
        const config = (await response.json()) as DidConfig;
        if (cancelled) return;
        setDidConfig(config);
        if (!response.ok || !config.configured || !config.agentId || !config.clientKey) {
          setDidStatus('Animated Aridon fallback active');
          return;
        }

        setDidStatus('Connecting live digital human…');
        const sdk: any = await import('@d-id/client-sdk');
        if (cancelled) return;
        manager = await sdk.createAgentManager(config.agentId, {
          auth: { type: 'key', clientKey: config.clientKey },
          callbacks: {
            onSrcObjectReady(value: MediaStream) {
              if (videoRef.current) videoRef.current.srcObject = value;
            },
            onConnectionStateChange(state: string) {
              if (cancelled) return;
              const normalized = String(state || '').toLowerCase();
              if (normalized.includes('connect')) {
                setDidReady(true);
                setDidStatus('Live digital human ready');
              } else {
                setDidStatus(`Avatar ${String(state || 'connecting')}`);
              }
            },
            onError(errorValue: unknown) {
              console.error('Creator teacher D-ID error', errorValue);
              if (!cancelled) setDidStatus('Live avatar unavailable · fallback voice ready');
            },
          },
          streamOptions: { compatibilityMode: 'auto', streamWarmup: true },
        });
        didManagerRef.current = manager;
        await manager.connect();
        if (!cancelled) {
          setDidReady(true);
          setDidStatus('Live digital human ready');
        }
      } catch (err) {
        console.error('Creator digital human initialization error', err);
        if (!cancelled) setDidStatus('Animated Aridon fallback active');
      }
    }

    void initDigitalHuman();
    return () => {
      cancelled = true;
      if (manager?.disconnect) void manager.disconnect().catch(() => undefined);
      didManagerRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [creatorSlug]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const prompt = question.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError('');
    const next: Message[] = [...messages, { role: 'user', content: prompt }];
    setMessages(next);
    setQuestion('');
    try {
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, messages: next }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'The lesson could not be generated.');
      const reply = String(payload.reply || '').trim();
      if (!reply) throw new Error('The teacher returned no readable answer.');
      setMessages([...next, { role: 'assistant', content: reply }]);
      setSources(payload.sources || []);
      if (autoSpeak) void speak(reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The lesson could not be generated.');
    } finally {
      setBusy(false);
    }
  }

  async function speak(text: string) {
    const clean = text.trim().slice(0, 3800);
    if (!clean) return;
    try {
      stopSpeaking();
      setSpeaking(true);
      if (didReady && didManagerRef.current?.speak) {
        await didManagerRef.current.speak({ type: 'text', input: clean, sentiment: 'friendly' });
        setSpeaking(false);
        return;
      }

      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive: tutorVoiceId, text: clean }),
      });
      if (!response.ok) throw new Error('Synthetic teaching voice is unavailable.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (err) {
      setSpeaking(false);
      setError(err instanceof Error ? err.message : 'Voice playback failed.');
    }
  }

  function stopSpeaking() {
    if (didManagerRef.current?.interrupt) void didManagerRef.current.interrupt().catch(() => undefined);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }

  function listenForQuestion() {
    if (typeof window === 'undefined') return;
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice questions are not supported by this browser. You can still type the question.');
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setListening(true);
        setError('');
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => {
        setListening(false);
        setError('I could not hear that clearly. Try again or type the question.');
      };
      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript;
        if (typeof transcript === 'string' && transcript.trim()) setQuestion(transcript.trim());
      };
      recognition.start();
    } catch {
      setListening(false);
      setError('Voice input could not start. You can still type the question.');
    }
  }

  function changeModule(id: string) {
    setModuleId(id);
    setMessages([]);
    setSources([]);
    setQuestion('Teach me this lesson and then give me a practical exercise.');
    stopSpeaking();
  }

  if (!module) return null;
  const stageState = speaking ? 'is-speaking' : busy ? 'is-thinking' : listening ? 'is-listening' : '';
  const status = listening ? 'Listening' : busy ? 'Thinking' : speaking ? 'Speaking' : didReady ? 'Live avatar ready' : 'Ready';

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: '24px 18px 70px' }}>
      <div style={{ maxWidth: 1220, margin: '0 auto' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={partnerHref} style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950 }}>← {displayName.toUpperCase()} PARTNER DEMO</Link>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Link href="/creator-teacher" style={outline}>Creator Teacher Engine</Link>
            {realWorldHref ? <Link href={realWorldHref} style={outline}>{realWorldLabel || 'Open Aridon Workspace'}</Link> : null}
          </div>
        </nav>

        <header style={{ padding: '48px 0 22px', maxWidth: 980 }}>
          <div style={{ color: accent, fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON · LIVE AI TEACHING STUDIO · {brandLabel.toUpperCase()}</div>
          <h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '12px 0 16px' }}>{headline}</h1>
          <p style={{ color: '#B9C5D6', lineHeight: 1.65, fontSize: 18 }}>{disclosure}</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(290px,.78fr) minmax(0,1.22fr)', gap: 15, alignItems: 'start' }} className="teacher-grid">
          <aside style={{ display: 'grid', gap: 12 }}>
            <section style={{ ...card, background: 'radial-gradient(circle at 50% 18%,#203B4A 0,#162237 42%,#0B1524 100%)', overflow: 'hidden' }}>
              {didConfig?.configured ? (
                <div className="live-video-stage">
                  <video ref={videoRef} autoPlay playsInline className="live-avatar-video" aria-label="Live Aridon digital teaching avatar" />
                  {!didReady ? <div className="avatar-loading"><span>◌</span><small>{didStatus}</small></div> : null}
                </div>
              ) : (
                <div className={`teacher-stage ${stageState}`} aria-label={`AI teacher is ${status.toLowerCase()}`}>
                  <div className="teacher-halo" />
                  <div className="teacher-portrait-wrap">
                    <img className="teacher-portrait" src={fallbackPortrait} alt="Generic Aridon teaching avatar" />
                    <div className="teacher-mouth"><i /><i /><i /><i /><i /></div>
                  </div>
                  <div className="teacher-shadow" />
                </div>
              )}

              <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                <strong style={{ fontSize: 22 }}>{tutorName}</strong>
                <div style={{ color: accent, fontSize: 12, marginTop: 5 }}>{didReady ? 'Live D-ID digital human · source-grounded Aridon brain' : 'Animated Aridon demo teacher · synthetic voice fallback'}</div>
                <div style={{ display: 'inline-flex', gap: 7, alignItems: 'center', marginTop: 10, padding: '6px 10px', borderRadius: 999, background: '#091321', border: '1px solid #2F4260', fontSize: 11, fontWeight: 900 }}>
                  <span className={`status-dot ${speaking || busy || listening ? 'active' : ''}`} />{status}
                </div>
                <div style={{ color: '#75859C', fontSize: 10, marginTop: 7 }}>{didStatus}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 14 }}>
                <button onClick={listenForQuestion} style={{ border: 0, borderRadius: 10, padding: '11px 14px', background: accent, color: '#07130F', fontWeight: 950, cursor: 'pointer' }}>{listening ? 'Listening…' : '🎙 Talk to Teacher'}</button>
                <button onClick={() => latestTutor && speak(latestTutor.content)} disabled={!latestTutor || speaking} style={{ ...secondary, opacity: !latestTutor ? .45 : 1 }}>{speaking ? 'Speaking…' : '▶ Speak Answer'}</button>
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, color: '#AEBBD0', fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={autoSpeak} onChange={(event) => setAutoSpeak(event.target.checked)} /> Automatically speak every answer
              </label>
            </section>

            <section style={card}>
              <div style={{ color: accent, fontSize: 11, fontWeight: 950 }}>CURRICULUM</div>
              <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
                {modules.map((item, index) => (
                  <button key={item.id} onClick={() => changeModule(item.id)} style={{ textAlign: 'left', border: item.id === moduleId ? `1px solid ${accent}` : '1px solid #2F4260', borderRadius: 11, padding: '10px 11px', background: item.id === moduleId ? '#122B26' : '#091321', color: '#F8FAFC', cursor: 'pointer' }}>
                    <strong>{index + 1}. {item.title}</strong>
                    <div style={{ color: '#94A4BA', fontSize: 11, marginTop: 4 }}>{item.promise}</div>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section style={{ display: 'grid', gap: 12 }}>
            <article style={{ ...card, background: '#102033' }}>
              <div style={{ color: accent, fontSize: 11, fontWeight: 950 }}>CURRENT LESSON</div>
              <h2 style={{ margin: '7px 0 8px', fontSize: 28 }}>{module.title}</h2>
              <p style={{ color: '#C3CFDE', lineHeight: 1.6 }}>{module.promise}</p>
              <div style={{ display: 'grid', gap: 8 }}>{module.lessons.map((lesson) => <div key={lesson} style={{ borderTop: '1px solid #2B405F', paddingTop: 8, color: '#DCE5F0', lineHeight: 1.5 }}>✓ {lesson}</div>)}</div>
              <div style={{ marginTop: 13, color: accent, lineHeight: 1.5 }}><strong>Aridon extension:</strong> {module.aridonExtension}</div>
            </article>

            <section style={{ ...card, minHeight: 360 }}>
              <div style={{ color: secondaryAccent, fontSize: 11, fontWeight: 950 }}>LIVE TEACHING CONVERSATION</div>
              {messages.length === 0 ? (
                <div style={{ color: '#8FA0B8', lineHeight: 1.6, padding: '34px 0' }}>Ask anything about the lesson, request a quiz, or describe your real situation. The tutor keeps the conversation context and can answer follow-up questions.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10, marginTop: 13 }}>{messages.map((message, index) => (
                  <div key={index} style={{ justifySelf: message.role === 'user' ? 'end' : 'stretch', maxWidth: message.role === 'user' ? '84%' : '100%', background: message.role === 'user' ? '#173149' : '#0A1423', border: '1px solid #2D405F', borderRadius: 13, padding: 13, color: '#E9EFF7', whiteSpace: 'pre-wrap', lineHeight: 1.58 }}>
                    <div style={{ color: message.role === 'user' ? '#B9CFFF' : accent, fontSize: 10, fontWeight: 950, marginBottom: 5 }}>{message.role === 'user' ? 'LEARNER' : 'ARIDON TUTOR'}</div>
                    {message.content}
                  </div>
                ))}</div>
              )}
            </section>

            <form onSubmit={submit} style={{ ...card, display: 'grid', gap: 9 }}>
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} placeholder="Ask the teacher a question, request a quiz, or describe your situation..." style={{ ...input, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button disabled={busy} style={{ border: 0, borderRadius: 10, padding: '11px 14px', background: accent, color: '#07130F', fontWeight: 950, cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Teaching…' : 'Ask Teacher'}</button>
                <button type="button" onClick={listenForQuestion} style={secondary}>🎙 Speak Question</button>
                <button type="button" onClick={() => setQuestion('Quiz me on this module with 5 practical questions. Do not give me the answers until I respond.')} style={secondary}>Build Quiz</button>
                {realWorldPrompt ? <button type="button" onClick={() => setQuestion(realWorldPrompt)} style={secondary}>{realWorldLabel || 'Apply It'}</button> : null}
              </div>
              {error ? <div style={{ color: '#FFB5C0' }}>{error}</div> : null}
            </form>

            {sources.length ? (
              <section style={card}>
                <div style={{ color: accent, fontSize: 11, fontWeight: 950 }}>SOURCE BASIS FOR THIS MODULE</div>
                <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={{ color: '#C7D6EA' }}>{source.title}</a>)}</div>
              </section>
            ) : null}
          </section>
        </div>

        <p style={{ color: '#7F8EA5', fontSize: 12, lineHeight: 1.6, marginTop: 18 }}>This is an Aridon teaching prototype built from summarized public sources. It is not {displayName}, does not imply endorsement, and does not clone the creator's voice. An authorized likeness, approved voice and proprietary course material should only be activated with the creator's explicit permission.</p>

        <style>{`
          @media(max-width:860px){.teacher-grid{grid-template-columns:1fr !important}}
          .live-video-stage,.teacher-stage{height:310px;position:relative;display:grid;place-items:center;margin:-8px -8px 12px;overflow:hidden;border-radius:15px;background:#091321}
          .live-avatar-video{width:100%;height:100%;object-fit:cover;background:#091321}
          .avatar-loading{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:9px;background:radial-gradient(circle,rgba(32,59,74,.82),rgba(9,19,33,.96));color:#DCE7F5;text-align:center}.avatar-loading span{font-size:34px;animation:spin 1.25s linear infinite}.avatar-loading small{color:#9FB0C6}
          .teacher-halo{position:absolute;width:245px;height:245px;border-radius:50%;background:radial-gradient(circle,rgba(158,240,207,.22),rgba(158,240,207,0) 68%);animation:haloPulse 4s ease-in-out infinite}
          .teacher-portrait-wrap{position:relative;width:210px;height:250px;border-radius:96px 96px 50px 50px;overflow:hidden;border:1px solid rgba(205,232,218,.45);box-shadow:0 22px 55px rgba(0,0,0,.42);transform-origin:50% 78%;animation:teacherIdle 5.4s ease-in-out infinite}
          .teacher-portrait{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.13);transform-origin:50% 42%;filter:saturate(.92) contrast(1.03)}
          .teacher-shadow{position:absolute;bottom:8px;width:165px;height:22px;border-radius:50%;background:rgba(0,0,0,.38);filter:blur(9px);animation:shadowIdle 5.4s ease-in-out infinite}
          .teacher-mouth{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:3px;align-items:flex-end;height:24px;padding:5px 8px;border-radius:999px;background:rgba(5,12,21,.72);border:1px solid rgba(158,240,207,.28);opacity:.2;transition:opacity .2s ease}.teacher-mouth i{display:block;width:3px;height:5px;border-radius:3px;background:${accent}}
          .is-speaking .teacher-mouth{opacity:1}.is-speaking .teacher-mouth i:nth-child(1){animation:voiceBar .42s ease-in-out infinite alternate}.is-speaking .teacher-mouth i:nth-child(2){animation:voiceBar .31s .08s ease-in-out infinite alternate}.is-speaking .teacher-mouth i:nth-child(3){animation:voiceBar .5s .04s ease-in-out infinite alternate}.is-speaking .teacher-mouth i:nth-child(4){animation:voiceBar .28s .12s ease-in-out infinite alternate}.is-speaking .teacher-mouth i:nth-child(5){animation:voiceBar .38s .02s ease-in-out infinite alternate}
          .is-speaking .teacher-portrait-wrap{animation:teacherTalk 1.15s ease-in-out infinite}.is-thinking .teacher-portrait-wrap{animation:teacherThink 2.2s ease-in-out infinite}.is-listening .teacher-portrait-wrap{animation:teacherListen 1.8s ease-in-out infinite}.is-speaking .teacher-halo,.is-listening .teacher-halo{animation:haloActive 1.25s ease-in-out infinite}
          .status-dot{width:7px;height:7px;border-radius:50%;background:#708099;box-shadow:0 0 0 0 rgba(158,240,207,0)}.status-dot.active{background:${accent};animation:statusPulse 1.1s ease-out infinite}
          @keyframes teacherIdle{0%,100%{transform:translateY(3px) rotate(-.8deg)}50%{transform:translateY(-7px) rotate(.8deg)}}@keyframes teacherTalk{0%,100%{transform:translateY(-3px) rotate(-1deg) scale(1.01)}25%{transform:translateY(-8px) rotate(.7deg) scale(1.018)}50%{transform:translateY(-4px) rotate(1.2deg) scale(1.01)}75%{transform:translateY(-9px) rotate(-.5deg) scale(1.02)}}@keyframes teacherThink{0%,100%{transform:translateY(-2px) rotate(-1deg)}50%{transform:translateY(-6px) rotate(2.2deg)}}@keyframes teacherListen{0%,100%{transform:translateY(-4px) rotate(.4deg) scale(1.01)}50%{transform:translateY(-8px) rotate(-.4deg) scale(1.025)}}@keyframes shadowIdle{0%,100%{transform:scaleX(1);opacity:.7}50%{transform:scaleX(.86);opacity:.46}}@keyframes haloPulse{0%,100%{transform:scale(.94);opacity:.65}50%{transform:scale(1.07);opacity:1}}@keyframes haloActive{0%,100%{transform:scale(.95);opacity:.65}50%{transform:scale(1.15);opacity:1}}@keyframes voiceBar{from{height:4px}to{height:18px}}@keyframes statusPulse{0%{box-shadow:0 0 0 0 rgba(158,240,207,.45)}100%{box-shadow:0 0 0 8px rgba(158,240,207,0)}}@keyframes spin{to{transform:rotate(360deg)}}
          @media (prefers-reduced-motion: reduce){.teacher-portrait-wrap,.teacher-shadow,.teacher-halo,.teacher-mouth i,.status-dot,.avatar-loading span{animation:none !important}}
        `}</style>
      </div>
    </main>
  );
}
