'use client';

import { useEffect, useState } from 'react';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [showIntelligence, setShowIntelligence] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('native') === '1') sessionStorage.setItem('aridon-native-store-app', '1');
    const native = sessionStorage.getItem('aridon-native-store-app') === '1';
    if (native) document.documentElement.dataset.aridonNative = '1';
    setShowIntelligence(!window.location.pathname.startsWith('/customer/login'));
  }, []);

  return <>
    {children}
    {showIntelligence && <a className="aridon-intelligence-launch" href="/customer/intelligence" aria-label="Open Aridon Intelligence Suite">◎ Intelligence</a>}
    <style>{`
      .aridon-intelligence-launch {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 90;
        border: 1px solid #3d665f;
        border-radius: 999px;
        padding: 9px 13px;
        background: rgba(7,17,29,.94);
        color: #84f4d1;
        text-decoration: none;
        font: 800 12px/1 Arial, sans-serif;
        box-shadow: 0 8px 24px rgba(0,0,0,.28);
        backdrop-filter: blur(8px);
      }
      html[data-aridon-native="1"] a[href^="/business-os"],
      html[data-aridon-native="1"] a[href^="/customer/upgrade"],
      html[data-aridon-native="1"] a[href="/customer/account"],
      html[data-aridon-native="1"] a[href*="stripe.com"],
      html[data-aridon-native="1"] a[href*="buy.stripe"],
      html[data-aridon-native="1"] form[action*="stripe"] { display:none !important; }
    `}</style>
  </>;
}
