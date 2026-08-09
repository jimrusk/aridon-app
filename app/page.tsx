'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { executives } from '../lib/executives';

type Msg = { role: 'user' | 'assistant'; content: string };
type Lead = { id: string; name: string; company: string; status: string; notes: string; email: string };
type Project = { id: string; name: string; status: string; description: string; executive: string };
type Task = { id: string; title: string; status: string; priority: string; assigned_to: string };
type KnowledgeItem = { id: string; title: string; content: string; category: string };

const tabs = ['Dashboard', 'Executive Chat', 'Builder Mode', 'Executive Team', 'CRM', 'Projects', 'Tasks', 'Company Brain'];

const statusColor = (status: string) =>
  status === 'active' || status === 'open' || status === 'new' || status === 'qualified' ? '#27AE60' :
  status === 'complete' || status === 'closed' || status === 'done' ? '#4A90D9' : '#E87722';

export default function Home() {
  const [tab, setTab] = useState('Dashboard');
  const [executive, setExecutive] = useState('Heather');
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: 'Welcome to Aridon. Your executive team is online. What are we moving forward today?' }]);
  const [input, setInput] = useState('');
  const [builder, setBuilder] = useState({ companyName: 'Aridon', services: 'AI executive teams, business automation, decision support and controlled execution', customers: 'owner-led businesses and teams that need clearer priorities, follow-up, research and execution' });
  const [builderPlan, setBuilderPlan] = useState<any>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);

  const [newLead, setNewLead] = useState({ name: '', company: '', email: '', notes: '', status: 'new' });
  const [newProject, setNewProject] = useState({ name: '', description: '', executive: 'Heather', status: 'active' });
  const [newTask, setNewTask] = useState({ title: '', assigned_to: '', priority: 'medium', status: 'open' });
  const [newKnowledge, setNewKnowledge] = useState({ title: '', category: '', content: '' });

  useEffect(() => {
    void Promise.all([fetchLeads(), fetchProjects(), fetchTasks(), fetchKnowledge()]);
  }, []);

  async function fetchLeads() {
    const response = await fetch('/api/crm', { cache: 'no-store' });
    if (response.ok) setLeads(await response.json());
  }
  async function fetchProjects() {
    const response = await fetch('/api/projects', { cache: 'no-store' });
    if (response.ok) setProjects(await response.json());
  }
  async function fetchTasks() {
    const response = await fetch('/api/tasks', { cache: 'no-store' });
    if (response.ok) setTasks(await response.json());
  }
  async function fetchKnowledge() {
    const response = await fetch('/api/knowledge', { cache: 'no-store' });
    if (response.ok) setKnowledge(await response.json());
  }

  async function addLead() {
    if (!newLead.name.trim()) return;
    await fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newLead) });
    setNewLead({ name: '', company: '', email: '', notes: '', status: 'new' });
    await fetchLeads();
  }
  async function addProject() {
    if (!newProject.name.trim()) return;
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProject) });
    setNewProject({ name: '', description: '', executive: 'Heather', status: 'active' });
    await fetchProjects();
  }
  async function addTask() {
    if (!newTask.title.trim()) return;
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask) });
    setNewTask({ title: '', assigned_to: '', priority: 'medium', status: 'open' });
    await fetchTasks();
  }
  async function addKnowledge() {
    if (!newKnowledge.title.trim()) return;
    await fetch('/api/knowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newKnowledge) });
    setNewKnowledge({ title: '', category: '', content: '' });
    await fetchKnowledge();
  }

  async function send() {
    if (!input.trim()) return;
    const next = [...messages, { role: 'user' as const, content: input.trim() }];
    setMessages(next);
    setInput('');
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ executive, messages: next }) });
    const data = await response.json().catch(() => ({}));
    setMessages([...next, { role: 'assistant', content: data.reply || `${executive} could not answer this turn.` }]);
  }

  async function buildPlan() {
    const response = await fetch('/api/builder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(builder) });
    if (response.ok) setBuilderPlan(await response.json());
  }

  const openTasks = tasks.filter((task) => !['done', 'complete', 'completed', 'closed'].includes(task.status.toLowerCase()));

  const Badge = ({ status }: { status: string }) => (
    <span style={{ fontSize: 11, fontWeight: 700, background: `${statusColor(status)}22`, color: statusColor(status), padding: '3px 10px', borderRadius: 999, border: `1px solid ${statusColor(status)}44`, whiteSpace: 'nowrap' }}>{status}</span>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">ARIDON</div>
        <div className="tag">Your Executive Team is Online</div>
        <div className="nav">
          {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'active' : ''}>{item}</button>)}
        </div>
        <div className="footer">v0.6 · Supabase Connected<br />Aridon Executive Operating System</div>
      </aside>

      <main className="main">
        <div className="hero">
          <div><h1 className="h1">{tab}</h1><div className="sub">Company Brain → Executive Boardroom → Decision → Execution → Approval → CEO Brief</div></div>
          <span className="pill">● System Online</span>
        </div>

        {tab === 'Dashboard' && (
          <section className="grid">
            <div className="card span8">
              <h2>Good morning, Jim.</h2>
              <p className="muted">Eva and Heather have the command center open. Pick a decision, a deliverable, or the next revenue move and put the right executive team on it.</p>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <Link className="btn" href="/boardroom">Open Executive Boardroom</Link>
                <Link className="btn secondary" href="/ceo-brief">Build CEO Brief</Link>
                <Link className="btn secondary" href="/execution">Run Execution Engine</Link>
                <Link className="btn secondary" href="/controls">Approval Center</Link>
              </div>
            </div>
            <div className="card span4"><div className="kpi">{executives.length}</div><div className="muted">AI Executives Online</div></div>

            <div className="card span4"><h3>CRM Leads <span style={countStyle}>({leads.length})</span></h3><div className="list">{leads.slice(0, 3).map((lead) => <div className="item" key={lead.id}>{lead.name}{lead.company ? ` · ${lead.company}` : ''}</div>)}{leads.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No leads yet.</div>}</div></div>
            <div className="card span4"><h3>Projects <span style={countStyle}>({projects.length})</span></h3><div className="list">{projects.slice(0, 3).map((project) => <div className="item" key={project.id}>{project.name}</div>)}{projects.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No projects yet.</div>}</div></div>
            <div className="card span4"><h3>Open Tasks <span style={countStyle}>({openTasks.length})</span></h3><div className="list">{openTasks.slice(0, 3).map((task) => <div className="item" key={task.id}>{task.title}</div>)}{openTasks.length === 0 && <div className="muted" style={{ fontSize: 13 }}>All caught up.</div>}</div></div>

            <div className="card span6"><h3>Company Brain</h3><p className="muted">{knowledge.length} knowledge item{knowledge.length === 1 ? '' : 's'} are available to ground decisions and execution.</p><button className="btn secondary" onClick={() => setTab('Company Brain')}>Open Company Brain</button></div>
            <div className="card span6"><h3>Hands-Free Executive Room</h3><p className="muted">Speak naturally with any executive and hear the answer in the Voice Room.</p><Link className="btn secondary" href="/avatars">Open Voice Room</Link></div>
          </section>
        )}

        {tab === 'Executive Chat' && (
          <section className="grid">
            <div className="card span4"><h3>Select Executive</h3><div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{executives.map((item) => <button key={item.id} onClick={() => setExecutive(item.name)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: executive === item.name ? `${item.color}22` : '#0d1325', border: `1px solid ${executive === item.name ? item.color : '#26314f'}`, borderRadius: 12, padding: 10, cursor: 'pointer', color: '#fff', textAlign: 'left' }}><span style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}22`, display: 'grid', placeItems: 'center', color: item.color, fontWeight: 950 }}>{item.icon}</span><div><div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div><div style={{ color: '#9ba8c6', fontSize: 11 }}>{item.abbr} · {item.role}</div></div></button>)}</div></div>
            <div className="card span8"><div className="chat">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`msg ${message.role === 'user' ? 'user' : 'ai'}`}>{message.content}</div>)}</div><div className="row"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} placeholder={`Ask ${executive}...`} /><button className="btn" onClick={() => void send()}>Send</button></div></div>
          </section>
        )}

        {tab === 'Builder Mode' && (
          <section className="grid"><div className="card span6"><h2>Plain-English Business Builder</h2><label>Company name<input value={builder.companyName} onChange={(event) => setBuilder({ ...builder, companyName: event.target.value })} /></label><label>What do you sell or do?<textarea value={builder.services} onChange={(event) => setBuilder({ ...builder, services: event.target.value })} /></label><label>Who are your customers?<textarea value={builder.customers} onChange={(event) => setBuilder({ ...builder, customers: event.target.value })} /></label><button className="btn" onClick={() => void buildPlan()}>Generate Aridon Setup</button></div><div className="card span6"><h2>Builder Output</h2>{builderPlan ? <div><p>{builderPlan.setupSummary}</p><h3>Modules</h3>{builderPlan.firstModules?.map((item: string) => <div className="item" key={item}>{item}</div>)}<h3>Next Steps</h3>{builderPlan.nextSteps?.map((item: string) => <div className="item" key={item}>{item}</div>)}</div> : <p className="muted">Answer the questions and Builder Mode will create the setup plan.</p>}</div></section>
        )}

        {tab === 'Executive Team' && (
          <section className="grid">{executives.map((item) => <div className="card span4" key={item.id} style={{ borderTop: `3px solid ${item.color}` }}><div className="exec"><div className="avatar-lg" style={{ background: `${item.color}22` }}><span style={{ fontSize: 28, fontWeight: 900, color: item.color }}>{item.icon}</span>{item.avatar && <img src={item.avatar} alt={item.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20, zIndex: 1 }} onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }} />}</div><div style={{ marginLeft: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="title" style={{ fontSize: 20 }}>{item.name}</div><span style={{ fontSize: 11, fontWeight: 700, background: item.color, color: '#111', padding: '2px 8px', borderRadius: 999 }}>{item.abbr}</span></div><div className="muted">{item.role}</div></div></div><p className="muted" style={{ fontSize: 13, margin: '12px 0' }}>{item.tagline}</p>{item.expertise.map((skill) => <div key={skill} style={{ fontSize: 12, color: '#9ba8c6', padding: '3px 0' }}>● {skill}</div>)}<button className="btn secondary" style={{ width: '100%', marginTop: 12, borderColor: item.color, color: item.color }} onClick={() => { setExecutive(item.name); setTab('Executive Chat'); }}>Talk to {item.name}</button></div>)}</section>
        )}

        {tab === 'CRM' && (
          <section className="grid"><div className="card span8"><h2>CRM Leads <span style={countStyle}>({leads.length})</span></h2><div className="list">{leads.map((lead) => <div className="item" key={lead.id} style={splitRow}><div><strong>{lead.name}</strong><div style={meta}>{[lead.company, lead.email].filter(Boolean).join(' · ')}</div>{lead.notes && <div style={meta}>{lead.notes}</div>}</div><Badge status={lead.status} /></div>)}{leads.length === 0 && <p className="muted">No leads yet.</p>}</div></div><div className="card span4"><h3>Add Lead</h3><label>Name *<input value={newLead.name} onChange={(event) => setNewLead({ ...newLead, name: event.target.value })} /></label><label>Company<input value={newLead.company} onChange={(event) => setNewLead({ ...newLead, company: event.target.value })} /></label><label>Email<input value={newLead.email} onChange={(event) => setNewLead({ ...newLead, email: event.target.value })} /></label><label>Notes<textarea value={newLead.notes} onChange={(event) => setNewLead({ ...newLead, notes: event.target.value })} /></label><label>Status<select value={newLead.status} onChange={(event) => setNewLead({ ...newLead, status: event.target.value })}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="closed">Closed</option></select></label><button className="btn" style={fullButton} onClick={() => void addLead()}>Add Lead</button></div></section>
        )}

        {tab === 'Projects' && (
          <section className="grid"><div className="card span8"><h2>Projects <span style={countStyle}>({projects.length})</span></h2><div className="list">{projects.map((project) => <div className="item" key={project.id} style={splitRow}><div><strong>{project.name}</strong><div style={meta}>{project.executive ? `Lead: ${project.executive}` : ''}{project.description ? ` · ${project.description}` : ''}</div></div><Badge status={project.status} /></div>)}{projects.length === 0 && <p className="muted">No projects yet.</p>}</div></div><div className="card span4"><h3>Add Project</h3><label>Name *<input value={newProject.name} onChange={(event) => setNewProject({ ...newProject, name: event.target.value })} /></label><label>Description<textarea value={newProject.description} onChange={(event) => setNewProject({ ...newProject, description: event.target.value })} /></label><label>Executive Lead<select value={newProject.executive} onChange={(event) => setNewProject({ ...newProject, executive: event.target.value })}>{executives.map((item) => <option key={item.id} value={item.name}>{item.name} ({item.abbr})</option>)}</select></label><label>Status<select value={newProject.status} onChange={(event) => setNewProject({ ...newProject, status: event.target.value })}><option value="active">Active</option><option value="planning">Planning</option><option value="on-hold">On Hold</option><option value="complete">Complete</option></select></label><button className="btn" style={fullButton} onClick={() => void addProject()}>Add Project</button></div></section>
        )}

        {tab === 'Tasks' && (
          <section className="grid"><div className="card span8"><h2>Tasks <span style={countStyle}>({tasks.length})</span></h2><div className="list">{tasks.map((task) => <div className="item" key={task.id} style={splitRow}><div><strong>{task.title}</strong><div style={meta}>{task.assigned_to ? `→ ${task.assigned_to} · ` : ''}Priority: {task.priority}</div></div><Badge status={task.status} /></div>)}{tasks.length === 0 && <p className="muted">No tasks yet.</p>}</div></div><div className="card span4"><h3>Add Task</h3><label>Title *<input value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} /></label><label>Assigned To<input value={newTask.assigned_to} onChange={(event) => setNewTask({ ...newTask, assigned_to: event.target.value })} /></label><label>Priority<select value={newTask.priority} onChange={(event) => setNewTask({ ...newTask, priority: event.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Status<select value={newTask.status} onChange={(event) => setNewTask({ ...newTask, status: event.target.value })}><option value="open">Open</option><option value="in-progress">In Progress</option><option value="done">Done</option></select></label><button className="btn" style={fullButton} onClick={() => void addTask()}>Add Task</button></div></section>
        )}

        {tab === 'Company Brain' && (
          <section className="grid"><div className="card span8"><h2>Company Brain <span style={countStyle}>({knowledge.length})</span></h2><p className="muted">Shared business context for the executive team. Add policies, capabilities, customer knowledge, operating notes, decision records, research, and other information the team should know.</p><div className="list">{knowledge.map((item) => <div className="item" key={item.id}><div style={splitRow}><strong>{item.title}</strong>{item.category && <span style={{ fontSize: 11, fontWeight: 700, background: '#4A90D922', color: '#4A90D9', padding: '3px 10px', borderRadius: 999 }}>{item.category}</span>}</div>{item.content && <div style={meta}>{item.content.slice(0, 180)}{item.content.length > 180 ? '…' : ''}</div>}</div>)}{knowledge.length === 0 && <p className="muted">No Company Brain items yet.</p>}</div></div><div className="card span4"><h3>Add to Company Brain</h3><label>Title *<input value={newKnowledge.title} onChange={(event) => setNewKnowledge({ ...newKnowledge, title: event.target.value })} /></label><label>Category<input value={newKnowledge.category} onChange={(event) => setNewKnowledge({ ...newKnowledge, category: event.target.value })} placeholder="Policies, customers, product, finance…" /></label><label>Content<textarea value={newKnowledge.content} onChange={(event) => setNewKnowledge({ ...newKnowledge, content: event.target.value })} style={{ minHeight: 120 }} /></label><button className="btn" style={fullButton} onClick={() => void addKnowledge()}>Add to Company Brain</button></div></section>
        )}
      </main>
    </div>
  );
}

const countStyle = { color: '#9ba8c6', fontWeight: 400, fontSize: 13 };
const splitRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 };
const meta = { color: '#9ba8c6', fontSize: 12, marginTop: 4, lineHeight: 1.5 };
const fullButton = { marginTop: 12, width: '100%' };
