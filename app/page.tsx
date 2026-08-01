'use client';
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { executives } from '../lib/executives';

type AuthUser = { id: string; email: string; role: string; name: string };
type OrgUser  = { id: string; email: string; role: string; name: string; active: boolean; last_sign_in: string | null; created_at: string; confirmed: boolean };

type Msg = { role:'user'|'assistant', content:string };
type Lead    = { id:string, name:string, company:string, status:string, notes:string, email:string, division?:string, assigned_executive?:string, priority?:string, due_date?:string, next_action?:string };
type Project = { id:string, name:string, status:string, description:string, executive:string, division?:string, assigned_executive?:string, priority?:string, due_date?:string, next_action?:string };
type Task    = { id:string, title:string, status:string, priority:string, assigned_to:string, division?:string, assigned_executive?:string, due_date?:string, next_action?:string, description?:string };
type KnowledgeItem = { id:string, title:string, content:string, category:string };

// Mission Control v1 types
type Alert     = { id:string, title:string, description:string, severity:string, division:string, assigned_executive:string, status:string, created_at:string };
type ExecAction= { id:string, action_type:string, title:string, description:string, executive:string, division:string, record_type:string, created_at:string };
type Briefing  = { id:string, briefing_date:string, narrative:string, top_priorities:any[], critical_alerts:any[], recommendations:string, jim_notes:string, is_complete:boolean, created_at:string };
type Priority  = { id:string, title:string, assigned_executive:string, division:string, due_date:string, status:string, priority:string, next_action:string, record_type:string };

const statusColor = (s:string) =>
  s==='active'||s==='open'||s==='new'||s==='qualified' ? '#27AE60' :
  s==='complete'||s==='closed'||s==='done' ? '#4A90D9' : '#E87722';

