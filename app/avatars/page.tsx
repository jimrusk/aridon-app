'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { executives } from '../../lib/executives';

type Executive = (typeof executives)[number];
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type VoiceEngine = 'studio' | 'unavailable';
type RoomStatus = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error';

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
    return 'Hello Jim. Eva here. My microphone system is online. Tap Start Hands-Free or Speak to Eva, talk normally, and I will transcribe the actual microphone recording before I answer. What shall we tackle first?';
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
  const [transcribing, setTranscribing] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>('studio');
  const [status, setStatus] = useState<RoomStatus>('idle');
  const [lastHeard, setLastHeard] = useState('');

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const meterRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
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
    const media = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined');
    const browserSpeech = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setMicSupported(media || browserSpeech);

    return () => {
      handsFreeRef.current = false;
      playbackIdRef.current += 1;
      cancelListening();
      releaseAudio();
    };
  }, []);

  function cleanupCapture() {
    if (meterRef.current !== null) {
      window.clearInterval(meterRef.current);
      meterRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
  }

  function cancelListening() {
    try { recognitionRef.current?.abort?.(); } catch {}
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.onstop = null;
        recorder.stop();
      } catch {}
    }
    cleanupCapture();
    chunksRef.current = [];
    setListening(false);
    setTranscribing(false);
    setStatus((current) => current === 'listening' || current === 'transcribing' ? 'idle' : current);
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
    setStatus('idle');
  }

  function resumeHandsFree(delay = 500) {
    if (!handsFreeRef.current || busyRef.current) return;
    window.setTimeout(() => {
      if (handsFreeRef.current && !busyRef.current && !audioRef.current) void startListening(true);
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

    cancelListening();
    stopSpeaking();
    const playbackId = playbackIdRef.current;
    setSpeakingName(executive.name);
    setStatus('speaking');
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
        if (playbackId === playbackIdRef.current) {
          setSpeakingName(executive.name);
          setStatus('speaking');
        }
      };
      audio.ontimeupdate = () => {
        if (playbackId === playbackIdRef.current) setSpeechBeat((beat) => beat + 1);
      };
      audio.onended = () => {
        if (playbackId !== playbackIdRef.current) return;
        releaseAudio();
        setSpeakingName('');
        setStatus('idle');
        resumeHandsFree(450);
      };
      audio.onerror = () => {
        if (playbackId !== playbackIdRef.current) return;
        releaseAudio();
        setSpeakingName('');
        setVoiceEngine('unavailable');
        setStatus('idle');
        resumeHandsFree(600);
      };

      await audio.play();
    } catch (error) {
      if (playbackId !== playbackIdRef.current) return;
      console.warn('Studio voice unavailable. Written answer remains available.', error);
      releaseAudio();
      setSpeakingName('');
      setVoiceEngine('unavailable');
      setStatus('idle');
      resumeHandsFree(600);
    }
  }

  function selectAndIntroduce(executive: Executive) {
    cancelListening();
    setSelectedName(executive.name);
    const intro = introFor(executive);
    setReply(intro);
    void speak(executive, intro);
  }

  async function transcribeRecording(blob: Blob, autoSend: boolean) {
    if (!blob.size || blob.size < 900) {
      setReply('I did not catch enough audio. Tap the microphone and speak again.');
      setStatus('idle');
      resumeHandsFree(700);
      return;
    }

    setListening(false);
    setTranscribing(true);
    setStatus('transcribing');
    setReply('Eva is transcribing what you said…');

    try {
      const form = new FormData();
      const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm';
      form.append('audio', blob, `eva-microphone.${extension}`);
      const response = await fetch('/api/transcribe', { method: 'POST', body: form });
      const data = await response.json() as { text?: string; error?: string };
      if (!response.ok || !data.text) throw new Error(data.error || 'Eva could not understand that recording.');

      const transcript = data.text.trim();
      setInput(transcript);
      setLastHeard(transcript);
      setReply(`I heard: “${transcript}”`);
      setTranscribing(false);
      setStatus('idle');

      if (autoSend || handsFreeRef.current) await askExecutive(transcript);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Eva could not transcribe the microphone recording.';
      setTranscribing(false);
      setStatus('error');
      setReply(message);
      if (handsFreeRef.current) resumeHandsFree(900);
    }
  }

  async function startMediaRecording(autoSend: boolean) {
    try {
      cancelListening();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const preferred = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      const startedAt = Date.now();
      let heardSpeech = false;
      let lastVoiceAt = startedAt;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = [...chunksRef.current];
        const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
        cleanupCapture();
        chunksRef.current = [];
        setListening(false);
        if (!chunks.length) {
          setStatus('idle');
          setReply('I did not receive any microphone audio. Please try again.');
          return;
        }
        void transcribeRecording(new Blob(chunks, { type }), autoSend);
      };

      recorder.start(250);
      setListening(true);
      setStatus('listening');
      setReply(autoSend ? 'Eva is listening. Speak normally. I will answer when you pause.' : 'Listening now. Speak normally. I will stop when you pause.');

      try {
        const AudioContextConstructor = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextConstructor) {
          const context = new AudioContextConstructor() as AudioContext;
          audioContextRef.current = context;
          const analyser = context.createAnalyser();
          analyser.fftSize = 1024;
          const source = context.createMediaStreamSource(stream);
          source.connect(analyser);
          const samples = new Uint8Array(analyser.fftSize);

          meterRef.current = window.setInterval(() => {
            if (!recorderRef.current || recorder.state !== 'recording') return;
            analyser.getByteTimeDomainData(samples);
            let sum = 0;
            for (let i = 0; i < samples.length; i += 1) {
              const value = (samples[i] - 128) / 128;
              sum += value * value;
            }
            const rms = Math.sqrt(sum / samples.length);
            const now = Date.now();
            if (rms > 0.022) {
              heardSpeech = true;
              lastVoiceAt = now;
            }
            if (heardSpeech && now - lastVoiceAt > 1450 && now - startedAt > 1200) {
              try { recorder.stop(); } catch {}
            } else if (now - startedAt > 45000) {
              try { recorder.stop(); } catch {}
            }
          }, 110);
        }
      } catch {
        window.setTimeout(() => {
          if (recorderRef.current === recorder && recorder.state === 'recording') {
            try { recorder.stop(); } catch {}
          }
        }, 20000);
      }
    } catch (error: any) {
      cleanupCapture();
      setListening(false);
      setStatus('error');
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        handsFreeRef.current = false;
        setHandsFree(false);
        setReply('Microphone permission is blocked. Allow microphone access for aridon-v02.vercel.app, then tap Start Hands-Free again.');
      } else {
        setReply('I could not open the microphone. I will try the browser speech fallback.');
        startBrowserSpeechListening(autoSend);
      }
    }
  }

  function startBrowserSpeechListening(autoSend: boolean) {
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      setMicSupported(false);
      setReply('This browser is not giving Aridon microphone access. You can still type your request below.');
      setStatus('error');
      return;
    }

    try { recognitionRef.current?.abort?.(); } catch {}
    const recognition = new SpeechRecognitionConstructor() as BrowserSpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
      setListening(false);
      recognitionRef.current = null;
      if (!transcript) {
        setReply('I did not catch that. Please try again.');
        resumeHandsFree();
        return;
      }
      setInput(transcript);
      setLastHeard(transcript);
      setReply(`I heard: “${transcript}”`);
      if (autoSend || handsFreeRef.current) void askExecutive(transcript);
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      setStatus('error');
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setReply('Microphone permission is blocked. Allow microphone access for this site, then try again.');
        handsFreeRef.current = false;
        setHandsFree(false);
        return;
      }
      setReply(`Voice recognition stopped${event?.error ? `: ${event.error}` : ''}. Please try again.`);
      if (handsFreeRef.current && event?.error !== 'aborted') resumeHandsFree(800);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setListening(true);
    setStatus('listening');
    setReply('Listening now…');
    try { recognition.start(); } catch { setListening(false); }
  }

  async function startListening(autoSend = false) {
    if (busyRef.current || speakingName || audioRef.current || transcribing) return;
    stopSpeaking();

    const canRecord = Boolean(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined');
    if (canRecord) {
      await startMediaRecording(autoSend);
      return;
    }
    startBrowserSpeechListening(autoSend);
  }

  async function askExecutive(questionOverride?: string) {
    const question = (questionOverride ?? input).trim();
    if (!question || busyRef.current) return;

    cancelListening();
    busyRef.current = true;
    setBusy(true);
    setStatus('thinking');
    setReply(`${selected.name} is thinking…`);
    try {
      const messages: ChatMessage[] = [{ role: 'user', content: question }];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive: selected.name, messages }),
      });
      const data = await response.json() as { reply?: string; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error || `${selected.name} could not answer right now.`);
      setReply(data.reply);
      setInput('');
      busyRef.current = false;
      setBusy(false);
      setStatus('idle');
      void speak(selected, data.reply);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The executive voice room is temporarily unavailable.';
      setReply(message);
      setStatus('error');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    resumeHandsFree(800);
  }

  function toggleHandsFree() {
    const next = !handsFreeRef.current;
    handsFreeRef.current = next;
    setHandsFree(next);
    if (!next) {
      cancelListening();
      setReply((current) => current || 'Hands-Free is off.');
      return;
    }
    if (!micSupported) {
      handsFreeRef.current = false;
      setHandsFree(false);
      setReply('This browser is not exposing a microphone to Aridon. Type your question below or open the site in Chrome.');
      return;
    }
    stopSpeaking();
    setReply(`Hands-Free is on. ${selected.name} is opening the microphone now.`);
    void startListening(true);
  }

  function stopEverything() {
    handsFreeRef.current = false;
    setHandsFree(false);
    cancelListening();
    stopSpeaking();
    setReply('Stopped. Tap Speak to Eva or Start Hands-Free when you are ready.');
  }

  const isSelectedSpeaking = speakingName === selected.name;
  const statusLabel = listening ? '● Listening' : transcribing ? '● Transcribing' : busy ? '● Thinking' : isSelectedSpeaking ? '● Speaking' : handsFree ? '● Ready' : status === 'error' ? '● Check mic' : '● Ready';

  return (
    <main className="avatar-room">
      <div className="avatar-room-shell">
        <header className="avatar-room-header">
          <div>
            <div className="avatar-room-brand">ARIDON</div>
            <h1>Eva Voice Command Room</h1>
            <p>Your microphone audio is now recorded and transcribed on the server before Eva answers. Speak normally and pause when you are finished.</p>
          </div>
          <div className="avatar-room-header-actions">
            <button className={`handsfree-toggle ${handsFree ? 'on' : ''}`} onClick={toggleHandsFree} disabled={busy || transcribing}>
              {handsFree ? '🎙 Hands-Free On' : '🎙 Start Hands-Free'}
            </button>
            <button
              className={`voice-toggle ${voiceEnabled ? 'on' : ''}`}
              onClick={() => {
                if (voiceEnabled) stopSpeaking();
                setVoiceEnabled((enabled) => !enabled);
              }}
            >
              {voiceEnabled ? '🔊 Eva Voice On' : '🔇 Eva Voice Off'}
            </button>
            <Link href="/dashboard" className="avatar-back-link">← Command Center</Link>
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
              <div className="avatar-online">● Online · {voiceEngine === 'studio' ? 'Natural voice' : 'Written reply available'}</div>
              <h2>{selected.name}</h2>
              <div className="avatar-role">{selected.role}</div>
              <p>{selected.tagline}</p>
              <div className="avatar-expertise">
                {selected.expertise.map((item) => <span key={item}>{item}</span>)}
              </div>
              <div className="avatar-feature-actions">
                <button className="avatar-primary" onClick={() => void startListening(true)} disabled={busy || transcribing || isSelectedSpeaking}>
                  {listening ? '🎙 Listening…' : transcribing ? 'Transcribing…' : `🎙 Speak to ${selected.name}`}
                </button>
                <button className="avatar-secondary" onClick={() => selectAndIntroduce(selected)}>▶ Test Eva Voice</button>
                <button className="avatar-secondary" onClick={stopEverything}>■ Stop</button>
              </div>
            </div>
          </div>

          <div className="avatar-conversation">
            <div className="avatar-conversation-head">
              <div>
                <h3>Talk with {selected.name}</h3>
                <p>{handsFree ? 'Hands-Free: listen → transcribe → answer → listen again.' : 'Tap Speak to Eva, talk, then pause. Eva will answer automatically.'}</p>
              </div>
              <div className={`voice-status ${listening ? 'listening' : isSelectedSpeaking ? 'speaking' : handsFree ? 'ready' : ''}`}>{statusLabel}</div>
            </div>

            {lastHeard && <div className="avatar-browser-note" style={{ borderColor: '#4FB7C5' }}><strong>Last heard:</strong> {lastHeard}</div>}

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Or type a request to ${selected.name}…`}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void askExecutive();
              }}
            />
            <button className="avatar-primary avatar-ask" onClick={() => void askExecutive()} disabled={busy || transcribing || !input.trim()}>
              {busy ? `${selected.name} is thinking…` : `Send Typed Request to ${selected.name}`}
            </button>
            <div className="avatar-reply" aria-live="polite">
              {reply || `Tap “Speak to ${selected.name}” and start talking. The screen will show exactly what I heard before I answer.`}
            </div>
            {!micSupported && <div className="avatar-browser-note">This browser is not exposing a microphone. Open Aridon in Chrome on Android or type your request.</div>}
            {voiceEngine === 'unavailable' && <div className="avatar-browser-note">Eva heard and answered, but natural voice playback could not start this turn. The written answer remains above.</div>}
            <div className="avatar-sync-note">For privacy and reliability, microphone recording is captured only while the room shows Listening. Hands-Free restarts listening after Eva finishes speaking.</div>
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
                onClick={() => {
                  cancelListening();
                  stopSpeaking();
                  setSelectedName(executive.name);
                  setReply(`${executive.name} is selected. Tap Speak to ${executive.name} when you are ready.`);
                }}
                style={{ '--avatar-color': executive.color } as React.CSSProperties}
              >
                <div className="avatar-card-image-wrap">
                  <img src={executive.avatar} alt={executive.name} className="avatar-card-image" />
                </div>
                <div className="avatar-card-copy">
                  <strong>{executive.name}</strong>
                  <span>{executive.abbr}</span>
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
