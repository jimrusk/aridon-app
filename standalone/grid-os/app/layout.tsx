import './globals.css';
import type { Metadata, Viewport } from 'next';

const utilityName = process.env.NEXT_PUBLIC_UTILITY_NAME || 'Aridon GridOS';

export const metadata: Metadata = {
  title: `${utilityName} GridOS`,
  description: 'Dedicated utility grid intelligence, resilience and cybersecurity operating system.',
  applicationName: `${utilityName} GridOS`,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: `${utilityName} GridOS`, statusBarStyle: 'black-translucent' }
};

export const viewport: Viewport = { themeColor: '#050a12', colorScheme: 'dark' };

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}<script src="/register-sw.js" /></body></html>;
}
