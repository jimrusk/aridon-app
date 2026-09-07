import type { Metadata } from 'next';

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
  return children;
}
