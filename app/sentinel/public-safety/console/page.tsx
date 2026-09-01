'use client';

import { useMemo, useState } from 'react';

const incidents = [
  {id:'PS-2041',severity:'Critical',title:'Credential theft + lateral movement',asset:'Dispatch workstation 14',protected:true,status:'Awaiting approval'},
  {id:'PS-2039',severity:'High',title:'Suspicious executable blocked',asset:'Records workstation 08',protected:false,status:'Contained'},
  {id:'PS-2037',severity:'Medium',title:'Impossible-travel sign-in',asset:'Patrol supervisor account',protected:false,status:'Investigating'},
];

export default function PublicSafetyConsole(){
  const [selected,setSelected]=useState(incidents[0]);
  const [action,setAction]=useState('No disruptive action executed');
  const risk = useMemo(()=> selected.protected ? 'Protected asset: two-person approval required' : 'Standard asset policy', [selected]);
  return (
    <main style={{minHeight:'100vh',background:'#050b14',color:'#f8fafc',fontFamily:'Arial, sans-serif',padding:'24px'}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:22}}>
          <div><div style={{fontSize:13,color:'#7dd3fc',letterSpacing:1.4,textTransform:'uppercase'}}>Aridon Sentinel Public Safety</div><h1 style={{margin:'6px 0 0'}}>Incident Command Console</h1></div>
          <div style={{padding:'9px 12px',border:'1px solid #14532d',background:'#052e16',borderRadius:10,color:'#86efac'}}>Local continuity: READY</div>
        </header>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginBottom:18}}>
          {[['Mission systems online','12 / 12'],['Open incidents','3'],['Protected assets','7'],['Pending approvals','1']].map(([k,v])=><div key={k} style={{background:'#0b1728',border:'1px solid #1e293b',borderRadius:14,padding:18}}><div style={{color:'#94a3b8',fontSize:13}}>{k}</div><div style={{fontSize:28,fontWeight:800,marginTop:6}}>{v}</div></div>)}
        </section>

        <section style={{display:'grid',gridTemplateColumns:'minmax(280px,0.9fr) minmax(360px,1.5fr)',gap:16}}>
          <div style={{background:'#0b1728',border:'1px solid #1e293b',borderRadius:16,padding:16}}>
            <h2 style={{marginTop:0,fontSize:18}}>Active incidents</h2>
            <div style={{display:'grid',gap:10}}>{incidents.map(i=><button key={i.id} onClick={()=>{setSelected(i);setAction('No disruptive action executed')}} style={{textAlign:'left',background:selected.id===i.id?'#12243d':'#091321',border:'1px solid #26364a',color:'#fff',borderRadius:12,padding:14,cursor:'pointer'}}><div style={{display:'flex',justifyContent:'space-between',gap:8}}><strong>{i.id}</strong><span style={{color:i.severity==='Critical'?'#fca5a5':i.severity==='High'?'#fdba74':'#fde68a'}}>{i.severity}</span></div><div style={{marginTop:7}}>{i.title}</div><div style={{marginTop:5,color:'#94a3b8',fontSize:13}}>{i.asset}</div></button>)}</div>
          </div>

          <div style={{background:'#0b1728',border:'1px solid #1e293b',borderRadius:16,padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div><div style={{color:'#94a3b8',fontSize:13}}>{selected.id}</div><h2 style={{margin:'5px 0'}}>{selected.title}</h2><div style={{color:'#cbd5e1'}}>{selected.asset}</div></div><div style={{padding:'8px 10px',borderRadius:10,background:selected.protected?'#3f1d2e':'#10253a',height:'fit-content'}}>{selected.protected?'PROTECTED ASSET':'STANDARD ASSET'}</div></div>
            <div style={{marginTop:20,padding:14,background:'#07111f',borderRadius:12,border:'1px solid #243244'}}><strong>Policy:</strong> {risk}</div>
            <h3>Recommended response</h3>
            <ul style={{color:'#cbd5e1',lineHeight:1.7}}><li>Revoke suspicious user sessions.</li><li>Block observed malicious destination through integrated firewall/EDR.</li><li>Preserve process, identity, network, and timeline evidence.</li><li>{selected.protected?'Keep dispatch service online; isolate only the suspected endpoint path after approval.':'Isolate endpoint if confidence threshold and policy permit.'}</li></ul>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:18}}>
              <button onClick={()=>setAction('Approval 1 recorded. Awaiting second authorized approver.')} style={{padding:'11px 14px',borderRadius:10,border:0,background:'#38bdf8',fontWeight:800,cursor:'pointer'}}>Approve containment</button>
              <button onClick={()=>setAction('Containment denied. Incident remains under monitoring.')} style={{padding:'11px 14px',borderRadius:10,border:'1px solid #475569',background:'#111827',color:'#fff',fontWeight:700,cursor:'pointer'}}>Deny</button>
              <button onClick={()=>setAction('Break-glass requested. Requires privileged authentication and reason code.')} style={{padding:'11px 14px',borderRadius:10,border:'1px solid #7c2d12',background:'#2b1309',color:'#fed7aa',fontWeight:700,cursor:'pointer'}}>Break-glass</button>
            </div>
            <div style={{marginTop:18,padding:12,borderRadius:10,background:'#06131d',color:'#93c5fd'}}>{action}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
