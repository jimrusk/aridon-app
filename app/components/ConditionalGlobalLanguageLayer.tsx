'use client';

import { usePathname } from 'next/navigation';
import GlobalLanguageLayer from './GlobalLanguageLayer';

export default function ConditionalGlobalLanguageLayer() {
  const pathname = usePathname();
  if (pathname.startsWith('/ag') || pathname.startsWith('/ai-visibility')) return null;
  return <GlobalLanguageLayer />;
}
