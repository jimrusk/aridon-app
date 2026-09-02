import Link from 'next/link';

export default function PropertyIntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav aria-label="Aridon property intelligence navigation" style={{ background: '#07101D', borderBottom: '1px solid #26354D', padding: '8px 14px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto' }}>
          <strong style={{ color: '#9EF0CF', fontSize: 11, whiteSpace: 'nowrap', marginRight: 4 }}>ARIDON PROPERTY</strong>
          <Link href="/property-intelligence" style={link}>Property Hunter</Link>
          <Link href="/property-intelligence/value" style={{ ...link, background: '#9EF0CF', color: '#07130F', borderColor: '#9EF0CF' }}>Verified Value</Link>
          <Link href="/property-intelligence/market" style={link}>Market Radar</Link>
          <Link href="/property-intelligence/land" style={link}>Land Intelligence</Link>
          <Link href="/property-intelligence/sources" style={link}>Public Sources</Link>
          <Link href="/ag" style={link}>Aridon Ag</Link>
        </div>
      </nav>
      {children}
    </>
  );
}

const link = { color: '#E8EEF6', textDecoration: 'none', border: '1px solid #31425C', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' } as const;
