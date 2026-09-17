const DEFAULT_BASE_URL = 'https://aridon-v02.vercel.app';
const POLL_MS = 3000;
let polling = false;
let timer = null;
let activeJob = null;
let transcript = [];

async function config() {
  const stored = await chrome.storage.local.get(['baseUrl', 'bridgeId', 'bridgeToken', 'autoAnswer']);
  return {
    baseUrl: String(stored.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, ''),
    bridgeId: String(stored.bridgeId || ''),
    bridgeToken: String(stored.bridgeToken || ''),
    autoAnswer: stored.autoAnswer !== false,
  };
}

async function api(path, options = {}) {
  const cfg = await config();
  if (!cfg.bridgeToken) throw new Error('Eva Phone Bridge is not paired yet.');
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${cfg.bridgeToken}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${cfg.baseUrl}${path}`, { ...options, headers, cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Aridon returned ${response.status}.`);
  return payload;
}

async function googleVoiceTab(create = false) {
  const tabs = await chrome.tabs.query({ url: 'https://voice.google.com/*' });
  if (tabs.length) return tabs[0];
  if (!create) return null;
  return chrome.tabs.create({ url: 'https://voice.google.com/u/0/calls', active: true });
}

async function sendToVoice(message) {
  const tab = await googleVoiceTab(true);
  if (!tab?.id) throw new Error('Could not open Google Voice.');
  for (let i = 0; i < 30; i += 1) {
    try {
      const reply = await chrome.tabs.sendMessage(tab.id, message);
      if (reply) return reply;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Eva Phone Bridge could not attach to the Google Voice tab. Reload Google Voice and try again.');
}

async function updateJob(state, extra = {}) {
  if (!activeJob?.id) return;
  try {
    await api('/api/phone-bridge/status', {
      method: 'POST',
      body: JSON.stringify({ jobId: activeJob.id, state, transcript: transcript.join('\n'), ...extra }),
    });
  } catch (error) {
    console.warn('Eva Phone status update failed', error);
  }
}

async function realtimeToken(jobId) {
  return api('/api/phone-bridge/realtime-token', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  });
}

async function startOutbound(job) {
  activeJob = job;
  transcript = [];
  await updateJob('dialing');
  const token = await realtimeToken(job.id);
  const dial = await sendToVoice({ type: 'DIAL', jobId: job.id, phone: job.phone });
  if (!dial?.ok) throw new Error(dial?.error || 'Google Voice did not start the call.');
  await sendToVoice({ type: 'START_REALTIME', jobId: job.id, secret: token.value });
}

async function beginInbound(caller) {
  if (activeJob) return;
  const cfg = await config();
  if (!cfg.autoAnswer) return;
  const payload = await api('/api/phone-bridge/inbound', {
    method: 'POST',
    body: JSON.stringify({ phone: caller || 'unknown', contactName: caller || 'Incoming caller' }),
  });
  const job = payload.job;
  if (!job?.id) throw new Error('Aridon did not create the inbound call job.');
  activeJob = job;
  transcript = [];
  const token = await realtimeToken(job.id);
  const answer = await sendToVoice({ type: 'ANSWER', jobId: job.id });
  if (!answer?.ok) throw new Error(answer?.error || 'Google Voice did not answer the call.');
  await sendToVoice({ type: 'START_REALTIME', jobId: job.id, secret: token.value });
}

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const cfg = await config();
    if (!cfg.bridgeToken) return;
    await googleVoiceTab(true);
    if (!activeJob) {
      const payload = await api('/api/phone-bridge/next');
      if (payload.job?.id) await startOutbound(payload.job);
    } else {
      await api('/api/phone-bridge/next?heartbeat=1').catch(() => null);
    }
  } catch (error) {
    console.warn('Eva Phone Bridge poll error', error);
    if (activeJob) {
      await updateJob('failed', { error: error instanceof Error ? error.message : String(error) });
      try { await sendToVoice({ type: 'STOP', hangup: true }); } catch {}
      activeJob = null;
      transcript = [];
    }
  } finally {
    polling = false;
  }
}

function schedule() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => void poll(), POLL_MS);
  void poll();
}

chrome.runtime.onInstalled.addListener(schedule);
chrome.runtime.onStartup.addListener(schedule);
schedule();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PAIR') {
    void (async () => {
      const baseUrl = String(message.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
      const origin = new URL(baseUrl).origin;
      if (!origin.endsWith('.vercel.app') && !origin.includes('localhost')) {
        const granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
        if (!granted) throw new Error('Permission to connect this Aridon site was not granted.');
      }
      const response = await fetch(`${baseUrl}/api/phone-bridge/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bridgeId: String(message.bridgeId || ''),
          pairingCode: String(message.pairingCode || ''),
          deviceName: 'Eva Google Voice Bridge',
          platform: navigator.platform || 'Chrome',
          googleVoiceNumber: String(message.googleVoiceNumber || ''),
          version: chrome.runtime.getManifest().version,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.token) throw new Error(payload.error || 'Pairing failed.');
      await chrome.storage.local.set({
        baseUrl,
        bridgeId: payload.bridgeId || payload.bridge?.id || '',
        bridgeToken: payload.token,
        googleVoiceNumber: String(message.googleVoiceNumber || ''),
      });
      schedule();
      return payload;
    })().then((payload) => sendResponse({ ok: true, payload })).catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return true;
  }

  if (message?.type === 'SET_AUTO_ANSWER') {
    void chrome.storage.local.set({ autoAnswer: Boolean(message.enabled) }).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === 'GET_STATE') {
    void (async () => {
      const cfg = await config();
      const tab = await googleVoiceTab(false);
      return { paired: Boolean(cfg.bridgeToken), ...cfg, activeJob, googleVoiceOpen: Boolean(tab) };
    })().then((state) => sendResponse({ ok: true, state })).catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message?.type === 'POLL' || (message?.source === 'aridon-eva-ui' && message?.type === 'POLL')) {
    void poll();
    sendResponse({ ok: true });
    return false;
  }

  if (message?.source === 'aridon-eva-ui') {
    const type = message.type;
    if (type === 'INCOMING_CALL') {
      void beginInbound(message.caller).catch(async (error) => {
        console.warn('Eva inbound call failed', error);
        if (activeJob) await updateJob('failed', { error: error instanceof Error ? error.message : String(error) });
        activeJob = null;
      });
    } else if (type === 'DIAL_CLICKED') {
      void updateJob('ringing');
    } else if (type === 'CALL_CONNECTED') {
      void updateJob('connected');
    } else if (type === 'CALL_ENDED') {
      void (async () => {
        await updateJob('completed');
        try { await sendToVoice({ type: 'STOP', hangup: false }); } catch {}
        activeJob = null;
        transcript = [];
      })();
    } else if (type === 'TRANSCRIPT' && message.line) {
      transcript.push(String(message.line));
    } else if (type === 'REALTIME_ERROR') {
      void (async () => {
        await updateJob('failed', { error: String(message.error || 'Realtime voice error.') });
        try { await sendToVoice({ type: 'STOP', hangup: true }); } catch {}
        activeJob = null;
        transcript = [];
      })();
    } else if (type === 'REALTIME_STOPPED' && message.transcript) {
      transcript = String(message.transcript).split('\n').filter(Boolean);
    }
  }
  return false;
});
