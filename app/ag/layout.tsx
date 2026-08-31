import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aridon Ag | AI Back Office for Ranches',
  description: 'Find margin leaks, weekly priorities, finance visibility, regenerative transition economics and funding opportunities for your ranch. Start with a free two-minute Aridon Operation Snapshot.',
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
  return <>
    <link rel="manifest" href="/ag/manifest.webmanifest" />
    <div style={{ background: '#102d25', color: '#fff', padding: '9px 16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1120, margin: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13 }}><strong>ARIDON AG</strong> · Finance OS + regenerative agriculture capital planning.</span>
        <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
          <Link href="/ag/regenerative" style={{ color: '#C8E2AC', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>Regenerative + Finance →</Link>
          <Link href="/ag/finance" style={{ color: '#fff', fontWeight: 850, textDecoration: 'none', fontSize: 13 }}>Open Ag Finance →</Link>
        </div>
      </div>
    </div>
    {children}
  </>;
}
