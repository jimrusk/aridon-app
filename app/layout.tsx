import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aridon v0.4',
  description: 'AI Executive Operating System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Link
          href="/email"
          aria-label="Open Email Command Center"
          style={{
            position: 'fixed',
            right: '18px',
            bottom: '18px',
            zIndex: 1000,
            background: '#E87722',
            color: '#101421',
            borderRadius: '999px',
            padding: '12px 17px',
            fontWeight: 900,
            textDecoration: 'none',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          }}
        >
          ✉ Email Queue
        </Link>
      </body>
    </html>
  );
}
