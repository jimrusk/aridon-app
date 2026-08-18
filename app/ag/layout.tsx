import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aridon Ag | AI Farm Operating System',
  description: 'Boost sales, improve crops, control payroll and strengthen water resilience with Aridon Ag.',
  applicationName: 'Aridon Ag',
  manifest: '/ag/manifest.webmanifest',
  themeColor: '#0A533E',
  appleWebApp: {
    capable: true,
    title: 'Aridon Ag',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/pwa/icon/192',
    apple: '/pwa/icon/192',
  },
};

export default function AgLayout({ children }: { children: React.ReactNode }) {
  return children;
}
