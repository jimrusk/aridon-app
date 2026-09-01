import Link from 'next/link';

export default function SentinelHome() {
  return (
    <main style={{minHeight:'100vh',background:'#07111f',color:'#f4f7fb',fontFamily:'Arial, sans-serif'}}>
      <section style={{maxWidth:1120,margin:'0 auto',padding:'72px 24px'}}>
        <div style={{fontSize:14,letterSpacing:2,textTransform:'uppercase',color:'#7dd3fc'}}>Aridon Sentinel</div>
        <h1 style={{fontSize:54,lineHeight:1.05,margin:'12px 0 18px'}}>Security that keeps the mission running.</h1>
        <p style={{maxWidth:760,fontSize:20,lineHeight:1.6,color:'#cbd5e1'}}>Sentinel correlates endpoint, identity, network, cloud, and operational alerts into one controlled incident response system. It is designed to help organizations contain attacks without blindly shutting down the systems they depend on.</p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:28}}>
          <Link href="/sentinel/public-safety" style={{background:'#22c55e',color:'#07111f',padding:'14px 18px',borderRadius:10,fontWeight:700,textDecoration:'none'}}>Public Safety Edition</Link>
          <Link href="/sentinel/public-safety/console" style={{border:'1px solid #475569',color:'#f8fafc',padding:'14px 18px',borderRadius:10,fontWeight:700,textDecoration:'none'}}>Open Command Console</Link>
        </div>
      </section>
    </main>
  );
}
