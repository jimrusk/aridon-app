import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Aridon Ag | AI Farm Operating System',
  description: 'Boost sales, improve crops, control payroll and strengthen water resilience with Aridon Ag.',
  applicationName: 'Aridon Ag',
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

export const viewport: Viewport = {
  themeColor: '#0A533E',
};

export default function AgLayout({ children }: { children: React.ReactNode }) {
  return <><link rel="manifest" href="/ag/manifest.webmanifest" />{children}</>;
}
