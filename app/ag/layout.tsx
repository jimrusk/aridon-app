import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aridon Ag | AI Back Office for Ranches',
  description: 'Find margin leaks, weekly priorities, finance visibility, regenerative transition economics, underwriting readiness, impact evidence and funding opportunities for your ranch. Start with a free two-minute Aridon Operation Snapshot.',
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
      <div style={{ maxWidth: 1180, margin: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13 }}><strong>ARIDON AG</strong> · Finance OS + regenerative agriculture capital planning.</span>
        <div style={{ display:'flex', gap:13, alignItems:'center', flexWrap:'wrap' }}>
          <Link href="/ag/rancher-network" style={{ color: '#C8E2AC', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>Rancher Network →</Link>
          <Link href="/ag/rd" style={{ color: '#C8E2AC', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>R&amp;D Portfolio →</Link>
          <Link href="/ag/rd/center" style={{ color: '#C8E2AC', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>R&amp;D Center Capital →</Link>
          <Link href="/ag/rd/fslc" style={{ color: '#C8E2AC', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>FSLC Proposal →</Link>
          <Link href="/ag/regenerative" style={{ color: '#C8E2AC', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>Regenerative + Finance →</Link>
          <Link href="/ag/regenerative/underwriting" style={{ color: '#C8E2AC', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>Risk + Underwriting →</Link>
          <Link href="/ag/regenerative/impact" style={{ color: '#C8E2AC', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>Impact + Readiness →</Link>
          <Link href="/ag/finance" style={{ color: '#fff', fontWeight: 850, textDecoration: 'none', fontSize: 13 }}>Open Ag Finance →</Link>
        </div>
      </div>
    </div>
    {children}
  </>;
}
