import Link from 'next/link';
import { OUTREACH_TARGETS } from '../../lib/outreachMonitor';

const statusLabel = {
  awaiting_reply: 'Awaiting reply',
  replied: 'Reply received',
  follow_up_due: 'Follow-up due',
  closed: 'Closed',
};

export default function OutreachMonitorPage() {
  const awaiting = OUTREACH_TARGETS.filter(x => x.status === 'awaiting_reply').length;
  const replied = OUTREACH_TARGETS.filter(x => x.status === 'replied').length;

  return (
    <main style={{minHeight:'100vh',background:'#070b16',color:'#fff',padding:'32px 20px',fontFamily:'Arial, sans-serif'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',flexWrap:'wrap',marginBottom:24}}>
          <div>
            <div style={{letterSpacing:3,fontWeight:900,color:'#E87722'}}>ARIDON</div>
            <h1 style={{fontSize:34,margin:'8px 0'}}>Outreach Reply Monitor</h1>
            <p style={{color:'#9ba8c6',maxWidth:760,margin:0}}>August 8 priority outreach. These records track the exact messages sent from Jim's Gmail and the next follow-up action.</p>
          </div>
          <Link href="/" style={{color:'#fff',border:'1px solid #33415f',padding:'10px 14px',borderRadius:10,textDecoration:'none'}}>Back to Executive OS</Link>
        </div>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:14,marginBottom:22}}>
          <div style={{background:'#10182b',border:'1px solid #26314f',borderRadius:16,padding:18}}><div style={{fontSize:30,fontWeight:900}}>{OUTREACH_TARGETS.length}</div><div style={{color:'#9ba8c6'}}>Active outreach threads</div></div>
          <div style={{background:'#10182b',border:'1px solid #26314f',borderRadius:16,padding:18}}><div style={{fontSize:30,fontWeight:900,color:'#F1C40F'}}>{awaiting}</div><div style={{color:'#9ba8c6'}}>Awaiting reply</div></div>
          <div style={{background:'#10182b',border:'1px solid #26314f',borderRadius:16,padding:18}}><div style={{fontSize:30,fontWeight:900,color:'#27AE60'}}>{replied}</div><div style={{color:'#9ba8c6'}}>Replies received</div></div>
        </section>

        <section style={{display:'grid',gap:14}}>
          {OUTREACH_TARGETS.map(target => (
            <article key={target.id} style={{background:'#10182b',border:`1px solid ${target.priority==='high'?'#E8772266':'#26314f'}`,borderRadius:16,padding:18}}>
              <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start',flexWrap:'wrap'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:target.priority==='high'?'#E87722':'#9ba8c6',textTransform:'uppercase',letterSpacing:1}}>{target.priority} priority</div>
                  <h2 style={{fontSize:20,margin:'6px 0 2px'}}>{target.organization}</h2>
                  <div style={{color:'#d7def0'}}>{target.name}</div>
                </div>
                <span style={{fontSize:12,fontWeight:800,padding:'7px 10px',borderRadius:999,background:target.status==='replied'?'#27AE6022':'#F1C40F22',color:target.status==='replied'?'#5fe18d':'#f4d03f',border:`1px solid ${target.status==='replied'?'#27AE6055':'#F1C40F55'}`}}>{statusLabel[target.status]}</span>
              </div>
              <div style={{marginTop:14,color:'#9ba8c6',fontSize:13,lineHeight:1.6}}>
                <div><strong style={{color:'#d7def0'}}>To:</strong> {target.emails.join(', ')}</div>
                {target.cc?.length ? <div><strong style={{color:'#d7def0'}}>CC:</strong> {target.cc.join(', ')}</div> : null}
                <div><strong style={{color:'#d7def0'}}>Subject:</strong> {target.subject}</div>
                <div><strong style={{color:'#d7def0'}}>Sent:</strong> August 8, 2026</div>
              </div>
              <div style={{marginTop:12,padding:12,borderRadius:10,background:'#0b1120',color:'#c5cee5'}}><strong>Next action:</strong> {target.nextAction}</div>
            </article>
          ))}
        </section>

        <div style={{marginTop:22,padding:16,borderRadius:14,background:'#0c1425',border:'1px solid #26314f',color:'#9ba8c6'}}>
          Reply monitoring is paired with the Aridon inbox watch. When a substantive reply is detected, the status should be advanced and Jim alerted with the recommended next action.
        </div>
      </div>
    </main>
  );
}
