import type { Metadata } from 'next';
import Link from 'next/link';
import SalesTeamPromo from './SalesTeamPromo';

export const metadata: Metadata = {
  metadataBase: new URL('https://aridon-v02.vercel.app'),
  title: {
    default: 'Aridon Executive Operating System | Your AI Executive Team',
    template: '%s | Aridon Executive OS',
  },
  description: 'Give your business an eight-member AI executive team, shared Company Brain, Executive Boardroom, controlled execution, CEO Brief, CRM, projects, tasks, voice interaction, and human approval controls inside one private workspace.',
  keywords: [
    'AI executive team',
    'AI executive operating system',
    'AI business operating system',
    'AI chief of staff',
    'AI boardroom',
    'AI workforce for business',
    'small business AI team',
    'AI business automation',
    'AI decision support',
  ],
  alternates: { canonical: '/business-os' },
  openGraph: {
    title: 'Aridon Executive Operating System',
    description: 'Your company does not need another chatbot. Give it an AI executive team with shared company memory, Boardroom decisions, controlled execution, and a CEO Brief.',
    url: '/business-os',
    siteName: 'Aridon Executive Operating System',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Aridon Executive Operating System',
    description: 'Eight AI executives, one Company Brain, an Executive Boardroom, controlled execution, and one CEO Brief.',
  },
  robots: { index: true, follow: true },
};

export default function BusinessOSLayout({ children }: { children: React.ReactNode }) {
  return <>
    <SalesTeamPromo />
    <div style={{ background: '#10211c', color: '#fff', padding: '9px 16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1180, margin: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13 }}><strong>NEW · ARIDON FINANCE OS</strong> · Books, tax workflow, CFO planning and Financial Sentinel.</span>
        <Link href="/business-os/finance" style={{ color: '#9EF0CF', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>Open Finance OS →</Link>
      </div>
    </div>
    {children}
  </>;
}
