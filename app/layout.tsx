import './globals.css';
import './avatars/avatar-room.css';
import type { Metadata } from 'next';
import InternalLaunchers from './InternalLaunchers';
import CustomerSessionControls from './components/CustomerSessionControls';

export const metadata: Metadata = {
  title: 'Aridon v0.5',
  description: 'AI Executive Operating System and Execution Replacement Layer',
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
