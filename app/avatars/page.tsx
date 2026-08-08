'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { executives } from '../../lib/executives';

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

const voiceHints: Record<string, string[]> = {
  Heather: ['Samantha', 'Ava', 'Karen', 'female'],
  Nova: ['Samantha', 'Ava', 'Zira', 'female'],
  Scout: ['Daniel', 'Alex', 'male'],
  Atlas: ['Aaron', 'Daniel', 'male'],
  Oracle: ['Samantha', 'Ava', 'female'],
  Ethos: ['Daniel', 'Alex', 'male'],
  Ledger: ['Daniel', 'Alex', 'male'],
  Eva: ['Moira', 'Fiona', 'Samantha', 'Ava', 'female'],
};

const voiceSettings: Record<string, { rate: number; pitch: number }> = {
  Heather: { rate: 1.02, pitch: 1.05 },
  Nova: { rate: 0.96, pitch: 1.02 },
  Scout: { rate: 1.02, pitch: 0.96 },
  Atlas: { rate: 0.96, pitch: 0.92 },
  Oracle: { rate: 0.98, pitch: 1.02 },
  Ethos: { rate: 0.9, pitch: 0.9 },
  Ledger: { rate: 0.94, pitch: 0.9 },
  Eva: { rate: 0.98, pitch: 1.08 },
};

function introFor(executive: Executive) {
  if (executive.name === 'Eva') {
    return 'Hello Jim. Eva here. The executive voice room is online. You can speak naturally, and in hands-free mode I will keep the conversation moving without making you tap between turns. What shall we tackle first?';
  }
  return `Hello Jim. I am ${executive.name}, your ${executive.role}. My focus is ${executive.focus}. I am ready when you are.`;
}

function findVoice(name: string, voices: SpeechSynthesisVoice[]) {
  const hints = voiceHints[name] ?? [];
  for (const hint of hints) {
    const voice = voices.find((candidate) =>
      `${candidate.name} ${candidate.lang}`.toLowerCase().includes(hint.toLowerCase()),
    );
    if (voice) return voice;
  }
  return voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ?? voices[0];
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
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const handsFreeRef = useRef(false);
  const busyRef = useRef(false);

  const selected = useMemo(
    () => executives.find((executive) => executive.name === selectedName) ?? executives[0],
    [selectedName],
  );

  useEffect(() => {
    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    const canListen = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSpeechSupported(canSpeak);
    setRecognitionSupported(canListen);

    return () => {
      handsFreeRef.current = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      try { recognitionRef.current?.abort?.(); } catch {}
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []);

  function stopListening() {
    try { recognitionRef.current?.abort?.(); } catch {}
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    setListening(false);
  }

  function stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingName('');
  }

  function resumeHandsFree(delay = 450) {
    if (!handsFreeRef.current || busyRef.current) return;
    window.setTimeout(() => {
      if (handsFreeRef.current && !busyRef.current) startListening(true);
    }, delay);
  }

  function speak(executive: Executive, text: string) {
    if (!voiceEnabled || !speechSupported || !text.trim()) {
      resumeHandsFree();
      return;
    }

    stopListening();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = findVoice(executive.name, voices);
    const settings = voiceSettings[executive.name] ?? { rate: 1, pitch: 1 };

    if (voice) utterance.voice = voice;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = 1;
    utterance.onstart = () => setSpeakingName(executive.name);
    utterance.onboundary = () => setSpeechBeat((beat) => beat + 1);
    utterance.onend = () => {
      setSpeakingName('');
      resumeHandsFree(350);
    };
    utterance.onerror = () => {
      setSpeakingName('');
      resumeHandsFree(500);
    };
    window.speechSynthesis.speak(utterance);
  }

  function selectAndIntroduce(executive: Executive) {
    stopListening();
    setSelectedName(executive.name);
    const intro = introFor(executive);
    setReply(intro);
    speak(executive, intro);
  }

  function startListening(autoSend = false) {
    if (busyRef.current || speakingName) return;
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
      speak(selected, data.reply);
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
            <p>Choose an executive, speak naturally, and hear the answer out loud. Hands-Free automatically listens again after each spoken response.</p>
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
              {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
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
              <div className="avatar-online">● Online</div>
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
                <p>{handsFree ? 'Hands-Free loop active: listen → answer → speak → listen again.' : 'Type, dictate, or turn on Hands-Free.'}</p>
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
            {!speechSupported && <div className="avatar-browser-note">This browser does not expose speech synthesis. Written answers will still work.</div>}
            {!recognitionSupported && <div className="avatar-browser-note">This browser does not expose speech recognition. Spoken answers still work, but voice input needs a supported browser.</div>}
            <div className="avatar-sync-note">Portrait motion is synchronized to browser speech events. The restored code does not claim phoneme-level mouth reshaping from a static photo.</div>
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
