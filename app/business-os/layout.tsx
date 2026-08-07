import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://aridon-v02.vercel.app'),
  title: {
    default: 'Private Business OS | Find Customers, Follow Up Faster, Run the Business',
    template: '%s | Private Business OS',
  },
  description: 'A private AI business workspace with Eva and Scout to help owner-led companies follow up leads, find customers, organize work, research opportunities, and keep revenue-producing next actions visible.',
  keywords: [
    'AI for small business',
    'AI business assistant',
    'small business sales follow up',
    'AI sales prospecting',
    'business operating system',
    'small business automation',
    'AI customer follow up',
  ],
  alternates: { canonical: '/business-os' },
  openGraph: {
    title: 'Private Business OS',
    description: 'Follow up faster, find customers, organize work, and give your business an AI team inside a private workspace.',
    url: '/business-os',
    siteName: 'Private Business OS',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Private Business OS',
    description: 'An AI business team for owner-led companies: follow-up, prospecting, planning, and execution in one private workspace.',
  },
  robots: { index: true, follow: true },
};

export default function BusinessOSLayout({ children }: { children: React.ReactNode }) {
  return children;
}
