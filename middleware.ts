import { NextRequest, NextResponse } from 'next/server';

const SECURITY_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
};

function withSecurityHeaders(response: NextResponse, pathname: string) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  if (pathname.startsWith('/customer/') || pathname.startsWith('/workspace/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return response;
}

export function middleware(request: NextRequest) {
  // Customer/workspace APIs enforce their own Supabase/Stripe auth. Private workspace
  // shells are deliberately excluded from search indexing while the public Ag funnel
  // stays focused on the Operation Snapshot and founding-ranch offer.
  return withSecurityHeaders(NextResponse.next(), request.nextUrl.pathname);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
