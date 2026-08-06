import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Private Business OS',
  description: 'A private AI executive operating system branded around your business.',
};

export default function BusinessOSLayout({ children }: { children: React.ReactNode }) {
  return children;
}
