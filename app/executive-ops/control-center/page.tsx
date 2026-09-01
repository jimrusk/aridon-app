'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const panel: React.CSSProperties = { background:'#101827', border:'1px solid #26364f', borderRadius:18, padding:18 };
const input: React.CSSProperties = { width:'100%', boxSizing:'border-box', background:'#08111f', color:'#eef4ff', border:'1px solid #344866', borderRadius:10, padding:'10px 12px' };
const button: React.CSSProperties = { border:0, borderRadius:10, padding:'10px 14px', fontWeight:900, cursor:'pointer', background:'#ff9d57', color:'#172030' };
const secondary: React.CSSProperties = { ...button, background:'#18263a', color:'#edf3ff', border:'1px solid #344866' };
const muted: React.CSSProperties = { color:'#9eb0c8', lineHeight:1.55 };

type Status = { configured?:boolean; connected?:boolean; email?:string; missing?:string[]; environment?:string; mode?:string };
type Contact = { id:string; name:string; email:string; phone:string; organization:string; title:string };
type DriveFile = { id:string; name:string; mimeType:string; modifiedTime:string; webViewLink?:string };
type MeetingArtifact = DriveFile;
type AuditEvent = { id:string; executive?:string; action:string; channel:string; target?:string; approved:boolean; created_at:string };
type GmailMessage = { id:string; from:string; subject:string; snippet:string; unread:boolean; recommendedExecutive?:{executive:string;reason:string}; attachments?:Array<{attachmentId:string;filename:string;mimeType:string;size:number}> };

