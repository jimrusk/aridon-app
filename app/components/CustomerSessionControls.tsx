'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CustomerSessionControls() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/avatars', label: 'Voice Room' },
    { href: '/sms', label: 'SMS' },
    { href: '/eva-chat', label: 'Eva Chat' },
    { href: '/eva-core', label: 'Eva Core' },
    { href: '/business-os', label: 'Business OS' },
  ];

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        background: '#08101D',
        borderBottom: '1px solid #24334E',
        color: '#F8FAFC',
        padding: '10px 16px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950, letterSpacing: '.8px' }}>
          ARIDON
        </Link>

        <nav aria-label="Aridon navigation" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {links.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  ...navLink,
                  ...(active ? activeNavLink : {}),
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

const navLink = {
  border: '1px solid #415171',
  color: '#E4EAF5',
  borderRadius: '10px',
  padding: '9px 12px',
  fontWeight: 900,
  textDecoration: 'none',
  fontSize: '13px',
};

const activeNavLink = {
  background: '#9EF0CF',
  color: '#08130F',
  borderColor: '#9EF0CF',
};
