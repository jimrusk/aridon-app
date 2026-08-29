import './globals.css';
import './avatars/avatar-room.css';
import type { Metadata } from 'next';
import InternalLaunchers from './InternalLaunchers';
import AridonRadarTabs from './components/AridonRadarTabs';
import CustomerSessionControls from './components/CustomerSessionControls';
import SalesTeamIntentRedirect from './components/SalesTeamIntentRedirect';
import PublicInstallPromo from './components/PublicInstallPromo';
import ConditionalGlobalLanguageLayer from './components/ConditionalGlobalLanguageLayer';

export const metadata: Metadata = {
  title: 'Aridon Executive Operating System',
  description: 'An AI executive team, Company Brain, Executive Boardroom, controlled execution and CEO Brief for owner-led businesses.',
  applicationName: 'Aridon Business AI',
  manifest: '/manifest.webmanifest',
  themeColor: '#07101D',
  appleWebApp: {
    capable: true,
    title: 'Aridon',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/pwa/icon/192',
    apple: '/pwa/icon/192',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PublicInstallPromo />
        <CustomerSessionControls />
        <SalesTeamIntentRedirect />
        {children}
        <AridonRadarTabs />
        <InternalLaunchers />
        <ConditionalGlobalLanguageLayer />
      </body>
    </html>
  );
}
