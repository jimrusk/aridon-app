import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aridon v0.5',
  description: 'AI Executive Operating System and Execution Replacement Layer',
};

const launcherStyle = {
  color: '#101421',
  borderRadius: '999px',
  padding: '12px 17px',
  fontWeight: 900,
  textDecoration: 'none',
  boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
} as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div
          style={{
            position: 'fixed',
            right: '18px',
            bottom: '18px',
            zIndex: 1000,
            display: 'flex',
            gap: '9px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <Link
            href="/execution/doe-test"
            aria-label="Open DOE execution test portfolio"
            style={{ ...launcherStyle, background: '#42D392' }}
          >
            ✓ DOE Test
          </Link>
          <Link
            href="/execution"
            aria-label="Open Execution Replacement Layer"
            style={{ ...launcherStyle, background: '#65B7FF' }}
          >
            ⚙ Execution Engine
          </Link>
          <Link
            href="/email"
            aria-label="Open Email Command Center"
            style={{ ...launcherStyle, background: '#E87722' }}
          >
            ✉ Email Queue
          </Link>
        </div>
      </body>
    </html>
  );
}
