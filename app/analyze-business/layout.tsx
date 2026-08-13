import Link from 'next/link';

export default function AnalyzeBusinessLayout({ children }: { children: React.ReactNode }) {
  return <div className="prospect-analyzer">
    {children}
    <section style={{ background: '#F4F1E9', color: '#171717', padding: '54px 20px 68px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', background: '#fff', border: '1px solid #D4CEC2', borderRadius: 20, padding: 26 }}>
        <div style={{ fontSize: 12, fontWeight: 950 }}>AFTER THE ANALYSIS</div>
        <h2 style={{ fontSize: 'clamp(34px,5vw,50px)', lineHeight: 1, margin: '9px 0 12px' }}>See a leak worth fixing? Put Aridon on the next move.</h2>
        <p style={{ fontSize: 18, lineHeight: 1.65, color: '#5D5A54', maxWidth: 830 }}>The free analysis shows the digital front-door opportunities. The paid system is for turning business context into priorities, owner-approved actions and measurable follow-through. Founding continuation is $497/month.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/business-os/revenue-recovery" style={{ background: '#171717', color: '#fff', textDecoration: 'none', fontWeight: 950, padding: '13px 17px', borderRadius: 11 }}>See the Pilot & $497 Continuation</Link>
          <Link href="/business-os/proof" style={{ border: '1px solid #777067', color: '#171717', textDecoration: 'none', fontWeight: 900, padding: '12px 16px', borderRadius: 11 }}>See Public Proof First</Link>
        </div>
        <p style={{ fontSize: 12, color: '#777067', marginBottom: 0 }}>No revenue guarantee. Consequential actions remain under owner approval.</p>
      </div>
    </section>
    <style>{`.prospect-analyzer main > section > nav > div { display:none !important; }`}</style>
  </div>;
}
