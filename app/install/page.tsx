import Link from 'next/link';
import InstallAridon from '../components/InstallAridon';

const mint = '#9EF0CF';

export default function InstallPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 20px 80px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950 }}>ARIDON</Link>
          <Link href="/business-os/subscribe" style={{ color: mint, textDecoration: 'none', fontWeight: 900 }}>See plans</Link>
        </nav>

        <div style={{ paddingTop: 64, maxWidth: 900 }}>
          <div style={{ color: mint, fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON COMPANY APP</div>
          <h1 style={{ fontSize: 'clamp(48px,8vw,82px)', lineHeight: .95, letterSpacing: -3, margin: '12px 0 20px' }}>Put your AI executive team on the company desktop.</h1>
          <p style={{ color: '#B8C4D5', fontSize: 20, lineHeight: 1.65, maxWidth: 820 }}>Aridon can install on supported computers, phones and tablets as a standalone company app. The same private workspace follows the company account rather than living on one machine.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginTop: 30 }}>
          <section style={{ background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 20, padding: 26 }}>
            <div style={{ color: mint, fontSize: 12, fontWeight: 950 }}>INSTALL ON THIS DEVICE</div>
            <h2 style={{ fontSize: 34, margin: '8px 0 12px' }}>Aridon Business AI</h2>
            <p style={{ color: '#B8C4D5', lineHeight: 1.65 }}>Install Aridon from the browser and launch it from the desktop, Start menu, applications list or home screen where the device supports web-app installation.</p>
            <InstallAridon />
          </section>

          <section style={{ background: '#F4F1E9', color: '#171717', borderRadius: 20, padding: 26 }}>
            <div style={{ fontSize: 12, fontWeight: 950 }}>FOR A COMPANY</div>
            <h2 style={{ fontSize: 34, margin: '8px 0 12px' }}>Plans start at $198/month</h2>
            <ol style={{ color: '#5D5A54', lineHeight: 1.9, paddingLeft: 22 }}>
              <li>Choose $198 Essentials or $497 Aridon Business.</li>
              <li>Activate the private company workspace.</li>
              <li>Use Aridon on the web or install it on supported company devices.</li>
            </ol>
            <Link href="/business-os/subscribe" style={{ display: 'inline-block', background: '#171717', color: '#fff', textDecoration: 'none', fontWeight: 950, padding: '14px 18px', borderRadius: 12 }}>Compare $198 & $497 Plans</Link>
          </section>
        </div>

        <section style={{ marginTop: 16, border: '1px solid #2A3A57', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontSize: 30, margin: '0 0 14px' }}>One company account. Multiple places to work.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
            <Feature title="Windows & Mac" text="Run Aridon in a dedicated app window from supported desktop browsers, with native desktop packages prepared for signed distribution." />
            <Feature title="Phones & tablets" text="Add Aridon to the home screen on supported mobile devices." />
            <Feature title="Browser access" text="Nothing to install is required. The web version remains available too." />
            <Feature title="Private workspace" text="Company data stays tied to the authenticated company workspace, not the device install." />
          </div>
        </section>
      </section>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return <article style={{ background: '#0D1728', borderRadius: 14, padding: 18 }}><strong>{title}</strong><p style={{ color: '#AEBBD0', lineHeight: 1.55, marginBottom: 0 }}>{text}</p></article>;
}
