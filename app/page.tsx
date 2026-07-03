'use client';
import { useState, useEffect } from 'react';
import { executives } from '../lib/executives';

type Msg = { role:'user'|'assistant', content:string };
type Lead = { id:string, name:string, company:string, status:string, notes:string, email:string };
type Project = { id:string, name:string, status:string, description:string, executive:string };
type Task = { id:string, title:string, status:string, priority:string, assigned_to:string };
type KnowledgeItem = { id:string, title:string, content:string, category:string };

const statusColor = (s:string) =>
  s==='active'||s==='open'||s==='new'||s==='qualified' ? '#27AE60' :
  s==='complete'||s==='closed'||s==='done' ? '#4A90D9' : '#E87722';

export default function Home() {
  const [tab, setTab] = useState('Dashboard');
  const [executive, setExecutive] = useState('Heather');
  const [messages, setMessages] = useState<Msg[]>([{role:'assistant',content:'Welcome to Aridon. Your Executive Team is online. I am Heather, your COO. What are we building today?'}]);
  const [input, setInput] = useState('');
  const [builder, setBuilder] = useState({companyName:'Aridon',services:'AI executive teams, business automation, infrastructure support, power and water project coordination',customers:'small businesses, contractors, tribes, utilities, data centers, government teams'});
  const [builderPlan, setBuilderPlan] = useState<any>(null);

  // Live data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);

  // Add forms
  const [newLead, setNewLead] = useState({name:'',company:'',email:'',notes:'',status:'new'});
  const [newProject, setNewProject] = useState({name:'',description:'',executive:'Heather',status:'active'});
  const [newTask, setNewTask] = useState({title:'',assigned_to:'',priority:'medium',status:'open'});
  const [newKnowledge, setNewKnowledge] = useState({title:'',category:'',content:''});

  useEffect(() => {
    fetchLeads(); fetchProjects(); fetchTasks(); fetchKnowledge();
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

  async function addLead() {
    if (!newLead.name.trim()) return;
    await fetch('/api/crm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newLead)});
    setNewLead({name:'',company:'',email:'',notes:'',status:'new'}); fetchLeads();
  }
  async function addProject() {
    if (!newProject.name.trim()) return;
    await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newProject)});
    setNewProject({name:'',description:'',executive:'Heather',status:'active'}); fetchProjects();
  }
  async function addTask() {
    if (!newTask.title.trim()) return;
    await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newTask)});
    setNewTask({title:'',assigned_to:'',priority:'medium',status:'open'}); fetchTasks();
  }
  async function addKnowledge() {
    if (!newKnowledge.title.trim()) return;
    await fetch('/api/knowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newKnowledge)});
    setNewKnowledge({title:'',category:'',content:''}); fetchKnowledge();
  }

  async function send() {
    if (!input.trim()) return;
    const next = [...messages,{role:'user' as const,content:input}];
    setMessages(next); setInput('');
    const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({executive,messages:next.map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.content}))})});
    const data = await res.json();
    setMessages([...next,{role:'assistant',content:data.reply}]);
  }

  async function buildPlan() {
    const res = await fetch('/api/builder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(builder)});
    setBuilderPlan(await res.json());
  }

  const Badge = ({s}:{s:string}) => (
    <span style={{fontSize:'11px',fontWeight:700,background:statusColor(s)+'22',color:statusColor(s),padding:'3px 10px',borderRadius:'999px',border:`1px solid ${statusColor(s)}44`,whiteSpace:'nowrap'}}>{s}</span>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">ARIDON</div>
        <div className="tag">Your Executive Team is Online</div>
        <div className="nav">
          {['Dashboard','Heather Chat','Builder Mode','Executive Team','CRM','Projects','Tasks','Knowledge Vault'].map(x=>
            <button key={x} onClick={()=>setTab(x)} className={tab===x?'active':''}>{x}</button>
          )}
        </div>
        <div className="footer">v0.3 · Supabase Connected<br/>Iron Grid Electric &amp; Water</div>
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
            <div className="card span8">
              <h2>Good morning, Jim.</h2>
              <p className="muted">Heather has the command center open. Live data is connected via Supabase.</p>
              <div className="row">
                <button className="btn" onClick={()=>setTab('Heather Chat')}>Talk to Heather</button>
                <button className="btn secondary" onClick={()=>setTab('Builder Mode')}>Open Builder Mode</button>
              </div>
            </div>
            <div className="card span4">
              <div className="kpi">7</div>
              <div className="muted">AI Executives Online</div>
            </div>
            <div className="card span4">
              <h3>CRM Leads <span style={{color:'#9ba8c6',fontWeight:400,fontSize:'13px'}}>({leads.length})</span></h3>
              <div className="list">
                {leads.slice(0,3).map(x=><div className="item" key={x.id}>{x.name}{x.company?` · ${x.company}`:''}</div>)}
                {leads.length===0&&<div className="muted" style={{fontSize:'13px'}}>No leads yet.</div>}
              </div>
            </div>
            <div className="card span4">
              <h3>Projects <span style={{color:'#9ba8c6',fontWeight:400,fontSize:'13px'}}>({projects.length})</span></h3>
              <div className="list">
                {projects.slice(0,3).map(x=><div className="item" key={x.id}>{x.name}</div>)}
                {projects.length===0&&<div className="muted" style={{fontSize:'13px'}}>No projects yet.</div>}
              </div>
            </div>
            <div className="card span4">
              <h3>Open Tasks <span style={{color:'#9ba8c6',fontWeight:400,fontSize:'13px'}}>({tasks.filter(t=>t.status==='open').length})</span></h3>
              <div className="list">
                {tasks.filter(t=>t.status==='open').slice(0,3).map(x=><div className="item" key={x.id}>{x.title}</div>)}
                {tasks.filter(t=>t.status==='open').length===0&&<div className="muted" style={{fontSize:'13px'}}>All caught up.</div>}
              </div>
            </div>
          </section>
        )}

        {tab==='Heather Chat' && (
          <section className="grid">
            <div className="card span4">
              <h3>Select Executive</h3>
              <div style={{display:'grid',gap:'8px',marginTop:'12px'}}>
                {executives.map(e=>(
                  <button key={e.id} onClick={()=>setExecutive(e.name)} style={{display:'flex',alignItems:'center',gap:'10px',background:executive===e.name?`${e.color}22`:'#0d1325',border:`1px solid ${executive===e.name?e.color:'#26314f'}`,borderRadius:'12px',padding:'10px',cursor:'pointer',color:'#fff',textAlign:'left'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'10px',background:`linear-gradient(135deg,${e.color}44,${e.color}22)`,display:'grid',placeItems:'center',overflow:'hidden',flexShrink:0,position:'relative'}}>
                      <span style={{fontWeight:900,fontSize:'14px',color:e.color}}>{e.icon}</span>
                      {e.avatar&&<img src={e.avatar} alt={e.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'10px',zIndex:1}} onError={(ev)=>{(ev.target as HTMLImageElement).style.display='none'}}/>}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:'13px'}}>{e.name}</div>
                      <div style={{color:'#9ba8c6',fontSize:'11px'}}>{e.abbr} · {e.role.split(' ').slice(-2).join(' ')}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="card span8">
              <div className="chat">
                {messages.map((m,i)=><div key={i} className={'msg '+(m.role==='user'?'user':'ai')}>{m.content}</div>)}
              </div>
              <div className="row">
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} placeholder={`Ask ${executive}...`}/>
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
                <button className="btn secondary" style={{width:'100%',borderColor:e.color,color:e.color}} onClick={()=>{setExecutive(e.name);setTab('Heather Chat')}}>Contact {e.name}</button>
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
                  <div className="item" key={x.id}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}>
                      <div style={{fontWeight:700}}>{x.title}</div>
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
      </main>
    </div>
  );
}
