import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wendell Berry Legacy Classroom Concept | Aridon Ag',
  description: 'A private Aridon Ag concept for review by Mary Berry and The Berry Center.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function WendellBerryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
