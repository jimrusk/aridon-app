import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Private Executive Command Center',
  description: 'Private company workspace.',
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
