'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CustomerSessionControls() {
  const pathname = usePathname();

  if (pathname.startsWith('/business-os') || pathname.startsWith('/customer') || pathname.startsWith('/demos')) return null;

  if (pathname.startsWith('/workspace/')) {
    const slug = pathname.split('/')[2] || '';
    if (!slug) return null;
    return (
      <div style={barStyle}>
        <div style={barInner}>
          <Link href={`/workspace/${slug}`} style={brandStyle}>ARIDON · {slug.replace(/-/g, ' ').toUpperCase()}</Link>
          <nav aria-label="Private workspace navigation" style={navStyle}>
            <Link href={`/workspace/${slug}`} style={navLink}>Company Home</Link>
            <Link href={`/workspace/${slug}/executive-suite?tab=boardroom`} style={navLink}>Boardroom</Link>
            <Link href={`/workspace/${slug}/executive-suite?tab=execution`} style={navLink}>Execution</Link>
            <Link href={`/workspace/${slug}/executive-suite?tab=brief`} style={navLink}>CEO Brief</Link>
            <Link href={`/workspace/${slug}/executive-suite?tab=brain`} style={navLink}>Company Brain</Link>
            <Link href={`/workspace/${slug}/executive-suite?tab=approval`} style={navLink}>Controls</Link>
          </nav>
        </div>
      </div>
    );
  }

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/boardroom', label: 'Boardroom' },
    { href: '/avatars', label: 'Voice Room' },
    { href: '/ceo-brief', label: 'CEO Brief' },
    { href: '/controls', label: 'Controls' },
    { href: '/business-os', label: 'Business OS' },
  ];

  return (
    <div style={barStyle}>
      <div style={barInner}>
        <Link href="/" style={brandStyle}>ARIDON</Link>
        <nav aria-label="Aridon navigation" style={navStyle}>
          {links.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return <Link key={link.href} href={link.href} style={{ ...navLink, ...(active ? activeNavLink : {}) }}>{link.label}</Link>;
          })}
        </nav>
      </div>
    </div>
  );
}

const barStyle = {
  position: 'sticky' as const,
  top: 0,
  zIndex: 1200,
  background: '#08101D',
  borderBottom: '1px solid #24334E',
  color: '#F8FAFC',
  padding: '10px 16px',
  fontFamily: 'Arial, sans-serif',
};

const barInner = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  flexWrap: 'wrap' as const,
};

const brandStyle = { color: '#F8FAFC', textDecoration: 'none', fontWeight: 950, letterSpacing: '.8px' };
const navStyle = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const };
const navLink = { border: '1px solid #415171', color: '#E4EAF5', borderRadius: '10px', padding: '9px 12px', fontWeight: 900, textDecoration: 'none', fontSize: '13px' };
const activeNavLink = { background: '#9EF0CF', color: '#08130F', borderColor: '#9EF0CF' };
