'use client';

import { useEffect } from 'react';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('native') === '1') sessionStorage.setItem('aridon-native-store-app', '1');
    const native = sessionStorage.getItem('aridon-native-store-app') === '1';
    if (native) document.documentElement.dataset.aridonNative = '1';
  }, []);

  return <>
    {children}
    <style>{`
      html[data-aridon-native="1"] a[href^="/business-os"],
      html[data-aridon-native="1"] a[href^="/customer/upgrade"],
      html[data-aridon-native="1"] a[href="/customer/account"],
      html[data-aridon-native="1"] a[href*="stripe.com"],
      html[data-aridon-native="1"] a[href*="buy.stripe"],
      html[data-aridon-native="1"] form[action*="stripe"] { display:none !important; }
    `}</style>
  </>;
}
