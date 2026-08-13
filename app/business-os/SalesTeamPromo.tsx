'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SalesTeamPromo() {
  const pathname = usePathname();
  if (pathname !== '/business-os') return null;

  return (
    <div style={{ background: '#9EF0CF', color: '#07130F', fontFamily: 'Arial, sans-serif', borderBottom: '1px solid #6FC8A5' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '11px 20px', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div><strong>New: Drop your URL and build an AI sales team.</strong><span style={{ marginLeft: 8, fontSize: 13 }}>Scout learns the business, finds prospects and prepares the first campaign.</span></div>
        <Link href="/sales-team" style={{ background: '#07101D', color: '#F8FAFC', textDecoration: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 950, whiteSpace: 'nowrap' }}>Build My AI Sales Team →</Link>
      </div>
    </div>
  );
}
