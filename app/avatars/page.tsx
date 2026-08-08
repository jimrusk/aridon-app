'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { executives } from '../../lib/executives';

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

function introFor(executive: Executive) {
  if (executive.name === 'Eva') {
    return 'Hello Jim. Eva here. The executive voice room is online with the upgraded natural voice system. You can speak normally, and in hands-free mode I will keep the conversation moving without making you tap between turns. What shall we tackle first?';
  }
  return `Hello Jim. I am ${executive.name}, your ${executive.role}. My focus is ${executive.focus}. I am ready when you are.`;
}

export default function TalkingAvatarsPage() {
  const [selectedName, setSelectedName] = useState('Eva');
  const [speakingName, setSpeakingName] = useState('');
  const [speechBeat, setSpeechBeat] = useState(0);
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>('studio');
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const handsFreeRef = useRef(false);
  const busyRef = useRef(false);
  const playbackIdRef = useRef(0);
  const lastSpeechRef = useRef<{ key: string; at: number } | null>(null);

  const selected = useMemo(
    () => executives.find((executive) => executive.name === selectedName) ?? executives[0],
    [selectedName],
  );

  useEffect(() => {
    const canListen = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setRecognitionSupported(canListen);

    return () => {
      handsFreeRef.current = false;
      playbackIdRef.current += 1;
      try { recognitionRef.current?.abort?.(); } catch {}
      try { recognitionRef.current?.stop(); } catch {}
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.pause();
      }
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

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

  function resumeHandsFree(delay = 450) {
    if (!handsFreeRef.current || busyRef.current) return;
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
    if (lastSpeechRef.current?.key === speechKey && now - lastSpeechRef.current.at < 2500) {
      return;
    }
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
      if (playbackId !== playbackIdRef.current) return;
      if (!blob.size) throw new Error('Studio voice returned empty audio.');

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioUrlRef.current = url;
      audioRef.current = audio;

      audio.onplaying = () => {
        if (playbackId === playbackIdRef.current) setSpeakingName(executive.name);
      };
      audio.ontimeupdate = () => {
        if (playbackId === playbackIdRef.current) setSpeechBeat((beat) => beat + 1);
      };
      audio.onended = () => {
        if (playbackId !== playbackIdRef.current) return;
        releaseAudio();
        setSpeakingName('');
        resumeHandsFree(350);
      };
      audio.onerror = () => {
        if (playbackId !== playbackIdRef.current) return;
        releaseAudio();
        setSpeakingName('');
        setVoiceEngine('unavailable');
        resumeHandsFree(500);
      };

      await audio.play();
    } catch (error) {
      if (playbackId !== playbackIdRef.current) return;
      console.warn('Studio voice unavailable. Written answer remains available.', error);
      releaseAudio();
      setSpeakingName('');
      setVoiceEngine('unavailable');
      resumeHandsFree(500);
    }
  }

  function selectAndIntroduce(executive: Executive) {
    stopListening();
    setSelectedName(executive.name);
    const intro = introFor(executive);
    setReply(intro);
    void speak(executive, intro);
  }

  function startListening(autoSend = false) {
    if (busyRef.current || speakingName || audioRef.current) return;
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setRecognitionSupported(false);
      setReply('Voice input is not available in this browser. You can still type your question below.');
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
        setReply('Microphone permission is blocked. Allow microphone access for this site, then turn Hands-Free back on.');
        handsFreeRef.current = false;
        setHandsFree(false);
        return;
      }
      if (handsFreeRef.current && event?.error !== 'aborted') resumeHandsFree(700);
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
    }
  }

  async function askExecutive(questionOverride?: string) {
    const question = (questionOverride ?? input).trim();
    if (!question || busyRef.current) return;

    stopListening();
    busyRef.current = true;
    setBusy(true);
    setReply('');
    try {
      const messages: ChatMessage[] = [{ role: 'user', content: question }];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive: selected.name, messages }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error || `${selected.name} could not answer right now.`);
      setReply(data.reply);
      setInput('');
      busyRef.current = false;
      setBusy(false);
      void speak(selected, data.reply);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The executive voice room is temporarily unavailable.';
      setReply(message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    resumeHandsFree(700);
  }

  function toggleHandsFree() {
    const next = !handsFreeRef.current;
    handsFreeRef.current = next;
    setHandsFree(next);
    if (!next) {
      stopListening();
      setReply((current) => current || 'Hands-Free is off.');
      return;
    }
    if (!recognitionSupported) {
      handsFreeRef.current = false;
      setHandsFree(false);
      setReply('This browser does not expose speech recognition. Try Chrome on Android or type your question instead.');
      return;
    }
    stopSpeaking();
    setReply(`Hands-Free is on. I am listening for your question to ${selected.name}.`);
    startListening(true);
  }

  const isSelectedSpeaking = speakingName === selected.name;

  return (
    <main className="avatar-room">
      <div className="avatar-room-shell">
        <header className="avatar-room-header">
          <div>
            <div className="avatar-room-brand">ARIDON</div>
            <h1>Hands-Free Executive Room</h1>
            <p>Choose an executive, speak naturally, and hear one generated studio response. Hands-Free automatically listens again after each spoken response.</p>
          </div>
          <div className="avatar-room-header-actions">
            <button className={`handsfree-toggle ${handsFree ? 'on' : ''}`} onClick={toggleHandsFree}>
              {handsFree ? '🎙 Hands-Free On' : '🎙 Start Hands-Free'}
            </button>
            <button
              className={`voice-toggle ${voiceEnabled ? 'on' : ''}`}
              onClick={() => {
                if (voiceEnabled) stopSpeaking();
                setVoiceEnabled((enabled) => !enabled);
              }}
            >
              {voiceEnabled ? '🔊 Natural Voices On' : '🔇 Voice Off'}
            </button>
            <Link href="/" className="avatar-back-link">← Dashboard</Link>
          </div>
        </header>

        <section className="avatar-stage">
          <div className={`avatar-feature ${isSelectedSpeaking ? 'is-speaking' : ''}`}>
            <div className="avatar-feature-image-wrap" style={{ '--avatar-color': selected.color } as React.CSSProperties}>
              <img
                src={selected.avatar}
                alt={`${selected.name}, ${selected.role}`}
                className="avatar-feature-image"
                style={{ transform: isSelectedSpeaking ? `scale(${1.006 + (speechBeat % 3) * 0.003}) translateY(${speechBeat % 2 ? '-1px' : '1px'})` : 'scale(1)' }}
              />
              <div className="avatar-speaking-ring" />
              <div className="avatar-wave" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              {isSelectedSpeaking && <div className="avatar-speaking-label">Speaking</div>}
            </div>
            <div className="avatar-feature-copy">
              <div className="avatar-online">● Online · {voiceEngine === 'studio' ? 'Studio voice' : 'Voice unavailable'}</div>
              <h2>{selected.name}</h2>
              <div className="avatar-role">{selected.role}</div>
              <p>{selected.tagline}</p>
              <div className="avatar-expertise">
                {selected.expertise.map((item) => <span key={item}>{item}</span>)}
              </div>
              <div className="avatar-feature-actions">
                <button className="avatar-primary" onClick={() => selectAndIntroduce(selected)}>▶ Hear {selected.name}</button>
                <button className={`avatar-mic ${listening ? 'listening' : ''}`} onClick={() => startListening(false)}>
                  {listening ? 'Listening…' : '🎙 Dictate'}
                </button>
                <button className="avatar-secondary" onClick={() => { stopSpeaking(); stopListening(); }}>■ Stop</button>
              </div>
            </div>
          </div>

          <div className="avatar-conversation">
            <div className="avatar-conversation-head">
              <div>
                <h3>Talk with {selected.name}</h3>
                <p>{handsFree ? 'Hands-Free loop active: listen → answer → one natural voice → listen again.' : 'Type, dictate, or turn on Hands-Free.'}</p>
              </div>
              <div className={`voice-status ${listening ? 'listening' : isSelectedSpeaking ? 'speaking' : handsFree ? 'ready' : ''}`}>
                {listening ? '● Listening' : isSelectedSpeaking ? '● Speaking' : handsFree ? '● Ready' : '● Manual'}
              </div>
            </div>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Ask ${selected.name} about Aridon, AWG-1000, finance, strategy, engineering, risk, revenue, or outreach…`}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void askExecutive();
              }}
            />
            <button className="avatar-primary avatar-ask" onClick={() => void askExecutive()} disabled={busy || !input.trim()}>
              {busy ? `${selected.name} is thinking…` : `Ask ${selected.name} and Speak Answer`}
            </button>
            <div className="avatar-reply" aria-live="polite">
              {reply || `Tap “Hear ${selected.name}” for an introduction, dictate one question, or turn on Hands-Free.`}
            </div>
            {voiceEngine === 'unavailable' && <div className="avatar-browser-note">Studio voice could not play this turn. The answer stays on screen and will not be repeated through the phone's robot voice.</div>}
            {!recognitionSupported && <div className="avatar-browser-note">This browser does not expose speech recognition. Spoken answers still work, but voice input needs a supported browser.</div>}
            <div className="avatar-sync-note">Portrait motion follows the single active audio playback. Static photos are animated while the executive is speaking; this is not phoneme-level mouth reshaping.</div>
          </div>
        </section>

        <section className="avatar-grid" aria-label="Aridon executive avatars">
          {executives.map((executive) => {
            const active = executive.name === selected.name;
            const speaking = executive.name === speakingName;
            return (
              <button
                key={executive.id}
                className={`avatar-card ${active ? 'active' : ''} ${speaking ? 'is-speaking' : ''}`}
                style={{ '--avatar-color': executive.color } as React.CSSProperties}
                onClick={() => selectAndIntroduce(executive)}
              >
                <div className="avatar-card-image-wrap">
                  <img src={executive.avatar} alt="" className="avatar-card-image" />
                  <div className="avatar-card-wave" aria-hidden="true"><span /><span /><span /></div>
                </div>
                <div className="avatar-card-copy">
                  <strong>{executive.name}</strong>
                  <span>{executive.abbr} · {executive.role}</span>
                  <small>{speaking ? 'Speaking now' : active && listening ? 'Listening now' : 'Tap to talk'}</small>
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
