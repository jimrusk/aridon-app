'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getBrowserClient } from '../../lib/supabase';

export default function CustomerSessionControls() {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    try {
      const db = getBrowserClient();

      db.auth.getSession()
        .then(({ data }) => {
          if (mounted) setSignedIn(Boolean(data.session));
        })
        .catch((error) => {
          console.error('Customer session lookup failed', error);
          if (mounted) setSignedIn(false);
        });

      const { data: listener } = db.auth.onAuthStateChange((_event, session) => {
        if (mounted) setSignedIn(Boolean(session));
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    } catch (error) {
      // Public pages must never crash just because customer auth configuration is
      // unavailable or malformed. Keep Sign In visible and degrade gracefully.
      console.error('Customer session controls unavailable', error);
      if (mounted) setSignedIn(false);
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      await getBrowserClient().auth.signOut();
    } catch (error) {
      console.error('Customer sign out failed', error);
    } finally {
      setSignedIn(false);
      router.replace('/customer/login');
      router.refresh();
      setSigningOut(false);
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        background: '#08101D',
        borderBottom: '1px solid #24334E',
        color: '#F8FAFC',
        padding: '10px 16px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/business-os" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950, letterSpacing: '.2px' }}>
          PRIVATE BUSINESS OS
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {signedIn ? (
            <>
              <Link href="/customer/account" style={navLink}>Account</Link>
              <button type="button" onClick={signOut} disabled={signingOut} style={buttonStyle}>
                {signingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </>
          ) : (
            <Link
              href={`/customer/login${pathname && pathname !== '/customer/login' ? `?next=${encodeURIComponent(pathname)}` : ''}`}
              style={{ ...navLink, background: '#9EF0CF', color: '#08130F', borderColor: '#9EF0CF' }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const navLink = {
  border: '1px solid #415171',
  color: '#E4EAF5',
  borderRadius: '10px',
  padding: '9px 12px',
  fontWeight: 900,
  textDecoration: 'none',
  fontSize: '13px',
};

const buttonStyle = {
  border: '1px solid #415171',
  background: '#111827',
  color: '#E4EAF5',
  borderRadius: '10px',
  padding: '9px 12px',
  fontWeight: 900,
  fontSize: '13px',
  cursor: 'pointer',
};
