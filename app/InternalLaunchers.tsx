'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EVA_AVATAR } from '../lib/evaIdentity';

const launcherStyle = {
  color: '#101421',
  borderRadius: '999px',
  padding: '7px 10px',
  fontSize: '10px',
  lineHeight: 1,
  fontWeight: 900,
  textDecoration: 'none',
  boxShadow: '0 5px 14px rgba(0,0,0,0.28)',
  whiteSpace: 'nowrap',
  flex: '0 0 auto',
} as const;

export default function InternalLaunchers() {
  const pathname = usePathname();
  if (
    pathname === '/' ||
    pathname === '/sales' ||
    pathname.startsWith('/install') ||
    pathname.startsWith('/business-os') ||
    pathname.startsWith('/impact-os') ||
    pathname.startsWith('/workspace') ||
    pathname.startsWith('/customer') ||
    pathname.startsWith('/demos') ||
    pathname.startsWith('/daily-demos') ||
    pathname.startsWith('/opportunity-intelligence') ||
    pathname.startsWith('/property-intelligence') ||
    pathname.startsWith('/analyze-business') ||
    pathname.startsWith('/site-indexing') ||
    pathname.startsWith('/sales-team') ||
    pathname.startsWith('/presentation-studio') ||
    pathname.startsWith('/facebook-launch') ||
    pathname.startsWith('/model-router') ||
    pathname.startsWith('/agent-supervisor') ||
    pathname.startsWith('/eva-chat')
  ) return null;

  return (
    <div
      aria-label="Aridon internal shortcuts"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        flexWrap: 'nowrap',
        gap: '5px',
        alignItems: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        maxWidth: '100vw',
        padding: '6px 8px max(6px, env(safe-area-inset-bottom))',
        background: 'rgba(7,16,29,.96)',
        borderTop: '1px solid rgba(255,255,255,.13)',
        boxShadow: '0 -6px 18px rgba(0,0,0,.28)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Link
        href="/eva-chat"
        aria-label="Chat with Eva"
        title="Chat with Eva"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#151A28',
          color: '#F5F7FB',
          border: '1px solid #D45A2A',
          borderRadius: '999px',
          padding: '3px 8px 3px 3px',
          fontSize: '10px',
          lineHeight: 1,
          fontWeight: 900,
          textDecoration: 'none',
          boxShadow: '0 5px 14px rgba(0,0,0,.28)',
          whiteSpace: 'nowrap',
          flex: '0 0 auto',
        }}
      >
        <img src={EVA_AVATAR} alt="Eva" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
        <span>Eva</span>
      </Link>
      <Link href="/property-intelligence" aria-label="Open nationwide property intelligence hunter" style={{ ...launcherStyle, background: '#FFE1A8' }}>⌂ Property</Link>
      <Link href="/agent-supervisor" aria-label="Open Aridon Agent Supervisor" style={{ ...launcherStyle, background: '#9EF0CF' }}>◎ Agents</Link>
      <Link href="/presentation-studio" aria-label="Open Aridon Presentation Studio" style={{ ...launcherStyle, background: '#FFD5A8' }}>▣ Present</Link>
      <Link href="/facebook-launch" aria-label="Open Aridon Facebook Page Launch Center" style={{ ...launcherStyle, background: '#A8C7FF' }}>f Facebook</Link>
      <Link href="/model-router" aria-label="Open Aridon model router" style={{ ...launcherStyle, background: '#C9A7FF' }}>⌘ Models</Link>
      <Link href="/impact-os" aria-label="Open Aridon Impact OS" style={{ ...launcherStyle, background: '#C9A7FF' }}>✦ Impact</Link>
      <Link href="/sales-team" aria-label="Build an AI sales team from a company website" style={{ ...launcherStyle, background: '#9EF0CF' }}>⚡ Sales AI</Link>
      <Link href="/site-indexing" aria-label="Open Aridon Index Engine" style={{ ...launcherStyle, background: '#B9CFFF' }}>⌁ Index</Link>
      <Link href="/analyze-business" aria-label="Analyze any business website" style={{ ...launcherStyle, background: '#F4D06F' }}>◎ Analyze</Link>
      <Link href="/business-os/growth-command" aria-label="Open Aridon Growth Command" style={{ ...launcherStyle, background: '#9EF0CF' }}>↗ Growth</Link>
      <Link href="/marketing-autopilot" aria-label="Open Aridon Marketing Autopilot" style={{ ...launcherStyle, background: '#8FE2C2' }}>⟳ Autopilot</Link>
      <Link href="/eva-core" aria-label="Open Eva Core inner-world lab" style={{ ...launcherStyle, background: '#9EF0CF' }}>◉ Eva Core</Link>
      <Link href="/customers/metrics" aria-label="Open customer product health" style={{ ...launcherStyle, background: '#B9CFFF' }}>▣ Health</Link>
      <Link href="/customers/feedback" aria-label="Review customer feedback" style={{ ...launcherStyle, background: '#FFD5A8' }}>✦ Feedback</Link>
      <Link href="/customers/beta" aria-label="Create no-cost customer beta invite" style={{ ...launcherStyle, background: '#9EF0CF' }}>◌ Beta</Link>
      <Link href="/business-os" aria-label="Open Private Business OS sales page" style={{ ...launcherStyle, background: '#E8DFC9' }}>◇ Business OS</Link>
      <Link href="/advisors/awg1000" aria-label="Open AWG-1000 challenge pack" style={{ ...launcherStyle, background: '#A4F0CF' }}>◈ AWG</Link>
      <Link href="/advisors" aria-label="Open Executive Challenge Suite" style={{ ...launcherStyle, background: '#C9A7FF' }}>◆ Challenge</Link>
      <Link href="/intelligence" aria-label="Open Aridon Intelligence Center" style={{ ...launcherStyle, background: '#FFB454' }}>◉ Intel</Link>
      <Link href="/execution/doe-test" aria-label="Open DOE execution test portfolio" style={{ ...launcherStyle, background: '#42D392' }}>✓ DOE</Link>
      <Link href="/execution" aria-label="Open Execution Replacement Layer" style={{ ...launcherStyle, background: '#65B7FF' }}>⚙ Execute</Link>
      <Link href="/email" aria-label="Open Email Command Center" style={{ ...launcherStyle, background: '#E87722' }}>✉ Email</Link>
    </div>
  );
}
