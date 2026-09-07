'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { executives } from '../../lib/executives';

type Executive = (typeof executives)[number];
type ChatMessage = { role: 'user' | 'assistant'; content: string };

type SpeechRecognitionLike = {
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

export default function VoiceRoom() {
  const [selectedName, setSelectedName] = useState('Eva');
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [lastHeard, setLastHeard] = useState('');
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [micAvailable, setMicAvailable] = useState(true);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const meterRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const handsFreeRef = useRef(false);
  const busyRef = useRef(false);

  const selected = useMemo(
    () => executives.find((executive) => executive.name === selectedName) ?? executives.find((executive) => executive.id === 'eva') ?? executives[0],
    [selectedName],
  );

  useEffect(() => {
    const canRecord = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && Boolean((navigator as any).mediaDevices?.getUserMedia);
    const canRecognize = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setMicAvailable(canRecord || canRecognize);
    return () => {
      handsFreeRef.current = false;
      stopCapture(true);
      stopAudio();
    };
  }, []);

  function cleanStream() {
    if (meterRef.current !== null) {
      window.clearInterval(meterRef.current);
      meterRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }

  function stopCapture(cancel: boolean) {
    try { recognitionRef.current?.abort?.(); } catch {}
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      if (cancel) recorder.onstop = null;
      try { recorder.stop(); } catch {}
    }
    if (cancel) {
      cleanStream();
      chunksRef.current = [];
      setListening(false);
      setTranscribing(false);
    }
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setSpeaking(false);
  }

  function resumeHandsFree(delay = 650) {
    if (!handsFreeRef.current || busyRef.current) return;
    window.setTimeout(() => {
      if (handsFreeRef.current && !busyRef.current && !speaking) void startListening(true);
    }, delay);
  }

  async function speakAnswer(text: string) {
    if (!text.trim()) return;
    stopCapture(true);
    stopAudio();
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive: selected.name, text }),
      });
      if (!response.ok) throw new Error('Voice playback failed.');
      const blob = await response.blob();
      if (!blob.size) throw new Error('Voice playback was empty.');
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioUrlRef.current = url;
      audioRef.current = audio;
      setSpeaking(true);
      audio.onended = () => {
        stopAudio();
        resumeHandsFree(450);
      };
      audio.onerror = () => {
        stopAudio();
        resumeHandsFree(650);
      };
      await audio.play();
    } catch {
      setSpeaking(false);
      resumeHandsFree(700);
    }
  }

  async function askExecutive(questionOverride?: string) {
    const question = (questionOverride ?? input).trim();
    if (!question || busyRef.current) return;
    stopCapture(true);
    busyRef.current = true;
    setThinking(true);
    setReply(`${selected.name} is thinking…`);
    try {
      const messages: ChatMessage[] = [{ role: 'user', content: question }];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive: selected.name, messages }),
      });
      const data = await response.json() as { reply?: string; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error || `${selected.name} could not answer.`);
      setReply(data.reply);
      setInput('');
      busyRef.current = false;
      setThinking(false);
      await speakAnswer(data.reply);
      return;
    } catch (error) {
      setReply(error instanceof Error ? error.message : 'Eva could not answer that turn.');
    } finally {
      busyRef.current = false;
      setThinking(false);
    }
    resumeHandsFree();
  }

  async function transcribe(blob: Blob, autoSend: boolean) {
    if (blob.size < 900) {
      setReply('I did not catch enough audio. Tap Speak and try again.');
      setTranscribing(false);
      resumeHandsFree();
      return;
    }
    setListening(false);
    setTranscribing(true);
    setReply('Eva is transcribing your voice…');
    try {
      const form = new FormData();
      const ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm';
      form.append('audio', blob, `eva-voice.${ext}`);
      const response = await fetch('/api/transcribe', { method: 'POST', body: form });
      const data = await response.json() as { text?: string; error?: string };
      if (!response.ok || !data.text) throw new Error(data.error || 'I could not understand that recording.');
      const transcript = data.text.trim();
      setLastHeard(transcript);
      setInput(transcript);
      setReply(`I heard: “${transcript}”`);
      setTranscribing(false);
      if (autoSend || handsFreeRef.current) await askExecutive(transcript);
    } catch (error) {
      setTranscribing(false);
      setReply(error instanceof Error ? error.message : 'Eva could not transcribe the recording.');
      resumeHandsFree(900);
    }
  }

  async function startRecorder(autoSend: boolean) {
    stopAudio();
    stopCapture(true);
    try {
      const stream = await (navigator as any).mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      }) as MediaStream;
      streamRef.current = stream;

      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
      const mimeType = types.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      const startedAt = Date.now();
      let speechDetected = false;
      let lastSoundAt = startedAt;

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = [...chunksRef.current];
        const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
        cleanStream();
        chunksRef.current = [];
        setListening(false);
        if (!chunks.length) {
          setReply('No microphone audio arrived. Please try again.');
          return;
        }
        void transcribe(new Blob(chunks, { type }), autoSend);
      };

      recorder.start(250);
      setListening(true);
      setReply('Listening. Speak normally, then pause.');

      try {
        const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextCtor) {
          const context = new AudioContextCtor() as AudioContext;
          audioContextRef.current = context;
          const analyser = context.createAnalyser();
          analyser.fftSize = 1024;
          context.createMediaStreamSource(stream).connect(analyser);
          const samples = new Uint8Array(analyser.fftSize);
          meterRef.current = window.setInterval(() => {
            if (recorder.state !== 'recording') return;
            analyser.getByteTimeDomainData(samples);
            let energy = 0;
            for (let i = 0; i < samples.length; i += 1) {
              const value = (samples[i] - 128) / 128;
              energy += value * value;
            }
            const rms = Math.sqrt(energy / samples.length);
            const now = Date.now();
            if (rms > 0.022) {
              speechDetected = true;
              lastSoundAt = now;
            }
            if ((speechDetected && now - lastSoundAt > 1500) || now - startedAt > 45000) {
              try { recorder.stop(); } catch {}
            }
          }, 120);
        } else {
          window.setTimeout(() => {
            if (recorder.state === 'recording') try { recorder.stop(); } catch {}
          }, 20000);
        }
      } catch {
        window.setTimeout(() => {
          if (recorder.state === 'recording') try { recorder.stop(); } catch {}
        }, 20000);
      }
    } catch (error: any) {
      cleanStream();
      setListening(false);
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        handsFreeRef.current = false;
        setHandsFree(false);
        setReply('Microphone permission is blocked. Allow microphone access for aridon-v02.vercel.app, then tap Speak again.');
        return;
      }
      startBrowserRecognition(autoSend);
    }
  }

  function startBrowserRecognition(autoSend: boolean) {
    const Constructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Constructor) {
      setMicAvailable(false);
      setReply('This browser is not exposing a microphone to Aridon. Open the site in Chrome or type your request.');
      return;
    }
    const recognition = new Constructor() as SpeechRecognitionLike;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      setListening(false);
      recognitionRef.current = null;
      if (!transcript) {
        setReply('I did not catch that. Try again.');
        return;
      }
      setLastHeard(transcript);
      setInput(transcript);
      setReply(`I heard: “${transcript}”`);
      if (autoSend || handsFreeRef.current) void askExecutive(transcript);
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      recognitionRef.current = null;
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        handsFreeRef.current = false;
        setHandsFree(false);
        setReply('Microphone permission is blocked. Allow it for this site, then try again.');
      } else {
        setReply(`Voice recognition stopped${event?.error ? `: ${event.error}` : ''}. Try again.`);
      }
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setListening(true);
    setReply('Listening…');
    try { recognition.start(); } catch { setListening(false); }
  }

  async function startListening(autoSend = true) {
    if (busyRef.current || thinking || transcribing || speaking) return;
    const canRecord = typeof MediaRecorder !== 'undefined' && Boolean((navigator as any).mediaDevices?.getUserMedia);
    if (canRecord) await startRecorder(autoSend);
    else startBrowserRecognition(autoSend);
  }

  function toggleHandsFree() {
    const next = !handsFreeRef.current;
    handsFreeRef.current = next;
    setHandsFree(next);
    if (!next) {
      stopCapture(true);
      setReply('Hands-Free is off.');
      return;
    }
    setReply(`${selected.name} is opening the microphone.`);
    void startListening(true);
  }

  function stopAll() {
    handsFreeRef.current = false;
    setHandsFree(false);
    stopCapture(true);
    stopAudio();
    setReply('Stopped. Tap Speak when you are ready.');
  }

  const status = listening ? 'LISTENING' : transcribing ? 'TRANSCRIBING' : thinking ? 'THINKING' : speaking ? 'SPEAKING' : handsFree ? 'HANDS-FREE READY' : 'READY';

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 70% 0,#153555,#07101D 42%,#040A11)', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: 18 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <div><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: '.14em' }}>ARIDON · VOICE COMMAND</div><h1 style={{ margin: '7px 0 5px', fontSize: 'clamp(30px,5vw,54px)' }}>Talk to Eva. She should hear you now.</h1><p style={{ color: '#AAB9CA', margin: 0, maxWidth: 760, lineHeight: 1.55 }}>Aridon records the microphone turn, transcribes the actual audio, sends the transcript to the selected executive, then speaks the answer back.</p></div>
          <Link href="/dashboard" style={{ color: '#9EF0CF', textDecoration: 'none', fontWeight: 900 }}>← Command Center</Link>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px,420px)', gap: 14 }}>
          <div style={panel}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 140, height: 140, borderRadius: 22, overflow: 'hidden', border: `2px solid ${selected.color}`, background: '#102033' }}><img src={selected.avatar} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div style={{ flex: 1, minWidth: 220 }}><div style={{ color: '#66D9EF', fontSize: 11, fontWeight: 950 }}>{status}</div><h2 style={{ fontSize: 32, margin: '5px 0' }}>{selected.name}</h2><div style={{ color: '#AAB9CA', fontWeight: 800 }}>{selected.role}</div><p style={{ color: '#AAB9CA', lineHeight: 1.5 }}>{selected.tagline}</p></div>
            </div>

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
              <button onClick={() => void startListening(true)} disabled={listening || transcribing || thinking || speaking} style={{ ...button, background: listening ? '#FFC857' : '#9EF0CF', color: '#07130F' }}>{listening ? '🎙 Listening…' : transcribing ? 'Transcribing…' : '🎙 Speak to Eva'}</button>
              <button onClick={toggleHandsFree} disabled={thinking || transcribing} style={{ ...button, background: handsFree ? '#66D9EF' : '#14253A', color: handsFree ? '#04202A' : '#F8FAFC' }}>{handsFree ? 'Hands-Free On' : 'Start Hands-Free'}</button>
              <button onClick={stopAll} style={{ ...button, background: '#14253A', color: '#F8FAFC' }}>Stop</button>
            </div>

            {lastHeard && <div style={{ marginTop: 15, padding: 13, borderRadius: 13, background: '#071A26', border: '1px solid #31566D' }}><div style={{ color: '#66D9EF', fontSize: 10, fontWeight: 950 }}>WHAT EVA HEARD</div><div style={{ marginTop: 6, lineHeight: 1.5 }}>{lastHeard}</div></div>}

            <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="You can also type a request here…" style={{ width: '100%', minHeight: 110, marginTop: 15, borderRadius: 13, border: '1px solid #294058', background: '#07111D', color: '#F8FAFC', padding: 13, font: 'inherit', resize: 'vertical' }} />
            <button onClick={() => void askExecutive()} disabled={!input.trim() || thinking || transcribing} style={{ ...button, marginTop: 9, background: '#66D9EF', color: '#04202A' }}>Send Typed Request</button>

            <div aria-live="polite" style={{ marginTop: 15, minHeight: 90, padding: 15, borderRadius: 14, background: '#0A1624', border: '1px solid #20344A', color: '#DCE6F1', lineHeight: 1.6 }}>{reply || 'Tap Speak to Eva, talk normally, then pause. The “What Eva Heard” box will show the transcript before her answer.'}</div>
            {!micAvailable && <div style={{ marginTop: 10, color: '#FFC857', fontWeight: 800 }}>The browser is not exposing microphone input. Open Aridon in Chrome on Android or type the request.</div>}
          </div>

          <aside style={panel}>
            <div style={{ color: '#9EF0CF', fontSize: 10, fontWeight: 950, letterSpacing: '.12em' }}>AI EXECUTIVE TEAM</div>
            <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
              {executives.map((executive) => <button key={executive.id} onClick={() => { stopAll(); setSelectedName(executive.name); setReply(`${executive.name} selected. Tap Speak when you are ready.`); }} style={{ display: 'grid', gridTemplateColumns: '42px 1fr', gap: 10, alignItems: 'center', textAlign: 'left', borderRadius: 12, border: executive.name === selected.name ? `1px solid ${executive.color}` : '1px solid #20344A', background: executive.name === selected.name ? '#10243A' : '#091522', color: '#F8FAFC', padding: 8, cursor: 'pointer' }}><img src={executive.avatar} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover' }} /><span><strong style={{ display: 'block', fontSize: 13 }}>{executive.name}</strong><span style={{ color: '#8EA2B8', fontSize: 10 }}>{executive.abbr}</span></span></button>)}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

const panel = { background: 'linear-gradient(180deg,#0E1D2E,#081420)', border: '1px solid #20344A', borderRadius: 20, padding: 18, boxShadow: '0 18px 50px rgba(0,0,0,.24)' } as const;
const button = { border: '1px solid #294058', borderRadius: 11, padding: '11px 15px', fontWeight: 950, cursor: 'pointer' } as const;