async function json(url:string, init?:RequestInit) {
  const response = await fetch(url, { ...init, cache:'no-store' });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

export default function ExecutiveOperationsControlCenter() {
  const [google,setGoogle]=useState<Status>({});
  const [microsoft,setMicrosoft]=useState<Status>({});
  const [quickbooks,setQuickbooks]=useState<Status>({});
  const [controls,setControls]=useState<{connected?:boolean;actorEmail?:string;externalActionsEnabled?:boolean}>({});
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState('');

  const [contactProvider,setContactProvider]=useState<'google'|'microsoft'>('google');
  const [contactQuery,setContactQuery]=useState('');
  const [contacts,setContacts]=useState<Contact[]>([]);

  const [fileQuery,setFileQuery]=useState('');
  const [files,setFiles]=useState<DriveFile[]>([]);
  const [fileDetail,setFileDetail]=useState<any>(null);

  const [meetings,setMeetings]=useState<{events:any[];artifacts:MeetingArtifact[]}>({events:[],artifacts:[]});
  const [meetingAnalysis,setMeetingAnalysis]=useState<any>(null);

  const [brief,setBrief]=useState<any>(null);
  const [audit,setAudit]=useState<AuditEvent[]>([]);
  const [inbox,setInbox]=useState<GmailMessage[]>([]);
  const [message,setMessage]=useState<any>(null);
  const [attachment,setAttachment]=useState<any>(null);

  const externalOn = controls.externalActionsEnabled !== false;

  async function refreshStatus() {
    const results = await Promise.allSettled([
      json('/api/gmail/status'), json('/api/microsoft365/status'), json('/api/accounting/quickbooks/status'), json('/api/executive-ops/controls'),
    ]);
    if (results[0].status==='fulfilled') setGoogle(results[0].value);
    if (results[1].status==='fulfilled') setMicrosoft(results[1].value);
    if (results[2].status==='fulfilled') setQuickbooks(results[2].value);
    if (results[3].status==='fulfilled') setControls(results[3].value);
  }

  useEffect(()=>{ refreshStatus().catch(()=>{}); },[]);

  async function toggleExternal() {
    setBusy('controls'); setNotice('');
    try {
      const next=!externalOn;
      const data=await json('/api/executive-ops/controls',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({externalActionsEnabled:next})});
      setControls({connected:true,actorEmail:data.control?.actor_email,externalActionsEnabled:data.control?.external_actions_enabled});
      setNotice(next?'External actions re-enabled. Approval gates still apply.':'Emergency stop active. Reading, drafting and analysis remain available.');
    } catch(e){setNotice(e instanceof Error?e.message:'Unable to update controls.');}
    finally{setBusy('');}
  }

  async function searchContacts() {
    setBusy('contacts'); setNotice('');
    try {
      const url=contactProvider==='google'?'/api/google-workspace/contacts':'/api/microsoft365/contacts';
      const data=await json(`${url}?q=${encodeURIComponent(contactQuery)}`);
      setContacts(data.contacts||[]);
    } catch(e){setNotice(e instanceof Error?e.message:'Unable to search contacts.');}
    finally{setBusy('');}
  }

  async function searchFiles() {
    setBusy('files'); setNotice(''); setFileDetail(null);
    try { const data=await json(`/api/google-workspace/files?q=${encodeURIComponent(fileQuery)}`); setFiles(data.files||[]); }
    catch(e){setNotice(e instanceof Error?e.message:'Unable to search Drive.');}
    finally{setBusy('');}
  }

  async function readFile(id:string) {
    setBusy(`file:${id}`); setNotice('');
    try { setFileDetail(await json(`/api/google-workspace/files?fileId=${encodeURIComponent(id)}`)); }
    catch(e){setNotice(e instanceof Error?e.message:'Unable to read file.');}
    finally{setBusy('');}
  }

  async function loadMeetings() {
    setBusy('meetings'); setNotice(''); setMeetingAnalysis(null);
    try { const data=await json('/api/google-workspace/meetings'); setMeetings({events:data.events||[],artifacts:data.artifacts||[]}); }
    catch(e){setNotice(e instanceof Error?e.message:'Unable to load meeting intelligence.');}
    finally{setBusy('');}
  }

  async function analyzeMeeting(fileId:string) {
    setBusy(`meeting:${fileId}`); setNotice('');
    try { setMeetingAnalysis(await json('/api/google-workspace/meetings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileId})})); }
    catch(e){setNotice(e instanceof Error?e.message:'Unable to analyze meeting.');}
    finally{setBusy('');}
  }

  async function buildBrief() {
    setBusy('brief'); setNotice('');
    try { setBrief(await json('/api/executive-ops/morning-brief')); }
    catch(e){setNotice(e instanceof Error?e.message:'Unable to build brief.');}
    finally{setBusy('');}
  }

  async function loadAudit() {
    setBusy('audit'); setNotice('');
    try { const data=await json('/api/executive-ops/audit?limit=100'); setAudit(data.events||[]); }
    catch(e){setNotice(e instanceof Error?e.message:'Unable to load audit.');}
    finally{setBusy('');}
  }

  async function loadInbox() {
    setBusy('inbox'); setNotice(''); setMessage(null); setAttachment(null);
    try { const data=await json('/api/gmail/inbox?maxResults=15'); setInbox(data.messages||[]); }
    catch(e){setNotice(e instanceof Error?e.message:'Unable to load inbox.');}
    finally{setBusy('');}
  }

  async function openMessage(id:string) {
    setBusy(`msg:${id}`); setAttachment(null);
    try { const data=await json(`/api/gmail/inbox?messageId=${encodeURIComponent(id)}`); setMessage(data.message); }
    catch(e){setNotice(e instanceof Error?e.message:'Unable to open email.');}
    finally{setBusy('');}
  }

  async function inspectAttachment(item:any) {
    if(!message?.id) return;
    setBusy(`att:${item.attachmentId}`); setAttachment(null);
    try {
      const qs=new URLSearchParams({messageId:message.id,attachmentId:item.attachmentId,filename:item.filename,mimeType:item.mimeType});
      setAttachment(await json(`/api/gmail/attachment?${qs.toString()}`));
    } catch(e){setNotice(e instanceof Error?e.message:'Unable to inspect attachment.');}
    finally{setBusy('');}
  }

  const statusLabel=useMemo(()=> externalOn?'EXTERNAL ACTIONS ON':'EMERGENCY STOP ACTIVE',[externalOn]);

  return <main style={{minHeight:'100vh',background:'#07101c',color:'#edf3ff',padding:'24px'}}>
    <div style={{maxWidth:1320,margin:'0 auto'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap',marginBottom:22}}>
        <div><div style={{color:'#ff9d57',fontWeight:950,letterSpacing:'.16em'}}>ARIDON · EXECUTIVE OPERATIONS</div><h1 style={{fontSize:'clamp(34px,6vw,64px)',margin:'8px 0 10px'}}>Control Center</h1><p style={{...muted,maxWidth:850}}>People, email, files, meetings, calendars, financial visibility, routing and owner controls. Executives can read, analyze and draft. External actions remain approval-gated.</p></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href="/executive-ops" style={{...secondary,textDecoration:'none'}}>← Gmail + Calendar</Link><Link href="/" style={{...secondary,textDecoration:'none'}}>Command Center</Link></div>
      </header>

      {notice&&<div style={{...panel,borderColor:'#ff9d5777',marginBottom:18}}>{notice}</div>}

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:14,marginBottom:18}}>
        <div style={panel}><strong>Google Workspace</strong><p style={muted}>{google.connected?`Connected · ${google.email||''}`:google.configured?'Ready to connect':'Needs OAuth variables'}</p><a href="/api/gmail/connect?returnTo=/executive-ops/control-center" style={{...button,textDecoration:'none',display:'inline-block'}}>{google.connected?'Refresh permissions':'Connect Google'}</a></div>
        <div style={panel}><strong>Microsoft 365</strong><p style={muted}>{microsoft.connected?`Connected · ${microsoft.email||''}`:microsoft.configured?'Ready to connect':`Needs ${microsoft.missing?.join(', ')||'Microsoft app credentials'}`}</p><a href="/api/microsoft365/connect?returnTo=/executive-ops/control-center" style={{...secondary,textDecoration:'none',display:'inline-block'}}>Connect / refresh</a></div>
        <div style={panel}><strong>QuickBooks</strong><p style={muted}>{quickbooks.connected?`Connected · ${quickbooks.mode||'read-only'}`:quickbooks.configured?'Ready to connect':`Needs ${quickbooks.missing?.join(', ')||'Intuit app credentials'}`}</p><a href="/api/accounting/quickbooks/connect?returnTo=/executive-ops/control-center" style={{...secondary,textDecoration:'none',display:'inline-block'}}>Connect QuickBooks</a></div>
        <div style={{...panel,borderColor:externalOn?'#3c7256':'#a84444'}}><strong>{statusLabel}</strong><p style={muted}>{externalOn?'Email, calendar, SMS and phone actions can proceed only through their existing approval/consent gates.':'All integrated external-action routes that see this control are blocked. Reading and drafting still work.'}</p><button style={externalOn?{...button,background:'#d85d5d',color:'#fff'}:{...button,background:'#54c68a'}} onClick={toggleExternal} disabled={busy==='controls'}>{externalOn?'ACTIVATE EMERGENCY STOP':'Re-enable external actions'}</button></div>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))',gap:16}}>
        <div style={panel}><h2>1 · People</h2><p style={muted}>Resolve the right person before an executive emails, calls or schedules.</p><div style={{display:'flex',gap:8,marginBottom:10}}><button style={contactProvider==='google'?button:secondary} onClick={()=>setContactProvider('google')}>Google</button><button style={contactProvider==='microsoft'?button:secondary} onClick={()=>setContactProvider('microsoft')}>Microsoft</button></div><div style={{display:'flex',gap:8}}><input style={input} value={contactQuery} onChange={e=>setContactQuery(e.target.value)} placeholder="Name, company, email or phone"/><button style={button} onClick={searchContacts}>Search</button></div><div style={{display:'grid',gap:8,marginTop:12,maxHeight:330,overflow:'auto'}}>{contacts.map(c=><div key={c.id} style={{padding:10,border:'1px solid #273a54',borderRadius:10}}><strong>{c.name}</strong><div style={muted}>{c.title}{c.organization?` · ${c.organization}`:''}</div><div>{c.email||'No email'} {c.phone?` · ${c.phone}`:''}</div></div>)}</div></div>

        <div style={panel}><h2>2 · Drive / Docs / Sheets / Slides</h2><p style={muted}>Search company files and let Aridon read native Google content.</p><div style={{display:'flex',gap:8}}><input style={input} value={fileQuery} onChange={e=>setFileQuery(e.target.value)} placeholder="Search Drive"/><button style={button} onClick={searchFiles}>Search</button></div><div style={{display:'grid',gap:8,marginTop:12,maxHeight:260,overflow:'auto'}}>{files.map(f=><button key={f.id} style={{...secondary,textAlign:'left'}} onClick={()=>readFile(f.id)}><strong>{f.name}</strong><div style={{fontSize:12,color:'#9eb0c8'}}>{f.mimeType}</div></button>)}</div>{fileDetail&&<pre style={{whiteSpace:'pre-wrap',maxHeight:320,overflow:'auto',background:'#08111f',padding:12,borderRadius:10,fontSize:12}}>{JSON.stringify(fileDetail,null,2).slice(0,30000)}</pre>}</div>

        <div style={panel}><h2>3 · Meeting intelligence</h2><p style={muted}>Match upcoming meetings with transcript/notes artifacts and extract decisions, commitments, action items and follow-ups.</p><button style={button} onClick={loadMeetings}>{busy==='meetings'?'Loading…':'Load meetings'}</button><div style={{marginTop:12}}><strong>Upcoming</strong>{meetings.events.slice(0,6).map((e:any)=><div key={e.id||e.summary} style={{...muted,padding:'7px 0'}}>{e.summary||'(Untitled)'} · {e.start?.dateTime||e.start?.date||''}</div>)}</div><div style={{marginTop:10}}><strong>Notes / transcripts</strong>{meetings.artifacts.map(a=><button key={a.id} style={{...secondary,display:'block',width:'100%',textAlign:'left',marginTop:7}} onClick={()=>analyzeMeeting(a.id)}>{a.name}</button>)}</div>{meetingAnalysis&&<pre style={{whiteSpace:'pre-wrap',maxHeight:360,overflow:'auto',background:'#08111f',padding:12,borderRadius:10,fontSize:12}}>{JSON.stringify(meetingAnalysis,null,2)}</pre>}</div>

        <div style={panel}><h2>4 · Automatic executive routing</h2><p style={muted}>Email and files are now classified automatically: Ethos for legal, Nova for finance, Ledger for sales, Atlas for tech, Sierra for ag, Maya for water/energy, Claire for research, and Eva for cross-functional items.</p><button style={button} onClick={loadInbox}>Load routed Gmail inbox</button><div style={{display:'grid',gap:8,marginTop:12,maxHeight:300,overflow:'auto'}}>{inbox.map(m=><button key={m.id} style={{...secondary,textAlign:'left'}} onClick={()=>openMessage(m.id)}><strong>{m.subject}</strong><div style={{fontSize:12,color:'#9eb0c8'}}>{m.from}</div><div style={{fontSize:12,color:'#ffbd8d'}}>{m.recommendedExecutive?.executive||'Eva'} · {m.recommendedExecutive?.reason||''}</div></button>)}</div>{message&&<div style={{marginTop:12,paddingTop:12,borderTop:'1px solid #2b3b51'}}><strong>{message.subject}</strong><p style={{whiteSpace:'pre-wrap',maxHeight:260,overflow:'auto'}}>{message.body}</p>{message.attachments?.map((a:any)=><button key={a.attachmentId} style={{...secondary,margin:'4px 6px 4px 0'}} onClick={()=>inspectAttachment(a)}>📎 {a.filename}</button>)}{attachment&&<pre style={{whiteSpace:'pre-wrap',maxHeight:260,overflow:'auto',background:'#08111f',padding:10,borderRadius:10,fontSize:12}}>{JSON.stringify(attachment,null,2)}</pre>}</div>}</div>

        <div style={panel}><h2>5 · Eva Morning Brief</h2><p style={muted}>Unread inbox + next 48 hours of calendar + recently changed Drive files, compressed into owner attention and suggested moves.</p><button style={button} onClick={buildBrief}>{busy==='brief'?'Building…':'Build morning brief'}</button>{brief&&<pre style={{whiteSpace:'pre-wrap',maxHeight:420,overflow:'auto',background:'#08111f',padding:12,borderRadius:10,fontSize:12}}>{JSON.stringify(brief.brief,null,2)}</pre>}</div>

        <div style={panel}><h2>6 · Attachments</h2><p style={muted}>Gmail attachments now expose filename, MIME type, size and executive routing. Text/CSV/JSON can be inspected in-place. PDFs report page/metadata and all supported files have a guarded download path. Office binaries remain routed/downloadable until a dedicated parser is enabled.</p><button style={secondary} onClick={loadInbox}>Open attachment-ready inbox</button></div>

        <div style={panel}><h2>7 · Audit + emergency stop</h2><p style={muted}>See what Aridon read, routed, analyzed or sent. Consequential external actions record approval state and target.</p><button style={button} onClick={loadAudit}>Refresh audit</button><div style={{display:'grid',gap:7,marginTop:12,maxHeight:330,overflow:'auto'}}>{audit.map(e=><div key={e.id} style={{padding:9,border:'1px solid #273a54',borderRadius:10}}><strong>{e.action}</strong> · {e.channel}<div style={muted}>{e.executive||'system'} {e.target?`→ ${e.target}`:''} · {new Date(e.created_at).toLocaleString()}</div></div>)}</div></div>

        <div style={panel}><h2>8 · Microsoft 365</h2><p style={muted}>Outlook inbox read, approved send, Microsoft Contacts, and Outlook Calendar read/create are coded. Activation needs your Microsoft app credentials in Vercel.</p><a href="/api/microsoft365/connect?returnTo=/executive-ops/control-center" style={{...secondary,textDecoration:'none',display:'inline-block'}}>Connect Microsoft 365</a></div>

        <div style={panel}><h2>9 · Accounting</h2><p style={muted}>Nova gets a read-only Aridon view of QuickBooks company info, P&L, balance sheet and cash-flow report. Aridon has no QuickBooks write route in this layer.</p><a href="/api/accounting/quickbooks/connect?returnTo=/executive-ops/control-center" style={{...secondary,textDecoration:'none',display:'inline-block'}}>Connect QuickBooks</a></div>

        <div style={panel}><h2>10 · Phone + SMS</h2><p style={muted}>Aridon already had a live SMS gateway, executive triage and Twilio executive-call system. They are now tied into the Executive Operations emergency-stop/audit layer when an executive account is connected.</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href="/sms" style={{...button,textDecoration:'none'}}>Open SMS</Link><Link href="/business-os" style={{...secondary,textDecoration:'none'}}>Open Business OS</Link></div></div>
      </section>
    </div>
  </main>;
}
