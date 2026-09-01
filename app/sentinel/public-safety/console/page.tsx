'use client';

import { useMemo, useState } from 'react';

const incidents = [
  {id:'PS-2041',severity:'Critical',title:'Credential theft + lateral movement',asset:'Dispatch workstation 14',assetClass:'mission-critical',status:'Awaiting approval'},
  {id:'PS-2039',severity:'High',title:'Suspicious executable blocked',asset:'Records workstation 08',assetClass:'protected',status:'Contained'},
  {id:'PS-2037',severity:'Medium',title:'Impossible-travel sign-in',asset:'Patrol supervisor account',assetClass:'standard',status:'Investigating'},
] as const;

type Decision = {
  allowed:boolean;
  mode:string;
  requiredApprovals:number;
  reason:string;
  continuityControls:string[];
};

export default function PublicSafetyConsole(){
  const [selected,setSelected]=useState(incidents[0]);
  const [approvals,setApprovals]=useState(0);
  const [decision,setDecision]=useState<Decision|null>(null);
  const [busy,setBusy]=useState(false);

  const risk = useMemo(()=> selected.assetClass === 'mission-critical'
    ? 'Mission-critical: two-person approval + high confidence required'
    : selected.assetClass === 'protected'
      ? 'Protected asset: two-person approval required'
      : 'Standard asset policy', [selected]);

  async function evaluateContainment(){
    setBusy(true);
    try {
      const response = await fetch('/api/sentinel/public-safety/policy',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          assetClass:selected.assetClass,
          action:'isolate_endpoint',
          confidence:selected.severity === 'Critical' ? 0.91 : selected.severity === 'High' ? 0.82 : 0.7,
          approvals,
        }),
      });
      const data = await response.json();
      setDecision(data.decision ?? null);
    } finally {
      setBusy(false);
    }
  }

  function selectIncident(i:(typeof incidents)[number]){
    setSelected(i);
    setApprovals(0);
    setDecision(null);
  }

  return (
    <main style={{minHeight:'100vh',background:'#050b14',color:'#f8fafc',fontFamily:'Arial, sans-serif',padding:'24px'}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:22}}>
          <div><div style={{fontSize:13,color:'#7dd3fc',letterSpacing:1.4,textTransform:'uppercase'}}>Aridon Sentinel Public Safety</div><h1 style={{margin:'6px 0 0'}}>Incident Command Console</h1></div>
          <div style={{padding:'9px 12px',border:'1px solid #14532d',background:'#052e16',borderRadius:10,color:'#86efac'}}>Local continuity: READY</div>
        </header>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginBottom:18}}>
          {[['Mission systems online','12 / 12'],['Open incidents','3'],['Protected assets','7'],['Pending approvals',String(selected.assetClass==='standard'?0:Math.max(0,2-approvals))]].map(([k,v])=><div key={k} style={{background:'#0b1728',border:'1px solid #1e293b',borderRadius:14,padding:18}}><div style={{color:'#94a3b8',fontSize:13}}>{k}</div><div style={{fontSize:28,fontWeight:800,marginTop:6}}>{v}</div></div>)}
        </section>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16}}>
          <div style={{background:'#0b1728',border:'1px solid #1e293b',borderRadius:16,padding:16}}>
            <h2 style={{marginTop:0,fontSize:18}}>Active incidents</h2>
            <div style={{display:'grid',gap:10}}>{incidents.map(i=><button key={i.id} onClick={()=>selectIncident(i)} style={{textAlign:'left',background:selected.id===i.id?'#12243d':'#091321',border:'1px solid #26364a',color:'#fff',borderRadius:12,padding:14,cursor:'pointer'}}><div style={{display:'flex',justifyContent:'space-between',gap:8}}><strong>{i.id}</strong><span style={{color:i.severity==='Critical'?'#fca5a5':i.severity==='High'?'#fdba74':'#fde68a'}}>{i.severity}</span></div><div style={{marginTop:7}}>{i.title}</div><div style={{marginTop:5,color:'#94a3b8',fontSize:13}}>{i.asset}</div></button>)}</div>
          </div>

          <div style={{background:'#0b1728',border:'1px solid #1e293b',borderRadius:16,padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div><div style={{color:'#94a3b8',fontSize:13}}>{selected.id}</div><h2 style={{margin:'5px 0'}}>{selected.title}</h2><div style={{color:'#cbd5e1'}}>{selected.asset}</div></div><div style={{padding:'8px 10px',borderRadius:10,background:selected.assetClass==='standard'?'#10253a':'#3f1d2e',height:'fit-content',textTransform:'uppercase'}}>{selected.assetClass}</div></div>
            <div style={{marginTop:20,padding:14,background:'#07111f',borderRadius:12,border:'1px solid #243244'}}><strong>Policy:</strong> {risk}</div>
            <h3>Recommended response</h3>
            <ul style={{color:'#cbd5e1',lineHeight:1.7}}><li>Preserve identity, process, network, and timeline evidence.</li><li>Revoke suspicious sessions and block observed malicious destinations where policy permits.</li><li>Keep mission services online while isolating the smallest possible compromised path.</li><li>Escalate disruptive containment through required approvals.</li></ul>

            <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:18}}>
              <button onClick={()=>{setApprovals(v=>Math.min(2,v+1));setDecision(null)}} style={{padding:'11px 14px',borderRadius:10,border:0,background:'#38bdf8',fontWeight:800,cursor:'pointer'}}>Record authorized approval</button>
              <span style={{color:'#cbd5e1'}}>Approvals: <strong>{approvals}</strong></span>
              <button disabled={busy} onClick={evaluateContainment} style={{padding:'11px 14px',borderRadius:10,border:'1px solid #475569',background:'#111827',color:'#fff',fontWeight:700,cursor:'pointer'}}>{busy?'Evaluating…':'Evaluate containment'}</button>
            </div>

            {decision && <div style={{marginTop:18,padding:14,borderRadius:12,background:decision.allowed?'#052e16':'#3f1520',border:`1px solid ${decision.allowed?'#166534':'#7f1d1d'}`}}>
              <div style={{fontWeight:800,fontSize:18}}>{decision.allowed?'AUTHORIZED':'BLOCKED'} · {decision.mode}</div>
              <p style={{lineHeight:1.6}}>{decision.reason}</p>
              <div style={{color:'#cbd5e1',fontSize:14}}>Continuity controls</div>
              <ul style={{color:'#cbd5e1',lineHeight:1.6}}>{decision.continuityControls.map(item=><li key={item}>{item}</li>)}</ul>
            </div>}
          </div>
        </section>
      </div>
    </main>
  );
}
