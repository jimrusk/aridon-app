'use client';

import { useEffect, useState } from 'react';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('native') === '1') sessionStorage.setItem('aridon-native-store-app', '1');
    const native = sessionStorage.getItem('aridon-native-store-app') === '1';
    if (native) document.documentElement.dataset.aridonNative = '1';
    setPathname(window.location.pathname);
    setShowIntelligence(!window.location.pathname.startsWith('/customer/login'));
  }, []);

  const active = (path: string) => pathname === path;

  return <>
    {children}
    {showIntelligence && <nav className="aridon-radar-tabs" aria-label="Aridon intelligence radars">
      <a className={active('/customer/aridon-one') ? 'active' : ''} href="/customer/aridon-one"><strong>Aridon 1</strong><span>Business Need</span></a>
      <a className={active('/customer/aridon-two') ? 'active' : ''} href="/customer/aridon-two"><strong>Aridon 2</strong><span>Real Estate</span></a>
      <a className={active('/customer/aridon-three') ? 'active' : ''} href="/customer/aridon-three"><strong>Aridon 3</strong><span>Buy a Business</span></a>
    </nav>}
    <style>{`
      .aridon-radar-tabs {
        position: fixed;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        z-index: 90;
        display: grid;
        grid-template-columns: repeat(3,minmax(110px,1fr));
        width: min(620px, calc(100vw - 24px));
        padding: 6px;
        gap: 6px;
        border: 1px solid #31475f;
        border-radius: 18px;
        background: rgba(7,17,29,.96);
        box-shadow: 0 12px 34px rgba(0,0,0,.38);
        backdrop-filter: blur(12px);
      }
      .aridon-radar-tabs a {
        display: grid;
        gap: 3px;
        min-width: 0;
        padding: 10px 12px;
        border: 1px solid transparent;
        border-radius: 12px;
        color: #dce7f3;
        text-decoration: none;
        text-align: center;
        font-family: Arial, sans-serif;
      }
      .aridon-radar-tabs a strong {
        font-size: 13px;
        font-weight: 900;
      }
      .aridon-radar-tabs a span {
        color: #8fa3b8;
        font-size: 10px;
        font-weight: 750;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .aridon-radar-tabs a.active {
        border-color: #84f4d1;
        background: #10283a;
        color: #84f4d1;
      }
      .aridon-radar-tabs a.active span { color: #b9f8e5; }
      @media (max-width: 520px) {
        .aridon-radar-tabs { bottom: 8px; width: calc(100vw - 12px); gap: 3px; padding: 4px; }
        .aridon-radar-tabs a { padding: 9px 5px; }
        .aridon-radar-tabs a strong { font-size: 12px; }
        .aridon-radar-tabs a span { font-size: 9px; }
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
