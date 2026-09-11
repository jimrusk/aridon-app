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

const MAX_CAPTION_CHARS = 6_000;

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

export default function EvaLivePage() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [status, setStatus] = useState('Checking your Aridon session…');
  const [backendStatus, setBackendStatus] = useState('Live research is ready when Eva needs it.');
  const [userCaption, setUserCaption] = useState('');
  const [evaCaption, setEvaCaption] = useState('');
  const [muted, setMuted] = useState(false);
  const [mutePending, setMutePending] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const eventsRef = useRef<RTCDataChannel | null>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const finalizedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void getBrowserClient().auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setAuthState('ready');
        setStatus('Ready for a live conversation.');
      } else {
        setAuthState('signed-out');
        setStatus('Sign in to Aridon to use Eva Live.');
      }
    }).catch(() => {
      if (!active) return;
      setAuthState('signed-out');
      setStatus('Sign in to Aridon to use Eva Live.');
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

  function handleLiveEvent(event: LiveEvent, channel: RTCDataChannel) {
    if (event.type === 'session.started') {
      finalizedRef.current = false;
      setConnectionState('live');
      setSessionId(event.session?.id || 'live');
      setStatus('Eva Live is connected. Talk normally and interrupt whenever you need to.');
      setBackendStatus('Live research is ready when Eva needs it.');

      channel.send(JSON.stringify({
        type: 'session.instructions.append',
        event_id: `eva_opening_${Date.now()}`,
        delegation_id: null,
        content: 'Begin the conversation now. Give the brief greeting requested in your startup instructions, then pause and listen to the user.',
      }));
      return;
    }

    if (event.type === 'session.input_transcript.delta' && typeof event.delta === 'string') {
      setUserCaption((previous) => appendCaption(previous, event.delta || ''));
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
        setBackendStatus('Eva is checking the live web and reasoning in the background…');
      } else if (nestedType.includes('completed') || nestedType.includes('done')) {
        setBackendStatus('Research complete. Eva is bringing it into the conversation.');
      }
      return;
    }

    if (event.type === 'session.closed') {
      finalizedRef.current = true;
      cleanupConnection();
      setConnectionState('idle');
      setStatus('Conversation ended. Start another whenever you are ready.');
      setBackendStatus('Live research is ready when Eva needs it.');
      return;
    }

    if (event.type?.includes('error')) {
      const message = event.error?.message || 'Eva Live reported a connection error.';
      setBackendStatus(message);
    }
  }

  async function startConversation() {
    if (connectionState === 'connecting' || connectionState === 'live' || connectionState === 'closing') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      fail('This browser cannot provide microphone audio. Open Aridon in a current Chrome, Edge, or Safari browser over HTTPS.');
      return;
    }

    setConnectionState('connecting');
    setStatus('Connecting Eva Live…');
    setBackendStatus('Preparing Eva and the research backend…');
    setUserCaption('');
    setEvaCaption('');
    setMuted(false);
    setMutePending(false);
    finalizedRef.current = false;

    try {
      const db = getBrowserClient();
      const { data, error } = await db.auth.getSession();
      if (error || !data.session?.access_token) {
        setAuthState('signed-out');
        throw new Error('Your Aridon session has expired. Sign in again to use Eva Live.');
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
        if (connection.connectionState === 'failed') {
          fail('The live audio connection failed. Try starting a new conversation.');
        }
      });

      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      microphoneRef.current = microphone;
      for (const track of microphone.getAudioTracks()) connection.addTrack(track, microphone);

      const channel = connection.createDataChannel('oai-events');
      eventsRef.current = channel;

      channel.addEventListener('message', ({ data: raw }) => {
        try {
          const event = JSON.parse(String(raw)) as LiveEvent;
          handleLiveEvent(event, channel);
        } catch {
          setBackendStatus('Eva received an unreadable Live event, but the audio connection can continue.');
        }
      });

      channel.addEventListener('close', () => {
        if (finalizedRef.current) return;
        cleanupConnection();
        setConnectionState('idle');
        setStatus('Eva Live disconnected. You can start another conversation.');
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
        throw new Error(result.error || 'Eva Live could not start.');
      }

      if (!result.transport?.sdp) throw new Error('Eva Live did not return a valid audio answer.');
      setSessionId(result.session?.id || 'live');
      await connection.setRemoteDescription({ type: 'answer', sdp: result.transport.sdp });
    } catch (error: any) {
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        fail('Microphone permission is blocked. Allow microphone access for Aridon, then try again.');
        return;
      }
      fail(error instanceof Error ? error.message : 'Eva Live could not start.');
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

  function endConversation() {
    const channel = eventsRef.current;
    if (connectionState === 'live' && channel?.readyState === 'open') {
      setConnectionState('closing');
      setStatus('Finishing the conversation…');
      channel.send(JSON.stringify({ type: 'session.close' }));
      closeTimerRef.current = window.setTimeout(() => {
        cleanupConnection();
        setConnectionState('idle');
        setStatus('Conversation ended.');
      }, 15_000);
      return;
    }
    cleanupConnection();
    setConnectionState('idle');
    setStatus('Conversation ended.');
  }

  const isLive = connectionState === 'live';
  const busy = connectionState === 'connecting' || connectionState === 'closing';

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 70% 0,#173D60,#07101D 44%,#040A11)', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: 18 }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: '.14em' }}>ARIDON · EVA LIVE</div>
            <h1 style={{ margin: '7px 0 5px', fontSize: 'clamp(34px,6vw,62px)' }}>A real conversation with Eva.</h1>
            <p style={{ color: '#AAB9CA', margin: 0, maxWidth: 760, lineHeight: 1.6 }}>GPT-Live gives Eva full-duplex voice: she can listen while speaking, handle interruptions, and delegate current-information questions to a stronger research backend.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/avatars" style={navLink}>Classic Voice</Link>
            <Link href="/dashboard" style={navLink}>Command Center</Link>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 16 }}>
          <div style={panel}>
            <div style={{ display: 'flex', gap: 17, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 150, height: 150, borderRadius: 30, overflow: 'hidden', border: '2px solid #D45A2A', boxShadow: isLive ? '0 0 0 7px rgba(158,240,207,.10)' : 'none' }}>
                <img src={EVA_AVATAR} alt="Eva" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 210 }}>
                <div style={{ color: isLive ? '#9EF0CF' : '#66D9EF', fontSize: 11, fontWeight: 950, letterSpacing: '.12em' }}>{isLive ? 'LIVE · FULL DUPLEX' : connectionState.toUpperCase()}</div>
                <h2 style={{ fontSize: 35, margin: '6px 0 2px' }}>Eva</h2>
                <div style={{ color: '#AAB9CA', fontWeight: 850 }}>AI Command Advisor & Chief of Staff</div>
                {sessionId && <div style={{ marginTop: 7, color: '#70869C', fontSize: 10 }}>Secure Live session active</div>}
              </div>
            </div>

            <div aria-live="polite" style={{ marginTop: 18, minHeight: 58, padding: 14, borderRadius: 14, background: '#071A26', border: '1px solid #29475B', color: '#DDE8F3', lineHeight: 1.5 }}>{status}</div>

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }}>
              <button onClick={() => void startConversation()} disabled={authState !== 'ready' || isLive || busy} style={{ ...button, background: '#9EF0CF', color: '#07130F', opacity: authState !== 'ready' || isLive || busy ? .55 : 1 }}>{connectionState === 'connecting' ? 'Connecting…' : '🎙 Start Eva Live'}</button>
              <button onClick={toggleMute} disabled={!isLive || mutePending} style={{ ...button, background: muted ? '#FFC857' : '#14253A', color: muted ? '#181007' : '#F8FAFC', opacity: !isLive ? .55 : 1 }}>{mutePending ? 'Updating…' : muted ? 'Unmute' : 'Mute Mic'}</button>
              <button onClick={endConversation} disabled={connectionState === 'idle' || connectionState === 'error'} style={{ ...button, background: '#14253A', color: '#F8FAFC', opacity: connectionState === 'idle' || connectionState === 'error' ? .55 : 1 }}>End</button>
            </div>

            {authState === 'signed-out' && <div style={{ marginTop: 15, padding: 14, borderRadius: 14, background: '#20170B', border: '1px solid #6C5427', color: '#FFE2A8' }}>Eva Live requires an Aridon sign-in. <Link href="/customer/login" style={{ color: '#9EF0CF', fontWeight: 900 }}>Sign in here.</Link></div>}

            <audio ref={audioRef} autoPlay controls playsInline style={{ width: '100%', marginTop: 16, opacity: isLive ? 1 : .45 }} />
          </div>

          <div style={panel}>
            <div style={{ color: '#9EF0CF', fontSize: 10, fontWeight: 950, letterSpacing: '.12em' }}>LIVE CAPTIONS</div>
            <p style={{ color: '#8298AD', fontSize: 12, lineHeight: 1.5, marginTop: 7 }}>Both caption streams can move at the same time because Eva can hear you while she is talking.</p>

            <div style={captionBox}>
              <div style={{ color: '#66D9EF', fontSize: 10, fontWeight: 950 }}>YOU</div>
              <div style={{ marginTop: 7, whiteSpace: 'pre-wrap', lineHeight: 1.55, minHeight: 58 }}>{userCaption || 'Your live transcript will appear here.'}</div>
            </div>

            <div style={{ ...captionBox, marginTop: 11 }}>
              <div style={{ color: '#D7A17B', fontSize: 10, fontWeight: 950 }}>EVA</div>
              <div style={{ marginTop: 7, whiteSpace: 'pre-wrap', lineHeight: 1.55, minHeight: 58 }}>{evaCaption || 'Eva’s live transcript will appear here.'}</div>
            </div>

            <div style={{ marginTop: 13, padding: 13, borderRadius: 13, background: '#0A1624', border: '1px solid #20344A' }}>
              <div style={{ color: '#9EF0CF', fontSize: 10, fontWeight: 950 }}>BACKEND</div>
              <div style={{ marginTop: 6, color: '#AAB9CA', lineHeight: 1.5 }}>{backendStatus}</div>
            </div>
          </div>
        </section>

        <section style={{ ...panel, marginTop: 16 }}>
          <div style={{ color: '#66D9EF', fontSize: 10, fontWeight: 950, letterSpacing: '.12em' }}>WHAT THIS VERSION CAN DO</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginTop: 11 }}>
            <Feature title="Natural interruption" text="Talk over Eva or change direction without waiting for a stop-and-start voice turn." />
            <Feature title="Current research" text="Eva can delegate questions that need fresh public information to the reasoning backend with web search." />
            <Feature title="Secure session creation" text="The OpenAI project key stays on the Aridon server. Live sessions require a signed-in Aridon user." />
            <Feature title="Safe action boundary" text="Eva will not claim an email, call, CRM update, deployment, or other action happened unless a connected backend confirms it." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return <div style={{ padding: 13, borderRadius: 13, background: '#091522', border: '1px solid #20344A' }}><strong style={{ display: 'block' }}>{title}</strong><span style={{ display: 'block', marginTop: 5, color: '#8EA2B8', lineHeight: 1.45, fontSize: 12 }}>{text}</span></div>;
}

const panel = { background: 'linear-gradient(180deg,#0E1D2E,#081420)', border: '1px solid #20344A', borderRadius: 20, padding: 18, boxShadow: '0 18px 50px rgba(0,0,0,.24)' } as const;
const button = { border: '1px solid #294058', borderRadius: 11, padding: '11px 15px', fontWeight: 950, cursor: 'pointer' } as const;
const navLink = { color: '#9EF0CF', textDecoration: 'none', fontWeight: 900, padding: '9px 11px', borderRadius: 10, border: '1px solid #31566D' } as const;
const captionBox = { padding: 14, borderRadius: 14, background: '#07111D', border: '1px solid #294058', color: '#DDE8F3' } as const;
