import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Small Business Revenue Opportunity Calculator',
  description: 'Estimate what better lead follow-up, a modest close-rate improvement, and reclaimed admin time could be worth to your business. Planning estimate only; results are not guaranteed.',
  alternates: { canonical: '/business-os/revenue' },
  openGraph: {
    title: 'What Is One Better Follow-Up Worth?',
    description: 'Use your own lead volume, average sale, close rate, and time value to estimate the size of the opportunity.',
    url: '/business-os/revenue',
    type: 'website',
  },
};

export default function RevenueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
