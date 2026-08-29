import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Aridon Ag | AI Back Office for Ranches',
  description: 'Find margin leaks, weekly priorities and funding opportunities for your ranch. Start with a free two-minute Aridon Operation Snapshot.',
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
  themeColor: '#163D2A',
};

export default function AgLayout({ children }: { children: React.ReactNode }) {
  return <><link rel="manifest" href="/ag/manifest.webmanifest" />{children}</>;
}
