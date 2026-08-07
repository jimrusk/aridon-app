import type { Metadata } from 'next';
import CustomerSessionControls from '../components/CustomerSessionControls';

export const metadata: Metadata = {
  title: 'Private Business OS',
  description: 'Private customer login, account and workspace access.',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomerSessionControls />
      {children}
    </>
  );
}
