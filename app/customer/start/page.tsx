'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';
import { executives } from '../../../lib/executives';

type Account = {
  tenant: { slug: string; business_name: string; industry?: string | null };
  user?: { name?: string; first_name?: string; email?: string };
};
type Executive = (typeof executives)[number];
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type BrainMode = 'fast' | 'think' | 'research' | 'act';
type BrainSource = { title: string; url: string };
type BrainRouting = { mode?: string; task?: string; provider?: string; model?: string; reason?: string; fallbackUsed?: boolean; totalLatencyMs?: number };
type BrainAction = { id: string; title: string; adapterKey: string; status: string; approvalRequired: boolean };
type BrainCapabilities = {
  googleWorkspace?: boolean;
  microsoft365?: boolean;
  connectedExecutionProvider?: string | null;
  actionFabric?: boolean;
  companyFiles?: number;
  durableMemories?: number;
  aiProviders?: Array<{ provider: string; label: string; model: string }>;
};
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

function introFor(executive: Executive, company: string, firstName?: string) {
  const namedHello = firstName && firstName.toLowerCase() !== 'there' ? `Hi ${firstName}` : 'Hi';
  if (executive.name === 'Eva') {
    return `${namedHello}, I'm Eva. Welcome to ${company}. What are you looking to get done today? Tell me in your own words and I'll get you started. If another Aridon executive is the best fit, I'll bring them in.`;
  }
  return `${namedHello}, I'm ${executive.name}, your ${executive.role}. My focus is ${executive.focus}. Tell me what you want to accomplish and we'll work through it.`;
}

const intakeChoices = [
  'Grow sales and find customers',
  'Find funding or investors',
  'Improve operations',
  'Research a company or opportunity',
  'Build a plan for something new',
];

const brainModes: Array<{ id: BrainMode; label: string; icon: string; description: string }> = [
  { id: 'fast', label: 'Fast', icon: '⚡', description: 'Quickest complete answer for everyday work.' },
  { id: 'think', label: 'Think', icon: '◈', description: 'Deeper analysis, tradeoffs and stronger reasoning.' },
  { id: 'research', label: 'Research', icon: '⌕', description: 'Current web-backed research with sources when available.' },
  { id: 'act', label: 'Act', icon: '▶', description: 'Turn the decision into a controlled Action Fabric step.' },
];

