import Link from 'next/link';

export default function AnalyzeBusinessLayout({ children }: { children: React.ReactNode }) {
  return <div className="prospect-analyzer">
    {children}
    <section style={{ background: '#F4F1E9', color: '#171717', padding: '54px 20px 68px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', background: '#fff', border: '1px solid #D4CEC2', borderRadius: 20, padding: 26 }}>
        <div style={{ fontSize: 12, fontWeight: 950 }}>AFTER THE ANALYSIS</div>
        <h2 style={{ fontSize: 'clamp(34px,5vw,50px)', lineHeight: 1, margin: '9px 0 12px' }}>See a leak worth fixing? Put Aridon on the next move.</h2>
        <p style={{ fontSize: 18, lineHeight: 1.65, color: '#5D5A54', maxWidth: 830 }}>The free analysis shows the digital front-door opportunities. The paid system turns business context into priorities, owner-approved actions and measurable follow-through. Aridon Essentials starts at $198/month, with the fuller Business system at $497/month.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/business-os/checkout?plan=essentials" style={{ background: '#171717', color: '#fff', textDecoration: 'none', fontWeight: 950, padding: '13px 17px', borderRadius: 11 }}>Start Essentials at $198/month</Link>
          <Link href="/business-os/subscribe" style={{ border: '1px solid #777067', color: '#171717', textDecoration: 'none', fontWeight: 900, padding: '12px 16px', borderRadius: 11 }}>Compare Aridon Plans</Link>
          <Link href="/business-os/proof" style={{ color: '#171717', textDecoration: 'underline', fontWeight: 900, padding: '12px 5px' }}>See Public Proof First</Link>
        </div>
        <p style={{ fontSize: 12, color: '#777067', marginBottom: 0 }}>No revenue guarantee. Consequential actions remain under owner approval.</p>
      </div>
    </section>
    <style>{`.prospect-analyzer main > section > nav > div { display:none !important; }`}</style>
  </div>;
}
