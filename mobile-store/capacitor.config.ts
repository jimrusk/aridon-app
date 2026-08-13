import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aridon.businessai',
  appName: 'Aridon Business AI',
  webDir: 'www',
  backgroundColor: '#07101D',
  server: {
    url: 'https://aridon-v02.vercel.app/mobile-app',
    cleartext: false,
    allowNavigation: ['aridon-v02.vercel.app'],
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#07101D',
  },
  android: {
    backgroundColor: '#07101D',
    allowMixedContent: false,
  },
};

export default config;
