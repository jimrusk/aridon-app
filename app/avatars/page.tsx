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
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

const voiceHints: Record<string, string[]> = {
  Heather: ['Samantha', 'Ava', 'Karen', 'female'],
  Ethos: ['Daniel', 'Alex', 'male'],
  Atlas: ['Aaron', 'Daniel', 'male'],
  Eva: ['Moira', 'Fiona', 'Samantha', 'Ava', 'female'],
  Scout: ['Samantha', 'Ava', 'female'],
  Ledger: ['Daniel', 'Alex', 'male'],
  Oracle: ['Samantha', 'Ava', 'female'],
};

const voiceSettings: Record<string, { rate: number; pitch: number }> = {
  Heather: { rate: 1.02, pitch: 1.05 },
  Ethos: { rate: 0.9, pitch: 0.9 },
  Atlas: { rate: 0.96, pitch: 0.92 },
  Eva: { rate: 0.98, pitch: 1.08 },
  Scout: { rate: 1.06, pitch: 1.08 },
  Ledger: { rate: 0.94, pitch: 0.9 },
  Oracle: { rate: 0.98, pitch: 1.02 },
};

function introFor(executive: Executive) {
  if (executive.name === 'Eva') {
    return "Hello Jim. Eva here. I am back in the Aridon command center and ready to help you think through strategy, protect the company, and keep every project moving. What shall we tackle first?";
  }

  return `Hello Jim. I am ${executive.name}, your ${executive.role}. My focus is ${executive.focus}. Select me whenever you want help in this part of Aridon.`;
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
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const selected = useMemo(
    () => executives.find((executive) => executive.name === selectedName) ?? executives[0],
    [selectedName],
  );

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    );

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop();
    };
  }, []);

  function stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingName('');
  }

  function speak(executive: Executive, text: string) {
    if (!voiceEnabled || !speechSupported || !text.trim()) return;

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
    utterance.onend = () => setSpeakingName('');
    utterance.onerror = () => setSpeakingName('');
    window.speechSynthesis.speak(utterance);
  }

  function selectAndIntroduce(executive: Executive) {
    setSelectedName(executive.name);
    setReply(introFor(executive));
    speak(executive, introFor(executive));
  }

  function startListening() {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setReply('Voice input is not available in this browser. You can still type your question below.');
      return;
    }

    const recognition = new SpeechRecognitionConstructor() as BrowserSpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      setInput(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  async function askExecutive() {
    if (!input.trim() || busy) return;

    const question = input.trim();
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
      if (!response.ok || !data.reply) {
        throw new Error(data.error || `${selected.name} could not answer right now.`);
      }
      setReply(data.reply);
      speak(selected, data.reply);
      setInput('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The executive voice room is temporarily unavailable.';
      setReply(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="avatar-room">
      <div className="avatar-room-shell">
        <header className="avatar-room-header">
          <div>
            <div className="avatar-room-brand">ARIDON</div>
            <h1>Talking Executive Avatars</h1>
            <p>Select an executive, hear an introduction, or ask a question and receive a spoken answer.</p>
          </div>
          <div className="avatar-room-header-actions">
            <button
              className={`voice-toggle ${voiceEnabled ? 'on' : ''}`}
              onClick={() => {
                if (voiceEnabled) stopSpeaking();
                setVoiceEnabled((enabled) => !enabled);
              }}
            >
              {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
            </button>
            <Link href="/" className="avatar-back-link">← Command Center</Link>
          </div>
        </header>

        <section className="avatar-stage">
          <div className={`avatar-feature ${speakingName === selected.name ? 'is-speaking' : ''}`}>
            <div className="avatar-feature-image-wrap" style={{ '--avatar-color': selected.color } as React.CSSProperties}>
              <img src={selected.avatar} alt={`${selected.name}, ${selected.role}`} className="avatar-feature-image" />
              <div className="avatar-speaking-ring" />
              <div className="avatar-wave" aria-hidden="true">
                <span /><span /><span /><span /><span />
              </div>
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
                <button className="avatar-secondary" onClick={stopSpeaking}>■ Stop</button>
              </div>
            </div>
          </div>

          <div className="avatar-conversation">
            <div className="avatar-conversation-head">
              <div>
                <h3>Talk with {selected.name}</h3>
                <p>Answers use the same Aridon executive intelligence as Heather Chat.</p>
              </div>
              <button className={`avatar-mic ${listening ? 'listening' : ''}`} onClick={startListening}>
                {listening ? 'Listening…' : '🎙 Dictate'}
              </button>
            </div>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Ask ${selected.name} about Aridon, AWG-1000, partners, funding, engineering, risk, finance, or outreach…`}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') askExecutive();
              }}
            />
            <button className="avatar-primary avatar-ask" onClick={askExecutive} disabled={busy || !input.trim()}>
              {busy ? `${selected.name} is thinking…` : `Ask ${selected.name} and Speak Answer`}
            </button>
            <div className="avatar-reply" aria-live="polite">
              {reply || `Tap “Hear ${selected.name}” for an introduction, or ask a question above.`}
            </div>
            {!speechSupported && (
              <div className="avatar-browser-note">This browser does not expose speech synthesis. Written answers will still work.</div>
            )}
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
                  <small>Tap to talk</small>
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
