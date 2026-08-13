'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PublicInstallPromo() {
  const pathname = usePathname();
  if (pathname !== '/' && pathname !== '/business-os/subscribe') return null;

  return (
    <div style={{ background: '#9EF0CF', color: '#07130F', padding: '9px 16px', fontFamily: 'Arial, sans-serif', textAlign: 'center', fontWeight: 900, fontSize: 13 }}>
      NEW: Aridon installs as a company app on supported computers and phones.{' '}
      <Link href="/install" style={{ color: '#07130F', fontWeight: 950 }}>See installation →</Link>
    </div>
  );
}
