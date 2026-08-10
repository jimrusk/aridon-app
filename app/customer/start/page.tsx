'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';
import { executives } from '../../../lib/executives';

type Account = { tenant: { slug: string; business_name: string; industry?: string | null } };
type Executive = (typeof executives)[number];
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type VoiceEngine = 'studio' | 'unavailable';
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

function introFor(executive: Executive, businessName: string) {
  if (executive.name === 'Eva') return `Welcome to the ${businessName} Main Room. Eva here. Your executive team is online and Hands-Free is the default. Speak naturally, switch executives whenever you want, and we will keep the conversation in this room.`;
  return `I am ${executive.name}, your ${executive.role}. I am with you in the ${businessName} Main Room. My focus is ${executive.focus}. What do you want to work through?`;
}

export default function CustomerStartPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [selectedName, setSelectedName] = useState('Eva');
  const [speakingName, setSpeakingName] = useState('');
  const [speechBeat, setSpeechBeat] = useState(0);
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [handsFree, setHandsFree] = useState(true);
  const [listening, setListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [micNeedsTap, setMicNeedsTap] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>('studio');
  const [researchWeb, setResearchWeb] = useState(false);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const handsFreeRef = useRef(true);
  const busyRef = useRef(false);
  const playbackIdRef = useRef(0);
  const autoStartAttemptedRef = useRef(false);
  const lastSpeechRef = useRef<{ key: string; at: number } | null>(null);

  const selected = useMemo(() => executives.find((executive) => executive.name === selectedName) ?? executives[0], [selectedName]);

  useEffect(() => {
    const canListen = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setRecognitionSupported(canListen);
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
      setReply(introFor(executives.find((item) => item.name === 'Eva') || executives[0], result.tenant.business_name));
    });

    return () => {
      handsFreeRef.current = false;
      playbackIdRef.current += 1;
      try { recognitionRef.current?.abort?.(); } catch {}
      try { recognitionRef.current?.stop(); } catch {}
      releaseAudio();
    };
  }, [router]);

  useEffect(() => {
    if (!account || !token || autoStartAttemptedRef.current) return;
    autoStartAttemptedRef.current = true;
    const timer = window.setTimeout(() => { void activateHandsFree(true); }, 500);
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
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  function stopSpeaking() {
    playbackIdRef.current += 1;
    releaseAudio();
    setSpeakingName('');
  }

  function resumeHandsFree(delay = 350) {
    if (!handsFreeRef.current || busyRef.current || micNeedsTap) return;
    window.setTimeout(() => {
      if (handsFreeRef.current && !busyRef.current && !audioRef.current) startListening(true);
    }, delay);
  }

  async function speak(executive: Executive, text: string) {
    const cleaned = text.trim();
    if (!voiceEnabled || !cleaned) {
      resumeHandsFree();
      return;
    }
    const speechKey = `${executive.name}:${cleaned}`;
    const now = Date.now();
    if (lastSpeechRef.current?.key === speechKey && now - lastSpeechRef.current.at < 2500) return;
    lastSpeechRef.current = { key: speechKey, at: now };

    stopListening();
    stopSpeaking();
    const playbackId = playbackIdRef.current;
    setSpeakingName(executive.name);
    setVoiceEngine('studio');

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive: executive.name, text: cleaned }),
      });
      if (playbackId !== playbackIdRef.current) return;
      if (!response.ok) throw new Error('Studio voice request failed.');
      const blob = await response.blob();
      if (!blob.size) throw new Error('Studio voice returned empty audio.');
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioUrlRef.current = url;
      audioRef.current = audio;
      audio.onplaying = () => { if (playbackId === playbackIdRef.current) setSpeakingName(executive.name); };
      audio.ontimeupdate = () => { if (playbackId === playbackIdRef.current) setSpeechBeat((beat) => beat + 1); };
      audio.onended = () => {
        if (playbackId !== playbackIdRef.current) return;
        releaseAudio();
        setSpeakingName('');
        resumeHandsFree(300);
      };
      audio.onerror = () => {
        if (playbackId !== playbackIdRef.current) return;
        releaseAudio();
        setSpeakingName('');
        setVoiceEngine('unavailable');
        resumeHandsFree(450);
      };
      await audio.play();
    } catch (error) {
      console.warn('Customer main-room voice unavailable', error);
      if (playbackId !== playbackIdRef.current) return;
      releaseAudio();
      setSpeakingName('');
      setVoiceEngine('unavailable');
      setMicNeedsTap(true);
    }
  }

  function startListening(autoSend = true) {
    if (busyRef.current || speakingName || audioRef.current || !handsFreeRef.current) return;
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      setRecognitionSupported(false);
      setReply('This browser does not expose speech recognition. You can still type and hear the executives speak.');
      return;
    }

    stopListening();
    const recognition = new SpeechRecognitionConstructor() as BrowserSpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
      setListening(false);
      if (!transcript) {
        resumeHandsFree();
        return;
      }
      setInput(transcript);
      if (autoSend || handsFreeRef.current) void askExecutive(transcript);
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setMicNeedsTap(true);
        setReply('Hands-Free is ready, but this browser requires microphone permission. Tap Enable Microphone once and the room will take it from there.');
        return;
      }
      if (handsFreeRef.current && event?.error !== 'aborted') resumeHandsFree(650);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (handsFreeRef.current && !busyRef.current && !audioRef.current && !micNeedsTap) resumeHandsFree(300);
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
    if (!recognitionSupported) {
      setReply('Hands-Free input is not supported in this browser. Spoken answers still work, and you can type your questions.');
      return;
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      setMicNeedsTap(false);
      stopSpeaking();
      setReply(automatic ? `Hands-Free Main Room is on. I am listening.` : `Hands-Free is on. I am listening for your question to ${selected.name}.`);
      window.setTimeout(() => startListening(true), 120);
    } catch {
      setMicNeedsTap(true);
      setReply('Hands-Free is the default, but your browser needs one microphone-permission tap before it can listen automatically.');
    }
  }

  function turnHandsFreeOff() {
    handsFreeRef.current = false;
    setHandsFree(false);
    setMicNeedsTap(false);
    stopListening();
    setReply('Hands-Free is off. You can still type or tap the microphone.');
  }

  async function askExecutive(questionOverride?: string) {
    const question = (questionOverride ?? input).trim();
    if (!question || busyRef.current || !account || !token) return;
    stopListening();
    busyRef.current = true;
    setBusy(true);
    setReply('');
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: question }].slice(-18);
    setMessages(nextMessages);
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
      const message = error instanceof Error ? error.message : 'The executive team is temporarily unavailable.';
      setReply(message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    resumeHandsFree(650);
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
  const isSelectedSpeaking = speakingName === selected.name;

  return (
    <main className="avatar-room">
      <div className="avatar-room-shell">
        <header className="avatar-room-header">
          <div>
            <div className="avatar-room-brand">ARIDON · {account.tenant.business_name.toUpperCase()}</div>
            <h1>Executive Main Room</h1>
            <p>Your executive team stays together here. Speak naturally, tap a different executive when needed, and keep the conversation moving without changing rooms.</p>
          </div>
          <div className="avatar-room-header-actions">
            {handsFree ? (
              <button className="handsfree-toggle on" onClick={micNeedsTap ? () => void activateHandsFree(false) : turnHandsFreeOff}>
                {micNeedsTap ? '🎙 Enable Microphone' : listening ? '🎙 Listening Automatically' : '🎙 Hands-Free On'}
              </button>
            ) : (
              <button className="handsfree-toggle" onClick={() => void activateHandsFree(false)}>🎙 Turn Hands-Free On</button>
            )}
            <button className={`voice-toggle ${voiceEnabled ? 'on' : ''}`} onClick={() => { if (voiceEnabled) stopSpeaking(); setVoiceEnabled((enabled) => !enabled); }}>
              {voiceEnabled ? '🔊 Voices On' : '🔇 Voice Off'}
            </button>
            <label className="voice-toggle" style={{ cursor: 'pointer' }}><input type="checkbox" checked={researchWeb} onChange={(event) => setResearchWeb(event.target.checked)} /> Live web</label>
          </div>
        </header>

        <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <Link href={home} target="_blank" style={toolLink}>Company Dashboard ↗</Link>
          <Link href="/customer/sales" target="_blank" style={toolLink}>Sales ↗</Link>
          <Link href="/customer/opportunities" target="_blank" style={toolLink}>Opportunities ↗</Link>
          <Link href="/customer/account" target="_blank" style={toolLink}>Account ↗</Link>
        </section>

        <section className="avatar-stage">
          <div className={`avatar-feature ${isSelectedSpeaking ? 'is-speaking' : ''}`}>
            <div className="avatar-feature-image-wrap" style={{ '--avatar-color': selected.color } as React.CSSProperties}>
              <img src={selected.avatar} alt={`${selected.name}, ${selected.role}`} className="avatar-feature-image" style={{ transform: isSelectedSpeaking ? `scale(${1.006 + (speechBeat % 3) * 0.003}) translateY(${speechBeat % 2 ? '-1px' : '1px'})` : 'scale(1)' }} />
              <div className="avatar-speaking-ring" />
              <div className="avatar-wave" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              {isSelectedSpeaking && <div className="avatar-speaking-label">Speaking</div>}
            </div>
            <div className="avatar-feature-copy">
              <div className="avatar-online">● Online · {voiceEngine === 'studio' ? 'Studio voice' : 'Voice needs a tap'}</div>
              <h2>{selected.name}</h2>
              <div className="avatar-role" style={{ color: selected.color }}>{selected.role}</div>
              <p>{selected.tagline}</p>
              <div className="avatar-expertise">{selected.expertise.map((item) => <span key={item}>{item}</span>)}</div>
              <div className="avatar-feature-actions">
                <button className="avatar-primary" onClick={() => selectExecutive(selected)}>▶ Hear {selected.name}</button>
                <button className={`avatar-mic ${listening ? 'listening' : ''}`} onClick={() => { handsFreeRef.current = true; setHandsFree(true); setMicNeedsTap(false); startListening(true); }}>{listening ? 'Listening…' : '🎙 Talk Now'}</button>
                <button className="avatar-secondary" onClick={() => { stopSpeaking(); stopListening(); }}>■ Stop</button>
              </div>
            </div>
          </div>

          <div className="avatar-conversation">
            <div className="avatar-conversation-head">
              <div><h3>Talk with {selected.name}</h3><p>{handsFree ? 'Hands-Free loop: listen → answer → speak → listen again.' : 'Type or tap Talk Now.'}</p></div>
              <div className={`voice-status ${listening ? 'listening' : isSelectedSpeaking ? 'speaking' : handsFree ? 'ready' : ''}`}>{listening ? '● Listening' : isSelectedSpeaking ? '● Speaking' : handsFree ? '● Ready' : '● Manual'}</div>
            </div>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Ask ${selected.name} anything about ${account.tenant.business_name}…`} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void askExecutive(); }} />
            <button className="avatar-primary avatar-ask" onClick={() => void askExecutive()} disabled={busy || !input.trim()}>{busy ? `${selected.name} is thinking…` : `Ask ${selected.name}`}</button>
            <div className="avatar-reply" aria-live="polite">{reply || `Hands-Free is ready. Start talking to ${selected.name}.`}</div>
            {micNeedsTap && <div className="avatar-browser-note">Your browser has blocked automatic microphone or audio start until you interact once. Tap “Enable Microphone” above. After that, the listen-and-answer loop is automatic.</div>}
            {!recognitionSupported && <div className="avatar-browser-note">This browser does not expose speech recognition. Spoken answers still work, but voice input needs a supported browser.</div>}
          </div>
        </section>

        <section className="avatar-grid" aria-label="Executive team">
          {executives.map((executive) => {
            const active = executive.name === selected.name;
            const speaking = executive.name === speakingName;
            return (
              <button key={executive.id} className={`avatar-card ${active ? 'active' : ''} ${speaking ? 'is-speaking' : ''}`} style={{ '--avatar-color': executive.color } as React.CSSProperties} onClick={() => selectExecutive(executive)}>
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
