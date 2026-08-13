'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const mint = '#9EF0CF';
const card = { background: '#101B2D', border: '1px solid #2A3B58', borderRadius: 20, padding: 20 } as const;

export default function MobileAppHome() {
  const [online, setOnline] = useState(true);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('aridon-native-store-app', '1');
    document.documentElement.dataset.aridonNative = '1';
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  async function shareAridon() {
    try {
      navigator.vibrate?.(25);
      if (navigator.share) {
        await navigator.share({ title: 'Aridon Business AI', text: 'Meet Aridon, an AI executive operating system for owner-led businesses.', url: 'https://aridon-v02.vercel.app/' });
      } else {
        await navigator.clipboard?.writeText('https://aridon-v02.vercel.app/');
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {}
  }

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif', paddingBottom: 44 }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '22px 18px 50px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div><strong style={{ fontSize: 18, letterSpacing: .8 }}>ARIDON</strong><div style={{ color: '#8EA0BA', fontSize: 11, marginTop: 3 }}>BUSINESS AI</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: online ? mint : '#F4D06F', fontSize: 12, fontWeight: 900 }}><span>●</span>{online ? 'Connected' : 'Offline'}</div>
        </header>

        <div style={{ paddingTop: 54 }}>
          <div style={{ color: mint, fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>YOUR AI EXECUTIVE TEAM, IN YOUR POCKET</div>
          <h1 style={{ fontSize: 'clamp(48px,12vw,76px)', lineHeight: .94, letterSpacing: -3, margin: '12px 0 18px' }}>Run the company from one room.</h1>
          <p style={{ color: '#B8C4D5', fontSize: 19, lineHeight: 1.65, margin: 0 }}>Aridon brings executive AI, company context, projects, tasks, analysis and owner-controlled decisions into one private business workspace.</p>
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
          <Link href="/customer/login?next=%2Fcustomer%2Fstart%3Fnative%3D1&native=1" onClick={() => navigator.vibrate?.(18)} style={{ background: mint, color: '#07130F', textDecoration: 'none', textAlign: 'center', padding: '16px 18px', borderRadius: 14, fontWeight: 950, fontSize: 17 }}>Sign In to My Company</Link>
          <Link href="/mobile-app/analyze" onClick={() => navigator.vibrate?.(18)} style={{ border: '1px solid #48617F', color: '#F8FAFC', textDecoration: 'none', textAlign: 'center', padding: '15px 18px', borderRadius: 14, fontWeight: 900 }}>Analyze a Business Free</Link>
          <Link href="/mobile-app/demo" style={{ color: '#B9CFFF', textAlign: 'center', padding: 10, fontWeight: 900, textDecoration: 'none' }}>Open the Review Demo →</Link>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 28 }}>
          <Feature title="Executive Room" text="Talk with the executive best suited to the decision in front of you." />
          <Feature title="Company Brain" text="Keep reusable company context tied to the private workspace." />
          <Feature title="Projects & Tasks" text="Turn decisions into work instead of another forgotten chat." />
          <Feature title="Owner Control" text="Consequential actions stay under human approval." />
        </section>

        <section style={{ ...card, marginTop: 12 }}>
          <div style={{ color: mint, fontSize: 11, fontWeight: 950 }}>MOBILE-FIRST</div>
          <h2 style={{ margin: '8px 0 8px', fontSize: 27 }}>Built for the five-minute window.</h2>
          <p style={{ color: '#B7C3D5', lineHeight: 1.6, marginBottom: 14 }}>Review a decision, ask an executive, scan a business, or check company work without opening a laptop.</p>
          <button type="button" onClick={shareAridon} style={{ width: '100%', border: '1px solid #3D536F', background: '#0A1322', color: '#E8EEF7', padding: 13, borderRadius: 12, fontWeight: 900, cursor: 'pointer' }}>{shared ? 'Aridon link ready ✓' : 'Share Aridon'}</button>
        </section>

        <footer style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap', fontSize: 12 }}>
          <Link href="/business-os/privacy" style={{ color: '#9CAAC0' }}>Privacy</Link>
          <Link href="/business-os/terms" style={{ color: '#9CAAC0' }}>Terms</Link>
          <a href="mailto:support@aridon.ai" style={{ color: '#9CAAC0' }}>Support</a>
        </footer>
      </section>
      <style>{`@media(max-width:420px){section[style*="repeat(2"]{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return <article style={card}><strong style={{ display: 'block', fontSize: 16 }}>{title}</strong><p style={{ color: '#AAB8CB', lineHeight: 1.5, marginBottom: 0, fontSize: 13 }}>{text}</p></article>;
}
