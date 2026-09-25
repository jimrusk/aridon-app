import type { Metadata } from 'next';
import SentinelDemoClient from './SentinelDemoClient';

export const metadata: Metadata = {
  title: 'Sentinel — Live Demo | Aridon',
  description:
    'Try Sentinel: run real attack scenarios against its pre-execution authorization engine, play the human approver, and inspect the tamper-evident audit trail.',
};

export default function SentinelDemoPage() {
  return <SentinelDemoClient />;
}
