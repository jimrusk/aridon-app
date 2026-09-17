(() => {
  if (window.__ARIDON_EVA_PHONE_BRIDGE__) return;
  window.__ARIDON_EVA_PHONE_BRIDGE__ = true;

  const NativePC = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  if (!NativePC) return;

  const gvPeers = new Set();
  const originalTracks = new Map();
  const AI = Symbol('aridon-openai-peer');
  let bridgeArmed = false;
  let activeJobId = '';
  let realtimePeer = null;
  let realtimeData = null;
  let remoteCallerTrack = null;
  let audioContext = null;
  let evaMicDestination = null;
  let evaMicTrack = null;
  let modelSource = null;
  let transcript = [];
  let pendingRealtime = null;

  function post(type, detail = {}) {
    window.postMessage({ source: 'aridon-eva-main', type, ...detail }, '*');
  }

  function ensureAudioGraph() {
    if (audioContext && evaMicDestination && evaMicTrack) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioContext = new Ctx({ latencyHint: 'interactive' });
    evaMicDestination = audioContext.createMediaStreamDestination();
    evaMicTrack = evaMicDestination.stream.getAudioTracks()[0];
    const gain = audioContext.createGain();
    gain.gain.value = 0;
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = 440;
    oscillator.connect(gain).connect(evaMicDestination);
    oscillator.start();
  }

  async function armGoogleVoicePeers() {
    ensureAudioGraph();
    bridgeArmed = true;
    for (const pc of gvPeers) {
      for (const sender of pc.getSenders()) {
        if (sender.track?.kind !== 'audio') continue;
        if (!originalTracks.has(sender)) originalTracks.set(sender, sender.track);
        try { await sender.replaceTrack(evaMicTrack); } catch {}
      }
    }
  }

  async function restoreGoogleVoicePeers() {
    bridgeArmed = false;
    for (const [sender, track] of originalTracks.entries()) {
      try { await sender.replaceTrack(track); } catch {}
    }
    originalTracks.clear();
  }

  function registerGoogleVoicePeer(pc) {
    gvPeers.add(pc);
    pc.addEventListener('track', (event) => {
      if (pc[AI]) return;
      const track = event.track;
      if (track?.kind !== 'audio') return;
      remoteCallerTrack = track;
      post('GV_REMOTE_AUDIO_READY');
      if (pendingRealtime) void startRealtime(pendingRealtime);
    });
    pc.addEventListener('connectionstatechange', () => {
      post('GV_PEER_STATE', { state: pc.connectionState });
    });
  }

  const originalAddTrack = NativePC.prototype.addTrack;
  NativePC.prototype.addTrack = function(track, ...streams) {
    const sender = originalAddTrack.call(this, track, ...streams);
    if (!this[AI] && track?.kind === 'audio' && bridgeArmed) {
      ensureAudioGraph();
      originalTracks.set(sender, track);
      queueMicrotask(() => sender.replaceTrack(evaMicTrack).catch(() => {}));
    }
    return sender;
  };

  const originalAddTransceiver = NativePC.prototype.addTransceiver;
  if (originalAddTransceiver) {
    NativePC.prototype.addTransceiver = function(trackOrKind, init) {
      const transceiver = originalAddTransceiver.call(this, trackOrKind, init);
      if (!this[AI] && bridgeArmed && transceiver?.sender) {
        const track = transceiver.sender.track;
        if (track?.kind === 'audio') {
          ensureAudioGraph();
          originalTracks.set(transceiver.sender, track);
          queueMicrotask(() => transceiver.sender.replaceTrack(evaMicTrack).catch(() => {}));
        }
      }
      return transceiver;
    };
  }

  function WrappedRTCPeerConnection(...args) {
    const pc = new NativePC(...args);
    registerGoogleVoicePeer(pc);
    return pc;
  }
  WrappedRTCPeerConnection.prototype = NativePC.prototype;
  Object.setPrototypeOf(WrappedRTCPeerConnection, NativePC);
  window.RTCPeerConnection = WrappedRTCPeerConnection;
  if (window.webkitRTCPeerConnection) window.webkitRTCPeerConnection = WrappedRTCPeerConnection;

  async function waitForRemoteCallerTrack(timeoutMs = 60000) {
    if (remoteCallerTrack?.readyState === 'live') return remoteCallerTrack;
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (remoteCallerTrack?.readyState === 'live') return remoteCallerTrack;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Google Voice call audio was not detected.');
  }

  function handleRealtimeEvent(event) {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    const type = String(message?.type || '');
    if (type.includes('input_audio_transcription') && typeof message.transcript === 'string') {
      transcript.push(`Caller: ${message.transcript}`);
      post('TRANSCRIPT', { line: `Caller: ${message.transcript}` });
    }
    if ((type.includes('response.audio_transcript') || type.includes('response.output_audio_transcript')) && typeof message.transcript === 'string') {
      transcript.push(`Eva: ${message.transcript}`);
      post('TRANSCRIPT', { line: `Eva: ${message.transcript}` });
    }
    if (type.endsWith('.error') || type === 'error') {
      post('REALTIME_ERROR', { error: message?.error?.message || message?.message || 'Realtime voice error.' });
    }
  }

  async function startRealtime(config) {
    if (!bridgeArmed || !config?.secret || !config?.jobId) return;
    if (realtimePeer || activeJobId === config.jobId) return;
    pendingRealtime = config;
    activeJobId = config.jobId;
    transcript = [];

    try {
      ensureAudioGraph();
      if (audioContext.state === 'suspended') await audioContext.resume().catch(() => {});
      const callerTrack = await waitForRemoteCallerTrack();

      const pc = new NativePC();
      pc[AI] = true;
      realtimePeer = pc;
      const callerStream = new MediaStream([callerTrack]);
      pc.addTrack(callerTrack, callerStream);

      realtimeData = pc.createDataChannel('oai-events');
      realtimeData.addEventListener('message', handleRealtimeEvent);
      realtimeData.addEventListener('open', () => {
        // Do not force an opening response here. On outbound calls, the remote
        // track can carry ringback before a person answers. Server VAD will let
        // Eva speak only after it hears the person, preventing her greeting the tone.
        post('REALTIME_CONNECTED', { jobId: activeJobId });
      });

      pc.addEventListener('track', (event) => {
        if (event.track?.kind !== 'audio') return;
        try {
          if (modelSource) modelSource.disconnect();
          modelSource = audioContext.createMediaStreamSource(new MediaStream([event.track]));
          modelSource.connect(evaMicDestination);
        } catch (error) {
          post('REALTIME_ERROR', { error: error instanceof Error ? error.message : String(error) });
        }
      });

      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          post('REALTIME_ERROR', { error: `OpenAI realtime connection ${pc.connectionState}.` });
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sdp: offer.sdp }),
      });
      const answerSdp = await response.text();
      if (!response.ok) throw new Error(answerSdp || `OpenAI realtime call returned ${response.status}.`);
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    } catch (error) {
      post('REALTIME_ERROR', { error: error instanceof Error ? error.message : String(error) });
      await stopRealtime(false);
    }
  }

  async function stopRealtime(restoreMic = true) {
    pendingRealtime = null;
    try { realtimeData?.close(); } catch {}
    try { realtimePeer?.close(); } catch {}
    realtimeData = null;
    realtimePeer = null;
    if (modelSource) {
      try { modelSource.disconnect(); } catch {}
      modelSource = null;
    }
    const finishedJobId = activeJobId;
    activeJobId = '';
    post('REALTIME_STOPPED', { jobId: finishedJobId, transcript: transcript.join('\n') });
    if (restoreMic) await restoreGoogleVoicePeers();
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.source !== 'aridon-eva-extension') return;
    const { type } = event.data;
    if (type === 'ARM') {
      void armGoogleVoicePeers().then(() => post('ARMED', { jobId: event.data.jobId || '' }));
    }
    if (type === 'START_REALTIME') {
      pendingRealtime = {
        jobId: String(event.data.jobId || ''),
        secret: String(event.data.secret || ''),
      };
      void armGoogleVoicePeers().then(() => startRealtime(pendingRealtime));
    }
    if (type === 'STOP') void stopRealtime(true);
  });
})();
