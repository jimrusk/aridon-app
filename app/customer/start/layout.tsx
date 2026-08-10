import Link from 'next/link';

export default function CustomerMainRoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 1400, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Link
          href="/customer/creator"
          aria-label="Open Creator Studio"
          style={{
            background: '#9EF0CF',
            color: '#07130F',
            border: '1px solid #B8F7DF',
            borderRadius: 999,
            padding: '12px 16px',
            textDecoration: 'none',
            fontFamily: 'Arial, sans-serif',
            fontSize: 13,
            fontWeight: 950,
            boxShadow: '0 14px 34px rgba(0,0,0,.34)',
          }}
        >
          ✦ Creator Studio
        </Link>
        <Link
          href="/customer/visual"
          aria-label="Open Visual Studio"
          style={{
            background: '#B9CFFF',
            color: '#07130F',
            border: '1px solid #D3DEFF',
            borderRadius: 999,
            padding: '12px 16px',
            textDecoration: 'none',
            fontFamily: 'Arial, sans-serif',
            fontSize: 13,
            fontWeight: 950,
            boxShadow: '0 14px 34px rgba(0,0,0,.34)',
          }}
        >
          ◈ Visual Studio
        </Link>
      </div>
    </>
  );
}
