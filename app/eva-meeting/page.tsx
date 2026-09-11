'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { EVA_AVATAR } from '../../lib/evaIdentity';
import { getBrowserClient } from '../../lib/supabase';

type LiveCreateResponse = {
  session?: { id?: string };
  transport?: { type?: string; sdp?: string };
};

type LiveEvent = {
  type?: string;
  session?: { id?: string };
  delta?: string;
  error?: { message?: string };
  event?: { type?: string };
};

type AuthState = 'checking' | 'ready' | 'signed-out';
type ConnectionState = 'idle' | 'connecting' | 'live' | 'closing' | 'error';

const MAX_CAPTION_CHARS = 12_000;

function appendCaption(previous: string, fragment: string) {
  const next = previous + fragment;
  return next.length > MAX_CAPTION_CHARS ? next.slice(next.length - MAX_CAPTION_CHARS) : next;
}

async function waitForIce(connection: RTCPeerConnection) {
  if (connection.iceGatheringState === 'complete') return;
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      connection.removeEventListener('icegatheringstatechange', onState);
      reject(new Error('Timed out while preparing the secure audio connection.'));
    }, 10_000);

    function onState() {
      if (connection.iceGatheringState !== 'complete') return;
      window.clearTimeout(timeout);
      connection.removeEventListener('icegatheringstatechange', onState);
      resolve();
    }

    connection.addEventListener('icegatheringstatechange', onState);
    onState();
  });
}

