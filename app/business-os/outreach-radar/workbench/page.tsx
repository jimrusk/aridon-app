import Link from 'next/link';
import ReplyWorkbench from '../ReplyWorkbench';

export const metadata = {
  title: 'Aridon Reply Workbench',
  description: 'Score a public business-growth post and draft a helpful Aridon reply.',
};

export default function ReplyWorkbenchPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F4F1E9', color: '#171717', fontFamily: 'Arial, sans-serif', padding: '28px 20px 70px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/business-os" style={{ color: '#171717', textDecoration: 'none', fontWeight: 950 }}>ARIDON · BUSINESS OS</Link>
          <Link href="/business-os/outreach-radar" style={{ color: '#176348', textDecoration: 'none', fontWeight: 850 }}>Social Reply Engine</Link>
        </nav>
        <ReplyWorkbench />
      </div>
    </main>
  );
}
