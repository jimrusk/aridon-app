import type { Metadata } from 'next';
import WildfireResilienceApp from './WildfireResilienceApp';

export const metadata: Metadata = {
  title: 'Aridon Wildfire + Watershed Resilience Grid',
  description:
    'Prioritize wildfire mitigation, protect critical watersheds, coordinate treatment capacity, route biomass, and verify outcomes from one operating system.',
};

export default function WildfireResiliencePage() {
  return <WildfireResilienceApp />;
}
