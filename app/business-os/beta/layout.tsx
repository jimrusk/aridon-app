import Link from 'next/link';
import { executives } from '../../../lib/executives';

export default function BetaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <aside style={{ background: '#07101D', color: '#F8FAFC', borderBottom: '1px solid #263754', padding: '13px 16px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><strong style={{ color: '#9EF0CF' }}>ARIDON EXECUTIVE OPERATING SYSTEM</strong><div style={{ color: '#B8C3D4', fontSize: 13, marginTop: 3 }}>Your private workspace includes an eight-member AI executive team, Company Brain, Boardroom, controlled execution and CEO Brief.</div></div>
            <Link href="/business-os" style={{ border: '1px solid #40506B', color: '#F8FAFC', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 }}>← Product Overview</Link>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {executives.map((executive) => <span key={executive.id} style={{ border: `1px solid ${executive.color}66`, background: `${executive.color}16`, color: '#E8EDF5', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 800 }}><b style={{ color: executive.color }}>{executive.name}</b> · {executive.abbr}</span>)}
          </div>
        </div>
      </aside>
      {children}
    </>
  );
}
