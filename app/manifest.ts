import type { MetadataRoute } from 'next';

type AridonManifest = MetadataRoute.Manifest & {
  share_target: {
    action: string;
    method: 'GET';
    params: {
      title: string;
      text: string;
      url: string;
    };
  };
};

export default function manifest(): AridonManifest {
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
        name: 'Company Account',
        short_name: 'Account',
        url: '/customer/account',
      },
    ],
  };
}
