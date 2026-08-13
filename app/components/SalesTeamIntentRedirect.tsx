'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function SalesTeamIntentRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== '/customer/start') return;
    try {
      const raw = window.sessionStorage.getItem('aridon-sales-team-intent');
      if (!raw) return;
      const intent = JSON.parse(raw) as { website?: string; focus?: string };
      if (!intent.website) return;
      const params = new URLSearchParams({ website: intent.website });
      if (intent.focus) params.set('focus', intent.focus);
      router.replace(`/customer/sales/launch?${params.toString()}`);
    } catch {
      // If storage is unavailable or malformed, leave the normal startup guide untouched.
    }
  }, [pathname, router]);

  return null;
}
