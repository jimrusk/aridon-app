import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    id: '/ag/',
    name: 'Aridon Ag',
    short_name: 'Aridon Ag',
    description: 'AI farm operating system for sales, crops, payroll, inputs, equipment and water resilience.',
    start_url: '/ag/app',
    scope: '/ag/',
    display: 'standalone',
    background_color: '#F4F7F4',
    theme_color: '#0A533E',
    categories: ['business', 'productivity', 'agriculture'],
    icons: [
      { src: '/pwa/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ],
    shortcuts: [
      { name: 'Farm Dashboard', short_name: 'Dashboard', url: '/ag/app' },
      { name: 'Farm Profit Check', short_name: 'Profit Check', url: '/ag#profit-check' },
      { name: 'Install Aridon Ag', short_name: 'Install', url: '/ag/install' }
    ]
  }, {
    headers: { 'Content-Type': 'application/manifest+json' }
  });
}
