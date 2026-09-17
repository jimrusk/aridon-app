import Link from 'next/link';
import type { ReactNode } from 'react';

export default function SalesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <nav
        aria-label="Scout sales tools"
        style={{
          position: 'fixed',
          right: 14,
          bottom: 14,
          zIndex: 70,
          display: 'flex',
          gap: 7,
          padding: 7,
          borderRadius: 14,
          background: 'rgba(6, 11, 20, .94)',
          border: '1px solid #33465F',
          boxShadow: '0 12px 38px rgba(0,0,0,.35)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link href="/customer/sales" style={linkStyle}>Scout</Link>
        <Link href="/customer/sales/security-radar" style={{ ...linkStyle, background: '#8DE7D2', color: '#06110E', borderColor: '#8DE7D2' }}>🛡 Security Radar</Link>
      </nav>
    </>
  );
}

const linkStyle = {
  color: '#E8EEF7',
  border: '1px solid #344761',
  borderRadius: 9,
  padding: '8px 10px',
  textDecoration: 'none',
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  fontWeight: 900,
};
