'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const radarTabs = [
  { href: '/customer/aridon-one', label: 'Aridon 1', sublabel: 'Business Need' },
  { href: '/customer/aridon-two', label: 'Aridon 2', sublabel: 'Real Estate' },
  { href: '/customer/aridon-three', label: 'Aridon 3', sublabel: 'Buy a Business' },
] as const;

function shouldShow(pathname: string) {
  if (pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/customer/login')) return false;
  if (pathname.startsWith('/customer/reset')) return false;
  if (pathname.startsWith('/customer/claim')) return false;

  return (
    pathname === '/' ||
    pathname === '/dashboard' ||
    pathname.startsWith('/workspace') ||
    pathname.startsWith('/customer') ||
    pathname.startsWith('/business-os') ||
    pathname.startsWith('/impact-os') ||
    pathname.startsWith('/intelligence') ||
    pathname.startsWith('/opportunity-intelligence') ||
    pathname.startsWith('/execution') ||
    pathname.startsWith('/sales-team') ||
    pathname.startsWith('/email') ||
    pathname.startsWith('/eva-chat') ||
    pathname.startsWith('/eva-core') ||
    pathname.startsWith('/mission-control')
  );
}

export default function AridonRadarTabs() {
  const pathname = usePathname();
  if (!shouldShow(pathname)) return null;

  return (
    <nav className="aridon-global-radar-tabs" aria-label="Aridon One, Two and Three">
      {radarTabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
            <strong>{tab.label}</strong>
            <span>{tab.sublabel}</span>
          </Link>
        );
      })}
      <style jsx global>{`
        .aridon-global-radar-tabs {
          position: fixed;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%);
          z-index: 2147483000;
          display: grid;
          grid-template-columns: repeat(3,minmax(108px,1fr));
          width: min(650px, calc(100vw - 20px));
          padding: 6px;
          gap: 6px;
          border: 1px solid #35516a;
          border-radius: 18px;
          background: rgba(7,17,29,.97);
          box-shadow: 0 14px 38px rgba(0,0,0,.44);
          backdrop-filter: blur(14px);
        }
        .aridon-global-radar-tabs a {
          display: grid;
          gap: 3px;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid transparent;
          border-radius: 12px;
          color: #e5edf6;
          text-decoration: none;
          text-align: center;
          font-family: Arial, sans-serif;
          background: rgba(255,255,255,.025);
        }
        .aridon-global-radar-tabs a:hover {
          border-color: #54718b;
          background: #102033;
        }
        .aridon-global-radar-tabs a strong {
          font-size: 13px;
          font-weight: 950;
        }
        .aridon-global-radar-tabs a span {
          color: #91a6ba;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .aridon-global-radar-tabs a.active {
          border-color: #84f4d1;
          background: #10283a;
          color: #84f4d1;
          box-shadow: inset 0 0 0 1px rgba(132,244,209,.08);
        }
        .aridon-global-radar-tabs a.active span { color: #b9f8e5; }
        @media (max-width: 520px) {
          .aridon-global-radar-tabs {
            bottom: 7px;
            width: calc(100vw - 10px);
            padding: 4px;
            gap: 3px;
            border-radius: 15px;
          }
          .aridon-global-radar-tabs a { padding: 9px 5px; border-radius: 10px; }
          .aridon-global-radar-tabs a strong { font-size: 12px; }
          .aridon-global-radar-tabs a span { font-size: 9px; }
        }
      `}</style>
    </nav>
  );
}
