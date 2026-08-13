import Link from 'next/link';

export default function RevenueRecoveryLayout({ children }: { children: React.ReactNode }) {
  return <>
    <div style={{ background: '#F4D06F', color: '#171717', padding: '12px 20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>Not a New Mexico / Arizona plumbing or HVAC company?</strong>
        <Link href="/business-os/subscribe" style={{ color: '#171717', fontWeight: 950 }}>See the general Aridon $497/month plan →</Link>
      </div>
    </div>
    {children}
  </>;
}
