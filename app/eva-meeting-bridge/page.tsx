'use client';

import { useEffect, useRef, useState } from 'react';
import { EVA_AVATAR } from '../../lib/evaIdentity';

type LiveCreateResponse = {
  session?: { id?: string };
  transport?: { type?: string; sdp?: string };
  error?: string;
};

async function waitForIce(connection: RTCPeerConnection) {
  if (connection.iceGatheringState === 'complete') return;
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      connection.removeEventListener('icegatheringstatechange', onState);
      reject(new Error('Audio connection preparation timed out.'));
    }, 12_000);

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

async function meetingAudioStream(onWaiting: () => void) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (error) {
      lastError = error;
      onWaiting();
      await new Promise((resolve) => window.setTimeout(resolve, 1_000));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Meeting audio is not available.');
}

export default function EvaMeetingBridgePage() {
  const [status, setStatus] = useState('Eva is entering the meeting…');
  const [detail, setDetail] = useState('Connecting Aridon Live voice.');
  const [connected, setConnected] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const meetingAudioRef = useRef<MediaStream | null>(null);
  const dataRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    let cancelled = false;

    function cleanup() {
      meetingAudioRef.current?.getTracks().forEach((track) => track.stop());
      meetingAudioRef.current = null;
      try { dataRef.current?.close(); } catch {}
      dataRef.current = null;
      try { peerRef.current?.close(); } catch {}
      peerRef.current = null;
      if (audioRef.current) audioRef.current.srcObject = null;
    }

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('This meeting browser cannot provide live audio.');

        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('token') || '';
        if (fromUrl) {
          sessionStorage.setItem('eva_meeting_bridge_token', fromUrl);
          window.history.replaceState({}, '', '/eva-meeting-bridge');
        }
        const token = fromUrl || sessionStorage.getItem('eva_meeting_bridge_token') || '';
        if (!token) throw new Error('Eva meeting authorization is missing.');

        setStatus('Eva is listening for the meeting audio…');
        const meetingAudio = await meetingAudioStream(() => {
          if (!cancelled) setDetail('Waiting for the meeting room to finish connecting.');
        });
        if (cancelled) {
          meetingAudio.getTracks().forEach((track) => track.stop());
          return;
        }
        meetingAudioRef.current = meetingAudio;

        const connection = new RTCPeerConnection();
        peerRef.current = connection;
        for (const track of meetingAudio.getAudioTracks()) connection.addTrack(track, meetingAudio);

        connection.addEventListener('track', (event) => {
          if (!audioRef.current) return;
          audioRef.current.srcObject = event.streams[0] || new MediaStream([event.track]);
          audioRef.current.volume = 1;
          void audioRef.current.play().catch(() => {
            setDetail('Eva is connected, but meeting audio playback was blocked by the browser.');
          });
        });

        connection.addEventListener('connectionstatechange', () => {
          if (connection.connectionState === 'connected') {
            setConnected(true);
            setStatus('Eva is live in the meeting.');
            setDetail('Listening quietly. Say “Eva” when you want her to speak.');
          } else if (connection.connectionState === 'failed' || connection.connectionState === 'disconnected') {
            setConnected(false);
            setStatus('Eva lost the live audio connection.');
            setDetail('The meeting host can remove and re-add Eva if the call continues.');
          }
        });

        const channel = connection.createDataChannel('oai-events');
        dataRef.current = channel;
        channel.addEventListener('message', ({ data }) => {
          try {
            const event = JSON.parse(String(data)) as { type?: string; error?: { message?: string } };
            if (event.type === 'session.started') {
              setConnected(true);
              setStatus('Eva is live in the meeting.');
              setDetail('Listening quietly. Say “Eva” when you want her to speak.');
            } else if (event.type?.includes('error')) {
              setDetail(event.error?.message || 'Eva received a live-session warning.');
            }
          } catch {}
        });

        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        await waitForIce(connection);
        const sdp = connection.localDescription?.sdp;
        if (!sdp) throw new Error('The meeting browser did not produce a live audio offer.');

        setStatus('Connecting Eva’s live voice…');
        const response = await fetch('/api/eva-meeting/bridge-session', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sdp }),
          cache: 'no-store',
        });
        const result = await response.json().catch(() => ({})) as LiveCreateResponse;
        if (!response.ok || !result.transport?.sdp) {
          throw new Error(result.error || 'Eva could not start her live meeting voice.');
        }

        await connection.setRemoteDescription({ type: 'answer', sdp: result.transport.sdp });
      } catch (error) {
        if (cancelled) return;
        cleanup();
        setConnected(false);
        setStatus('Eva could not enter Live Meeting Mode.');
        setDetail(error instanceof Error ? error.message : 'Unknown meeting bridge error.');
      }
    }

    void start();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      display: 'grid',
      placeItems: 'center',
      background: 'radial-gradient(circle at 50% 20%, #224c70 0%, #0c1a2a 46%, #050a11 100%)',
      color: '#f8fafc',
      fontFamily: 'Arial, sans-serif',
    }}>
      <audio ref={audioRef} autoPlay playsInline />
      <section style={{ textAlign: 'center', width: '88%', maxWidth: 760 }}>
        <div style={{ position: 'relative', width: 230, height: 230, margin: '0 auto 24px' }}>
          <div style={{
            position: 'absolute', inset: -10, borderRadius: '50%',
            border: connected ? '3px solid #88f3c8' : '3px solid rgba(148,163,184,.5)',
            boxShadow: connected ? '0 0 42px rgba(83, 235, 175, .32)' : 'none',
          }} />
          <img src={EVA_AVATAR} alt="Eva" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '.16em', color: '#9ef0cf' }}>ARIDON</div>
        <h1 style={{ margin: '10px 0 4px', fontSize: 42, lineHeight: 1.05 }}>Eva</h1>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#cbd5e1' }}>AI Command Advisor & Chief of Staff</div>
        <div style={{ marginTop: 28, fontSize: 20, fontWeight: 800 }}>{status}</div>
        <div style={{ margin: '10px auto 0', maxWidth: 620, fontSize: 15, lineHeight: 1.5, color: '#b7c5d6' }}>{detail}</div>
        <div style={{ marginTop: 28, fontSize: 12, color: '#8da1b6' }}>AI participant · live audio enabled · transparent by design</div>
      </section>
    </main>
  );
}
