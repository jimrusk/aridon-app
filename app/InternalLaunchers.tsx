'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EVA_AVATAR } from '../lib/evaIdentity';

const launcherStyle = {
  color: '#101421', borderRadius: '999px', padding: '12px 17px', fontWeight: 900,
  textDecoration: 'none', boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
} as const;

export default function InternalLaunchers() {
  const pathname = usePathname();
  if (
    pathname === '/' ||
    pathname === '/sales' ||
    pathname.startsWith('/business-os') ||
    pathname.startsWith('/workspace') ||
    pathname.startsWith('/customer') ||
    pathname.startsWith('/demos') ||
    pathname.startsWith('/daily-demos') ||
    pathname.startsWith('/opportunity-intelligence') ||
    pathname.startsWith('/analyze-business') ||
    pathname.startsWith('/sales-team') ||
    pathname.startsWith('/eva-chat')
  ) return null;

  return (
    <div style={{ position: 'fixed', right: '18px', bottom: '18px', zIndex: 1000, display: 'flex', gap: '9px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
      <Link href="/eva-chat" aria-label="Chat with Eva" title="Chat with Eva" style={{ display: 'flex', alignItems: 'center', gap: '9px', background: '#151A28', color: '#F5F7FB', border: '2px solid #D45A2A', borderRadius: '999px', padding: '4px 12px 4px 4px', fontWeight: 900, textDecoration: 'none', boxShadow: '0 12px 32px rgba(0,0,0,.42)' }}>
        <img src={EVA_AVATAR} alt="Eva" style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /><span>Eva Chat</span>
      </Link>
      <Link href="/sales-team" aria-label="Build an AI sales team from a company website" style={{ ...launcherStyle, background: '#9EF0CF' }}>⚡ Build AI Sales Team</Link>
      <Link href="/analyze-business" aria-label="Analyze any business website" style={{ ...launcherStyle, background: '#F4D06F' }}>◎ Analyze Any Business</Link>
      <Link href="/business-os/growth-command" aria-label="Open Aridon Growth Command" style={{ ...launcherStyle, background: '#9EF0CF' }}>↗ Growth Command</Link>
      <Link href="/eva-core" aria-label="Open Eva Core inner-world lab" style={{ ...launcherStyle, background: '#9EF0CF' }}>◉ Eva Core</Link>
      <Link href="/customers/metrics" aria-label="Open customer product health" style={{ ...launcherStyle, background: '#B9CFFF' }}>▣ Product Health</Link>
      <Link href="/customers/feedback" aria-label="Review customer feedback" style={{ ...launcherStyle, background: '#FFD5A8' }}>✦ Customer Feedback</Link>
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
