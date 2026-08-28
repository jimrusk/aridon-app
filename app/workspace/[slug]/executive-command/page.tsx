'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';
import { executives } from '../../../../lib/executives';

type Message = { role: 'user' | 'assistant'; content: string; executive?: string; sources?: Array<{ title: string; url: string }> };
type Workspace = { tenant?: { business_name?: string } };

export default function ExecutiveCommand({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [businessName, setBusinessName] = useState('Your company');
  const [executive, setExecutive] = useState('Auto');
  const [lastResponder, setLastResponder] = useState('Eva');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', executive: 'Eva', content: 'I’m Eva. Ask Aridon anything. In Auto mode I’ll route the question to the executive best suited to answer it, while keeping the conversation in one place.' }]);
  const [input, setInput] = useState('');
  const [researchWeb, setResearchWeb] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token || '';
      if (!accessToken) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/executive-command`)}`); return; }
      setToken(accessToken);
      const response = await fetch(`/api/customer/workspace?slug=${encodeURIComponent(params.slug)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const workspace = await response.json().catch(() => ({})) as Workspace;
      if (response.ok) setBusinessName(workspace.tenant?.business_name || 'Your company');
    });
  }, [params.slug, router]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);
  const visibleExecutive = executive === 'Auto' ? lastResponder : executive;
  const active = executives.find((item) => item.name === visibleExecutive) || executives[executives.length - 1];
  const canSend = useMemo(() => Boolean(token && input.trim() && !busy), [token, input, busy]);

  function speak(text: string) {
    if (!speakReplies || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 3500));
    utterance.rate = 1.02;
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Voice input is not supported in this browser yet. You can still type normally.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; recognition.interimResults = false; recognition.continuous = false;
    recognition.onstart = () => { setListening(true); setError(''); };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setError('I could not hear that clearly. Try again or type the request.'); };
    recognition.onresult = (event: any) => setInput(event.results?.[0]?.[0]?.transcript || '');
    recognition.start();
  }

  async function send(event?: FormEvent, promptOverride?: string) {
    event?.preventDefault();
    const text = (promptOverride ?? input).trim();
    if (!text || !token || busy) return;
    const nextMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages); setInput(''); setBusy(true); setError('');
    try {
      const response = await fetch('/api/customer/assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, executive, researchWeb, messages: nextMessages.slice(-20).map(({ role, content }) => ({ role, content })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Aridon could not answer right now.');
      const reply = data.reply || 'I did not receive a readable response.';
      const respondingExecutive = data.executive || (executive === 'Auto' ? 'Eva' : executive);
      setLastResponder(respondingExecutive);
      setMessages((current) => [...current, { role: 'assistant', executive: respondingExecutive, content: reply, sources: Array.isArray(data.sources) ? data.sources : [] }]);
      speak(reply);
    } catch (err) { setError(err instanceof Error ? err.message : 'The executive team is temporarily unavailable.'); }
    finally { setBusy(false); }
  }

  return <main style={page}><div style={shell}>
    <header style={header}><div><div style={eyebrow}>ARIDON EXECUTIVE COMMAND</div><h1 style={h1}>Ask Aridon.</h1><p style={lead}>{businessName} · One conversation. Aridon routes the work.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href={`/workspace/${params.slug}`} style={link}>Company Home</Link><Link href={`/workspace/${params.slug}/executive-suite`} style={link}>Executive Suite →</Link></div></header>

    <section style={grid}>
      <aside style={teamPanel}>
        <div style={label}>ROUTING</div>
        <button onClick={() => setExecutive('Auto')} style={{...execButton, ...(executive === 'Auto' ? activeButton : {})}}><span style={autoAvatar}>A</span><span><b>Auto · Ask Aridon</b><small style={small}>Eva routes each question to the best executive</small></span></button>
        <div style={{...label,marginTop:12}}>OR PICK AN EXECUTIVE</div>
        {executives.map((item) => <button key={item.id} onClick={() => setExecutive(item.name)} style={{...execButton, ...(executive === item.name ? activeButton : {})}}><img src={item.avatar} alt="" style={avatar}/><span><b>{item.name}</b><small style={small}>{item.abbr} · {item.role}</small></span></button>)}
      </aside>

      <section style={chatPanel}>
        <div style={activeHeader}><img src={active.avatar} alt="" style={heroAvatar}/><div><div style={statusDot}>{busy ? '● THINKING' : listening ? '● LISTENING' : '● READY'}</div><h2 style={{margin:'4px 0'}}>{executive === 'Auto' ? `Ask Aridon · ${active.name} ready` : active.name}</h2><div style={muted}>{executive === 'Auto' ? 'Automatic executive routing' : `${active.role} · ${active.tagline}`}</div></div></div>
        <div style={messagesBox}>{messages.map((message, index) => <article key={index} style={{...bubble, marginLeft: message.role === 'user' ? 'auto' : 0, background: message.role === 'user' ? '#17304A' : '#111D30'}}><div style={speaker}>{message.role === 'user' ? 'YOU' : (message.executive || lastResponder).toUpperCase()}</div><div style={{whiteSpace:'pre-wrap', lineHeight:1.6}}>{message.content}</div>{message.sources?.length ? <div style={{marginTop:10}}>{message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={sourceLink}>{source.title}</a>)}</div> : null}</article>)}{busy && <div style={working}>{executive === 'Auto' ? 'Aridon is routing and working on it…' : `${active.name} is working on it…`}</div>}<div ref={bottomRef}/></div>
        {error && <div style={errorBox}>{error}</div>}
        <div style={controls}><label style={toggle}><input type="checkbox" checked={researchWeb} onChange={(e)=>setResearchWeb(e.target.checked)}/> Current web research</label><label style={toggle}><input type="checkbox" checked={speakReplies} onChange={(e)=>setSpeakReplies(e.target.checked)}/> Speak replies</label></div>
        <form onSubmit={(e)=>send(e)} style={composer}><button type="button" onClick={startListening} style={mic}>{listening ? 'Listening…' : '🎙 Talk'}</button><textarea value={input} onChange={(e)=>setInput(e.target.value)} rows={3} placeholder={executive === 'Auto' ? 'Ask Aridon a question or tell Aridon what you need done…' : `Ask ${active.name} a question or tell ${active.name} what you want done…`} style={textarea}/><button disabled={!canSend} style={{...sendButton, opacity:canSend?1:.45}}>Send</button></form>
        <div style={quickRow}>{['What needs my attention today?','What are we waiting on?','What would you do next?','Challenge this before I spend money.'].map((p)=><button key={p} disabled={busy || !token} onClick={()=>send(undefined,p)} style={quick}>{p}</button>)}</div>
        <p style={guardrail}>Aridon may answer, research, analyze, plan and draft. External sends, spending, signatures, commitments and other consequential actions stay behind your approval controls.</p>
      </section>
    </section>
  </div></main>;
}

const page={minHeight:'100vh',background:'#07101C',color:'#F4F7FB',padding:'24px 14px 80px',fontFamily:'Arial, sans-serif'} as const;
const shell={maxWidth:1280,margin:'0 auto'} as const;
const header={display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',flexWrap:'wrap',marginBottom:18} as const;
const eyebrow={fontSize:11,fontWeight:950,color:'#9EF0CF',letterSpacing:1.4} as const;
const h1={fontSize:'clamp(36px,6vw,64px)',margin:'5px 0'} as const;
const lead={color:'#93A3BA',margin:0} as const;
const link={color:'#EAF2FF',textDecoration:'none',border:'1px solid #34445F',padding:'10px 13px',borderRadius:10,fontWeight:800} as const;
const grid={display:'grid',gridTemplateColumns:'minmax(220px,280px) 1fr',gap:14} as const;
const teamPanel={background:'#0D1726',border:'1px solid #25344D',borderRadius:18,padding:12,height:'fit-content'} as const;
const label={fontSize:10,fontWeight:950,color:'#7F91AB',margin:'3px 4px 10px'} as const;
const execButton={width:'100%',display:'flex',alignItems:'center',gap:10,textAlign:'left',border:'1px solid transparent',background:'transparent',color:'#EAF0F8',padding:9,borderRadius:12,cursor:'pointer',marginBottom:5} as const;
const activeButton={background:'#15243A',border:'1px solid #3B5576'} as const;
const avatar={width:44,height:44,borderRadius:12,objectFit:'cover'} as const;
const autoAvatar={width:44,height:44,borderRadius:12,display:'grid',placeItems:'center',background:'#9EF0CF',color:'#07130F',fontWeight:950} as const;
const small={display:'block',color:'#8FA0B8',fontSize:10,marginTop:3} as const;
const chatPanel={background:'#0D1726',border:'1px solid #25344D',borderRadius:18,overflow:'hidden'} as const;
const activeHeader={display:'flex',gap:14,alignItems:'center',padding:16,borderBottom:'1px solid #25344D'} as const;
const heroAvatar={width:68,height:68,borderRadius:18,objectFit:'cover'} as const;
const statusDot={fontSize:10,fontWeight:950,color:'#9EF0CF'} as const;
const muted={color:'#91A0B7',fontSize:12} as const;
const messagesBox={height:'min(54vh,620px)',minHeight:390,overflowY:'auto',padding:16,display:'grid',gap:11} as const;
const bubble={width:'min(820px,92%)',border:'1px solid #2B3A54',borderRadius:15,padding:'13px 14px'} as const;
const speaker={fontSize:10,fontWeight:950,color:'#9EF0CF',marginBottom:6} as const;
const sourceLink={display:'block',color:'#9BCBFF',fontSize:11,marginTop:4} as const;
const working={color:'#A9B5C7',fontSize:12} as const;
const errorBox={margin:'0 14px 10px',padding:10,borderRadius:10,background:'#2B1718',border:'1px solid #6B353B',color:'#F1B9B1'} as const;
const controls={display:'flex',gap:16,flexWrap:'wrap',padding:'10px 14px 0'} as const;
const toggle={fontSize:11,color:'#B8C3D3'} as const;
const composer={display:'grid',gridTemplateColumns:'auto 1fr auto',gap:8,padding:14,alignItems:'stretch'} as const;
const mic={border:'1px solid #3A4C68',background:'#101C2D',color:'#DDE6F2',borderRadius:12,padding:'0 13px',fontWeight:850,cursor:'pointer'} as const;
const textarea={background:'#07101C',color:'#F4F7FB',border:'1px solid #34445F',borderRadius:12,padding:12,fontSize:14,resize:'vertical'} as const;
const sendButton={border:0,background:'#9EF0CF',color:'#07130F',borderRadius:12,padding:'0 20px',fontWeight:950} as const;
const quickRow={display:'flex',gap:7,overflowX:'auto',padding:'0 14px 12px'} as const;
const quick={flex:'0 0 auto',border:'1px solid #34445F',background:'#091321',color:'#C9D4E5',borderRadius:999,padding:'7px 10px',fontSize:11,cursor:'pointer'} as const;
const guardrail={color:'#71829B',fontSize:10,lineHeight:1.5,padding:'0 14px 14px',margin:0} as const;