export default function CustomerStartPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [selectedName, setSelectedName] = useState('Eva');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingName, setSpeakingName] = useState('');
  const [speechBeat, setSpeechBeat] = useState(0);
  const [handsFree, setHandsFree] = useState(true);
  const [micNeedsTap, setMicNeedsTap] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [intakeMode, setIntakeMode] = useState(true);
  const [mode, setMode] = useState<BrainMode>('fast');
  const [sources, setSources] = useState<BrainSource[]>([]);
  const [routing, setRouting] = useState<BrainRouting | null>(null);
  const [queuedAction, setQueuedAction] = useState<BrainAction | null>(null);
  const [capabilities, setCapabilities] = useState<BrainCapabilities | null>(null);
  const [researchWarning, setResearchWarning] = useState('');
  const [continuityCount, setContinuityCount] = useState(0);
  const [memoryPulse, setMemoryPulse] = useState(false);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const handsFreeRef = useRef(true);
  const busyRef = useRef(false);
  const autoStartedRef = useRef(false);
  const playbackRef = useRef(0);

  const selected = useMemo(() => executives.find((item) => item.name === selectedName) || executives[0], [selectedName]);
  const selectedMode = brainModes.find((item) => item.id === mode) || brainModes[0];

  useEffect(() => {
    setRecognitionSupported(Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/customer/start');
        return;
      }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) {
        router.replace('/customer/login');
        return;
      }
      const loadedAccount = result as Account;
      setToken(accessToken);
      setAccount(loadedAccount);
      const eva = executives.find((item) => item.name === 'Eva') || executives[0];
      const greeting = introFor(eva, loadedAccount.tenant.business_name, loadedAccount.user?.first_name);
      setReply(greeting);

      let continuity: ChatMessage[] = [];
      try {
        const historyResponse = await fetch(`/api/customer/assistant?slug=${encodeURIComponent(loadedAccount.tenant.slug)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });
        const historyData = await historyResponse.json().catch(() => ({}));
        if (historyResponse.ok) {
          continuity = Array.isArray(historyData.history)
            ? historyData.history
                .filter((item: any) => (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string' && item.content.trim())
                .map((item: any) => ({ role: item.role as 'user' | 'assistant', content: item.content.trim() }))
                .slice(-16)
            : [];
          setContinuityCount(continuity.length);
          setCapabilities(historyData.capabilities || null);
        }
      } catch {}
      setMessages([...continuity, { role: 'assistant', content: greeting }].slice(-18));
    });
    return () => {
      handsFreeRef.current = false;
      stopListening();
      stopSpeaking();
    };
  }, [router]);

  useEffect(() => {
    if (!account || !token || autoStartedRef.current) return;
    autoStartedRef.current = true;
    const timer = window.setTimeout(() => { void activateHandsFree(true); }, 450);
    return () => window.clearTimeout(timer);
  }, [account, token]);

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
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }

  function stopSpeaking() {
    playbackRef.current += 1;
    releaseAudio();
    setSpeakingName('');
  }

  function resumeHandsFree(delay = 350) {
    if (!handsFreeRef.current || busyRef.current || micNeedsTap) return;
    window.setTimeout(() => {
      if (handsFreeRef.current && !busyRef.current && !audioRef.current) startListening();
    }, delay);
  }

  async function speak(executive: Executive, text: string) {
    if (!voiceEnabled || !text.trim()) {
      resumeHandsFree();
      return;
    }
    stopListening();
    stopSpeaking();
    const playback = playbackRef.current;
    setSpeakingName(executive.name);
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive: executive.name, text }),
      });
      if (!response.ok) throw new Error('Voice unavailable.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioUrlRef.current = url;
      audioRef.current = audio;
      audio.ontimeupdate = () => { if (playback === playbackRef.current) setSpeechBeat((beat) => beat + 1); };
      audio.onended = () => {
        if (playback !== playbackRef.current) return;
        releaseAudio();
        setSpeakingName('');
        resumeHandsFree(250);
      };
      audio.onerror = () => {
        releaseAudio();
        setSpeakingName('');
        setMicNeedsTap(true);
      };
      await audio.play();
    } catch {
      releaseAudio();
      setSpeakingName('');
      setMicNeedsTap(true);
    }
  }

  function startListening() {
    if (!handsFreeRef.current || busyRef.current || audioRef.current) return;
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      setRecognitionSupported(false);
      return;
    }
    stopListening();
    const recognition = new SpeechRecognitionConstructor() as BrowserSpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      setListening(false);
      if (transcript) void askExecutive(transcript);
      else resumeHandsFree();
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setMicNeedsTap(true);
        setReply('Hands-Free is ready, but this browser needs microphone permission. Tap Enable Microphone once.');
      } else if (event?.error !== 'aborted') {
        resumeHandsFree(600);
      }
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
      setMicNeedsTap(true);
    }
  }

  async function activateHandsFree(automatic = false) {
    handsFreeRef.current = true;
    setHandsFree(true);
    const eva = executives.find((item) => item.name === 'Eva') || executives[0];
    const greeting = account ? introFor(eva, account.tenant.business_name, account.user?.first_name) : reply;
    if (!recognitionSupported) {
      if (automatic && greeting) void speak(eva, greeting);
      return;
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      setMicNeedsTap(false);
      if (automatic) {
        setReply(greeting);
        void speak(eva, greeting);
      } else {
        setReply(`Hands-Free is on. I am listening for your question to ${selected.name}.`);
        window.setTimeout(startListening, 100);
      }
    } catch {
      setMicNeedsTap(true);
      if (automatic) {
        setReply(greeting);
        void speak(eva, greeting);
      } else {
        setReply('Hands-Free is the default. Your browser needs one microphone-permission tap before automatic listening can begin.');
      }
    }
  }

  function turnHandsFreeOff() {
    handsFreeRef.current = false;
    setHandsFree(false);
    setMicNeedsTap(false);
    stopListening();
  }

  async function askExecutive(override?: string) {
    const question = (override ?? input).trim();
    if (!question || busyRef.current || !account || !token) return;
    stopListening();
    busyRef.current = true;
    setBusy(true);
    setSources([]);
    setRouting(null);
    setQueuedAction(null);
    setResearchWarning('');
    setMemoryPulse(false);
    const userMessage: ChatMessage = { role: 'user', content: question };
    const nextMessages: ChatMessage[] = [...messages, userMessage].slice(-20);
    setMessages(nextMessages);
    setReply('');
    const requestedExecutive = intakeMode ? 'Auto' : selected.name;
    try {
      const response = await fetch('/api/customer/assistant', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: account.tenant.slug,
          executive: requestedExecutive,
          messages: nextMessages,
          mode,
          researchWeb: mode === 'research',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data.error || `${selected.name} could not answer right now.`);
      const routed = executives.find((item) => item.name === data.executive) || selected;
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.reply };
      setMessages([...nextMessages, assistantMessage].slice(-20));
      setReply(data.reply);
      setInput('');
      setSources(Array.isArray(data.sources) ? data.sources : []);
      setRouting(data.routing || null);
      setQueuedAction(data.action || null);
      setCapabilities(data.capabilities || capabilities);
      setResearchWarning(data.researchWarning || '');
      setMemoryPulse(Boolean(data.memoryCaptured));
      if (intakeMode) setIntakeMode(false);
      if (routed.name !== selected.name) setSelectedName(routed.name);
      busyRef.current = false;
      setBusy(false);
      void speak(routed, data.reply);
      return;
    } catch (error) {
      setReply(error instanceof Error ? error.message : 'The executive team is temporarily unavailable.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    resumeHandsFree(600);
  }

  function selectExecutive(executive: Executive) {
    stopListening();
    stopSpeaking();
    setIntakeMode(false);
    setSelectedName(executive.name);
    const intro = introFor(executive, account?.tenant.business_name || 'your company', account?.user?.first_name);
    setReply(intro);
    setSources([]);
    setRouting(null);
    setQueuedAction(null);
    setMessages((current) => [...current, { role: 'assistant' as const, content: intro }].slice(-20));
    void speak(executive, intro);
  }

  if (!account) return <main style={loadingStyle}>Opening your Main Room…</main>;

  const home = `/workspace/${account.tenant.slug}`;
  const missionControl = `/workspace/${account.tenant.slug}/mission-control`;
  const actionCenter = `/workspace/${account.tenant.slug}/action-center`;
  const companyBrain = `/workspace/${account.tenant.slug}/executive-suite?tab=brain`;
  const speaking = speakingName === selected.name;
  const firstName = account.user?.first_name && account.user.first_name.toLowerCase() !== 'there' ? account.user.first_name : '';
  const connectionLabel = capabilities?.googleWorkspace
    ? 'Google connected'
    : capabilities?.microsoft365
      ? 'Microsoft connected'
      : 'External tools not connected';

  return (
    <main className="avatar-room">
      <div className="avatar-room-shell">
        <header className="avatar-room-header">
          <div>
            <div className="avatar-room-brand">ARIDON BRAIN · {account.tenant.business_name.toUpperCase()}</div>
            <h1>{firstName ? `Welcome, ${firstName}.` : 'Executive Main Room'}</h1>
            <p>Tell Eva what you want. Aridon can answer fast, think deeper, research the live web, or turn a decision into a controlled action.</p>
          </div>
          <div className="avatar-room-header-actions">
            {handsFree ? <button className="handsfree-toggle on" onClick={micNeedsTap ? () => void activateHandsFree(false) : turnHandsFreeOff}>{micNeedsTap ? '🎙 Enable Microphone' : listening ? '🎙 Listening Automatically' : '🎙 Hands-Free On'}</button> : <button className="handsfree-toggle" onClick={() => void activateHandsFree(false)}>🎙 Turn Hands-Free On</button>}
            <button className={`voice-toggle ${voiceEnabled ? 'on' : ''}`} onClick={() => { if (voiceEnabled) stopSpeaking(); setVoiceEnabled((value) => !value); }}>{voiceEnabled ? '🔊 Voices On' : '🔇 Voice Off'}</button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Link href={home} target="_blank" style={toolLink}>Company Dashboard ↗</Link>
          <Link href={missionControl} target="_blank" style={toolLink}>Mission Control ↗</Link>
          <Link href={actionCenter} target="_blank" style={toolLink}>Action Center ↗</Link>
          <Link href={companyBrain} target="_blank" style={toolLink}>Company Brain ↗</Link>
          <Link href="/customer/opportunities" target="_blank" style={toolLink}>Opportunities ↗</Link>
        </div>

        <section style={brainModePanel} aria-label="Aridon Brain mode">
          <div style={brainModeIntro}>
            <div style={{ fontSize: 10, letterSpacing: 1, fontWeight: 950, color: '#9EF0CF' }}>CHOOSE HOW ARIDON WORKS</div>
            <strong>{selectedMode.icon} {selectedMode.label}</strong>
            <span>{selectedMode.description}</span>
          </div>
          <div style={brainModeButtons}>
            {brainModes.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={busy}
                onClick={() => setMode(item.id)}
                aria-pressed={mode === item.id}
                title={item.description}
                style={mode === item.id ? brainModeButtonActive : brainModeButton}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
        </section>

        <div style={brainStatusBar}>
          <span><strong>{capabilities?.aiProviders?.length || 0}</strong> AI engines ready</span>
          <span>{connectionLabel}</span>
          <span><strong>{capabilities?.companyFiles || 0}</strong> company files</span>
          <span><strong>{capabilities?.durableMemories || 0}</strong> durable memories</span>
          <span><strong>{continuityCount}</strong> prior messages loaded</span>
          {memoryPulse && <span style={{ color: '#9EF0CF' }}>✓ Continuity saved</span>}
        </div>

        <section className="avatar-stage">
          <div className={`avatar-feature ${speaking ? 'is-speaking' : ''}`}>
            <div className="avatar-feature-image-wrap" style={{ '--avatar-color': selected.color } as React.CSSProperties}>
              <img src={selected.avatar} alt={`${selected.name}, ${selected.role}`} className="avatar-feature-image" style={{ transform: speaking ? `scale(${1.006 + (speechBeat % 3) * 0.003}) translateY(${speechBeat % 2 ? '-1px' : '1px'})` : 'scale(1)' }} />
              <div className="avatar-speaking-ring" />
              <div className="avatar-wave" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              {speaking && <div className="avatar-speaking-label">Speaking</div>}
            </div>
            <div className="avatar-feature-copy">
              <div className="avatar-online">● Online</div>
              <h2>{selected.name}</h2>
              <div className="avatar-role" style={{ color: selected.color }}>{selected.role}</div>
              <p>{selected.tagline}</p>
              <div className="avatar-expertise">{selected.expertise.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          </div>

          <div className="avatar-conversation">
            <div className="avatar-conversation-head">
              <div><h3>{intakeMode ? 'What are you looking to do?' : `Talk with ${selected.name}`}</h3><p>{intakeMode ? `Answer Eva naturally. ${selectedMode.label} mode is on.` : `${selectedMode.label} mode · ${selectedMode.description}`}</p></div>
              <div className={`voice-status ${listening ? 'listening' : speaking ? 'speaking' : handsFree ? 'ready' : ''}`}>{listening ? '● Listening' : speaking ? '● Speaking' : handsFree ? '● Ready' : '● Manual'}</div>
            </div>
            {intakeMode && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {intakeChoices.map((choice) => (
                  <button key={choice} type="button" onClick={() => void askExecutive(choice)} disabled={busy} style={intakeChoiceStyle}>{choice}</button>
                ))}
              </div>
            )}
            <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={mode === 'act' ? 'Tell Eva what you want Aridon to move forward…' : mode === 'research' ? 'What should Aridon research and verify?' : intakeMode ? 'Tell Eva what you want to get done today…' : `Ask ${selected.name} anything about ${account.tenant.business_name}…`} />
            <button className="avatar-primary avatar-ask" onClick={() => void askExecutive()} disabled={busy || !input.trim()}>{busy ? `${selected.name} is working…` : mode === 'act' ? 'Prepare Action' : mode === 'research' ? 'Research It' : intakeMode ? 'Tell Eva What I Need' : `Ask ${selected.name}`}</button>

            {routing && (
              <div style={routeBadge}>
                <strong>{routing.provider || 'AI'} · {routing.model || 'model'}</strong>
                <span>{routing.task || mode}{routing.fallbackUsed ? ' · fallback used' : ''}{routing.totalLatencyMs ? ` · ${(routing.totalLatencyMs / 1000).toFixed(1)}s` : ''}</span>
              </div>
            )}

            <div className="avatar-reply" aria-live="polite">{reply || `Aridon ${selectedMode.label} mode is ready. Start talking to ${selected.name}.`}</div>

            {researchWarning && <div style={warningBox}>{researchWarning}</div>}

            {sources.length > 0 && (
              <div style={sourcePanel}>
                <strong>Sources</strong>
                <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                  {sources.slice(0, 8).map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={sourceLink}>{source.title || source.url} ↗</a>
                  ))}
                </div>
              </div>
            )}

            {queuedAction && (
              <div style={actionCard}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: 1 }}>ACTION FABRIC</div>
                  <strong>{queuedAction.title}</strong>
                  <p style={{ margin: '5px 0 0', fontSize: 12 }}>{queuedAction.adapterKey.replace(/_/g, ' ')} · {queuedAction.status}{queuedAction.approvalRequired ? ' · approval required' : ' · ready to execute'}</p>
                </div>
                <Link href={actionCenter} target="_blank" style={actionLink}>{queuedAction.approvalRequired ? 'Review & approve ↗' : 'Execute in Action Center ↗'}</Link>
              </div>
            )}

            {micNeedsTap && <div className="avatar-browser-note">Your browser requires one microphone or audio interaction. Tap “Enable Microphone” once. After that, Hands-Free continues automatically.</div>}
            {!recognitionSupported && <div className="avatar-browser-note">This browser does not expose speech recognition. You can still type and hear spoken answers.</div>}
          </div>
        </section>

        <section className="avatar-grid" aria-label="Executive team">
          {executives.map((executive) => {
            const active = executive.name === selected.name;
            const isSpeaking = executive.name === speakingName;
            return (
              <button key={executive.id} className={`avatar-card ${active ? 'active' : ''} ${isSpeaking ? 'is-speaking' : ''}`} style={{ '--avatar-color': executive.color } as React.CSSProperties} onClick={() => selectExecutive(executive)}>
                <div className="avatar-card-image-wrap">
                  <img src={executive.avatar} alt={executive.name} className="avatar-card-image" />
                  <div className="avatar-card-wave" aria-hidden="true"><span /><span /><span /></div>
                </div>
                <div className="avatar-card-copy"><strong>{executive.name}</strong><span>{executive.role}</span><small>{active ? 'In the chair now' : 'Tap to bring in'}</small></div>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}

const loadingStyle = { minHeight: '100vh', background: '#08101D', color: '#F7FAFC', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const toolLink = { border: '1px solid #34435D', color: '#DDE7F5', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 12, background: '#10192A' };
const intakeChoiceStyle = { border: '1px solid #3B516E', background: '#101B2D', color: '#DDE7F5', borderRadius: 999, padding: '8px 11px', fontWeight: 800, fontSize: 12, cursor: 'pointer' as const };
const brainModePanel = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' as const, background: '#0B1525', border: '1px solid #263A55', borderRadius: 16, padding: 14, marginBottom: 10 };
const brainModeIntro = { display: 'grid', gap: 3, color: '#EAF1FA', minWidth: 220 };
const brainModeButtons = { display: 'flex', gap: 7, flexWrap: 'wrap' as const };
const brainModeButton = { border: '1px solid #3A4B66', background: '#111C2E', color: '#D6E0ED', borderRadius: 11, padding: '9px 12px', fontWeight: 900, cursor: 'pointer' as const };
const brainModeButtonActive = { ...brainModeButton, background: '#9EF0CF', color: '#07130F', border: '1px solid #9EF0CF' };
const brainStatusBar = { display: 'flex', gap: 12, flexWrap: 'wrap' as const, color: '#9CACBF', fontSize: 11, margin: '0 2px 16px' };
const routeBadge = { display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' as const, background: '#0E192A', border: '1px solid #2E405C', color: '#DCE7F5', borderRadius: 10, padding: '8px 10px', marginTop: 10, fontSize: 11 };
const sourcePanel = { marginTop: 10, background: '#0D1726', border: '1px solid #2C3D57', borderRadius: 12, padding: 12, color: '#EAF1FA' };
const sourceLink = { color: '#9EF0CF', textDecoration: 'none', fontSize: 12, overflowWrap: 'anywhere' as const };
const warningBox = { marginTop: 10, background: '#3A2E17', border: '1px solid #705A2B', color: '#FFE2A2', borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 1.5 };
const actionCard = { marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const, background: '#DDF5EB', color: '#10231D', borderRadius: 12, padding: 12, border: '1px solid #A8D8C5' };
const actionLink = { background: '#10231D', color: '#fff', borderRadius: 9, padding: '9px 11px', textDecoration: 'none', fontWeight: 900, fontSize: 12 };
