'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const launcherStyle = {
  color: '#101421',
  borderRadius: '999px',
  padding: '12px 17px',
  fontWeight: 900,
  textDecoration: 'none',
  boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
} as const;

export default function InternalLaunchers() {
  const pathname = usePathname();
  if (
    pathname.startsWith('/business-os') ||
    pathname.startsWith('/workspace') ||
    pathname.startsWith('/customer')
  ) return null;

  return (
    <div
      style={{
        position: 'fixed', right: '18px', bottom: '18px', zIndex: 1000,
        display: 'flex', gap: '9px', flexWrap: 'wrap', justifyContent: 'flex-end',
      }}
    >
      <Link href="/customers/beta" aria-label="Create no-cost customer beta invite" style={{ ...launcherStyle, background: '#9EF0CF' }}>◌ Beta Invites</Link>
      <Link href="/business-os" aria-label="Open Private Business OS sales page" style={{ ...launcherStyle, background: '#E8DFC9' }}>◇ Sell Business OS</Link>
      <Link href="/advisors/awg1000" aria-label="Open AWG-1000 challenge pack" style={{ ...launcherStyle, background: '#A4F0CF' }}>◈ AWG Review</Link>
      <Link href="/advisors" aria-label="Open Executive Challenge Suite" style={{ ...launcherStyle, background: '#C9A7FF' }}>◆ Challenge Suite</Link>
      <Link href="/intelligence" aria-label="Open Aridon Intelligence Center" style={{ ...launcherStyle, background: '#FFB454' }}>◉ Morning Intel</Link>
      <Link href="/execution/doe-test" aria-label="Open DOE execution test portfolio" style={{ ...launcherStyle, background: '#42D392' }}>✓ DOE Test</Link>
      <Link href="/execution" aria-label="Open Execution Replacement Layer" style={{ ...launcherStyle, background: '#65B7FF' }}>⚙ Execution Engine</Link>
      <Link href="/email" aria-label="Open Email Command Center" style={{ ...launcherStyle, background: '#E87722' }}>✉ Email Queue</Link>
    </div>
  );
}
