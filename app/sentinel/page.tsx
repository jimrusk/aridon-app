import type { Metadata } from 'next';
import SentinelDownloadClient from './SentinelDownloadClient';

export const metadata: Metadata = {
  title: 'Get Sentinel | Aridon',
  description:
    'Download Sentinel — one-tap protection for your Android phone and your Windows computer.',
};

export default function SentinelDownloadPage() {
  return <SentinelDownloadClient />;
}