export default function EvaMeetingPage() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [status, setStatus] = useState('Checking your Aridon session…');
  const [backendStatus, setBackendStatus] = useState('Meeting intelligence is ready.');
  const [roomCaption, setRoomCaption] = useState('');
  const [evaCaption, setEvaCaption] = useState('');
  const [muted, setMuted] = useState(false);
  const [mutePending, setMutePending] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('Aridon Partner Meeting');
  const [meetingGoal, setMeetingGoal] = useState('Explain Aridon clearly, identify the partner fit, agree on a measurable next step, and capture owners and follow-up actions.');
  const [meetUrl, setMeetUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const eventsRef = useRef<RTCDataChannel | null>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const finalizedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title');
    const goal = params.get('goal');
    const meet = params.get('meet');
    if (title) setMeetingTitle(title.slice(0, 180));
    if (goal) setMeetingGoal(goal.slice(0, 1200));
    if (meet && /^https:\/\/meet\.google\.com\//i.test(meet)) setMeetUrl(meet);

    let active = true;
    void getBrowserClient().auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setAuthState('ready');
        setStatus('Ready. Put Eva on a second device beside the meeting, then start Meeting Mode.');
      } else {
        setAuthState('signed-out');
        setStatus('Sign in to Aridon to use Eva Meeting Mode.');
      }
    }).catch(() => {
      if (!active) return;
      setAuthState('signed-out');
      setStatus('Sign in to Aridon to use Eva Meeting Mode.');
    });

    return () => {
      active = false;
      cleanupConnection();
    };
  }, []);

  function cleanupConnection() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    microphoneRef.current?.getTracks().forEach((track) => track.stop());
    microphoneRef.current = null;
    try { eventsRef.current?.close(); } catch {}
    eventsRef.current = null;
    try { peerRef.current?.close(); } catch {}
    peerRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setMuted(false);
    setMutePending(false);
    setSessionId('');
  }

  function fail(message: string) {
    finalizedRef.current = false;
    cleanupConnection();
    setConnectionState('error');
    setStatus(message);
  }

  function sendInstruction(content: string) {
    const channel = eventsRef.current;
    if (connectionState !== 'live' || !channel || channel.readyState !== 'open') {
      setStatus('Start Eva Meeting Mode before asking Eva to speak.');
      return false;
    }
    channel.send(JSON.stringify({
      type: 'session.instructions.append',
      event_id: `eva_meeting_${Date.now()}`,
      delegation_id: null,
      content,
    }));
    return true;
  }

  function handleLiveEvent(event: LiveEvent, channel: RTCDataChannel) {
    if (event.type === 'session.started') {
      finalizedRef.current = false;
      setConnectionState('live');
      setSessionId(event.session?.id || 'meeting');
      setStatus('Eva is in Meeting Mode. She is listening for her name and your speaking commands.');
      setBackendStatus('Live research is available when the meeting needs current facts.');

      channel.send(JSON.stringify({
        type: 'session.instructions.append',
        event_id: `eva_meeting_opening_${Date.now()}`,
        delegation_id: null,
        content:
          `Switch into Aridon Meeting Mode. Meeting title: ${meetingTitle}. Meeting objective: ${meetingGoal}. ` +
          `You are Eva, Aridon's AI Command Advisor and Chief of Staff. Treat the microphone audio as a business meeting with Jim and outside guests. ` +
          `Do not dominate the conversation. Listen carefully and stay concise. Speak when someone directly addresses Eva, when Jim clearly asks you to explain or answer something, or when a button instruction tells you to speak. ` +
          `When speaking to outside guests, identify yourself once as Eva, Aridon's AI executive assistant. Be transparent that you are AI. ` +
          `Explain Aridon, the Southwest Technology Campus, water, energy, agriculture, resilient infrastructure, and AI initiatives accurately. ` +
          `Never invent commitments, prices, test results, partnerships, approvals, or external actions. If current facts are needed, use the research backend. ` +
          `Listen now. Do not give a general greeting unless Jim asks you to speak.`,
      }));
      return;
    }

    if (event.type === 'session.input_transcript.delta' && typeof event.delta === 'string') {
      setRoomCaption((previous) => appendCaption(previous, event.delta || ''));
      return;
    }

    if (event.type === 'session.output_transcript.delta' && typeof event.delta === 'string') {
      setEvaCaption((previous) => appendCaption(previous, event.delta || ''));
      return;
    }

    if (event.type === 'session.input_audio.muted') {
      setMuted(true);
      setMutePending(false);
      return;
    }

    if (event.type === 'session.input_audio.unmuted') {
      setMuted(false);
      setMutePending(false);
      return;
    }

    if (event.type === 'response.event') {
      const nestedType = event.event?.type || '';
      if (nestedType.includes('web_search') || nestedType.includes('tool')) {
        setBackendStatus('Eva is checking current information for the meeting…');
      } else if (nestedType.includes('completed') || nestedType.includes('done')) {
        setBackendStatus('Research complete. Eva has the result ready for the room.');
      }
      return;
    }

    if (event.type === 'session.closed') {
      finalizedRef.current = true;
      cleanupConnection();
      setConnectionState('idle');
      setStatus('Meeting Mode ended.');
      setBackendStatus('Meeting intelligence is ready.');
      return;
    }

    if (event.type?.includes('error')) {
      setBackendStatus(event.error?.message || 'Eva Meeting Mode reported a connection error.');
    }
  }

  async function startMeetingMode() {
    if (connectionState === 'connecting' || connectionState === 'live' || connectionState === 'closing') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      fail('This browser cannot provide microphone audio. Use a current Chrome, Edge, or Safari browser over HTTPS.');
      return;
    }

    setConnectionState('connecting');
    setStatus('Connecting Eva Meeting Mode…');
    setBackendStatus('Preparing Eva and the live research backend…');
    setRoomCaption('');
    setEvaCaption('');
    setMuted(false);
    setMutePending(false);
    finalizedRef.current = false;

    try {
      const db = getBrowserClient();
      const { data, error } = await db.auth.getSession();
      if (error || !data.session?.access_token) {
        setAuthState('signed-out');
        throw new Error('Your Aridon session has expired. Sign in again to use Eva Meeting Mode.');
      }
      setAuthState('ready');

      const connection = new RTCPeerConnection();
      peerRef.current = connection;

      connection.addEventListener('track', (event) => {
        if (!audioRef.current) return;
        audioRef.current.srcObject = event.streams[0] || new MediaStream([event.track]);
        void audioRef.current.play().catch(() => {
          setStatus('Eva is connected. Tap the audio player once if your browser blocked playback.');
        });
      });

      connection.addEventListener('connectionstatechange', () => {
        if (connection.connectionState === 'failed') fail('The meeting audio connection failed. Start a new Meeting Mode session.');
      });

      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      microphoneRef.current = microphone;
      for (const track of microphone.getAudioTracks()) connection.addTrack(track, microphone);

      const channel = connection.createDataChannel('oai-events');
      eventsRef.current = channel;
      channel.addEventListener('message', ({ data: raw }) => {
        try {
          handleLiveEvent(JSON.parse(String(raw)) as LiveEvent, channel);
        } catch {
          setBackendStatus('Eva received an unreadable Live event, but the audio connection can continue.');
        }
      });
      channel.addEventListener('close', () => {
        if (finalizedRef.current) return;
        cleanupConnection();
        setConnectionState('idle');
        setStatus('Eva Meeting Mode disconnected.');
      });

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      await waitForIce(connection);
      const sdp = connection.localDescription?.sdp;
      if (!sdp) throw new Error('The browser did not create an audio connection offer.');

      const response = await fetch('/api/live/session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sdp }),
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({})) as LiveCreateResponse & { error?: string };
      if (!response.ok) {
        if (response.status === 401) setAuthState('signed-out');
        throw new Error(result.error || 'Eva Meeting Mode could not start.');
      }
      if (!result.transport?.sdp) throw new Error('Eva did not return a valid audio answer.');
      setSessionId(result.session?.id || 'meeting');
      await connection.setRemoteDescription({ type: 'answer', sdp: result.transport.sdp });
    } catch (error: any) {
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        fail('Microphone permission is blocked. Allow microphone access for Aridon, then try again.');
        return;
      }
      fail(error instanceof Error ? error.message : 'Eva Meeting Mode could not start.');
    }
  }

  function toggleMute() {
    const channel = eventsRef.current;
    if (connectionState !== 'live' || !channel || channel.readyState !== 'open' || mutePending) return;
    setMutePending(true);
    const nextMuted = !muted;
    channel.send(JSON.stringify({
      type: nextMuted ? 'session.input_audio.mute' : 'session.input_audio.unmute',
      event_id: `${nextMuted ? 'mute' : 'unmute'}_${Date.now()}`,
    }));
    window.setTimeout(() => setMutePending(false), 4_000);
  }

  function endMeetingMode() {
    const channel = eventsRef.current;
    if (connectionState === 'live' && channel?.readyState === 'open') {
      setConnectionState('closing');
      setStatus('Finishing Eva Meeting Mode…');
      channel.send(JSON.stringify({ type: 'session.close' }));
      closeTimerRef.current = window.setTimeout(() => {
        cleanupConnection();
        setConnectionState('idle');
        setStatus('Meeting Mode ended.');
      }, 15_000);
      return;
    }
    cleanupConnection();
    setConnectionState('idle');
    setStatus('Meeting Mode ended.');
  }

  function presentAridon() {
    if (sendInstruction(
      `Speak to the room now. Give a clear 60 to 90 second executive explanation of what Aridon is building and why this partner meeting matters. ` +
      `Cover Aridon as an AI Executive Operating System, the Southwest Technology Campus in the Farmington/Four Corners region, and the plan to demonstrate and commercialize energy, water, agriculture, resilient infrastructure, and AI technologies. ` +
      `Tie the explanation directly to this meeting objective: ${meetingGoal}. End by turning the conversation back to Jim.`,
    )) setStatus('Eva is presenting Aridon to the room.');
  }

  function summarizeMeeting() {
    if (sendInstruction(
      `Based only on what you heard in this meeting, speak a concise wrap-up now: decisions, commitments actually made, open questions, owners, and the next three actions. ` +
      `Do not invent anything that was not said. End by asking the room to correct anything you missed.`,
    )) setStatus('Eva is summarizing the meeting.');
  }

  function sendCustomPrompt() {
    const prompt = customPrompt.trim();
    if (!prompt) return;
    if (sendInstruction(`Jim is directing you during the meeting: ${prompt}`)) {
      setCustomPrompt('');
      setStatus('Direction sent to Eva.');
    }
  }

  const isLive = connectionState === 'live';
  const busy = connectionState === 'connecting' || connectionState === 'closing';

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 70% 0,#173D60,#07101D 44%,#040A11)', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: 18 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: '.14em' }}>ARIDON · EVA MEETING MODE</div>
            <h1 style={{ margin: '7px 0 5px', fontSize: 'clamp(34px,6vw,62px)' }}>Put Eva in the room.</h1>
            <p style={{ color: '#AAB9CA', margin: 0, maxWidth: 800, lineHeight: 1.6 }}>Eva listens through the device microphone, speaks through its audio, answers when called on, presents Aridon on command, and can research current questions live.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/eva-live" style={navLink}>Eva Live</Link>
            <Link href="/dashboard" style={navLink}>Command Center</Link>
          </div>
        </header>

        <section style={{ ...panel, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>
            <label style={labelStyle}>Meeting title<input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Google Meet link<input value={meetUrl} onChange={(e) => setMeetUrl(e.target.value)} placeholder="https://meet.google.com/..." style={inputStyle} /></label>
          </div>
          <label style={{ ...labelStyle, marginTop: 12 }}>Meeting objective<textarea value={meetingGoal} onChange={(e) => setMeetingGoal(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></label>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 12 }}>
            {meetUrl && <a href={meetUrl} target="_blank" rel="noreferrer" style={{ ...button, background: '#66D9EF', color: '#06131A', textDecoration: 'none' }}>Open Google Meet ↗</a>}
            <span style={{ color: '#8195AA', fontSize: 12, alignSelf: 'center' }}>Best setup: Google Meet on your main device, Eva Meeting Mode on a second device beside you.</span>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 16 }}>
          <div style={panel}>
            <div style={{ display: 'flex', gap: 17, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 140, height: 140, borderRadius: 30, overflow: 'hidden', border: '2px solid #D45A2A', boxShadow: isLive ? '0 0 0 7px rgba(158,240,207,.10)' : 'none' }}>
                <img src={EVA_AVATAR} alt="Eva" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 210 }}>
                <div style={{ color: isLive ? '#9EF0CF' : '#66D9EF', fontSize: 11, fontWeight: 950, letterSpacing: '.12em' }}>{isLive ? 'MEETING LIVE' : connectionState.toUpperCase()}</div>
                <h2 style={{ fontSize: 34, margin: '6px 0 2px' }}>Eva</h2>
                <div style={{ color: '#AAB9CA', fontWeight: 850 }}>AI Executive Assistant · Meeting Presenter</div>
                {sessionId && <div style={{ marginTop: 7, color: '#70869C', fontSize: 10 }}>Secure live session active</div>}
              </div>
            </div>

            <div aria-live="polite" style={{ marginTop: 18, minHeight: 58, padding: 14, borderRadius: 14, background: '#071A26', border: '1px solid #29475B', color: '#DDE8F3', lineHeight: 1.5 }}>{status}</div>

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }}>
              <button onClick={() => void startMeetingMode()} disabled={authState !== 'ready' || isLive || busy} style={{ ...button, background: '#9EF0CF', color: '#07130F', opacity: authState !== 'ready' || isLive || busy ? .55 : 1 }}>{connectionState === 'connecting' ? 'Connecting…' : '🎙 Start Meeting Mode'}</button>
              <button onClick={presentAridon} disabled={!isLive} style={{ ...button, background: '#D45A2A', color: '#FFF', opacity: !isLive ? .55 : 1 }}>Eva, Present Aridon</button>
              <button onClick={summarizeMeeting} disabled={!isLive} style={{ ...button, background: '#14253A', color: '#F8FAFC', opacity: !isLive ? .55 : 1 }}>Summarize Meeting</button>
              <button onClick={toggleMute} disabled={!isLive || mutePending} style={{ ...button, background: muted ? '#FFC857' : '#14253A', color: muted ? '#181007' : '#F8FAFC', opacity: !isLive ? .55 : 1 }}>{mutePending ? 'Updating…' : muted ? 'Unmute Room' : 'Mute Room'}</button>
              <button onClick={endMeetingMode} disabled={connectionState === 'idle' || connectionState === 'error'} style={{ ...button, background: '#14253A', color: '#F8FAFC', opacity: connectionState === 'idle' || connectionState === 'error' ? .55 : 1 }}>End</button>
            </div>

            <label style={{ ...labelStyle, marginTop: 16 }}>Direct Eva during the meeting<textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Example: Explain how Pii Energy could fit into our campus microgrid demonstration." rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></label>
            <button onClick={sendCustomPrompt} disabled={!isLive || !customPrompt.trim()} style={{ ...button, marginTop: 8, background: '#66D9EF', color: '#06131A', opacity: !isLive || !customPrompt.trim() ? .55 : 1 }}>Send Direction to Eva</button>

            {authState === 'signed-out' && <div style={{ marginTop: 15, padding: 14, borderRadius: 14, background: '#20170B', border: '1px solid #6C5427', color: '#FFE2A8' }}>Meeting Mode requires an Aridon sign-in. <Link href="/customer/login" style={{ color: '#9EF0CF', fontWeight: 900 }}>Sign in here.</Link></div>}
            <audio ref={audioRef} autoPlay controls playsInline style={{ width: '100%', marginTop: 16, opacity: isLive ? 1 : .45 }} />
          </div>

          <div style={panel}>
            <div style={{ color: '#9EF0CF', fontSize: 10, fontWeight: 950, letterSpacing: '.12em' }}>MEETING CAPTIONS</div>
            <div style={captionBox}>
              <div style={{ color: '#66D9EF', fontSize: 10, fontWeight: 950 }}>ROOM</div>
              <div style={{ marginTop: 7, whiteSpace: 'pre-wrap', lineHeight: 1.55, minHeight: 100 }}>{roomCaption || 'What Eva hears in the room will appear here.'}</div>
            </div>
            <div style={{ ...captionBox, marginTop: 11 }}>
              <div style={{ color: '#D7A17B', fontSize: 10, fontWeight: 950 }}>EVA</div>
              <div style={{ marginTop: 7, whiteSpace: 'pre-wrap', lineHeight: 1.55, minHeight: 100 }}>{evaCaption || 'What Eva says to the meeting will appear here.'}</div>
            </div>
            <div style={{ marginTop: 13, padding: 13, borderRadius: 13, background: '#0A1624', border: '1px solid #20344A' }}>
              <div style={{ color: '#9EF0CF', fontSize: 10, fontWeight: 950 }}>RESEARCH BACKEND</div>
              <div style={{ marginTop: 6, color: '#AAB9CA', lineHeight: 1.5 }}>{backendStatus}</div>
            </div>
          </div>
        </section>

        <section style={{ ...panel, marginTop: 16 }}>
          <div style={{ color: '#66D9EF', fontSize: 10, fontWeight: 950, letterSpacing: '.12em' }}>HOW TO USE IT TODAY</div>
          <p style={{ color: '#AAB9CA', lineHeight: 1.65, marginBottom: 0 }}>Join Google Meet normally on your main device. Open this page on a second phone, tablet, or laptop, sign into Aridon, tap <strong>Start Meeting Mode</strong>, and place that device near you with its speaker audible. When you want Eva to take the floor, say “Eva, explain what we’re doing,” or tap <strong>Eva, Present Aridon</strong>. This avoids Google Meet blocking a second browser from injecting microphone audio directly into another Meet tab.</p>
        </section>
      </div>
    </main>
  );
}

const panel = { background: 'linear-gradient(180deg,#0E1D2E,#081420)', border: '1px solid #20344A', borderRadius: 20, padding: 18, boxShadow: '0 18px 50px rgba(0,0,0,.24)' } as const;
const button = { border: '1px solid #294058', borderRadius: 11, padding: '11px 15px', fontWeight: 950, cursor: 'pointer' } as const;
const navLink = { color: '#9EF0CF', textDecoration: 'none', fontWeight: 900, padding: '9px 11px', borderRadius: 10, border: '1px solid #31566D' } as const;
const captionBox = { padding: 14, borderRadius: 14, background: '#07111D', border: '1px solid #294058', color: '#DDE8F3', marginTop: 12 } as const;
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, color: '#AAB9CA', fontSize: 12, fontWeight: 850 } as const;
const inputStyle = { width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1px solid #294058', background: '#07111D', color: '#F8FAFC', padding: '10px 11px', font: 'inherit' } as const;