export default function Home() {
  // Auth
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [authUser, setAuthUser] = useState<AuthUser|null>(null);

  // Admin panel state
  const [orgUsers, setOrgUsers]         = useState<OrgUser[]>([]);
  const [inviteEmail, setInviteEmail]   = useState('');
  const [inviteRole, setInviteRole]     = useState('member');
  const [inviteName, setInviteName]     = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const [tab, setTab] = useState('Dashboard');
  const [executive, setExecutive] = useState('Heather');
  const [messages, setMessages] = useState<Msg[]>([{role:'assistant',content:'Welcome to Aridon. Your Executive Team is online. I\'m Heather, your COO. What are we building today?'}]);
  const [input, setInput] = useState('');
  const [builder, setBuilder] = useState({companyName:'Aridon',services:'AI executive teams, business automation, infrastructure support, power and water project coordination',customers:'small businesses, contractors, tribes, utilities, data centers, government teams'});
  const [builderPlan, setBuilderPlan] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [videoStatus, setVideoStatus] = useState<'idle'|'connecting'|'ready'>('idle');
  const [shouldAutoListen, setShouldAutoListen] = useState(false);

  // Audio / speech refs
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const recognitionRef = useRef<any>(null);

  // D-ID / WebRTC refs
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection|null>(null);
  const streamIdRef = useRef<string|null>(null);
  const sessionIdRef = useRef<string|null>(null);
  const handsFreeRef = useRef(false);
  const videoReadyRef = useRef(false);
  const streamReadyRef = useRef(false);
  const chatRef = useRef<HTMLDivElement|null>(null);
  const [videoDebug, setVideoDebug] = useState('');
  const [didSpeaking, setDidSpeaking] = useState(false); // true only when D-ID is streaming video

  // ─── Cookie-based stream ID tracker (survives page refreshes / tab closes) ───
  // Cookies outlive React state; we use them to delete the previous D-ID session
  // even when streamIdRef was reset by a refresh.
  function saveCookieStreamId(id: string) {
    try { document.cookie = `did_sid=${id}; max-age=3600; path=/; SameSite=Strict`; } catch {}
  }
  function getCookieStreamId(): string | null {
    try { return document.cookie.match(/(?:^|;\s*)did_sid=([^;]+)/)?.[1] ?? null; } catch { return null; }
  }
  function clearCookieStreamId() {
    try { document.cookie = 'did_sid=; max-age=0; path=/'; } catch {}
  }

  // ─── localStorage stream ID tracker ─────────────────────────────────────────
  // Persists stream IDs across page refreshes so we can DELETE them on next boot.
  function saveStreamId(id: string) {
    try {
      const existing: string[] = JSON.parse(localStorage.getItem('didStreamIds') || '[]');
      if (!existing.includes(id)) {
        existing.push(id);
        localStorage.setItem('didStreamIds', JSON.stringify(existing));
      }
    } catch {}
  }
  function removeStreamId(id: string) {
    try {
      const existing: string[] = JSON.parse(localStorage.getItem('didStreamIds') || '[]');
      localStorage.setItem('didStreamIds', JSON.stringify(existing.filter(x => x !== id)));
    } catch {}
  }
  async function deleteStoredStreams() {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('didStreamIds') || '[]');
      if (ids.length === 0) return 0;
      let deleted = 0;
      await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(`/api/did/${id}`, { method: 'DELETE' });
          if (res.ok || res.status === 404) { removeStreamId(id); deleted++; }
        } catch {}
      }));
      return deleted;
    } catch { return 0; }
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setAuthUser({
          id:   u.id,
          email: u.email || '',
          role:  u.user_metadata?.role || 'member',
          name:  u.user_metadata?.name || u.email?.split('@')[0] || 'User',
        });
      }
    });
  }, []);

  async function signOut() {
    await fetch('/api/auth', { method: 'POST' });
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  // ── Admin helpers ─────────────────────────────────────────────────────────────
  async function fetchOrgUsers() {
    const res = await fetch('/api/admin/users');
    if (res.ok) setOrgUsers(await res.json());
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviteStatus('Sending…');
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, name: inviteName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setInviteStatus(`✓ Invite sent to ${inviteEmail}`);
      setInviteEmail(''); setInviteName(''); setInviteRole('member');
      fetchOrgUsers();
    } else {
      setInviteStatus(`✗ ${data.error}`);
    }
    setTimeout(() => setInviteStatus(''), 4000);
  }

  async function updateUserRole(id: string, role: string) {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) });
    fetchOrgUsers();
  }

  async function toggleUserActive(id: string, active: boolean) {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active }) });
    fetchOrgUsers();
  }

  async function removeUser(id: string, email: string) {
    if (!confirm(`Permanently remove ${email}? This cannot be undone.`)) return;
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
    fetchOrgUsers();
  }

  // Live data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);

  // Dashboard state
  const [lastRefreshed, setLastRefreshed] = useState('');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<KnowledgeItem|null>(null);
  const [ideaCopied, setIdeaCopied] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeItem|null>(null);
  const [docCopied, setDocCopied] = useState(false);

  // Mission Control v1 state
  const [alerts, setAlerts]                   = useState<Alert[]>([]);
  const [execActions, setExecActions]         = useState<ExecAction[]>([]);
  const [briefing, setBriefing]               = useState<Briefing|null>(null);
  const [briefingArchive, setBriefingArchive] = useState<Briefing[]>([]);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [briefingError, setBriefingError]     = useState('');
  const [briefingJimNotes, setBriefingJimNotes] = useState('');
  const [showBriefingArchive, setShowBriefingArchive] = useState(false);

  // Add forms
  const [newLead, setNewLead] = useState({name:'',company:'',email:'',notes:'',status:'new'});
  const [newProject, setNewProject] = useState({name:'',description:'',executive:'Heather',status:'active'});
  const [newTask, setNewTask] = useState({title:'',assigned_to:'',priority:'medium',status:'open'});
  const [newKnowledge, setNewKnowledge] = useState({title:'',category:'',content:''});

  useEffect(() => {
    fetchLeads(); fetchProjects(); fetchTasks(); fetchKnowledge();
    fetchAlerts(); fetchExecActions(); fetchBriefing();
    setLastRefreshed(new Date().toLocaleTimeString());
  }, []);

  // Auto-refresh all data every 30 seconds
  useEffect(() => {
    const id = setInterval(async () => {
      await Promise.all([fetchLeads(), fetchProjects(), fetchTasks(), fetchKnowledge(), fetchAlerts(), fetchExecActions()]);
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Keep handsFree + videoReady refs in sync (for use inside WebRTC callbacks)
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);
  useEffect(() => { videoReadyRef.current = videoReady; }, [videoReady]);

  // Auto-listen trigger (used by hands-free to bridge WebRTC callback → React)
  useEffect(() => {
    if (shouldAutoListen) { setShouldAutoListen(false); startListening(); }
  }, [shouldAutoListen]);

  // Init D-ID stream whenever executive or tab changes
  useEffect(() => {
    if (tab === 'Heather Chat') initDIDStream(executive);
  }, [tab, executive]);

  // Cleanup D-ID on unmount
  useEffect(() => {
    return () => { closeDIDStream(); };
  }, []);

  // On page refresh/close, fire a beacon DELETE so the stream is closed even if
  // the async closeDIDStream() doesn't complete before the page unloads.
  useEffect(() => {
    const onUnload = () => {
      const id = streamIdRef.current;
      if (id) {
        // keepalive keeps the fetch alive through page unload (unlike sendBeacon, supports DELETE)
        fetch(`/api/did/${id}`, { method: 'DELETE', keepalive: true }).catch(() => {});
        removeStreamId(id);
        clearCookieStreamId();
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  async function fetchLeads() {
    const res = await fetch('/api/crm'); if (res.ok) setLeads(await res.json());
  }
  async function fetchProjects() {
    const res = await fetch('/api/projects'); if (res.ok) setProjects(await res.json());
  }
  async function fetchTasks() {
    const res = await fetch('/api/tasks'); if (res.ok) setTasks(await res.json());
  }
  async function fetchKnowledge() {
    const res = await fetch('/api/knowledge'); if (res.ok) setKnowledge(await res.json());
  }

  async function refreshAll() {
    await Promise.all([fetchLeads(), fetchProjects(), fetchTasks(), fetchKnowledge(), fetchAlerts(), fetchExecActions()]);
    setLastRefreshed(new Date().toLocaleTimeString());
  }

  // ── Mission Control data fetchers ─────────────────────────────────────────────
  async function fetchAlerts() {
    const res = await fetch('/api/alerts?status=open&limit=20');
    if (res.ok) setAlerts(await res.json());
  }
  async function fetchExecActions() {
    const res = await fetch('/api/executive-actions?limit=15');
    if (res.ok) setExecActions(await res.json());
  }
  async function fetchBriefing() {
    const res = await fetch('/api/briefings?latest=1');
    if (res.ok) {
      const data = await res.json();
      if (data) setBriefing(data);
    }
  }
  async function fetchBriefingArchive() {
    const res = await fetch('/api/briefings');
    if (res.ok) setBriefingArchive(await res.json());
  }
  async function generateBriefing() {
    setIsGeneratingBriefing(true);
    setBriefingError('');
    try {
      const res = await fetch('/api/briefings/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setBriefingError(data.error || 'Generation failed'); return; }
      setBriefing(data);
      setBriefingJimNotes('');
    } catch (e: any) {
      setBriefingError(e?.message || 'Network error');
    } finally {
      setIsGeneratingBriefing(false);
    }
  }
  async function saveBriefingNotes() {
    if (!briefing) return;
    const res = await fetch('/api/briefings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: briefing.id, jim_notes: briefingJimNotes }),
    });
    if (res.ok) setBriefing({ ...briefing, jim_notes: briefingJimNotes });
  }
  async function markBriefingComplete() {
    if (!briefing) return;
    const res = await fetch('/api/briefings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: briefing.id, is_complete: true }),
    });
    if (res.ok) setBriefing({ ...briefing, is_complete: true });
  }

  async function generateIdeas() {
    setIsGeneratingIdeas(true);
    try {
      // Ask each executive for one top idea; save results to Knowledge Vault
      for (const exec of executives) {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              executive: exec.name,
              messages: [{
                role: 'user',
                content: `As ${exec.name} (${exec.role}), give Iron Grid Electric & Water your single most important idea or opportunity right now. Lead with a short bold title on the first line, then 1–2 sentences explaining it. Be specific and actionable.`
              }]
            })
          });
          if (!res.ok) continue;
          const { reply } = await res.json();
          if (!reply) continue;
          const firstLine = reply.split('\n').find((l: string) => l.trim()) || reply.slice(0, 60);
          await fetch('/api/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `${exec.abbr}: ${firstLine.replace(/^[*#\s]+/, '').slice(0, 80)}`,
              content: reply,
              category: 'executive-idea'
            })
          });
        } catch {}
      }
      await fetchKnowledge();
    } finally {
      setIsGeneratingIdeas(false);
    }
  }

  async function addLead() {
    if (!newLead.name.trim()) return;
    const res = await fetch('/api/crm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newLead)});
    if (!res.ok) { const e=await res.json().catch(()=>({})); alert(`Could not save lead:\n${e.error||'Supabase may not be configured. Check Vercel environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'}`); return; }
    setNewLead({name:'',company:'',email:'',notes:'',status:'new'}); fetchLeads();
  }
  async function addProject() {
    if (!newProject.name.trim()) return;
    const res = await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newProject)});
    if (!res.ok) { const e=await res.json().catch(()=>({})); alert(`Could not save project:\n${e.error||'Check Supabase setup in Vercel.'}`); return; }
    setNewProject({name:'',description:'',executive:'Heather',status:'active'}); fetchProjects();
  }
  async function addTask() {
    if (!newTask.title.trim()) return;
    const res = await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newTask)});
    if (!res.ok) { const e=await res.json().catch(()=>({})); alert(`Could not save task:\n${e.error||'Check Supabase setup in Vercel.'}`); return; }
    setNewTask({title:'',assigned_to:'',priority:'medium',status:'open'}); fetchTasks();
  }
  async function addKnowledge() {
    if (!newKnowledge.title.trim()) return;
    const res = await fetch('/api/knowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newKnowledge)});
    if (!res.ok) { const e=await res.json().catch(()=>({})); alert(`Could not save to vault:\n${e.error||'Check Supabase setup in Vercel.'}`); return; }
    setNewKnowledge({title:'',category:'',content:''}); fetchKnowledge();
  }

  // ─── TTS fallback (used when D-ID not configured) ───────────────────────────
  async function speak(text: string, execName: string) {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setIsSpeaking(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({text, executive: execName})
      });
      if (!res.ok) { setIsSpeaking(false); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        if (handsFreeRef.current) setShouldAutoListen(true);
      };
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch { setIsSpeaking(false); }
  }

  // ─── D-ID stream management ──────────────────────────────────────────────────
  async function closeDIDStream() {
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch {}
      peerConnectionRef.current = null;
    }
    if (streamIdRef.current) {
      const id = streamIdRef.current;
      streamIdRef.current = null;
      sessionIdRef.current = null;
      try { await fetch(`/api/did/${id}`, { method: 'DELETE' }); } catch {}
      removeStreamId(id);
      clearCookieStreamId();
    }
    setVideoReady(false);
    setVideoStatus('idle');
    setVideoDebug('');
    streamReadyRef.current = false;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function initDIDStream(execName: string) {
    // Delete any session left over from a previous page load (cookie survives refreshes)
    const prevCookieId = getCookieStreamId();
    if (prevCookieId && prevCookieId !== streamIdRef.current) {
      clearCookieStreamId();
      await fetch(`/api/did/${prevCookieId}`, { method: 'DELETE' }).catch(() => {});
    }

    await closeDIDStream();
    const exec = executives.find(e => e.name === execName);
    if (!exec) { setVideoDebug('exec not found'); return; }

    setVideoStatus('connecting');
    setVideoDebug('creating stream…');
    try {
      // 1. Create D-ID stream
      const streamRes = await fetch('/api/did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_url: `${window.location.origin}${exec.avatar}` }),
      });
      let payload = await streamRes.json();
      let streamHttpStatus = streamRes.status;

      // If D-ID says "Max user sessions reached", nuke ALL sessions server-side then retry
      if (!streamRes.ok && (payload?.error?.description ?? '').includes('Max user sessions')) {
        setVideoDebug('max sessions — clearing all D-ID streams…');
        // First delete localStorage-tracked streams individually
        await deleteStoredStreams();
        // Then call server-side cleanup which lists + deletes ALL streams from D-ID
        try {
          const cleanRes = await fetch('/api/did/cleanup', { method: 'DELETE' });
          const cleanData = await cleanRes.json().catch(() => ({}));
          setVideoDebug(`cleared ${cleanData.deleted ?? 0} stream(s) — retrying…`);
        } catch {}
        // Wait a moment for D-ID to release sessions, then retry up to 3 times
        let resolved = false;
        for (let attempt = 1; attempt <= 3 && !resolved; attempt++) {
          for (let i = 8; i >= 1; i--) {
            setVideoDebug(`sessions cleared — retry ${attempt}/3 in ${i}s…`);
            await new Promise(r => setTimeout(r, 1000));
          }
          const retryRes = await fetch('/api/did', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_url: `${window.location.origin}${exec.avatar}` }),
          });
          payload = await retryRes.json();
          streamHttpStatus = retryRes.status;
          if (retryRes.ok || !(payload?.error?.description ?? '').includes('Max user sessions')) {
            resolved = true;
          }
        }
      }

      const { id, offer, ice_servers, session_id } = payload;
      if (!id || !offer) {
        setVideoStatus('idle');
        setVideoDebug(`stream failed ${streamHttpStatus}: ${JSON.stringify(payload).slice(0,120)}`);
        return;
      }
      const sid = session_id ? String(session_id).slice(0,12)+'…' : 'none';
      setVideoDebug(`stream OK · sid:${sid}`);
      saveStreamId(id);
      saveCookieStreamId(id); // cookie survives page refreshes for reliable cleanup

      streamIdRef.current = id;
      sessionIdRef.current = session_id || null;

      // 2. WebRTC peer connection
      const pc = new RTCPeerConnection({ iceServers: ice_servers });
      peerConnectionRef.current = pc;

      // D-ID requires the data channel to be created CLIENT-side
      const dc = pc.createDataChannel('JanusDataChannel');
      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const evt = msg.event || msg.status || '';
          if (evt === 'stream/started' || evt === 'started') {
            setIsSpeaking(true);
            setDidSpeaking(true);
          }
          if (evt === 'stream/done' || evt === 'done') {
            setIsSpeaking(false);
            setDidSpeaking(false);
            if (handsFreeRef.current) setShouldAutoListen(true);
          }
        } catch {}
      };

      // Receive video/audio stream
      pc.addEventListener('track', (event) => {
        const stream = event.streams?.[0];
        if (!stream || !videoRef.current || videoRef.current.srcObject) return;
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('playing', () => {
          setVideoReady(true);
          setVideoStatus('ready');
        }, { once: true });
        videoRef.current.play().catch(() => {});
      });

      // Relay ICE candidates (trickle ICE)
      pc.addEventListener('icecandidate', async (event) => {
        if (!event.candidate || !streamIdRef.current) return;
        await fetch(`/api/did/${streamIdRef.current}/ice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            session_id: sessionIdRef.current,
          }),
        });
      });

      // Track ICE state — show in UI for diagnostics
      pc.addEventListener('iceconnectionstatechange', () => {
        const s = pc.iceConnectionState;
        if (s === 'connected' || s === 'completed') {
          streamReadyRef.current = true;
          setVideoReady(true);
          setVideoStatus('ready');
          setVideoDebug('');  // clear — all good, no text needed
          // Kick video element into playing — needed for audio to come through
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
          }
        } else if (s === 'failed') {
          streamReadyRef.current = false;
          setVideoStatus('idle');
          setVideoReady(false);
          setVideoDebug('ICE failed — check /api/did/debug');
        } else if (s === 'disconnected') {
          setVideoDebug('ICE disconnected');
        } else {
          setVideoDebug(`ICE: ${s}`);
        }
      });

      // 3. SDP exchange — D-ID needs ICE gathering complete before receiving the answer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Wait for ICE gathering to finish (max 4 s), then send the fully-populated SDP
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') { resolve(); return; }
        const onStateChange = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', onStateChange);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', onStateChange);
        setTimeout(resolve, 4000); // don't wait forever
      });

      await fetch(`/api/did/${id}/sdp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: { type: pc.localDescription!.type, sdp: pc.localDescription!.sdp },
          session_id: sessionIdRef.current,
        }),
      });
    } catch (err: any) {
      setVideoStatus('idle');
      setVideoDebug(`init error: ${err?.message ?? String(err)}`);
    }
  }

  // ─── Make executive speak (D-ID preferred, TTS fallback) ────────────────────
  async function speakDID(text: string, execName: string) {
    // If stream exists but ICE isn't connected yet, wait up to 8 s before falling back to TTS
    if (streamIdRef.current && !streamReadyRef.current) {
      setVideoDebug('waiting for video stream…');
      for (let i = 0; i < 16; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (streamReadyRef.current) { setVideoDebug(''); break; }
      }
    }
    if (!streamIdRef.current || !streamReadyRef.current) {
      return speak(text, execName);
    }
    const exec = executives.find(e => e.name === execName);
    setIsSpeaking(true);

    // Ensure video element is active — calling play() here is inside a user-gesture
    // call stack, so browsers allow it even with strict autoplay policies
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }

    try {
      const res = await fetch(`/api/did/${streamIdRef.current}/talk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: text,
            provider: {
              type: 'microsoft',
              voice_id: exec?.didVoice || 'en-US-JennyNeural',
            },
          },
          config: { fluent: true, pad_audio: 0 },
          session_id: sessionIdRef.current,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const kind = errBody?.kind ?? '';
        // 402 = out of credits — fall back silently, no alarming red text
        if (res.status === 402 || kind === 'InsufficientCreditsError') {
          setVideoDebug('D-ID credits empty — using audio only');
        } else {
          setVideoDebug(`D-ID talk error ${res.status}: ${JSON.stringify(errBody).slice(0,120)}`);
        }
        setIsSpeaking(false);
        return speak(text, execName);
      }
      // D-ID accepted the talk request — mark as D-ID speaking so overlay shows
      setDidSpeaking(true);
    } catch (e: any) {
      setVideoDebug(`talk fetch error: ${e?.message}`);
      setIsSpeaking(false);
      return speak(text, execName);
    }
  }

  // ─── Voice input ─────────────────────────────────────────────────────────────
  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition is not supported in this browser. Try Chrome.'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); if (silenceTimer) clearTimeout(silenceTimer); };
    recognition.onerror = () => { setIsListening(false); if (silenceTimer) clearTimeout(silenceTimer); };
    recognition.onresult = (e: any) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interimText += e.results[i][0].transcript;
      }
      const currentText = finalText + interimText;
      setInput(currentText);
      // Auto-send after 2.5 seconds of silence
      silenceTimer = setTimeout(() => {
        if (currentText.trim()) {
          recognition.stop();
          setIsListening(false);
          setInput('');
          sendText(currentText.trim());
        }
      }, 2500);
    };
    recognition.start();
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────────
  async function sendText(text: string) {
    if (!text.trim()) return;
    const next = [...messages, {role:'user' as const, content:text}];
    setMessages(next);
    const res = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({executive, messages:next.map(m=>({role:m.role==='assistant'?'assistant':'user', content:m.content}))})
    });
    const data = await res.json();
    const reply = data.reply;
    setMessages([...next, {role:'assistant', content:reply}]);
    speakDID(reply, executive);
    // If Heather executed database actions, refresh all data so the UI reflects them
    if (data.actions?.length) { refreshAll(); }
  }

  async function send() {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendText(text);
  }

  async function buildPlan() {
    const res = await fetch('/api/builder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(builder)});
    setBuilderPlan(await res.json());
  }

  const Badge = ({s}:{s:string}) => (
    <span style={{fontSize:'11px',fontWeight:700,background:statusColor(s)+'22',color:statusColor(s),padding:'3px 10px',borderRadius:'999px',border:`1px solid ${statusColor(s)}44`,whiteSpace:'nowrap'}}>{s}</span>
  );

  const activeExec = executives.find(e => e.name === executive) ?? executives[0];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">ARIDON</div>
        <div className="tag">Your Executive Team is Online</div>
        <div className="nav">
          {['Dashboard','Briefing','Heather Chat','Builder Mode','Executive Team','CRM','Projects','Tasks','Knowledge Vault'].map(x=>
            <button key={x} onClick={()=>{setTab(x); if(x==='Briefing'){fetchBriefingArchive();}}} className={tab===x?'active':''}>{x}</button>
          )}
          {authUser?.role === 'admin' && (
            <button onClick={()=>{setTab('Admin');fetchOrgUsers();}} className={tab==='Admin'?'active':''} style={{marginTop:'8px',borderTop:'1px solid #1d2740',paddingTop:'12px'}}>⚙ Admin</button>
          )}
        </div>
        {authUser && (
          <div style={{padding:'12px 16px',borderTop:'1px solid #1d2740',marginTop:'auto'}}>
            <div style={{fontSize:'11px',color:'#9ba8c6',marginBottom:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{authUser.name}</div>
            <div style={{fontSize:'10px',color:'#4a5568',marginBottom:'8px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{authUser.email}</div>
            <button onClick={signOut} style={{width:'100%',background:'transparent',border:'1px solid #1d2740',borderRadius:'6px',padding:'6px',color:'#9ba8c6',fontSize:'11px',cursor:'pointer'}}>Sign Out</button>
          </div>
        )}
        <div className="footer">Mission Control v1.0 · Supabase Connected<br/>Iron Grid Electric &amp; Water · Aridon · SWSA</div>
      </aside>

      <main className="main">
        <div className="hero">
          <div>
            <h1 className="h1">{tab}</h1>
            <div className="sub">Aridon turns business knowledge into an AI leadership system.</div>
          </div>
          <span className="pill">● System Online</span>
        </div>

        {tab==='Dashboard' && (
          <section className="grid">

            {/* ══ MISSION CONTROL HEADER ══ */}
            <div className="card span12" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',background:'linear-gradient(135deg,#0d1630,#111827)',border:'1px solid #4A90D933'}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <h2 style={{margin:0,fontSize:'22px',letterSpacing:'0.04em'}}>Mission Control</h2>
                  <span style={{fontSize:'11px',fontWeight:700,background:'#27AE6022',color:'#27AE60',padding:'3px 10px',borderRadius:'999px',border:'1px solid #27AE6033'}}>● All Systems Online</span>
                </div>
                <div className="muted" style={{fontSize:'12px',marginTop:'4px'}}>
                  Iron Grid Electric &amp; Water · Aridon · SWSA{lastRefreshed&&` · Refreshed ${lastRefreshed}`}
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button className="btn secondary" onClick={refreshAll} style={{fontSize:'13px',padding:'8px 14px'}}>⟳ Refresh</button>
                <button className="btn secondary" onClick={()=>setTab('Briefing')} style={{fontSize:'13px',padding:'8px 14px'}}>📋 Briefing Archive</button>
                <button className="btn" onClick={generateBriefing} disabled={isGeneratingBriefing} style={{fontSize:'13px',padding:'8px 16px',opacity:isGeneratingBriefing?0.6:1,background:'#E87722',border:'none'}}>
                  {isGeneratingBriefing?'Generating…':'✦ Generate Briefing'}
                </button>
              </div>
            </div>

            {/* ══ ROW: HEATHER'S BRIEFING + CRITICAL ALERTS ══ */}

            {/* Heather's Briefing */}
            <div className="card span8" style={{minHeight:'220px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#E8772222',border:'1px solid #E8772244',display:'grid',placeItems:'center',overflow:'hidden',flexShrink:0,position:'relative'}}>
                    <span style={{fontWeight:900,fontSize:'14px',color:'#E87722'}}>H</span>
                    <img src="/executives/heather.jpg" alt="Heather" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'10px',zIndex:1}} onError={(ev)=>{(ev.target as HTMLImageElement).style.display='none'}}/>
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:'14px'}}>Heather's Briefing</div>
                    <div style={{fontSize:'11px',color:'#9ba8c6'}}>{briefing ? new Date(briefing.briefing_date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}) : 'No briefing yet today'}</div>
                  </div>
                </div>
                {briefing?.is_complete&&<span style={{fontSize:'10px',background:'#27AE6022',color:'#27AE60',padding:'2px 8px',borderRadius:'999px',border:'1px solid #27AE6033'}}>✓ Reviewed</span>}
              </div>
              {briefingError&&<div style={{color:'#e74c3c',fontSize:'12px',marginBottom:'10px',padding:'8px',background:'#e74c3c11',borderRadius:'8px'}}>{briefingError}</div>}
              {briefing?(
                <div style={{fontSize:'13px',lineHeight:'1.8',color:'#cdd6f4',whiteSpace:'pre-wrap'}}>{briefing.narrative}</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'120px',gap:'12px'}}>
                  <div className="muted" style={{fontSize:'13px',textAlign:'center'}}>No briefing generated yet today. Click "Generate Briefing" to have Heather brief you on current operations.</div>
                  <button className="btn" onClick={generateBriefing} disabled={isGeneratingBriefing} style={{fontSize:'12px',padding:'8px 18px',background:'#E87722',border:'none',opacity:isGeneratingBriefing?0.6:1}}>
                    {isGeneratingBriefing?'Generating…':'✦ Generate Now'}
                  </button>
                </div>
              )}
              {briefing&&(
                <div style={{marginTop:'16px',paddingTop:'12px',borderTop:'1px solid #1d2740',display:'flex',gap:'8px'}}>
                  <button className="btn secondary" style={{flex:1,fontSize:'12px',padding:'6px'}} onClick={()=>setTab('Briefing')}>View Archive →</button>
                  {!briefing.is_complete&&<button className="btn secondary" style={{flex:1,fontSize:'12px',padding:'6px',borderColor:'#27AE60',color:'#27AE60'}} onClick={markBriefingComplete}>✓ Mark Reviewed</button>}
                </div>
              )}
            </div>

            {/* Critical Alerts */}
            <div className="card span4" style={{minHeight:'220px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Critical Alerts</h3>
                <span style={{fontSize:'19px',fontWeight:900,color:alerts.filter(a=>a.severity==='red').length>0?'#e74c3c':'#9ba8c6'}}>{alerts.filter(a=>a.status==='open').length}</span>
              </div>
              {/* Traffic light summary */}
              <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
                {[{sev:'red',color:'#e74c3c',label:'Critical'},{sev:'amber',color:'#F1C40F',label:'Warning'},{sev:'green',color:'#27AE60',label:'OK'}].map(({sev,color,label})=>{
                  const n = alerts.filter(a=>a.severity===sev&&a.status==='open').length;
                  return (
                    <div key={sev} style={{flex:1,textAlign:'center',padding:'8px 4px',borderRadius:'10px',background:`${color}11`,border:`1px solid ${color}33`}}>
                      <div style={{fontSize:'18px',fontWeight:900,color}}>{n}</div>
                      <div style={{fontSize:'10px',color:'#9ba8c6'}}>{label}</div>
                    </div>
                  );
                })}
              </div>
              {alerts.filter(a=>a.status==='open').length===0?(
                <div className="muted" style={{fontSize:'12px',lineHeight:'1.6'}}>No open alerts. Add alerts in Supabase or via the API to track critical issues.</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'6px',maxHeight:'220px',overflowY:'auto'}}>
                  {alerts.filter(a=>a.status==='open').slice(0,8).map(a=>{
                    const clr = a.severity==='red'?'#e74c3c':a.severity==='green'?'#27AE60':'#F1C40F';
                    return (
                      <div key={a.id} style={{padding:'8px 10px',borderRadius:'8px',background:`${clr}0d`,border:`1px solid ${clr}33`,display:'flex',gap:'8px',alignItems:'flex-start'}}>
                        <span style={{color:clr,fontSize:'10px',fontWeight:900,marginTop:'2px',flexShrink:0}}>{a.severity==='red'?'🔴':a.severity==='green'?'🟢':'🟡'}</span>
                        <div>
                          <div style={{fontWeight:700,fontSize:'12px',color:clr}}>{a.title}</div>
                          {a.description&&<div style={{fontSize:'11px',color:'#9ba8c6',marginTop:'2px'}}>{a.description.slice(0,80)}{a.description.length>80?'…':''}</div>}
                          {a.division&&<div style={{fontSize:'10px',color:'#4a5568',marginTop:'2px'}}>{a.division}{a.assigned_executive?` · ${a.assigned_executive}`:''}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ══ TODAY'S TOP PRIORITIES ══ */}
            <div className="card span12">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Today's Top Priorities</h3>
                <button className="btn secondary" style={{fontSize:'12px',padding:'5px 12px'}} onClick={()=>setTab('Tasks')}>View All Tasks →</button>
              </div>
              {tasks.filter(t=>t.status==='open'||t.status==='in-progress').length===0?(
                <div className="muted" style={{fontSize:'13px'}}>No open tasks. Add high-priority tasks in the Tasks tab.</div>
              ):(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'10px'}}>
                  {tasks.filter(t=>t.status==='open'||t.status==='in-progress').sort((a,b)=>{const ord={high:0,medium:1,low:2};return (ord[a.priority as keyof typeof ord]??1)-(ord[b.priority as keyof typeof ord]??1);}).slice(0,5).map((t,i)=>{
                    const prioColor = t.priority==='high'?'#e74c3c':t.priority==='low'?'#27AE60':'#F1C40F';
                    const exec = executives.find(e=>e.name===(t.assigned_executive||t.assigned_to));
                    return (
                      <div key={t.id} style={{padding:'12px 14px',borderRadius:'12px',background:'#0a0e1a',border:`1px solid ${prioColor}33`,position:'relative'}}>
                        <div style={{position:'absolute',top:'10px',right:'12px',fontSize:'10px',fontWeight:700,background:`${prioColor}22`,color:prioColor,padding:'2px 8px',borderRadius:'999px',border:`1px solid ${prioColor}44`}}>{t.priority||'medium'}</div>
                        <div style={{fontWeight:700,fontSize:'13px',paddingRight:'70px',lineHeight:'1.4',marginBottom:'6px'}}>{t.title}</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',fontSize:'11px',color:'#9ba8c6'}}>
                          {(t.assigned_executive||t.assigned_to)&&<span style={{color:exec?.color||'#4A90D9',fontWeight:600}}>{t.assigned_executive||t.assigned_to}</span>}
                          {t.division&&<span style={{background:'#1d2740',padding:'1px 6px',borderRadius:'4px'}}>{t.division}</span>}
                          {t.due_date&&<span style={{color:'#E87722'}}>due {t.due_date}</span>}
                        </div>
                        {t.next_action&&<div style={{marginTop:'6px',fontSize:'11px',color:'#4A90D9',lineHeight:'1.4'}}>→ {t.next_action}</div>}
                      </div>
                    );
                  })}
                  {tasks.filter(t=>t.status==='open').length>5&&(
                    <div style={{padding:'12px 14px',borderRadius:'12px',background:'#0a0e1a',border:'1px solid #1d2740',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <button className="btn secondary" style={{fontSize:'12px',padding:'6px 14px'}} onClick={()=>setTab('Tasks')}>+{tasks.filter(t=>t.status==='open').length-5} more tasks</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ══ EXECUTIVE TEAM STATUS ══ */}
            <div className="card span12">
              <h3 style={{margin:'0 0 14px'}}>Executive Team Status</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'10px'}}>
                {executives.map(e=>{
                  const myTasks = tasks.filter(t=>(t.assigned_executive||t.assigned_to)===e.name&&(t.status==='open'||t.status==='in-progress'));
                  const myProjects = projects.filter(p=>(p.assigned_executive||p.executive)===e.name&&p.status==='active');
                  return (
                    <button key={e.id} onClick={()=>{setTab('Heather Chat');setExecutive(e.name);setMessages([{role:'assistant',content:`I'm ${e.name}, your ${e.role}. What can I help you with?`}]);}}
                      style={{background:`${e.color}0d`,border:`1px solid ${e.color}33`,borderRadius:'14px',padding:'14px 10px',cursor:'pointer',textAlign:'center',color:'#fff',transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
                      <div style={{width:'48px',height:'48px',borderRadius:'12px',background:`${e.color}22`,display:'grid',placeItems:'center',overflow:'hidden',position:'relative',flexShrink:0}}>
                        <span style={{fontWeight:900,fontSize:'18px',color:e.color}}>{e.icon}</span>
                        {e.avatar&&<img src={e.avatar} alt={e.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'12px',zIndex:1}} onError={(ev)=>{(ev.target as HTMLImageElement).style.display='none'}}/>}
                      </div>
                      <div style={{fontWeight:700,fontSize:'12px'}}>{e.name}</div>
                      <div style={{fontSize:'10px',color:e.color,fontWeight:700}}>{e.abbr}</div>
                      <div style={{display:'flex',gap:'6px',justifyContent:'center',flexWrap:'wrap'}}>
                        {myTasks.length>0&&<span style={{fontSize:'10px',background:'#F1C40F22',color:'#F1C40F',padding:'1px 6px',borderRadius:'999px'}}>{myTasks.length} tasks</span>}
                        {myProjects.length>0&&<span style={{fontSize:'10px',background:'#27AE6022',color:'#27AE60',padding:'1px 6px',borderRadius:'999px'}}>{myProjects.length} proj</span>}
                        {myTasks.length===0&&myProjects.length===0&&<span style={{fontSize:'10px',color:'#4a5568'}}>● ready</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ══ DIVISION SUMMARIES ══ */}
            {[
              {id:'aridon',    name:'Aridon',                    icon:'🌊', color:'#4A90D9', desc:'AWG-1000 · Pilots · Investors · Token System'},
              {id:'iron-grid', name:'Iron Grid Electric & Water', icon:'⚡', color:'#E87722', desc:'Field Ops · Projects · Equipment · Revenue'},
              {id:'swsa',      name:'SW Water Security Alliance', icon:'🏛', color:'#27AE60', desc:'Gov Outreach · Partnerships · Grants · Policy'},
            ].map(div=>{
              const divLeads    = leads.filter(l=>l.division===div.id);
              const divProjects = projects.filter(p=>p.division===div.id);
              const divTasks    = tasks.filter(t=>t.division===div.id&&(t.status==='open'||t.status==='in-progress'));
              const divAlerts   = alerts.filter(a=>a.division===div.id&&a.status==='open');
              return (
                <div key={div.id} className="card span4" style={{borderTop:`3px solid ${div.color}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                    <span style={{fontSize:'22px'}}>{div.icon}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:'14px',color:div.color}}>{div.name}</div>
                      <div style={{fontSize:'11px',color:'#9ba8c6'}}>{div.desc}</div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                    {[{label:'Leads',n:divLeads.length,color:'#4A90D9'},{label:'Projects',n:divProjects.length,color:'#27AE60'},{label:'Open Tasks',n:divTasks.length,color:'#F1C40F'},{label:'Alerts',n:divAlerts.length,color:'#e74c3c'}].map(({label,n,color})=>(
                      <div key={label} style={{padding:'8px',borderRadius:'8px',background:'#0a0e1a',border:'1px solid #1d2740',textAlign:'center'}}>
                        <div style={{fontSize:'20px',fontWeight:900,color:n>0?color:'#4a5568'}}>{n}</div>
                        <div style={{fontSize:'10px',color:'#9ba8c6'}}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {divLeads.length===0&&divProjects.length===0&&divTasks.length===0&&(
                    <div className="muted" style={{fontSize:'11px',lineHeight:'1.6'}}>No records tagged to this division yet. Tag leads, projects, and tasks with division="{div.id}" to populate this summary.</div>
                  )}
                </div>
              );
            })}

            {/* ══ KEY METRICS ══ */}
            {[
              {label:'Executives Online', n:7,            color:'#E87722', sub:'All 7 active'},
              {label:'CRM Leads',         n:leads.length,   color:'#4A90D9', sub:`${leads.filter(l=>l.status==='new'||l.status==='qualified').length} active`},
              {label:'Active Projects',   n:projects.filter(p=>p.status==='active').length, color:'#27AE60', sub:`${projects.length} total`},
              {label:'Open Tasks',        n:tasks.filter(t=>t.status==='open').length,       color:'#F1C40F', sub:`${tasks.filter(t=>t.priority==='high'&&t.status==='open').length} high priority`},
            ].map(({label,n,color,sub})=>(
              <div key={label} className="card span3" style={{textAlign:'center'}}>
                <div className="kpi" style={{color}}>{n}</div>
                <div className="muted">{label}</div>
                {sub&&<div style={{fontSize:'11px',color:'#4a5568',marginTop:'4px'}}>{sub}</div>}
              </div>
            ))}

            {/* ══ RECENT ACTIVITY ══ */}
            <div className="card span12">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Recent Activity</h3>
                <span style={{fontSize:'12px',color:'#9ba8c6'}}>Last 15 actions</span>
              </div>
              {execActions.length===0?(
                <div className="muted" style={{fontSize:'13px'}}>No recent activity. Activity will populate as leads, projects, and tasks are added.</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {execActions.slice(0,10).map((a,i)=>{
                    const exec = executives.find(e=>e.name===a.executive);
                    const typeColor = a.action_type==='completed'?'#27AE60':a.action_type==='flagged'?'#e74c3c':a.action_type==='briefed'?'#E87722':'#4A90D9';
                    return (
                      <div key={a.id||i} style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'8px 10px',borderRadius:'8px',background:'#0a0e1a',border:'1px solid #1d2740'}}>
                        <div style={{width:'28px',height:'28px',borderRadius:'7px',background:`${exec?.color||'#4A90D9'}22`,display:'grid',placeItems:'center',flexShrink:0}}>
                          <span style={{fontWeight:900,fontSize:'11px',color:exec?.color||'#4A90D9'}}>{exec?.icon||'●'}</span>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'12px',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div>
                          <div style={{fontSize:'11px',color:'#9ba8c6',marginTop:'2px',display:'flex',gap:'8px',flexWrap:'wrap'}}>
                            <span style={{color:typeColor,fontWeight:600}}>{a.action_type}</span>
                            {a.executive&&<span>{a.executive}</span>}
                            {a.division&&<span style={{background:'#1d2740',padding:'1px 5px',borderRadius:'4px'}}>{a.division}</span>}
                            {a.record_type&&<span style={{color:'#4a5568'}}>{a.record_type}</span>}
                          </div>
                        </div>
                        <div style={{fontSize:'10px',color:'#4a5568',flexShrink:0,textAlign:'right'}}>
                          {new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </section>
        )}

            {/* ── KPI cards ── */}
            <div className="card span3" style={{textAlign:'center'}}>
              <div className="kpi" style={{color:'#4A90D9'}}>{leads.length}</div>
              <div className="muted">CRM Leads</div>
              {leads.filter(l=>l.status==='new'||l.status==='qualified').length>0&&(
                <div style={{fontSize:'11px',color:'#27AE60',marginTop:'4px',fontWeight:600}}>{leads.filter(l=>l.status==='new'||l.status==='qualified').length} active</div>
              )}
            </div>
            <div className="card span3" style={{textAlign:'center'}}>
              <div className="kpi" style={{color:'#27AE60'}}>{projects.length}</div>
              <div className="muted">Projects</div>
              {projects.filter(p=>p.status==='active'||p.status==='open').length>0&&(
                <div style={{fontSize:'11px',color:'#27AE60',marginTop:'4px',fontWeight:600}}>{projects.filter(p=>p.status==='active'||p.status==='open').length} active</div>
              )}
            </div>
            <div className="card span3" style={{textAlign:'center'}}>
              <div className="kpi" style={{color:'#F1C40F'}}>{tasks.filter(t=>t.status==='open').length}</div>
              <div className="muted">Open Tasks</div>
            </div>
            <div className="card span3" style={{textAlign:'center'}}>
              <div className="kpi" style={{color:'#8E44AD'}}>{knowledge.filter(k=>k.category==='executive-idea'||k.category==='ideas'||k.category==='idea').length}</div>
              <div className="muted">Team Ideas</div>
            </div>

            {/* ── Active Projects Overview ── */}
            <div className="card span6">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Active Projects</h3>
                <button className="btn secondary" style={{fontSize:'12px',padding:'5px 12px'}} onClick={()=>setTab('Projects')}>View All →</button>
              </div>
              {projects.length===0?(
                <div className="muted" style={{fontSize:'13px',lineHeight:'1.6'}}>No projects yet. Add your first project in the Projects tab.</div>
              ):(
                <div style={{display:'grid',gap:'8px',maxHeight:'300px',overflowY:'auto'}}>
                  {projects.slice(0,8).map(p=>{
                    const isBlocked = p.status==='blocked'||p.status==='at-risk'||p.status==='on-hold';
                    return (
                      <div key={p.id} style={{padding:'10px 12px',borderRadius:'10px',background:isBlocked?'#e74c3c08':'#ffffff05',border:`1px solid ${isBlocked?'#e74c3c33':'#26314f'}`}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px'}}>
                          <span style={{fontWeight:700,fontSize:'13px'}}>{p.name}</span>
                          <span style={{fontSize:'11px',fontWeight:700,color:statusColor(p.status),background:`${statusColor(p.status)}18`,padding:'2px 8px',borderRadius:'999px',flexShrink:0}}>{p.status||'active'}</span>
                        </div>
                        {p.description&&<div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'4px',lineHeight:'1.5'}}>{p.description.slice(0,120)}{p.description.length>120?'…':''}</div>}
                        {isBlocked&&<div style={{color:'#e74c3c',fontSize:'11px',fontWeight:700,marginTop:'4px'}}>⚠ Roadblock — review needed</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Lead Tracking ── */}
            <div className="card span6">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Lead Tracking</h3>
                <button className="btn secondary" style={{fontSize:'12px',padding:'5px 12px'}} onClick={()=>setTab('CRM')}>View All →</button>
              </div>
              {leads.length===0?(
                <div className="muted" style={{fontSize:'13px',lineHeight:'1.6'}}>No leads yet. Add your first lead in the CRM tab — start with the Navajo Nation and NM data center.</div>
              ):(
                <div style={{display:'grid',gap:'8px',maxHeight:'300px',overflowY:'auto'}}>
                  {leads.slice(0,8).map(l=>{
                    const isKeyAccount = l.company?.toLowerCase().includes('navajo')||l.name?.toLowerCase().includes('navajo')||l.company?.toLowerCase().includes('data center')||l.company?.toLowerCase().includes('new mexico')||l.notes?.toLowerCase().includes('navajo')||l.notes?.toLowerCase().includes('data center');
                    return (
                      <div key={l.id} style={{padding:'10px 12px',borderRadius:'10px',background:isKeyAccount?'#4A90D908':'#ffffff05',border:`1px solid ${isKeyAccount?'#4A90D944':'#26314f'}`}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px'}}>
                          <div>
                            <span style={{fontWeight:700,fontSize:'13px'}}>{l.name}</span>
                            {l.company&&<span style={{color:'#9ba8c6',fontSize:'12px',marginLeft:'6px'}}>· {l.company}</span>}
                          </div>
                          <span style={{fontSize:'11px',fontWeight:700,color:statusColor(l.status),background:`${statusColor(l.status)}18`,padding:'2px 8px',borderRadius:'999px',flexShrink:0}}>{l.status||'new'}</span>
                        </div>
                        {l.notes&&<div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'4px',lineHeight:'1.5'}}>{l.notes.slice(0,100)}{l.notes.length>100?'…':''}</div>}
                        {isKeyAccount&&<div style={{color:'#4A90D9',fontSize:'11px',fontWeight:700,marginTop:'4px'}}>★ Key Account</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Grant Opportunities ── */}
            <div className="card span4">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Grant Opportunities</h3>
                <span style={{fontSize:'20px',fontWeight:900,color:'#27AE60'}}>{knowledge.filter(k=>k.category==='grant'||k.category==='grants').length}</span>
              </div>
              {knowledge.filter(k=>k.category==='grant'||k.category==='grants').length===0?(
                <div>
                  <div className="muted" style={{fontSize:'13px',lineHeight:'1.6',marginBottom:'10px'}}>No grants tracked yet. Add grant opportunities to the Knowledge Vault with category "grant".</div>
                  <button className="btn secondary" style={{width:'100%',fontSize:'12px',padding:'8px'}} onClick={()=>setTab('Knowledge Vault')}>+ Add Grant</button>
                </div>
              ):(
                <div style={{display:'grid',gap:'8px',maxHeight:'280px',overflowY:'auto'}}>
                  {knowledge.filter(k=>k.category==='grant'||k.category==='grants').slice().reverse().slice(0,6).map(k=>(
                    <div key={k.id} onClick={()=>{setSelectedDoc(k);setDocCopied(false);}} style={{padding:'10px 12px',borderRadius:'10px',background:'#27AE6008',border:'1px solid #27AE6022',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.2)')} onMouseLeave={e=>(e.currentTarget.style.filter='')}>
                      <div style={{fontWeight:700,fontSize:'13px',color:'#27AE60'}}>{k.title}</div>
                      <div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'3px',lineHeight:'1.5'}}>{k.content?.slice(0,100)}{(k.content?.length||0)>100?'…':''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Compliance Checklist ── */}
            <div className="card span4">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Compliance</h3>
                <span style={{fontSize:'20px',fontWeight:900,color:'#8E44AD'}}>{knowledge.filter(k=>k.category==='compliance').length}</span>
              </div>
              {knowledge.filter(k=>k.category==='compliance').length===0?(
                <div>
                  <div className="muted" style={{fontSize:'13px',lineHeight:'1.6',marginBottom:'10px'}}>No compliance items yet. Add federal/tribal compliance status to the Knowledge Vault with category "compliance".</div>
                  <button className="btn secondary" style={{width:'100%',fontSize:'12px',padding:'8px'}} onClick={()=>setTab('Knowledge Vault')}>+ Add Item</button>
                </div>
              ):(
                <div style={{display:'grid',gap:'8px',maxHeight:'280px',overflowY:'auto'}}>
                  {knowledge.filter(k=>k.category==='compliance').slice().reverse().slice(0,6).map(k=>(
                    <div key={k.id} onClick={()=>{setSelectedDoc(k);setDocCopied(false);}} style={{padding:'10px 12px',borderRadius:'10px',background:'#8E44AD08',border:'1px solid #8E44AD22',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.2)')} onMouseLeave={e=>(e.currentTarget.style.filter='')}>
                      <div style={{fontWeight:700,fontSize:'13px',color:'#8E44AD'}}>{k.title}</div>
                      <div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'3px',lineHeight:'1.5'}}>{k.content?.slice(0,100)}{(k.content?.length||0)>100?'…':''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Financial Snapshot ── */}
            <div className="card span4">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Financial Snapshot</h3>
                <button className="btn secondary" style={{fontSize:'12px',padding:'5px 10px'}} onClick={()=>{setExecutive('Ledger');setMessages([{role:'assistant',content:"I'm Ledger, your CFO. What's the financial question?"}]);setTab('Heather Chat');}}>Ask Ledger</button>
              </div>
              {knowledge.filter(k=>k.category==='financial'||k.category==='finance'||k.category==='financials').length===0?(
                <div>
                  <div className="muted" style={{fontSize:'13px',lineHeight:'1.6',marginBottom:'10px'}}>No financial data yet. Add cash flow snapshots, revenue milestones, or project financials to the Knowledge Vault with category "financial".</div>
                  <button className="btn secondary" style={{width:'100%',fontSize:'12px',padding:'8px'}} onClick={()=>setTab('Knowledge Vault')}>+ Add Data</button>
                </div>
              ):(
                <div style={{display:'grid',gap:'8px',maxHeight:'280px',overflowY:'auto'}}>
                  {knowledge.filter(k=>k.category==='financial'||k.category==='finance'||k.category==='financials').slice().reverse().slice(0,6).map(k=>(
                    <div key={k.id} onClick={()=>{setSelectedDoc(k);setDocCopied(false);}} style={{padding:'10px 12px',borderRadius:'10px',background:'#1ABC9C08',border:'1px solid #1ABC9C22',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.2)')} onMouseLeave={e=>(e.currentTarget.style.filter='')}>
                      <div style={{fontWeight:700,fontSize:'13px',color:'#1ABC9C'}}>{k.title}</div>
                      <div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'3px',lineHeight:'1.5'}}>{k.content?.slice(0,100)}{(k.content?.length||0)>100?'…':''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Executive Ideas Board ── */}
            <div className="card span6">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Executive Ideas</h3>
                <button className="btn" style={{fontSize:'12px',padding:'6px 14px',opacity:isGeneratingIdeas?0.6:1}} onClick={generateIdeas} disabled={isGeneratingIdeas}>
                  {isGeneratingIdeas?'Generating…':'✦ Generate from Team'}
                </button>
              </div>
              {knowledge.filter(k=>k.category==='executive-idea'||k.category==='ideas'||k.category==='idea').length===0?(
                <div className="muted" style={{fontSize:'13px',lineHeight:'1.6'}}>No ideas yet. Click "Generate from Team" to get today's top ideas from all 7 executives.</div>
              ):(
                <div style={{display:'grid',gap:'10px',maxHeight:'280px',overflowY:'auto'}}>
                  {knowledge.filter(k=>k.category==='executive-idea'||k.category==='ideas'||k.category==='idea')
                    .slice().reverse().slice(0,8).map(k=>{
                      const execMatch = executives.find(e=>k.title?.startsWith(e.abbr+':'));
                      return (
                        <div key={k.id} onClick={()=>{setSelectedIdea(k);setIdeaCopied(false);}} style={{padding:'10px 12px',borderRadius:'10px',background:`${execMatch?execMatch.color:'#4A90D9'}0d`,border:`1px solid ${execMatch?execMatch.color:'#4A90D9'}22`,cursor:'pointer',transition:'filter 0.15s'}} onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.15)')} onMouseLeave={e=>(e.currentTarget.style.filter='brightness(1)')}>
                          <div style={{fontWeight:700,fontSize:'13px',color:execMatch?execMatch.color:'#4A90D9'}}>{k.title} <span style={{fontSize:'10px',opacity:0.6,fontWeight:400}}>— click to expand</span></div>
                          <div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'4px',lineHeight:'1.5'}}>{k.content?.split('\n').filter((l:string)=>l.trim()).slice(1).join(' ').slice(0,140)}{(k.content?.length||0)>140?'…':''}</div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* ── Open Tasks / Follow-Ups ── */}
            <div className="card span6">
              <h3 style={{margin:'0 0 12px'}}>Open Tasks & Follow-Ups</h3>
              <div className="list">
                {tasks.filter(t=>t.status==='open'||t.status==='pending').slice(0,8).map(t=>(
                  <div key={t.id} className="item" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px'}}>
                    <span style={{fontSize:'13px'}}>{t.title}</span>
                    <span style={{fontSize:'11px',fontWeight:600,color:statusColor(t.priority||'normal'),background:`${statusColor(t.priority||'normal')}18`,padding:'2px 8px',borderRadius:'999px',flexShrink:0}}>{t.priority||'normal'}</span>
                  </div>
                ))}
                {tasks.filter(t=>t.status==='open').length===0&&<div className="muted" style={{fontSize:'13px'}}>All caught up.</div>}
              </div>
            </div>

            {/* ── Idea Detail Modal ── */}
            {selectedIdea && (()=>{
              const em = executives.find(e=>selectedIdea.title?.startsWith(e.abbr+':'));
              const accent = em?.color||'#4A90D9';
              return (
                <div onClick={()=>setSelectedIdea(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:'#0f1623',border:`1px solid ${accent}44`,borderRadius:'16px',padding:'28px',maxWidth:'680px',width:'100%',maxHeight:'80vh',display:'flex',flexDirection:'column',gap:'16px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
                      <div style={{fontWeight:700,fontSize:'15px',color:accent,lineHeight:'1.4'}}>{selectedIdea.title}</div>
                      <button onClick={()=>setSelectedIdea(null)} style={{background:'none',border:'none',color:'#9ba8c6',fontSize:'20px',cursor:'pointer',flexShrink:0,lineHeight:1}}>✕</button>
                    </div>
                    <div style={{overflowY:'auto',flex:1,color:'#cdd6f4',fontSize:'13px',lineHeight:'1.8',whiteSpace:'pre-wrap'}}>{selectedIdea.content}</div>
                    <div style={{display:'flex',gap:'10px',paddingTop:'8px',borderTop:'1px solid #1d2740'}}>
                      <button onClick={()=>{navigator.clipboard.writeText(selectedIdea.content||'');setIdeaCopied(true);setTimeout(()=>setIdeaCopied(false),2500);}} style={{flex:1,background:accent,border:'none',color:'#fff',fontWeight:700,fontSize:'13px',padding:'10px',borderRadius:'10px',cursor:'pointer'}}>
                        {ideaCopied?'✓ Copied!':'📋 Copy Full Text'}
                      </button>
                      <button onClick={()=>{const sub=encodeURIComponent(selectedIdea.title||'');const body=encodeURIComponent(selectedIdea.content||'');window.open(`mailto:?subject=${sub}&body=${body}`);}} style={{flex:1,background:'#1d2740',border:`1px solid ${accent}44`,color:'#cdd6f4',fontWeight:700,fontSize:'13px',padding:'10px',borderRadius:'10px',cursor:'pointer'}}>
                        ✉ Send via Email
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Executive Roster ── */}
            <div className="card span12">
              <h3 style={{margin:'0 0 14px'}}>Executive Team — Click to Talk</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'8px'}}>
                {executives.map(e=>(
                  <button key={e.id} onClick={()=>{setTab('Heather Chat');setExecutive(e.name);setMessages([{role:'assistant',content:`I'm ${e.name}, your ${e.role}. What can I help you with?`}]);}}
                    style={{background:`${e.color}0d`,border:`1px solid ${e.color}33`,borderRadius:'12px',padding:'12px 8px',cursor:'pointer',textAlign:'center',color:'#fff',transition:'all 0.2s'}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'11px',background:`${e.color}22`,margin:'0 auto 8px',display:'grid',placeItems:'center',overflow:'hidden',position:'relative'}}>
                      <span style={{fontWeight:900,fontSize:'17px',color:e.color}}>{e.icon}</span>
                      {e.avatar&&<img src={e.avatar} alt={e.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'11px',zIndex:1}} onError={(ev)=>{(ev.target as HTMLImageElement).style.display='none'}}/>}
                    </div>
                    <div style={{fontWeight:700,fontSize:'12px'}}>{e.name}</div>
                    <div style={{fontSize:'10px',color:e.color,fontWeight:700,marginTop:'2px'}}>{e.abbr}</div>
                  </button>
                ))}
              </div>
            </div>

          </section>
        )}

        {tab==='Heather Chat' && (
          <section className="grid">

            {/* ── Left panel: executive selector + hands-free ── */}
            <div className="card span4" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              <h3 style={{margin:'0 0 4px'}}>Select Executive</h3>
              <div style={{display:'grid',gap:'6px',flex:1,overflowY:'auto'}}>
                {executives.map(e=>(
                  <button key={e.id} onClick={()=>{
                    setExecutive(e.name);
                    setMessages([{role:'assistant',content:`I'm ${e.name}, your ${e.role}. What can I help you with?`}]);
                    setInput('');
                    if(audioRef.current){audioRef.current.pause();setIsSpeaking(false);}
                  }} style={{display:'flex',alignItems:'center',gap:'10px',background:executive===e.name?`${e.color}22`:'#0d1325',border:`1px solid ${executive===e.name?e.color:'#26314f'}`,borderRadius:'12px',padding:'10px',cursor:'pointer',color:'#fff',textAlign:'left'}}>
                    <div className={executive===e.name&&isSpeaking?'speaking-ring':''} style={{'--speak-color':e.color} as any}>
                      <div style={{width:'36px',height:'36px',borderRadius:'10px',background:`linear-gradient(135deg,${e.color}44,${e.color}22)`,display:'grid',placeItems:'center',overflow:'hidden',flexShrink:0,position:'relative'}}>
                        <span style={{fontWeight:900,fontSize:'14px',color:e.color}}>{e.icon}</span>
                        {e.avatar&&<img src={e.avatar} alt={e.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'10px',zIndex:1}} onError={(ev)=>{(ev.target as HTMLImageElement).style.display='none'}}/>}
                      </div>
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:'13px'}}>{e.name}</div>
                      <div style={{color:'#9ba8c6',fontSize:'11px'}}>{e.abbr} · {e.role.split(' ').slice(-2).join(' ')}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* D-ID reset (clears stuck sessions) */}
              <div style={{marginTop:'8px'}}>
                <button onClick={async()=>{
                  await closeDIDStream();
                  setVideoStatus('connecting');
                  // Delete all stored stream IDs from localStorage
                  setVideoDebug('deleting stored streams…');
                  const n = await deleteStoredStreams();
                  for(let i=60;i>=1;i--){
                    setVideoDebug(`deleted ${n} stream(s) — waiting ${i}s for sessions to expire…`);
                    await new Promise(r=>setTimeout(r,1000));
                  }
                  setVideoDebug('reconnecting…');
                  initDIDStream(executive);
                }} style={{width:'100%',background:'#1d2740',border:'1px solid var(--line)',color:'#9ba8c6',borderRadius:'12px',padding:'8px',cursor:'pointer',fontWeight:700,fontSize:'12px'}}>
                  ↺ Reset D-ID Video
                </button>
              </div>

              {/* Hands-free toggle */}
              <div style={{marginTop:'8px',paddingTop:'12px',borderTop:'1px solid var(--line)'}}>
                <button onClick={()=>setHandsFree(h=>!h)} style={{width:'100%',background:handsFree?'#27AE6022':'#1d2740',border:`1px solid ${handsFree?'#27AE60':'var(--line)'}`,color:handsFree?'#27AE60':'#9ba8c6',borderRadius:'12px',padding:'10px',cursor:'pointer',fontWeight:700,fontSize:'13px',transition:'all 0.2s'}}>
                  {handsFree ? '🎤 Hands-Free: ON' : '🎤 Hands-Free: OFF'}
                </button>
                <div style={{fontSize:'11px',color:'#9ba8c6',marginTop:'5px',textAlign:'center'}}>
                  {handsFree ? 'Mic opens automatically after each reply' : 'Tap mic or toggle ON for hands-free'}
                </div>
              </div>
            </div>

            {/* ── Right panel: video + chat ── */}
            <div className="card span8" style={{display:'flex',flexDirection:'column',gap:'12px',padding:'16px'}}>

              {/* ── Executive header — avatar lives here, above the camera ── */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                <div>
                  <div style={{fontWeight:800,fontSize:'18px'}}>{activeExec.name}
                    <span style={{marginLeft:'8px',fontSize:'11px',fontWeight:700,background:activeExec.color,color:'#111',padding:'2px 8px',borderRadius:'999px',verticalAlign:'middle'}}>{activeExec.abbr}</span>
                  </div>
                  <div style={{fontSize:'12px',color:'#9ba8c6',marginTop:'2px'}}>{activeExec.role}</div>
                </div>
                {/* Profile avatar — top-right of panel, above and away from camera */}
                <div className={isSpeaking&&!videoReady?'speaking-ring':''} style={{'--speak-color':activeExec.color} as any}>
                  <div style={{width:'64px',height:'64px',borderRadius:'14px',overflow:'hidden',position:'relative',background:`linear-gradient(135deg,${activeExec.color}55,${activeExec.color}22)`,border:`2px solid ${activeExec.color}66`,boxShadow:`0 0 16px ${activeExec.color}30`}}>
                    <span style={{position:'absolute',inset:0,display:'grid',placeItems:'center',fontSize:'24px',fontWeight:900,color:activeExec.color}}>{activeExec.icon}</span>
                    {activeExec.avatar&&<img src={activeExec.avatar} alt={activeExec.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'12px',zIndex:1}} onError={(ev)=>{(ev.target as HTMLImageElement).style.display='none'}}/>}
                  </div>
                </div>
              </div>

              {/* ── Video panel: office/desk scene ── */}
              <div style={{position:'relative',borderRadius:'16px',overflow:'hidden',height:'420px',flexShrink:0,background:`linear-gradient(175deg,${activeExec.color}0a 0%,#0b1120 35%,#070c18 100%)`}}>

                {/* Status overlay — full-width, always on top so debug text is never hidden */}
                {(videoDebug || (videoStatus==='connecting' && !videoReady)) && (
                  <div style={{position:'absolute',top:0,left:0,right:0,zIndex:25,padding:'10px 14px',background:'linear-gradient(to bottom,rgba(5,8,18,0.92) 0%,transparent 100%)',pointerEvents:'none'}}>
                    {videoStatus==='connecting' && !videoReady && !videoDebug && (
                      <div style={{color:'#9ba8c6',fontSize:'12px',fontWeight:600,letterSpacing:'0.03em'}}>● Connecting video stream…</div>
                    )}
                    {videoDebug && (
                      <div style={{color:videoDebug.includes('error')||videoDebug.includes('failed')||videoDebug.includes('Error')||videoDebug.includes('max session')?'#e74c3c':'#9ba8c6',fontSize:'12px',fontWeight:600,wordBreak:'break-all',lineHeight:'1.5'}}>{videoDebug}</div>
                    )}
                  </div>
                )}

                {/* ── Portrait video window ──────────────────────────────────────────
                     Explicitly sized so the face is a small window inside the panel,
                     not a full-bleed fill. The desk rises up to cover the lower portion,
                     making her appear to sit behind it. */}
                <div style={{position:'absolute',top:'16px',left:0,right:0,
                             display:'flex',justifyContent:'center',zIndex:2}}>
                  <div style={{
                    width:'54%', height:'270px',
                    borderRadius:'10px', overflow:'hidden', position:'relative',
                    background:'#000',
                    boxShadow:`0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${activeExec.color}18`
                  }}>
                    {/* Idle portrait inside the video window */}
                    {!videoReady&&(
                      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(160deg,${activeExec.color}18,#000)`}}>
                        <div style={{width:'72px',height:'72px',borderRadius:'14px',overflow:'hidden',position:'relative',background:`linear-gradient(135deg,${activeExec.color}44,${activeExec.color}22)`,border:`1px solid ${activeExec.color}33`}}>
                          <span style={{position:'absolute',inset:0,display:'grid',placeItems:'center',fontSize:'28px',fontWeight:900,color:activeExec.color}}>{activeExec.icon}</span>
                          {activeExec.avatar&&<img src={activeExec.avatar} alt={activeExec.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'14px',zIndex:1}} onError={(ev)=>{(ev.target as HTMLImageElement).style.display='none'}}/>}
                        </div>
                      </div>
                    )}
                    {/* D-ID live video — scaled down so the face sits further back */}
                    <video
                      ref={videoRef}
                      autoPlay playsInline
                      style={{position:'absolute',
                              top:'50%',left:'50%',
                              transform:'translate(-50%,-50%) scale(0.68)',
                              width:'100%',height:'100%',
                              objectFit:'contain',
                              opacity:videoReady?(didSpeaking?1:0.85):0,
                              transition:'opacity 0.4s ease',
                              pointerEvents:'none'}}
                    />
                  </div>
                </div>

                {/* ── Desk overlay ───────────────────────────────────────────────────
                     Rises 210px from the bottom, covering the lower ~40% of the video
                     window. The hard desk edge lands at roughly chest/shoulder level on
                     the exec, creating the "sitting behind a desk" look. */}
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:'210px',zIndex:10,pointerEvents:'none'}}>
                  {/* Solid desk body */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:'160px',
                               background:'linear-gradient(to top,rgba(3,5,12,1) 0%,rgba(5,8,18,0.98) 60%,rgba(7,11,24,0.8) 100%)'}}/>
                  {/* Top fade — blends into the panel background above */}
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'80px',
                               background:'linear-gradient(to bottom,transparent 0%,rgba(5,8,18,0.9) 100%)'}}/>
                  {/* Hard desk-edge line */}
                  <div style={{position:'absolute',top:'58px',left:'4%',right:'4%',height:'2px',
                               background:`linear-gradient(90deg,transparent 0%,${activeExec.color}35 12%,${activeExec.color}75 50%,${activeExec.color}35 88%,transparent 100%)`}}/>
                  {/* Surface sheen */}
                  <div style={{position:'absolute',top:'60px',left:'4%',right:'4%',height:'10px',
                               background:`linear-gradient(to bottom,${activeExec.color}20 0%,transparent 100%)`}}/>
                </div>

                {/* Name + status bar — sits at bottom, on the desk */}
                <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'10px 16px 14px',zIndex:15}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontWeight:800,fontSize:'17px'}}>{activeExec.name}</span>
                    <span style={{fontSize:'11px',fontWeight:700,background:activeExec.color,color:'#111',padding:'2px 8px',borderRadius:'999px'}}>{activeExec.abbr}</span>
                    {isSpeaking&&(
                      <div className="wave-bars" style={{color:activeExec.color}}>
                        <span/><span/><span/><span/><span/>
                      </div>
                    )}
                    {isSpeaking&&(
                      <button onClick={()=>{
                        if(audioRef.current){audioRef.current.pause();}
                        if(streamIdRef.current){
                          fetch(`/api/did/${streamIdRef.current}/abort`,{method:'POST'}).catch(()=>{});
                        }
                        setIsSpeaking(false);
                      }} style={{marginLeft:'auto',background:'rgba(231,76,60,0.25)',border:'1px solid #e74c3c',color:'#e74c3c',borderRadius:'8px',padding:'3px 10px',cursor:'pointer',fontSize:'12px',fontWeight:700}}>
                        ✕ Stop
                      </button>
                    )}
                    {isListening&&(
                      <div style={{marginLeft:isSpeaking?'0':'auto',display:'flex',alignItems:'center',gap:'6px',color:'#e74c3c',fontSize:'12px',fontWeight:700}}>
                        <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#e74c3c',display:'inline-block',animation:'speakPulse 0.7s ease-in-out infinite'}}/>
                        Listening…
                      </div>
                    )}
                  </div>
                  <div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'2px',display:'flex',alignItems:'center',gap:'8px'}}>
                    {activeExec.role}
                    <span style={{fontSize:'10px',fontWeight:700,padding:'1px 7px',borderRadius:'999px',background:videoReady?'#27AE6022':'#9ba8c622',color:videoReady?'#27AE60':'#9ba8c6',border:`1px solid ${videoReady?'#27AE6044':'#9ba8c633'}`}}>
                      {videoStatus==='connecting'?'● Connecting…':videoReady?'● Live Video':'○ Audio Only'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat messages */}
              <div ref={chatRef} className="chat" style={{height:'220px'}}>
                {messages.map((m,i)=><div key={i} className={'msg '+(m.role==='user'?'user':'ai')}>{m.content}</div>)}
              </div>

              {/* Input row */}
              <div className="row">
                <button className={`mic-btn${isListening?' listening':''}`} onClick={startListening} title={isListening?'Listening… click to stop':'Click to speak'}>
                  {isListening ? '🔴' : '🎤'}
                </button>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} placeholder={isListening?'Listening…':`Ask ${executive}…`}/>
                <button className="btn" onClick={send}>Send</button>
              </div>
            </div>

          </section>
        )}

        {tab==='Builder Mode' && (
          <section className="grid">
            <div className="card span6">
              <h2>Plain-English Business Builder</h2>
              <label>Company name<input value={builder.companyName} onChange={e=>setBuilder({...builder,companyName:e.target.value})}/></label>
              <label>What do you sell/install/do?<textarea value={builder.services} onChange={e=>setBuilder({...builder,services:e.target.value})}/></label>
              <label>Who are your customers?<textarea value={builder.customers} onChange={e=>setBuilder({...builder,customers:e.target.value})}/></label>
              <button className="btn" onClick={buildPlan}>Generate Aridon Setup</button>
            </div>
            <div className="card span6">
              <h2>Builder Output</h2>
              {builderPlan
                ? <div><p>{builderPlan.setupSummary}</p><h3>Modules</h3>{builderPlan.firstModules.map((x:string)=><div className="item" key={x}>{x}</div>)}<h3>Next Steps</h3>{builderPlan.nextSteps.map((x:string)=><div className="item" key={x}>{x}</div>)}</div>
                : <p className="muted">Answer the questions and Builder Mode will create the setup plan.</p>
              }
            </div>
          </section>
        )}

        {tab==='Executive Team' && (
          <section className="grid">
            {executives.map(e=>(
              <div className="card span4" key={e.id} style={{borderTop:`3px solid ${e.color}`}}>
                <div className="exec">
                  <div className="avatar-lg" style={{background:`linear-gradient(135deg,${e.color}44,${e.color}22)`}}>
                    <span style={{fontSize:'28px',fontWeight:900,color:e.color}}>{e.icon}</span>
                    {e.avatar&&<img src={e.avatar} alt={e.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'20px',zIndex:1}} onError={(ev)=>{(ev.target as HTMLImageElement).style.display='none'}}/>}
                  </div>
                  <div style={{marginLeft:'12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div className="title" style={{fontSize:'20px'}}>{e.name}</div>
                      <span style={{fontSize:'11px',fontWeight:700,background:e.color,color:'#111',padding:'2px 8px',borderRadius:'999px'}}>{e.abbr}</span>
                    </div>
                    <div className="muted">{e.role}</div>
                  </div>
                </div>
                <p className="muted" style={{fontSize:'13px',margin:'12px 0'}}>{e.tagline}</p>
                <div style={{marginBottom:'12px'}}>
                  {e.expertise.map(x=><div key={x} style={{fontSize:'12px',color:'#9ba8c6',padding:'3px 0',display:'flex',gap:'6px',alignItems:'center'}}><span style={{color:e.color}}>●</span>{x}</div>)}
                </div>
                <button className="btn secondary" style={{width:'100%',borderColor:e.color,color:e.color}} onClick={()=>{setExecutive(e.name);setMessages([{role:'assistant',content:`I'm ${e.name}, your ${e.role}. What can I help you with?`}]);setTab('Heather Chat')}}>Contact {e.name}</button>
              </div>
            ))}
          </section>
        )}

        {tab==='CRM' && (
          <section className="grid">
            <div className="card span8">
              <h2>CRM Leads <span style={{color:'#9ba8c6',fontWeight:400,fontSize:'16px'}}>({leads.length})</span></h2>
              <div className="list" style={{marginTop:'12px'}}>
                {leads.map(x=>(
                  <div className="item" key={x.id} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px'}}>
                    <div>
                      <div style={{fontWeight:700}}>{x.name}</div>
                      <div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'2px'}}>{[x.company,x.email].filter(Boolean).join(' · ')}</div>
                      {x.notes&&<div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'4px'}}>{x.notes}</div>}
                    </div>
                    <Badge s={x.status}/>
                  </div>
                ))}
                {leads.length===0&&<p className="muted">No leads yet. Add your first lead →</p>}
              </div>
            </div>
            <div className="card span4">
              <h3>Add Lead</h3>
              <label>Name *<input value={newLead.name} onChange={e=>setNewLead({...newLead,name:e.target.value})} placeholder="Contact name"/></label>
              <label>Company<input value={newLead.company} onChange={e=>setNewLead({...newLead,company:e.target.value})} placeholder="Company name"/></label>
              <label>Email<input value={newLead.email} onChange={e=>setNewLead({...newLead,email:e.target.value})} placeholder="email@example.com"/></label>
              <label>Notes<textarea value={newLead.notes} onChange={e=>setNewLead({...newLead,notes:e.target.value})} placeholder="Quick notes..." style={{minHeight:'70px'}}/></label>
              <label>Status
                <select value={newLead.status} onChange={e=>setNewLead({...newLead,status:e.target.value})}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <button className="btn" style={{marginTop:'12px',width:'100%'}} onClick={addLead}>Add Lead</button>
            </div>
          </section>
        )}

        {tab==='Projects' && (
          <section className="grid">
            <div className="card span8">
              <h2>Projects <span style={{color:'#9ba8c6',fontWeight:400,fontSize:'16px'}}>({projects.length})</span></h2>
              <div className="list" style={{marginTop:'12px'}}>
                {projects.map(x=>(
                  <div className="item" key={x.id} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px'}}>
                    <div>
                      <div style={{fontWeight:700}}>{x.name}</div>
                      <div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'2px'}}>{x.executive?`Lead: ${x.executive}`:''}{x.description?` · ${x.description}`:''}</div>
                    </div>
                    <Badge s={x.status}/>
                  </div>
                ))}
                {projects.length===0&&<p className="muted">No projects yet. Add your first project →</p>}
              </div>
            </div>
            <div className="card span4">
              <h3>Add Project</h3>
              <label>Name *<input value={newProject.name} onChange={e=>setNewProject({...newProject,name:e.target.value})} placeholder="Project name"/></label>
              <label>Description<textarea value={newProject.description} onChange={e=>setNewProject({...newProject,description:e.target.value})} placeholder="What's this project?" style={{minHeight:'70px'}}/></label>
              <label>Executive Lead
                <select value={newProject.executive} onChange={e=>setNewProject({...newProject,executive:e.target.value})}>
                  {executives.map(e=><option key={e.id} value={e.name}>{e.name} ({e.abbr})</option>)}
                </select>
              </label>
              <label>Status
                <select value={newProject.status} onChange={e=>setNewProject({...newProject,status:e.target.value})}>
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                  <option value="on-hold">On Hold</option>
                  <option value="complete">Complete</option>
                </select>
              </label>
              <button className="btn" style={{marginTop:'12px',width:'100%'}} onClick={addProject}>Add Project</button>
            </div>
          </section>
        )}

        {tab==='Tasks' && (
          <section className="grid">
            <div className="card span8">
              <h2>Tasks <span style={{color:'#9ba8c6',fontWeight:400,fontSize:'16px'}}>({tasks.length})</span></h2>
              <div className="list" style={{marginTop:'12px'}}>
                {tasks.map(x=>(
                  <div className="item" key={x.id} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px'}}>
                    <div>
                      <div style={{fontWeight:700}}>{x.title}</div>
                      <div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'2px'}}>{x.assigned_to?`→ ${x.assigned_to} · `:''}Priority: {x.priority}</div>
                    </div>
                    <Badge s={x.status}/>
                  </div>
                ))}
                {tasks.length===0&&<p className="muted">No tasks yet. Add your first task →</p>}
              </div>
            </div>
            <div className="card span4">
              <h3>Add Task</h3>
              <label>Title *<input value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} placeholder="Task title"/></label>
              <label>Assigned To<input value={newTask.assigned_to} onChange={e=>setNewTask({...newTask,assigned_to:e.target.value})} placeholder="Name or executive"/></label>
              <label>Priority
                <select value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label>Status
                <select value={newTask.status} onChange={e=>setNewTask({...newTask,status:e.target.value})}>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <button className="btn" style={{marginTop:'12px',width:'100%'}} onClick={addTask}>Add Task</button>
            </div>
          </section>
        )}

        {tab==='Knowledge Vault' && (
          <section className="grid">
            <div className="card span8">
              <h2>Knowledge Vault <span style={{color:'#9ba8c6',fontWeight:400,fontSize:'16px'}}>({knowledge.length})</span></h2>
              <div className="list" style={{marginTop:'12px'}}>
                {knowledge.map(x=>(
                  <div className="item" key={x.id} onClick={()=>{setSelectedDoc(x);setDocCopied(false);}} style={{cursor:'pointer',transition:'background 0.15s'}} onMouseEnter={e=>(e.currentTarget.style.background='#1d274088')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}>
                      <div style={{fontWeight:700}}>{x.title} <span style={{fontSize:'11px',color:'#9ba8c6',fontWeight:400}}>— click to read</span></div>
                      {x.category&&<span style={{fontSize:'11px',fontWeight:700,background:'#4A90D922',color:'#4A90D9',padding:'3px 10px',borderRadius:'999px',border:'1px solid #4A90D944',whiteSpace:'nowrap'}}>{x.category}</span>}
                    </div>
                    {x.content&&<div style={{color:'#9ba8c6',fontSize:'12px',marginTop:'6px',lineHeight:'1.5'}}>{x.content.slice(0,150)}{x.content.length>150?'...':''}</div>}
                  </div>
                ))}
                {knowledge.length===0&&<p className="muted">No documents yet. Add your first knowledge document →</p>}
              </div>
            </div>
            <div className="card span4">
              <h3>Add Document</h3>
              <label>Title *<input value={newKnowledge.title} onChange={e=>setNewKnowledge({...newKnowledge,title:e.target.value})} placeholder="Document title"/></label>
              <label>Category<input value={newKnowledge.category} onChange={e=>setNewKnowledge({...newKnowledge,category:e.target.value})} placeholder="e.g. Capabilities, Contracts"/></label>
              <label>Content<textarea value={newKnowledge.content} onChange={e=>setNewKnowledge({...newKnowledge,content:e.target.value})} placeholder="Paste or type content..." style={{minHeight:'110px'}}/></label>
              <button className="btn" style={{marginTop:'12px',width:'100%'}} onClick={addKnowledge}>Add to Vault</button>
            </div>
          </section>
        )}

        {/* ── Admin Panel ── */}
        {tab==='Admin' && authUser?.role==='admin' && (
          <section className="grid">

            {/* Invite New User */}
            <div className="card span4">
              <h3 style={{margin:'0 0 16px'}}>Invite Employee</h3>
              <label>Name<input value={inviteName} onChange={e=>setInviteName(e.target.value)} placeholder="Full name"/></label>
              <label>Email *<input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="employee@company.com"/></label>
              <label>Role
                <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} style={{width:'100%',padding:'8px',background:'#0a0e1a',border:'1px solid #1d2740',borderRadius:'8px',color:'#cdd6f4',marginTop:'4px'}}>
                  <option value="member">Member — standard access</option>
                  <option value="admin">Admin — can manage users</option>
                </select>
              </label>
              <button className="btn" style={{marginTop:'12px',width:'100%'}} onClick={sendInvite}>Send Invite</button>
              {inviteStatus && <div style={{marginTop:'10px',fontSize:'13px',color:inviteStatus.startsWith('✓')?'#27AE60':'#E87722'}}>{inviteStatus}</div>}
              <p style={{fontSize:'12px',color:'#9ba8c6',marginTop:'12px',lineHeight:'1.6'}}>The employee will receive an email with a link to set their password and log in.</p>
            </div>

            {/* User List */}
            <div className="card span8">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                <h3 style={{margin:0}}>Team Members <span style={{color:'#9ba8c6',fontWeight:400,fontSize:'14px'}}>({orgUsers.length})</span></h3>
                <button className="btn secondary" style={{fontSize:'12px',padding:'6px 14px'}} onClick={fetchOrgUsers}>↺ Refresh</button>
              </div>
              {orgUsers.length===0 ? (
                <p className="muted">Loading users…</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {orgUsers.map(u=>(
                    <div key={u.id} style={{padding:'14px 16px',borderRadius:'10px',background:'#0a0e1a',border:'1px solid #1d2740',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
                      {/* Avatar initial */}
                      <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'#4A90D922',border:'1px solid #4A90D944',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#4A90D9',fontSize:'14px',flexShrink:0}}>
                        {(u.name||u.email||'?')[0].toUpperCase()}
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:'13px',color:u.active?'#cdd6f4':'#9ba8c6',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name||'—'}</div>
                        <div style={{fontSize:'11px',color:'#9ba8c6',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                      </div>
                      {/* Status badges */}
                      <div style={{display:'flex',gap:'6px',alignItems:'center',flexShrink:0}}>
                        {!u.confirmed&&<span style={{fontSize:'10px',background:'#E8772218',color:'#E87722',padding:'2px 8px',borderRadius:'999px',border:'1px solid #E8772244'}}>invite pending</span>}
                        {!u.active&&<span style={{fontSize:'10px',background:'#1d2740',color:'#9ba8c6',padding:'2px 8px',borderRadius:'999px'}}>deactivated</span>}
                        <span style={{fontSize:'10px',background:'#4A90D918',color:'#4A90D9',padding:'2px 8px',borderRadius:'999px',border:'1px solid #4A90D933'}}>{u.role}</span>
                      </div>
                      {/* Last active */}
                      <div style={{fontSize:'11px',color:'#4a5568',flexShrink:0,minWidth:'80px',textAlign:'right'}}>
                        {u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : 'Never'}
                      </div>
                      {/* Actions */}
                      {u.id !== authUser?.id && (
                        <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                          <select value={u.role} onChange={e=>updateUserRole(u.id,e.target.value)} style={{fontSize:'11px',background:'#1d2740',border:'1px solid #1d274088',borderRadius:'6px',color:'#cdd6f4',padding:'4px 6px',cursor:'pointer'}}>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button onClick={()=>toggleUserActive(u.id,!u.active)} style={{fontSize:'11px',background:'#1d2740',border:'1px solid #1d274088',borderRadius:'6px',color:u.active?'#E87722':'#27AE60',padding:'4px 8px',cursor:'pointer'}}>
                            {u.active?'Deactivate':'Reactivate'}
                          </button>
                          <button onClick={()=>removeUser(u.id,u.email)} style={{fontSize:'11px',background:'transparent',border:'1px solid #E8772244',borderRadius:'6px',color:'#E87722',padding:'4px 8px',cursor:'pointer'}}>Remove</button>
                        </div>
                      )}
                      {u.id === authUser?.id && <div style={{fontSize:'11px',color:'#4a5568',flexShrink:0}}>(you)</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>
        )}

        {/* ══ BRIEFING TAB — Executive Briefing Archive ══ */}
        {tab==='Briefing' && (
          <section className="grid">

            {/* Header */}
            <div className="card span12" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',background:'linear-gradient(135deg,#0d1630,#111827)',border:'1px solid #E8772233'}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'#E8772222',border:'1px solid #E8772244',display:'grid',placeItems:'center',overflow:'hidden',flexShrink:0,position:'relative'}}>
                    <span style={{fontWeight:900,fontSize:'16px',color:'#E87722'}}>H</span>
                    <img src="/executives/heather.jpg" alt="Heather" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'10px',zIndex:1}} onError={(ev)=>{(ev.target as HTMLImageElement).style.display='none'}}/>
                  </div>
                  <div>
                    <h2 style={{margin:0,fontSize:'20px'}}>Executive Briefing</h2>
                    <div className="muted" style={{fontSize:'12px'}}>Heather's daily narrative — your front door to operations</div>
                  </div>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button className="btn secondary" onClick={()=>setTab('Dashboard')} style={{fontSize:'13px',padding:'8px 14px'}}>← Dashboard</button>
                <button className="btn" onClick={generateBriefing} disabled={isGeneratingBriefing} style={{fontSize:'13px',padding:'8px 16px',background:'#E87722',border:'none',opacity:isGeneratingBriefing?0.6:1}}>
                  {isGeneratingBriefing?'Generating…':'✦ Generate Today\'s Briefing'}
                </button>
              </div>
            </div>

            {/* Today's Briefing — full view */}
            <div className="card span8">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                <h3 style={{margin:0}}>Today's Briefing</h3>
                {briefing&&<span style={{fontSize:'11px',color:'#9ba8c6'}}>{new Date(briefing.briefing_date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</span>}
              </div>
              {briefingError&&<div style={{color:'#e74c3c',fontSize:'12px',marginBottom:'12px',padding:'10px',background:'#e74c3c11',borderRadius:'8px',border:'1px solid #e74c3c33'}}>{briefingError}</div>}
              {briefing?(
                <>
                  <div style={{fontSize:'13px',lineHeight:'1.9',color:'#cdd6f4',whiteSpace:'pre-wrap',marginBottom:'16px'}}>{briefing.narrative}</div>

                  {/* Top Priorities snapshot */}
                  {briefing.top_priorities?.length>0&&(
                    <div style={{marginBottom:'16px',padding:'14px',background:'#0a0e1a',borderRadius:'10px',border:'1px solid #1d2740'}}>
                      <div style={{fontWeight:700,fontSize:'12px',color:'#E87722',marginBottom:'10px',letterSpacing:'0.05em'}}>TOP PRIORITIES AT TIME OF BRIEFING</div>
                      {briefing.top_priorities.map((p:any,i:number)=>{
                        const prioColor = p.priority==='high'?'#e74c3c':p.priority==='low'?'#27AE60':'#F1C40F';
                        return (
                          <div key={i} style={{padding:'8px 10px',marginBottom:'6px',borderRadius:'8px',background:'#0f1623',border:`1px solid ${prioColor}22`,display:'flex',gap:'10px',alignItems:'flex-start'}}>
                            <span style={{color:prioColor,fontSize:'11px',fontWeight:700,flexShrink:0,marginTop:'2px'}}>{i+1}.</span>
                            <div>
                              <div style={{fontWeight:700,fontSize:'12px'}}>{p.title}</div>
                              <div style={{fontSize:'11px',color:'#9ba8c6',marginTop:'2px',display:'flex',gap:'8px',flexWrap:'wrap'}}>
                                {p.assigned_executive&&<span style={{color:'#4A90D9'}}>{p.assigned_executive}</span>}
                                {p.division&&<span>{p.division}</span>}
                                {p.due_date&&<span style={{color:'#E87722'}}>due {p.due_date}</span>}
                                {p.status&&<Badge s={p.status}/>}
                              </div>
                              {p.next_action&&<div style={{fontSize:'11px',color:'#4A90D9',marginTop:'4px'}}>→ {p.next_action}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Alerts snapshot */}
                  {briefing.critical_alerts?.length>0&&(
                    <div style={{marginBottom:'16px',padding:'14px',background:'#0a0e1a',borderRadius:'10px',border:'1px solid #1d2740'}}>
                      <div style={{fontWeight:700,fontSize:'12px',color:'#e74c3c',marginBottom:'10px',letterSpacing:'0.05em'}}>ALERTS AT TIME OF BRIEFING</div>
                      {briefing.critical_alerts.map((a:any,i:number)=>{
                        const clr = a.severity==='red'?'#e74c3c':a.severity==='green'?'#27AE60':'#F1C40F';
                        return (
                          <div key={i} style={{padding:'6px 10px',marginBottom:'4px',borderRadius:'8px',background:`${clr}0d`,border:`1px solid ${clr}33`,display:'flex',gap:'8px',alignItems:'center'}}>
                            <span style={{color:clr,fontSize:'11px'}}>{a.severity==='red'?'🔴':a.severity==='green'?'🟢':'🟡'}</span>
                            <span style={{fontSize:'12px',fontWeight:700,color:clr}}>{a.title}</span>
                            {a.division&&<span style={{fontSize:'10px',color:'#9ba8c6'}}>{a.division}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Jim's Notes */}
                  <div style={{marginBottom:'12px'}}>
                    <div style={{fontWeight:700,fontSize:'12px',color:'#9ba8c6',marginBottom:'6px',letterSpacing:'0.05em'}}>JIM'S NOTES</div>
                    <textarea
                      value={briefingJimNotes!==''?briefingJimNotes:(briefing.jim_notes||'')}
                      onChange={e=>setBriefingJimNotes(e.target.value)}
                      placeholder="Add your notes on this briefing…"
                      style={{width:'100%',minHeight:'80px',background:'#0a0e1a',border:'1px solid #1d2740',borderRadius:'8px',padding:'10px',color:'#cdd6f4',fontSize:'13px',resize:'vertical',boxSizing:'border-box'}}
                    />
                  </div>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <button className="btn secondary" style={{fontSize:'12px',padding:'8px 16px'}} onClick={saveBriefingNotes}>💾 Save Notes</button>
                    {!briefing.is_complete&&<button className="btn secondary" style={{fontSize:'12px',padding:'8px 16px',borderColor:'#27AE60',color:'#27AE60'}} onClick={markBriefingComplete}>✓ Mark Reviewed</button>}
                    {briefing.is_complete&&<span style={{fontSize:'12px',color:'#27AE60',padding:'8px',alignSelf:'center'}}>✓ Reviewed</span>}
                  </div>
                </>
              ):(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'180px',gap:'14px',textAlign:'center'}}>
                  <div style={{fontSize:'32px'}}>📋</div>
                  <div className="muted" style={{fontSize:'14px'}}>No briefing generated yet.</div>
                  <button className="btn" onClick={generateBriefing} disabled={isGeneratingBriefing} style={{fontSize:'13px',padding:'10px 24px',background:'#E87722',border:'none',opacity:isGeneratingBriefing?0.6:1}}>
                    {isGeneratingBriefing?'Generating…':'✦ Generate Briefing'}
                  </button>
                </div>
              )}
            </div>

            {/* Archive sidebar */}
            <div className="card span4">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <h3 style={{margin:0}}>Archive</h3>
                <button className="btn secondary" style={{fontSize:'11px',padding:'4px 10px'}} onClick={fetchBriefingArchive}>↺</button>
              </div>
              {briefingArchive.length===0?(
                <div className="muted" style={{fontSize:'12px',lineHeight:'1.6'}}>No archived briefings yet. Briefings are saved here automatically when generated.</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'8px',maxHeight:'600px',overflowY:'auto'}}>
                  {briefingArchive.map(b=>(
                    <button key={b.id} onClick={()=>{setBriefing(b);setBriefingJimNotes('');}}
                      style={{display:'block',width:'100%',textAlign:'left',background:briefing?.id===b.id?'#E8772215':'#0a0e1a',border:`1px solid ${briefing?.id===b.id?'#E8772244':'#1d2740'}`,borderRadius:'10px',padding:'12px',cursor:'pointer',color:'#fff'}}>
                      <div style={{fontWeight:700,fontSize:'13px'}}>{new Date(b.briefing_date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
                      <div style={{fontSize:'11px',color:'#9ba8c6',marginTop:'4px',lineHeight:'1.5'}}>{b.narrative?.slice(0,80)}{(b.narrative?.length||0)>80?'…':''}</div>
                      <div style={{display:'flex',gap:'6px',marginTop:'6px',flexWrap:'wrap'}}>
                        {b.is_complete&&<span style={{fontSize:'10px',background:'#27AE6022',color:'#27AE60',padding:'1px 6px',borderRadius:'999px'}}>✓ reviewed</span>}
                        {b.jim_notes&&<span style={{fontSize:'10px',background:'#4A90D922',color:'#4A90D9',padding:'1px 6px',borderRadius:'999px'}}>notes saved</span>}
                        {(b.top_priorities as any[])?.length>0&&<span style={{fontSize:'10px',background:'#1d2740',color:'#9ba8c6',padding:'1px 6px',borderRadius:'999px'}}>{(b.top_priorities as any[]).length} priorities</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </section>
        )}

      </main>

      {/* ── Document / Vault Modal — renders on ANY tab ── */}
      {selectedDoc && (
        <div onClick={()=>setSelectedDoc(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#0f1623',border:'1px solid #4A90D944',borderRadius:'16px',padding:'28px',maxWidth:'700px',width:'100%',maxHeight:'82vh',display:'flex',flexDirection:'column',gap:'16px'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
              <div>
                <div style={{fontWeight:700,fontSize:'15px',color:'#cdd6f4',lineHeight:'1.4'}}>{selectedDoc.title}</div>
                {selectedDoc.category&&<span style={{fontSize:'11px',fontWeight:700,background:'#4A90D922',color:'#4A90D9',padding:'2px 10px',borderRadius:'999px',border:'1px solid #4A90D944',display:'inline-block',marginTop:'6px'}}>{selectedDoc.category}</span>}
              </div>
              <button onClick={()=>setSelectedDoc(null)} style={{background:'none',border:'none',color:'#9ba8c6',fontSize:'20px',cursor:'pointer',flexShrink:0,lineHeight:1}}>✕</button>
            </div>
            <div style={{overflowY:'auto',flex:1,color:'#cdd6f4',fontSize:'13px',lineHeight:'1.9',whiteSpace:'pre-wrap',background:'#0a0e1a',borderRadius:'10px',padding:'16px'}}>{selectedDoc.content}</div>
            <div style={{display:'flex',gap:'10px',paddingTop:'8px',borderTop:'1px solid #1d2740'}}>
              <button onClick={()=>{navigator.clipboard.writeText(selectedDoc.content||'');setDocCopied(true);setTimeout(()=>setDocCopied(false),2500);}} style={{flex:1,background:'#4A90D9',border:'none',color:'#fff',fontWeight:700,fontSize:'13px',padding:'10px',borderRadius:'10px',cursor:'pointer'}}>
                {docCopied?'✓ Copied!':'📋 Copy Full Text'}
              </button>
              <button onClick={()=>{const sub=encodeURIComponent(selectedDoc.title||'');const bod=encodeURIComponent(selectedDoc.content||'');window.open(`mailto:?subject=${sub}&body=${bod}`);}} style={{flex:1,background:'#1d2740',border:'1px solid #4A90D944',color:'#cdd6f4',fontWeight:700,fontSize:'13px',padding:'10px',borderRadius:'10px',cursor:'pointer'}}>
                ✉ Send via Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
