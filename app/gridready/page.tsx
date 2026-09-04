import type { Metadata } from 'next';
import GridReadyApp from './GridReadyApp';

export const metadata: Metadata = {
  title: 'Aridon GridReady | Data Center Power, Water & ERCOT Readiness',
  description:
    'Screen large-load data center projects for power, stability, water, cooling, compliance and community readiness before utility and ERCOT review.',
};

export default function GridReadyPage() {
  return <GridReadyApp />;
}
