import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Private Executive Command Center',
  description: 'Private company workspace.',
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Link
        href="/customer/sales"
        aria-label="Open Scout Sales Agent"
        style={{
          position: 'fixed',
          right: '18px',
          bottom: '18px',
          zIndex: 900,
          background: '#9EF0CF',
          color: '#07130F',
          borderRadius: '999px',
          padding: '12px 16px',
          fontWeight: 950,
          textDecoration: 'none',
          boxShadow: '0 14px 35px rgba(0,0,0,.35)',
        }}
      >
        ◎ Scout Sales Agent
      </Link>
    </>
  );
}
