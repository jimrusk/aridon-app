import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Aridon Business AI',
    short_name: 'Aridon',
    description: 'A private AI executive operating system for owner-led businesses.',
    start_url: '/customer/start',
    scope: '/',
    display: 'standalone',
    background_color: '#07101D',
    theme_color: '#07101D',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/pwa/icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Executive Main Room',
        short_name: 'Main Room',
        url: '/customer/start',
      },
      {
        name: 'Company Account',
        short_name: 'Account',
        url: '/customer/account',
      },
    ],
  };
}
