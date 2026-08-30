import type { Metadata } from 'next';

const AI_VISIBILITY_CHECKOUT = 'https://buy.stripe.com/7sYaEW5jx5qXfwa3tw4AU0m';

export const metadata: Metadata = {
  title: 'Aridon AI Visibility | Can ChatGPT Find Your Business?',
  description: 'Run a free AI visibility scan for answer coverage, citation readiness, indexing health, competitor readiness, and owner-approved fixes.',
};

export default function AIVisibilityLayout({ children }: { children: React.ReactNode }) {
  return <>
    <div style={{ background:'#9EF0CF', color:'#07130F', padding:'10px 16px', fontFamily:'Arial,sans-serif', textAlign:'center', fontWeight:900, fontSize:13 }}>
      Keep watching after the free scan with Aridon AI Visibility Monitor · $149/month.{' '}
      <a href={AI_VISIBILITY_CHECKOUT} style={{ color:'#07130F', fontWeight:950 }}>Start monitoring →</a>
    </div>
    {children}
  </>;
}
