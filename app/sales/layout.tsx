import Link from 'next/link';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ background: '#9EF0CF', color: '#07130F', padding: '10px 16px', fontFamily: 'Arial,sans-serif' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 13 }}>New: Aridon now has fixed-scope offers from $198 plus the Business OS.</strong>
          <Link href="/revenue" style={{ color: '#07130F', fontWeight: 950, fontSize: 13 }}>Open Revenue Store →</Link>
        </div>
      </div>
      {children}
    </>
  );
}
