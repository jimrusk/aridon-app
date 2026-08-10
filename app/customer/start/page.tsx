'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';
import { executives } from '../../../lib/executives';

type Account = { tenant: { slug: string; business_name: string; industry?: string | null } };
type Executive = (typeof executives)[number];
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function introFor(executive: Executive, company: string) {
  if (executive.name === 'Eva') return `Welcome to the ${company} Main Room. Eva here. Your executive team is online. Hands-Free is the default, so speak naturally and switch executives whenever you want.`;
  return `I am ${executive.name}, your ${executive.role}. I am here in the ${company} Main Room. My focus is ${executive.focus}. What do you want to work through?`;
}

export default function CustomerStartPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [selectedName, setSelectedName] = useState('Eva');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingName, setSpeakingName] = useState('');
  const [speechBeat, setSpeechBeat] = useState(0);
  const [handsFree, setHandsFree] = useState(true);
  const [micNeedsTap, setMicNeedsTap] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [researchWeb, setResearchWeb] = useState(false);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const handsFreeRef = useRef(true);
  const busyRef = useRef(false);
  const autoStartedRef = useRef(false);
  const playbackRef = useRef(0);

  const selected = useMemo(() => executives.find((item) => item.name === selectedName) || executives[0], [selectedName]);

  useEffect(() => {
    setRecognitionSupported(Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/customer/start');
        return;
      }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) {
        router.replace('/customer/login');
        return;
      }
      setToken(accessToken);
      setAccount(result as Account);
      const eva = executives.find((item) => item.name === 'Eva') || executives[0];
      setReply(introFor(eva, result.tenant.business_name));
    });
    return () => {
      handsFreeRef.current = false;
      stopListening();
      stopSpeaking();
    };
  }, [router]);

  useEffect(() => {
    if (!account || !token || autoStartedRef.current) return;
    autoStartedRef.current = true;
    const timer = window.setTimeout(() => { void activateHandsFree(true); }, 400);
    return () => window.clearTimeout(timer);
  }, [account, token]);

  function stopListening() {
    try { recognitionRef.current?.abort?.(); } catch {}
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    setListening(false);
  }

  function releaseAudio() {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }

  function stopSpeaking() {
    playbackRef.current += 1;
    releaseAudio();
    setSpeakingName('');
  }

  function resumeHandsFree(delay = 350) {
    if (!handsFreeRef.current || busyRef.current || micNeedsTap) return;
    window.setTimeout(() => {
      if (handsFreeRef.current && !busyRef.current && !audioRef.current) startListening();
    }, delay);
  }

  async function speak(executive: Executive, text: string) {
    if (!voiceEnabled || !text.trim()) {
      resumeHandsFree();
      return;
    }
    stopListening();
    stopSpeaking();
    const playback = playbackRef.current;
    setSpeakingName(executive.name);
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive: executive.name, text }),
      });
      if (!response.ok) throw new Error('Voice unavailable.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioUrlRef.current = url;
      audioRef.current = audio;
      audio.ontimeupdate = () => { if (playback === playbackRef.current) setSpeechBeat((beat) => beat + 1); };
      audio.onended = () => {
        if (playback !== playbackRef.current) return;
        releaseAudio();
        setSpeakingName('');
        resumeHandsFree(250);
      };
      audio.onerror = () => {
        releaseAudio();
        setSpeakingName('');
        setMicNeedsTap(true);
      };
      await audio.play();
    } catch {
      releaseAudio();
      setSpeakingName('');
      setMicNeedsTap(true);
    }
  }

  function startListening() {
    if (!handsFreeRef.current || busyRef.current || audioRef.current) return;
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      setRecognitionSupported(false);
      return;
    }
    stopListening();
    const recognition = new SpeechRecognitionConstructor() as BrowserSpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      setListening(false);
      if (transcript) void askExecutive(transcript);
      else resumeHandsFree();
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setMicNeedsTap(true);
        setReply('Hands-Free is ready, but this browser needs microphone permission. Tap Enable Microphone once.');
      } else if (event?.error !== 'aborted') {
        resumeHandsFree(600);
      }
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      setMicNeedsTap(true);
    }
  }

  async function activateHandsFree(automatic = false) {
    handsFreeRef.current = true;
    setHandsFree(true);
    if (!recognitionSupported) return;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      setMicNeedsTap(false);
      setReply(automatic ? 'Hands-Free Main Room is on. I am listening.' : `Hands-Free is on. I am listening for your question to ${selected.name}.`);
      window.setTimeout(startListening, 100);
    } catch {
      setMicNeedsTap(true);
      setReply('Hands-Free is the default. Your browser needs one microphone-permission tap before automatic listening can begin.');
    }
  }

  function turnHandsFreeOff() {
    handsFreeRef.current = false;
    setHandsFree(false);
    setMicNeedsTap(false);
    stopListening();
  }

  async function askExecutive(override?: string) {
    const question = (override ?? input).trim();
    if (!question || busyRef.current || !account || !token) return;
    stopListening();
    busyRef.current = true;
    setBusy(true);
    const userMessage: ChatMessage = { role: 'user', content: question };
    const nextMessages: ChatMessage[] = [...messages, userMessage].slice(-18);
    setMessages(nextMessages);
    setReply('');
    try {
      const response = await fetch('/api/customer/assistant', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, executive: selected.name, messages: nextMessages, researchWeb }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data.error || `${selected.name} could not answer right now.`);
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.reply };
      setMessages([...nextMessages, assistantMessage].slice(-18));
      setReply(data.reply);
      setInput('');
      busyRef.current = false;
      setBusy(false);
      void speak(selected, data.reply);
      return;
    } catch (error) {
      setReply(error instanceof Error ? error.message : 'The executive team is temporarily unavailable.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    resumeHandsFree(600);
  }

  function selectExecutive(executive: Executive) {
    stopListening();
    stopSpeaking();
    setSelectedName(executive.name);
    const intro = introFor(executive, account?.tenant.business_name || 'your company');
    setReply(intro);
    void speak(executive, intro);
  }

  if (!account) return <main style={loadingStyle}>Opening your Main Room…</main>;

  const home = `/workspace/${account.tenant.slug}`;
  const speaking = speakingName === selected.name;

  return (
    <main className="avatar-room">
      <div className="avatar-room-shell">
        <header className="avatar-room-header">
          <div>
            <div className="avatar-room-brand">ARIDON · {account.tenant.business_name.toUpperCase()}</div>
            <h1>Executive Main Room</h1>
            <p>All eight executives stay together here. Speak naturally, change executives with one tap, and keep the conversation in the same room.</p>
          </div>
          <div className="avatar-room-header-actions">
            {handsFree ? <button className="handsfree-toggle on" onClick={micNeedsTap ? () => void activateHandsFree(false) : turnHandsFreeOff}>{micNeedsTap ? '🎙 Enable Microphone' : listening ? '🎙 Listening Automatically' : '🎙 Hands-Free On'}</button> : <button className="handsfree-toggle" onClick={() => void activateHandsFree(false)}>🎙 Turn Hands-Free On</button>}
            <button className={`voice-toggle ${voiceEnabled ? 'on' : ''}`} onClick={() => { if (voiceEnabled) stopSpeaking(); setVoiceEnabled((value) => !value); }}>{voiceEnabled ? '🔊 Voices On' : '🔇 Voice Off'}</button>
            <label className="voice-toggle" style={{ cursor: 'pointer' }}><input type="checkbox" checked={researchWeb} onChange={(event) => setResearchWeb(event.target.checked)} /> Live web</label>
          </div>
        </header>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <Link href={home} target="_blank" style={toolLink}>Company Dashboard ↗</Link>
          <Link href="/customer/sales" target="_blank" style={toolLink}>Sales ↗</Link>
          <Link href="/customer/opportunities" target="_blank" style={toolLink}>Opportunities ↗</Link>
          <Link href="/customer/account" target="_blank" style={toolLink}>Account ↗</Link>
        </div>

        <section className="avatar-stage">
          <div className={`avatar-feature ${speaking ? 'is-speaking' : ''}`}>
            <div className="avatar-feature-image-wrap" style={{ '--avatar-color': selected.color } as React.CSSProperties}>
              <img src={selected.avatar} alt={`${selected.name}, ${selected.role}`} className="avatar-feature-image" style={{ transform: speaking ? `scale(${1.006 + (speechBeat % 3) * 0.003}) translateY(${speechBeat % 2 ? '-1px' : '1px'})` : 'scale(1)' }} />
              <div className="avatar-speaking-ring" />
              <div className="avatar-wave" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              {speaking && <div className="avatar-speaking-label">Speaking</div>}
            </div>
            <div className="avatar-feature-copy">
              <div className="avatar-online">● Online</div>
              <h2>{selected.name}</h2>
              <div className="avatar-role" style={{ color: selected.color }}>{selected.role}</div>
              <p>{selected.tagline}</p>
              <div className="avatar-expertise">{selected.expertise.map((item) => <span key={item}>{item}</span>)}</div>
              <div className="avatar-feature-actions">
                <button className="avatar-primary" onClick={() => selectExecutive(selected)}>▶ Hear {selected.name}</button>
                <button className={`avatar-mic ${listening ? 'listening' : ''}`} onClick={() => { handsFreeRef.current = true; setHandsFree(true); setMicNeedsTap(false); startListening(); }}>{listening ? 'Listening…' : '🎙 Talk Now'}</button>
                <button className="avatar-secondary" onClick={() => { stopSpeaking(); stopListening(); }}>■ Stop</button>
              </div>
            </div>
          </div>

          <div className="avatar-conversation">
            <div className="avatar-conversation-head">
              <div><h3>Talk with {selected.name}</h3><p>{handsFree ? 'Listen → answer → speak → listen again.' : 'Type or tap Talk Now.'}</p></div>
              <div className={`voice-status ${listening ? 'listening' : speaking ? 'speaking' : handsFree ? 'ready' : ''}`}>{listening ? '● Listening' : speaking ? '● Speaking' : handsFree ? '● Ready' : '● Manual'}</div>
            </div>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Ask ${selected.name} anything about ${account.tenant.business_name}…`} />
            <button className="avatar-primary avatar-ask" onClick={() => void askExecutive()} disabled={busy || !input.trim()}>{busy ? `${selected.name} is thinking…` : `Ask ${selected.name}`}</button>
            <div className="avatar-reply" aria-live="polite">{reply || `Hands-Free is ready. Start talking to ${selected.name}.`}</div>
            {micNeedsTap && <div className="avatar-browser-note">Your browser requires one microphone or audio interaction. Tap “Enable Microphone” once. After that, Hands-Free continues automatically.</div>}
            {!recognitionSupported && <div className="avatar-browser-note">This browser does not expose speech recognition. You can still type and hear spoken answers.</div>}
          </div>
        </section>

        <section className="avatar-grid" aria-label="Executive team">
          {executives.map((executive) => {
            const active = executive.name === selected.name;
            const isSpeaking = executive.name === speakingName;
            return (
              <button key={executive.id} className={`avatar-card ${active ? 'active' : ''} ${isSpeaking ? 'is-speaking' : ''}`} style={{ '--avatar-color': executive.color } as React.CSSProperties} onClick={() => selectExecutive(executive)}>
                <div className="avatar-card-image-wrap">
                  <img src={executive.avatar} alt={executive.name} className="avatar-card-image" />
                  <div className="avatar-card-wave" aria-hidden="true"><span /><span /><span /></div>
                </div>
                <div className="avatar-card-copy"><strong>{executive.name}</strong><span>{executive.role}</span><small>{active ? 'In the chair now' : 'Tap to bring in'}</small></div>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}

const loadingStyle = { minHeight: '100vh', background: '#08101D', color: '#F7FAFC', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const toolLink = { border: '1px solid #34435D', color: '#DDE7F5', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 12, background: '#10192A' };
