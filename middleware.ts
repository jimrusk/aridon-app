import { NextRequest, NextResponse } from 'next/server';

const SECURITY_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function unauthorized() {
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      ...SECURITY_HEADERS,
      'WWW-Authenticate': 'Basic realm="Aridon Command Center", charset="UTF-8"',
    },
  });
}

export function middleware(request: NextRequest) {
  // Primary names documented for Aridon. The shorter aliases support an
  // earlier Vercel naming convention without weakening authentication.
  const expectedUser =
    process.env.ARIDON_APP_USERNAME || process.env.ARIDON_USERNAME;
  const expectedPassword =
    process.env.ARIDON_APP_PASSWORD || process.env.ARIDON_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.next();
    }

    const missing: string[] = [];
    if (!expectedUser) {
      missing.push('ARIDON_APP_USERNAME (or ARIDON_USERNAME)');
    }
    if (!expectedPassword) {
      missing.push('ARIDON_APP_PASSWORD (or ARIDON_PASSWORD)');
    }

    const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown';

    return new NextResponse(
      `Aridon security is not configured. Missing: ${missing.join(', ')}. Deployment: ${commit}.`,
      {
        status: 503,
        headers: SECURITY_HEADERS,
      },
    );
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Basic ')) {
    return unauthorized();
  }

  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(':');

    if (separator < 0) {
      return unauthorized();
    }

    const suppliedUser = decoded.slice(0, separator);
    const suppliedPassword = decoded.slice(separator + 1);

    if (suppliedUser !== expectedUser || suppliedPassword !== expectedPassword) {
      return unauthorized();
    }
  } catch {
    return unauthorized();
  }

  const response = NextResponse.next();
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
