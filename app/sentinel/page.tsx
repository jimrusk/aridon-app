import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Get Sentinel | Aridon',
  description:
    'Download Sentinel — one-tap protection for your Android phone and your Windows computer.',
};

const card: React.CSSProperties = {
  background: '#0E1E33',
  border: '1px solid #1E3A5F',
  borderRadius: 20,
  padding: 28,
  flex: '1 1 260px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const btn: React.CSSProperties = {
  display: 'inline-block',
  textAlign: 'center',
  background: '#ffb45e',
  color: '#1a1206',
  fontWeight: 800,
  fontSize: 16,
  padding: '14px 22px',
  borderRadius: 12,
  textDecoration: 'none',
  marginTop: 8,
};

const btnDisabled: React.CSSProperties = {
  ...btn,
  background: '#2A3B52',
  color: '#8A97A8',
};

export default function SentinelDownloadPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#081120',
        color: '#fff',
        padding: '64px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div
          style={{
            color: '#ffb45e',
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 2,
            marginBottom: 12,
          }}
        >
          SENTINEL — PRE-SECURITY FOR AI AGENTS
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 900, margin: '0 0 12px' }}>
          Get Sentinel
        </h1>
        <p style={{ color: '#B8C4D5', fontSize: 18, margin: '0 0 40px', maxWidth: 640 }}>
          One tap. Protected. Pick your device below — no account, no
          subscription, nothing leaves your device.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={card}>
            <div style={{ fontSize: 40 }}>📱</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>Android phone</h2>
            <p style={{ color: '#B8C4D5', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              The Sentinel app filters every lookup on your phone. Tap Protect
              and you're covered.
            </p>
            <a href="/sentinel/sentinel-mobile.apk" style={btn}>
              Download for Android
            </a>
          </div>

          <div style={card}>
            <div style={{ fontSize: 40 }}>🍎</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>iPhone</h2>
            <p style={{ color: '#B8C4D5', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              The iPhone app is still being built — Apple requires their own
              build tools, which we're setting up now.
            </p>
            <span style={btnDisabled}>Coming soon</span>
          </div>

          <div style={card}>
            <div style={{ fontSize: 40 }}>💻</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>Windows computer</h2>
            <p style={{ color: '#B8C4D5', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              Sentinel for Windows — install it, tap Protect, done. Same
              protection as the phone app.
            </p>
            <a
              href="https://github.com/jimrusk/aridon-app/releases/download/sentinel-desktop-v1.0.0/Sentinel-Setup-1.0.0.exe"
              style={btn}
            >
              Download for Windows
            </a>
            <p style={{ color: '#7A8699', margin: 0, fontSize: 12, lineHeight: 1.5 }}>
              Windows may show a SmartScreen warning on first install — the
              installer isn't signed yet. Click "More info" → "Run anyway".
            </p>
          </div>

          <div style={card}>
            <div style={{ fontSize: 40 }}>🖥️</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>Mac computer</h2>
            <p style={{ color: '#B8C4D5', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              The Mac app is still being built — it needs Apple's build tools,
              same as the iPhone app.
            </p>
            <span style={btnDisabled}>Coming soon</span>
          </div>
        </div>

        <p style={{ color: '#7A8699', fontSize: 14, marginTop: 40 }}>
          Sentinel blocks what you tell it to block and never touches your bank
          or email. Read the{' '}
          <Link href="/sentinel-privacy" style={{ color: '#ffb45e' }}>
            privacy policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
