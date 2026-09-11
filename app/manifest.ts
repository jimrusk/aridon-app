import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const value = {
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
    share_target: {
      action: '/customer/assistant',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
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
        name: 'Ask Eva',
        short_name: 'Eva',
        url: '/customer/assistant',
      },
      {
        name: 'Eva Meeting Mode',
        short_name: 'Eva Meeting',
        url: '/eva-meeting',
      },
      {
        name: 'Company Account',
        short_name: 'Account',
        url: '/customer/account',
      },
    ],
  };

  // Next 14's MetadataRoute.Manifest type predates the standards-based share_target
  // manifest member. The runtime emits this object as JSON, so keep the supported
  // field while casting through unknown until the framework type catches up.
  return value as unknown as MetadataRoute.Manifest;
}
