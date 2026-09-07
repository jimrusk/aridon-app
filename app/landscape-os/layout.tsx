import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aridon Landscape OS | Run the whole landscaping business',
  description: 'A landscaping operating system for estimates, recurring routes, crews, irrigation, equipment, job costing, customer follow-up, upsells and owner-level business intelligence.',
  alternates: { canonical: '/landscape-os' },
  openGraph: {
    title: 'Aridon Landscape OS',
    description: 'Run estimates, routes, crews, jobs, equipment, irrigation, follow-up and profit from one operating system.',
    type: 'website',
  },
};

export default function LandscapeOSLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <section style={{ background: '#DDEBCF', borderTop: '1px solid #C5D9B5', padding: '42px 20px', fontFamily: 'Arial, sans-serif', color: '#17210F' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(280px,.65fr)', gap: 22, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#527A48', fontWeight: 950, fontSize: 12, letterSpacing: 1.4 }}>LANDSCAPE VISUAL BUILDER</div>
            <h2 style={{ fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1.02, margin: '9px 0 12px', letterSpacing: -1.3 }}>Upload the yard. Build the picture. Show the customer the vision.</h2>
            <p style={{ color: '#5B6255', lineHeight: 1.7, fontSize: 16, margin: 0 }}>Create a before-and-after customer concept board, select a design direction and budget, add an AI-generated or designer concept image, then carry the approved idea into the estimate and job scope.</p>
          </div>
          <div style={{ display: 'grid', gap: 9 }}>
            <Link href="/landscape-os/visual-builder" style={{ background: '#193018', color: '#F7FAF5', textDecoration: 'none', fontWeight: 950, borderRadius: 999, padding: '14px 18px', textAlign: 'center' }}>Open Picture Builder</Link>
            <Link href="/customer/login" style={{ color: '#385D34', textDecoration: 'none', border: '1px solid #A9C393', borderRadius: 999, padding: '12px 18px', textAlign: 'center', fontWeight: 850 }}>Open Private Visual Studio</Link>
          </div>
        </div>
      </section>
    </>
  );
}
