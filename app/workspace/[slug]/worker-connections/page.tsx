'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type BrowserIdentity = {
  id: string;
  name: string;
  site_name?: string | null;
  login_url?: string | null;
  home_url?: string | null;
  status: string;
  last_verified_at?: string | null;
  last_used_at?: string | null;
  updated_at: string;
};

type DirectIntegration = {
  id: string;
  provider: string;
  label?: string | null;
  status: string;
  metadata?: Record<string, any>;
  last_verified_at?: string | null;
  updated_at: string;
};

type Worker = {
  id: string;
  name: string;
  objective: string;
  mode: string;
  status: string;
  browser_identity_id?: string | null;
};

export default function WorkerConnectionsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [identities, setIdentities] = useState<BrowserIdentity[]>([]);
  const [integrations, setIntegrations] = useState<DirectIntegration[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [controlRole, setControlRole] = useState(false);
  const [browserConfigured, setBrowserConfigured] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [identityForm, setIdentityForm] = useState({ name: '', siteName: '', loginUrl: '', homeUrl: '' });
  const [workerForm, setWorkerForm] = useState({ objective: '', browserIdentityId: '', priority: 'medium', maxCycles: 6 });
  const [githubForm, setGithubForm] = useState({ token: '', defaultRepo: '' });
  const [vercelForm, setVercelForm] = useState({ hook: '', projectName: '' });

  async function load(access = token) {
    if (!access) return;
    setError('');
    const headers = { Authorization: `Bearer ${access}` };
    const [identityResponse, integrationResponse, workerResponse] = await Promise.all([
      fetch(`/api/customer/browser-identities?slug=${encodeURIComponent(params.slug)}`, { headers, cache: 'no-store' }),
      fetch(`/api/customer/direct-integrations?slug=${encodeURIComponent(params.slug)}`, { headers, cache: 'no-store' }),
      fetch(`/api/customer/cloud-workers?slug=${encodeURIComponent(params.slug)}`, { headers, cache: 'no-store' }),
    ]);
    const [identityData, integrationData, workerData] = await Promise.all([
      identityResponse.json().catch(() => ({})),
      integrationResponse.json().catch(() => ({})),
      workerResponse.json().catch(() => ({})),
    ]);
    if (!identityResponse.ok || !integrationResponse.ok || !workerResponse.ok) {
      setError(identityData.error || integrationData.error || workerData.error || 'Connections could not load.');
      return;
    }
    setIdentities(identityData.identities || []);
    setIntegrations(integrationData.integrations || []);
    setWorkers(workerData.workers || []);
    setControlRole(Boolean(identityData.controlRole && integrationData.controlRole));
    setBrowserConfigured(Boolean(identityData.browserProviderConfigured));
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data }) => {
      const access = data.session?.access_token || '';
      if (!access) {
        router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/worker-connections`)}`);
        return;
      }
      setToken(access);
      void load(access);
    });
  }, [params.slug, router]);

  async function identityCommand(command: string, body: Record<string, unknown>) {
    if (!token || busy) return null;
    setBusy(`identity:${command}`); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/browser-identities', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, command, ...body }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Browser identity command failed.');
      await load();
      return data;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Browser identity command failed.');
      return null;
    } finally { setBusy(''); }
  }

  async function createIdentity() {
    const data = await identityCommand('create', identityForm);
    if (data?.identity) {
      setIdentityForm({ name: '', siteName: '', loginUrl: '', homeUrl: '' });
      setNotice('Identity shell created. Start its secure login session next.');
    }
  }

  async function startLogin(identity: BrowserIdentity) {
    const data = await identityCommand(identity.status === 'connected' ? 'reauthenticate' : 'start_login', { id: identity.id });
    if (data?.liveViewUrl) {
      window.open(data.liveViewUrl, '_blank', 'noopener,noreferrer');
      setNotice('Secure browser opened. Sign in there, then return here and press “Save signed-in state”.');
    }
  }

  async function finishLogin(identity: BrowserIdentity) {
    const data = await identityCommand('finish_login', { id: identity.id });
    if (data) setNotice('Signed-in state saved. Eva can now reuse this browser identity across workers.');
  }

  async function connectDirect(provider: 'github' | 'vercel_hook') {
    if (!token || busy) return;
    setBusy(`direct:${provider}`); setError(''); setNotice('');
    try {
      const payload = provider === 'github'
        ? { provider, secret: githubForm.token, defaultRepo: githubForm.defaultRepo }
        : { provider, secret: vercelForm.hook, projectName: vercelForm.projectName };
      const response = await fetch('/api/customer/direct-integrations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, command: 'connect', ...payload }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Connection failed.');
      if (provider === 'github') setGithubForm({ token: '', defaultRepo: githubForm.defaultRepo });
      else setVercelForm({ hook: '', projectName: vercelForm.projectName });
      setNotice(provider === 'github' ? 'GitHub connected. Eva can now prepare approved GitHub issue actions.' : 'Vercel Deployment Hook connected. Deploys remain owner-approved.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connection failed.');
    } finally { setBusy(''); }
  }

  async function disconnect(provider: 'github' | 'vercel_hook') {
    if (!token || busy) return;
    setBusy(`disconnect:${provider}`); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/direct-integrations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, command: 'disconnect', provider }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Disconnect failed.');
      setNotice(`${provider === 'github' ? 'GitHub' : 'Vercel'} disconnected and its stored credential cleared.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Disconnect failed.');
    } finally { setBusy(''); }
  }

  async function launchAuthenticatedWorker() {
    if (!token || !workerForm.objective.trim() || !workerForm.browserIdentityId || busy) return;
    setBusy('worker'); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/cloud-workers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: params.slug,
          command: 'create',
          name: 'Eva Authenticated Worker',
          objective: workerForm.objective,
          mode: 'mixed',
          priority: workerForm.priority,
          maxCycles: workerForm.maxCycles,
          browserIdentityId: workerForm.browserIdentityId,
          runNow: true,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Authenticated worker could not start.');
      setWorkerForm({ ...workerForm, objective: '' });
      setNotice(data.warning ? `Worker queued. ${data.warning}` : 'Authenticated worker started. Eva will reuse the saved browser identity when browser exploration runs.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authenticated worker could not start.');
    } finally { setBusy(''); }
  }

  const connectedIdentities = useMemo(() => identities.filter((item) => item.status === 'connected'), [identities]);
  const github = integrations.find((item) => item.provider === 'github' && item.status === 'connected');
  const vercel = integrations.find((item) => item.provider === 'vercel_hook' && item.status === 'connected');

  return (
    <main style={page}>
      <style>{`*{box-sizing:border-box}button,input,textarea,select{font:inherit}.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}@media(max-width:900px){.two,.three{grid-template-columns:1fr}}`}</style>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>EVA · IDENTITY & CONNECTION VAULT</div>
            <h1 style={h1}>Sign in once. Let approved work remember the door.</h1>
            <p style={lead}>Persistent browser identities preserve an authenticated browser context for later read-safe work. Direct integrations give Eva narrow, auditable lanes into GitHub, Vercel, Aridon CRM and the Knowledge Vault.</p>
          </div>
          <div style={buttonRow}>
            <Link href={`/workspace/${params.slug}/cloud-workers`} style={outline}>Cloud Workers</Link>
            <Link href={`/workspace/${params.slug}/action-center`} style={outline}>Action Center</Link>
            <Link href={`/workspace/${params.slug}`} style={mint}>Company Home</Link>
          </div>
        </header>

        {error && <div style={errorBox}>{error}</div>}
        {notice && <div style={noticeBox}>{notice}</div>}

        <section className="three" style={{marginBottom:14}}>
          <Status label="Browser provider" value={browserConfigured ? 'READY' : 'NEEDS BROWSERBASE KEYS'} good={browserConfigured} />
          <Status label="Saved identities" value={String(connectedIdentities.length)} good={connectedIdentities.length > 0} />
          <Status label="Owner controls" value={controlRole ? 'ENABLED' : 'READ ONLY'} good={controlRole} />
        </section>

        <section className="two">
          <article style={darkPanel}>
            <div style={labelLight}>CREATE PERSISTENT BROWSER IDENTITY</div>
            <h2 style={darkH2}>A reusable signed-in browser profile</h2>
            <p style={darkMuted}>Aridon stores the Browserbase context ID, not your password. You sign in inside the secure live browser. The resulting browser cookies and site session remain in that isolated context for later workers.</p>
            <input style={darkInput} placeholder="Identity name, e.g. Eva · LinkedIn" value={identityForm.name} onChange={(e)=>setIdentityForm({...identityForm,name:e.target.value})}/>
            <input style={darkInput} placeholder="Site name, e.g. LinkedIn" value={identityForm.siteName} onChange={(e)=>setIdentityForm({...identityForm,siteName:e.target.value})}/>
            <input style={darkInput} type="url" placeholder="Login URL, e.g. https://www.linkedin.com/login" value={identityForm.loginUrl} onChange={(e)=>setIdentityForm({...identityForm,loginUrl:e.target.value})}/>
            <input style={darkInput} type="url" placeholder="Home URL after login (optional)" value={identityForm.homeUrl} onChange={(e)=>setIdentityForm({...identityForm,homeUrl:e.target.value})}/>
            <button style={{...mintButton,opacity:!controlRole||busy?.6:1}} disabled={!controlRole||Boolean(busy)||!identityForm.name||!identityForm.loginUrl} onClick={()=>void createIdentity()}>{busy==='identity:create'?'Creating…':'Create Identity'}</button>
            {!browserConfigured && <p style={warningText}>Browser identity creation will activate when BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are configured in production.</p>}
          </article>

          <article style={panel}>
            <div style={label}>SAVED BROWSER IDENTITIES</div>
            <h2 style={h2}>Authenticated rooms Eva can revisit</h2>
            {identities.length === 0 ? <p style={muted}>No persistent identities yet. Create one on the left, then authenticate it once.</p> : identities.map((identity)=><div key={identity.id} style={identityRow}>
              <div style={{minWidth:0}}>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong>{identity.name}</strong><span style={pill(identity.status)}>{identity.status.replaceAll('_',' ')}</span></div>
                <div style={smallMuted}>{identity.site_name || identity.login_url || 'Browser identity'}</div>
                <div style={tinyMuted}>{identity.last_verified_at ? `Verified ${new Date(identity.last_verified_at).toLocaleString()}` : 'Not authenticated yet'}{identity.last_used_at ? ` · Last used ${new Date(identity.last_used_at).toLocaleString()}` : ''}</div>
              </div>
              <div style={buttonRow}>
                <button style={smallButton} disabled={!controlRole||Boolean(busy)} onClick={()=>void startLogin(identity)}>{identity.status==='connected'?'Re-authenticate':'Start Login'}</button>
                {identity.status==='login_required' && <button style={mintSmall} disabled={!controlRole||Boolean(busy)} onClick={()=>void finishLogin(identity)}>Save signed-in state</button>}
                {identity.status!=='disabled' && <button style={smallButton} disabled={!controlRole||Boolean(busy)} onClick={()=>void identityCommand('disable',{id:identity.id})}>Disable</button>}
                <button style={dangerButton} disabled={!controlRole||Boolean(busy)} onClick={()=>void identityCommand('delete',{id:identity.id})}>Delete</button>
              </div>
            </div>)}
          </article>
        </section>

        <section style={{marginTop:14}} className="two">
          <article style={panel}>
            <div style={label}>GITHUB DIRECT LANE</div>
            <h2 style={h2}>{github ? `Connected · ${github.label || 'GitHub'}` : 'Connect GitHub'}</h2>
            <p style={muted}>Eva can turn engineering findings into GitHub issues. Creating the issue stays approval-gated in Action Center.</p>
            {github ? <>
              <div style={successBox}>Default repository: {github.metadata?.defaultRepo || 'choose per action'}</div>
              <button style={dangerButton} disabled={!controlRole||Boolean(busy)} onClick={()=>void disconnect('github')}>Disconnect GitHub</button>
            </> : <>
              <input style={input} type="password" autoComplete="off" placeholder="GitHub fine-grained token" value={githubForm.token} onChange={(e)=>setGithubForm({...githubForm,token:e.target.value})}/>
              <input style={input} placeholder="Default repository, e.g. jimrusk/aridon-app" value={githubForm.defaultRepo} onChange={(e)=>setGithubForm({...githubForm,defaultRepo:e.target.value})}/>
              <button style={mintButton} disabled={!controlRole||Boolean(busy)||!githubForm.token} onClick={()=>void connectDirect('github')}>Verify & Connect GitHub</button>
            </>}
          </article>

          <article style={panel}>
            <div style={label}>VERCEL DIRECT LANE</div>
            <h2 style={h2}>{vercel ? `Connected · ${vercel.label || 'Vercel'}` : 'Connect Vercel Deployment Hook'}</h2>
            <p style={muted}>Eva can prepare a deployment action. The hook fires only after owner approval in Action Center.</p>
            {vercel ? <>
              <div style={successBox}>Deployment hook is encrypted and stored server-side. Its URL is never returned to this page.</div>
              <button style={dangerButton} disabled={!controlRole||Boolean(busy)} onClick={()=>void disconnect('vercel_hook')}>Disconnect Vercel</button>
            </> : <>
              <input style={input} type="password" autoComplete="off" placeholder="Vercel Deployment Hook URL" value={vercelForm.hook} onChange={(e)=>setVercelForm({...vercelForm,hook:e.target.value})}/>
              <input style={input} placeholder="Project name" value={vercelForm.projectName} onChange={(e)=>setVercelForm({...vercelForm,projectName:e.target.value})}/>
              <button style={mintButton} disabled={!controlRole||Boolean(busy)||!vercelForm.hook} onClick={()=>void connectDirect('vercel_hook')}>Connect Deployment Hook</button>
            </>}
          </article>
        </section>

        <section style={{marginTop:14}} className="two">
          <article style={panel}>
            <div style={label}>BUILT-IN DIRECT LANES</div>
            <h2 style={h2}>CRM + Knowledge Vault</h2>
            <p style={muted}>These do not need another account connection. Eva can safely create researched CRM leads and save durable findings into the tenant Knowledge Vault during a worker cycle.</p>
            <div style={buttonRow}><span style={greenChip}>CRM lead creation · ready</span><span style={greenChip}>Knowledge save · ready</span></div>
          </article>

          <article style={darkPanel}>
            <div style={labelLight}>LAUNCH WITH A SAVED IDENTITY</div>
            <h2 style={darkH2}>Start an authenticated worker</h2>
            <select style={darkInput} value={workerForm.browserIdentityId} onChange={(e)=>setWorkerForm({...workerForm,browserIdentityId:e.target.value})}>
              <option value="">Choose a connected identity</option>
              {connectedIdentities.map((identity)=><option key={identity.id} value={identity.id}>{identity.name}{identity.site_name ? ` · ${identity.site_name}` : ''}</option>)}
            </select>
            <textarea style={{...darkInput,minHeight:135}} placeholder="Example: Using my saved LinkedIn identity, review the public/professional information available on this company page, capture useful facts, save the best prospect to CRM, and prepare any consequential next action for approval." value={workerForm.objective} onChange={(e)=>setWorkerForm({...workerForm,objective:e.target.value})}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <select style={darkInput} value={workerForm.priority} onChange={(e)=>setWorkerForm({...workerForm,priority:e.target.value})}><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option><option value="urgent">Urgent</option></select>
              <input style={darkInput} type="number" min={1} max={12} value={workerForm.maxCycles} onChange={(e)=>setWorkerForm({...workerForm,maxCycles:Number(e.target.value)||6})}/>
            </div>
            <button style={mintButton} disabled={!controlRole||Boolean(busy)||!workerForm.browserIdentityId||!workerForm.objective.trim()} onClick={()=>void launchAuthenticatedWorker()}>{busy==='worker'?'Eva is starting…':'Start Authenticated Worker'}</button>
            {connectedIdentities.length===0 && <p style={warningText}>Authenticate at least one browser identity first.</p>}
          </article>
        </section>

        <section style={{marginTop:14}}>
          <article style={panel}>
            <div style={label}>RECENT WORKERS</div>
            <h2 style={h2}>Who is using a saved identity?</h2>
            {workers.length===0 ? <p style={muted}>No workers yet.</p> : workers.slice(0,8).map((worker)=>{
              const identity = identities.find((item)=>item.id===worker.browser_identity_id);
              return <div key={worker.id} style={identityRow}><div><strong>{worker.name}</strong><div style={smallMuted}>{worker.status.replaceAll('_',' ')} · {worker.mode}{identity ? ` · identity: ${identity.name}` : ''}</div></div><Link href={`/workspace/${params.slug}/cloud-workers`} style={smallLink}>Open worker</Link></div>;
            })}
          </article>
        </section>
      </div>
    </main>
  );
}

function Status({label,value,good}:{label:string;value:string;good:boolean}) { return <div style={statusCard}><span>{label}</span><strong style={{color:good?'#176C4A':'#9B4B25'}}>{value}</strong></div>; }
function pill(status:string){const connected=status==='connected';const waiting=status==='login_required'||status==='reauth_required';return {padding:'5px 8px',borderRadius:999,fontSize:10,fontWeight:950,textTransform:'uppercase' as const,background:connected?'#DDF4E7':waiting?'#FFF1CE':'#EEF1F5',color:connected?'#176C4A':waiting?'#8A5A00':'#647286'};}

const page={minHeight:'100vh',background:'#F4F7F6',color:'#142036',padding:'26px 18px 100px',fontFamily:'Inter,ui-sans-serif,system-ui,Segoe UI,Arial'} as const;
const shell={maxWidth:1200,margin:'0 auto'} as const;
const header={display:'flex',justifyContent:'space-between',gap:18,alignItems:'flex-start',flexWrap:'wrap',marginBottom:18} as const;
const eyebrow={fontSize:12,fontWeight:950,letterSpacing:'.15em',color:'#407C67'} as const;
const h1={fontSize:'clamp(34px,5vw,60px)',lineHeight:1.02,margin:'8px 0 10px',maxWidth:820} as const;
const lead={color:'#607084',lineHeight:1.6,maxWidth:850,margin:0} as const;
const panel={background:'#fff',border:'1px solid #DCE5E1',borderRadius:20,padding:18,boxShadow:'0 12px 34px rgba(24,48,40,.06)'} as const;
const darkPanel={...panel,background:'#0D1728',borderColor:'#24334B',color:'#fff'} as const;
const darkH2={fontSize:27,margin:'7px 0 10px'} as const;
const h2={fontSize:24,margin:'7px 0 9px'} as const;
const label={fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#4B7B68'} as const;
const labelLight={...label,color:'#9EF0CF'} as const;
const muted={color:'#66768A',lineHeight:1.55,margin:'4px 0 12px'} as const;
const darkMuted={color:'#A8B4C8',lineHeight:1.55,fontSize:13} as const;
const tinyMuted={color:'#8997A8',fontSize:11,marginTop:4} as const;
const smallMuted={color:'#718095',fontSize:12,marginTop:4,lineHeight:1.45} as const;
const input={width:'100%',background:'#fff',border:'1px solid #C9D5D0',color:'#172538',borderRadius:12,padding:'11px 12px',marginBottom:9} as const;
const darkInput={width:'100%',background:'#101D31',border:'1px solid #30415D',color:'#fff',borderRadius:12,padding:'11px 12px',marginBottom:9} as const;
const mintButton={border:0,borderRadius:12,padding:'11px 15px',background:'#9EF0CF',color:'#102119',fontWeight:950,cursor:'pointer'} as const;
const buttonRow={display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'} as const;
const outline={textDecoration:'none',border:'1px solid #B8C7C0',borderRadius:999,padding:'9px 12px',color:'#26384A',fontWeight:850} as const;
const mint={...outline,background:'#9EF0CF',borderColor:'#9EF0CF',color:'#11261E'} as const;
const statusCard={...panel,padding:'12px 14px',display:'grid',gap:4} as const;
const identityRow={display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',padding:'12px 0',borderTop:'1px solid #E6ECE9',flexWrap:'wrap'} as const;
const smallButton={border:'1px solid #B9C7C1',background:'#fff',borderRadius:10,padding:'8px 10px',fontWeight:850,cursor:'pointer',color:'#24384D'} as const;
const mintSmall={...smallButton,background:'#9EF0CF',borderColor:'#9EF0CF',color:'#102119'} as const;
const dangerButton={...smallButton,borderColor:'#E3B9B9',color:'#9A3131'} as const;
const smallLink={...smallButton,textDecoration:'none'} as const;
const greenChip={background:'#E5F7EE',border:'1px solid #C7E7D7',borderRadius:999,padding:'7px 10px',fontSize:11,fontWeight:900,color:'#176C4A'} as const;
const successBox={background:'#EDF8F3',border:'1px solid #C8E7D9',borderRadius:12,padding:'10px 12px',color:'#315F4D',marginBottom:10,fontSize:13} as const;
const warningText={color:'#F3C985',fontSize:12,lineHeight:1.5,marginTop:10} as const;
const errorBox={background:'#FFF0F0',border:'1px solid #EABBBB',color:'#8E2F2F',borderRadius:12,padding:'10px 12px',marginBottom:10} as const;
const noticeBox={background:'#E8F7EF',border:'1px solid #B9E0CA',color:'#216044',borderRadius:12,padding:'10px 12px',marginBottom:10} as const;
