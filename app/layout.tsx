import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import AvatarLauncher from './components/AvatarLauncher';

export const metadata: Metadata = {
  title: 'Aridon v0.4',
  description: 'AI Executive Operating System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AvatarLauncher />
        <Link
          href="/email"
          aria-label="Open Email Command Center"
          className="email-launcher"
        >
          ✉ Email Queue
        </Link>
      </body>
    </html>
  );
}
