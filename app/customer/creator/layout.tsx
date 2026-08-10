import Link from 'next/link';

export default function CreatorStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div style={{ position: 'fixed', left: 18, bottom: 18, zIndex: 1500, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/customer/creator" style={pillStyle}>✦ Create</Link>
        <Link href="/customer/creator/review" style={{ ...pillStyle, background: '#B9CFFF' }}>✓ Edit · Approve · Reject</Link>
      </div>
    </>
  );
}

const pillStyle = {
  background: '#9EF0CF',
  color: '#07130F',
  border: '1px solid rgba(255,255,255,.5)',
  borderRadius: 999,
  padding: '11px 14px',
  textDecoration: 'none',
  fontFamily: 'Arial, sans-serif',
  fontWeight: 950,
  fontSize: 12,
  boxShadow: '0 12px 28px rgba(0,0,0,.3)',
};
