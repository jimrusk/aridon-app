import type { Metadata } from 'next';
import Link from 'next/link';
import { highTicketOffers } from '../../lib/highTicketCheckout';

export const metadata: Metadata = {
  title: 'Analyze Any Business | Aridon Executive OS',
  description: 'Run a public business website through Aridon for organization-aware scoring, authority signals, AI/search visibility, indexing readiness, conversion opportunities, and an executive-team readout.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://aridon-v02.vercel.app/analyze-business' },
  openGraph: {
    title: 'Analyze Any Business | Aridon',
    description: 'Paste a company website and get an organization-aware executive readout across clarity, conversion, authority, AI/search visibility, and indexing readiness.',
    url: 'https://aridon-v02.vercel.app/analyze-business',
    type: 'website',
  },
};

export default function AnalyzeBusinessLayout({ children }: { children: React.ReactNode }) {
  return <div className="prospect-analyzer">
    {children}
    <section style={{ background: '#F4F1E9', color: '#171717', padding: '54px 20px 68px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', background: '#fff', border: '1px solid #D4CEC2', borderRadius: 20, padding: 26 }}>
        <div style={{ fontSize: 12, fontWeight: 950 }}>AFTER THE FREE ANALYSIS</div>
        <h2 style={{ fontSize: 'clamp(34px,5vw,50px)', lineHeight: 1, margin: '9px 0 12px' }}>See a leak worth fixing? Turn the scan into a decision-ready next step.</h2>
        <p style={{ fontSize: 18, lineHeight: 1.65, color: '#5D5A54', maxWidth: 830 }}>The free scan surfaces the strongest digital opportunities. The optional $198 Starter Diagnostic goes deeper on conversion leaks, trust gaps, missed follow-up, AI opportunities, and the highest-priority actions. Larger implementation packages are separate and only make sense when the evidence supports them.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={highTicketOffers.healthScan.href} style={{ background: '#171717', color: '#fff', textDecoration: 'none', fontWeight: 950, padding: '13px 17px', borderRadius: 11 }}>Get the $198 Starter Diagnostic</a>
          <Link href="/growth" style={{ border: '1px solid #777067', color: '#171717', textDecoration: 'none', fontWeight: 900, padding: '12px 16px', borderRadius: 11 }}>See All Growth Packages</Link>
          <Link href="/business-os/proof" style={{ color: '#171717', textDecoration: 'underline', fontWeight: 900, padding: '12px 5px' }}>See Public Proof First</Link>
        </div>
        <p style={{ fontSize: 12, color: '#777067', marginBottom: 0 }}>No revenue guarantee. The diagnostic is optional. Consequential actions remain under owner approval.</p>
      </div>
    </section>
    <style>{`.prospect-analyzer main > section > nav > div > a:last-child { display:none !important; }`}</style>
  </div>;
}
