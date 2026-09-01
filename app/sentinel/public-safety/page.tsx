import Link from 'next/link';

const capabilities = [
  ['Mission-Critical Asset Protection','Classify CAD, dispatch, 911, radio, RMS, access-control, and other systems as protected assets with stricter response rules.'],
  ['Continuity-First Containment','Contain compromised accounts, endpoints, sessions, and network paths without automatically taking protected services offline.'],
  ['Human Override + Two-Person Approval','Require authorized approval for disruptive actions on critical assets, with emergency break-glass controls and full audit history.'],
  ['Evidence Vault','Preserve timestamps, hashes, account activity, device events, actions, and response decisions in an append-only incident record.'],
  ['Local Continuity Mode','Keep core monitoring, policy, and incident controls available during cloud or internet outages.'],
  ['Integrated Response','Orchestrate approved actions through existing EDR, identity, firewall, SIEM, backup, and ticketing systems rather than replacing every tool.'],
];

export default function PublicSafety() {
  return (
    <main style={{minHeight:'100vh',background:'#06101d',color:'#f8fafc',fontFamily:'Arial, sans-serif'}}>
      <section style={{maxWidth:1160,margin:'0 auto',padding:'68px 24px 36px'}}>
        <div style={{display:'inline-block',padding:'7px 10px',border:'1px solid #334155',borderRadius:999,color:'#7dd3fc',fontSize:13,letterSpacing:1.3,textTransform:'uppercase'}}>Sentinel Public Safety</div>
        <h1 style={{fontSize:52,lineHeight:1.05,maxWidth:900,margin:'18px 0'}}>Cyber defense for systems that cannot simply go dark.</h1>
        <p style={{maxWidth:820,fontSize:20,lineHeight:1.65,color:'#cbd5e1'}}>Built for police, sheriff, fire, EMS, 911/dispatch, emergency management, and municipal critical services. Sentinel prioritizes operational continuity while giving authorized teams a controlled way to detect, investigate, contain, recover, and document incidents.</p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:26}}>
          <Link href="/sentinel/public-safety/console" style={{background:'#38bdf8',color:'#06101d',padding:'14px 18px',borderRadius:10,fontWeight:800,textDecoration:'none'}}>Launch Demo Console</Link>
          <a href="#architecture" style={{border:'1px solid #475569',color:'#f8fafc',padding:'14px 18px',borderRadius:10,fontWeight:700,textDecoration:'none'}}>View Architecture</a>
        </div>
      </section>

      <section style={{maxWidth:1160,margin:'0 auto',padding:'28px 24px 60px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
        {capabilities.map(([title,body]) => (
          <article key={title} style={{background:'#0b1728',border:'1px solid #1e293b',borderRadius:16,padding:22}}>
            <h2 style={{fontSize:20,margin:'0 0 10px'}}>{title}</h2>
            <p style={{margin:0,color:'#b6c2d1',lineHeight:1.6}}>{body}</p>
          </article>
        ))}
      </section>

      <section id="architecture" style={{background:'#0b1728',borderTop:'1px solid #1e293b',borderBottom:'1px solid #1e293b'}}>
        <div style={{maxWidth:1160,margin:'0 auto',padding:'54px 24px'}}>
          <h2 style={{fontSize:34,marginTop:0}}>Public Safety response architecture</h2>
          <ol style={{display:'grid',gap:14,paddingLeft:20,color:'#cbd5e1',fontSize:17,lineHeight:1.6}}>
            <li><strong style={{color:'#fff'}}>Observe:</strong> ingest endpoint, identity, network, cloud, SIEM, firewall, backup, and application telemetry.</li>
            <li><strong style={{color:'#fff'}}>Correlate:</strong> combine related signals into one incident with affected users, systems, attack path, and business/mission context.</li>
            <li><strong style={{color:'#fff'}}>Classify:</strong> distinguish normal assets from protected mission-critical assets such as CAD, 911, dispatch, radio, RMS, and emergency communications.</li>
            <li><strong style={{color:'#fff'}}>Recommend:</strong> rank containment actions by risk, operational impact, reversibility, and confidence.</li>
            <li><strong style={{color:'#fff'}}>Approve:</strong> enforce agency policy, including two-person approval or break-glass authorization where required.</li>
            <li><strong style={{color:'#fff'}}>Act:</strong> execute approved containment through integrated security products and record every action.</li>
            <li><strong style={{color:'#fff'}}>Recover + Report:</strong> restore operations, preserve evidence, and generate an incident package for leadership, counsel, insurance, regulators, or law enforcement workflows.</li>
          </ol>
        </div>
      </section>

      <section style={{maxWidth:1160,margin:'0 auto',padding:'54px 24px 72px'}}>
        <h2 style={{fontSize:34}}>Designed around a safer default</h2>
        <div style={{background:'#111827',border:'1px solid #334155',borderRadius:16,padding:24,maxWidth:900}}>
          <p style={{fontSize:19,lineHeight:1.7,margin:0,color:'#dbe4ee'}}>Sentinel does <strong>not</strong> automatically disconnect mission-critical public-safety systems just because an alert fires. Protected assets use continuity-first policies, scoped containment, stronger approvals, and explicit emergency override controls.</p>
        </div>
        <p style={{marginTop:24,color:'#94a3b8',lineHeight:1.6,maxWidth:900}}>Production use in criminal-justice, emergency, healthcare, or critical-infrastructure environments requires agency-specific security review, validated integrations, signed endpoint components, penetration testing, operational runbooks, and applicable compliance mapping before deployment.</p>
      </section>
    </main>
  );
}
