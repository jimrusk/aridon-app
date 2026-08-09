import './globals.css';
import './avatars/avatar-room.css';
import type { Metadata } from 'next';
import InternalLaunchers from './InternalLaunchers';
import CustomerSessionControls from './components/CustomerSessionControls';

export const metadata: Metadata = {
  title: 'Aridon Executive Operating System',
  description: 'An AI executive team, Company Brain, Executive Boardroom, controlled execution and CEO Brief for owner-led businesses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CustomerSessionControls />
        {children}
        <InternalLaunchers />
      </body>
    </html>
  );
}
