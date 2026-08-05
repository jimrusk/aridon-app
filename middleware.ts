import { NextRequest, NextResponse } from 'next/server';

const SECURITY_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

type LoginCredential = {
  username: string;
  password: string;
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
  const primaryUsername =
    process.env.ARIDON_APP_USERNAME || process.env.ARIDON_USERNAME;
  const primaryPassword =
    process.env.ARIDON_APP_PASSWORD || process.env.ARIDON_PASSWORD;

  // Optional secondary account. Both values must be present together.
  const secondaryUsername =
    process.env.ARIDON_APP_SECONDARY_USERNAME ||
    process.env.ARIDON_SECONDARY_USERNAME;
  const secondaryPassword =
    process.env.ARIDON_APP_SECONDARY_PASSWORD ||
    process.env.ARIDON_SECONDARY_PASSWORD;

  const missing: string[] = [];
  if (!primaryUsername) {
    missing.push('ARIDON_APP_USERNAME (or ARIDON_USERNAME)');
  }
  if (!primaryPassword) {
    missing.push('ARIDON_APP_PASSWORD (or ARIDON_PASSWORD)');
  }

  const secondaryIsPartiallyConfigured =
    Boolean(secondaryUsername) !== Boolean(secondaryPassword);
  if (secondaryIsPartiallyConfigured) {
    missing.push(
      'both ARIDON_APP_SECONDARY_USERNAME and ARIDON_APP_SECONDARY_PASSWORD',
    );
  }

  if (missing.length > 0) {
    if (process.env.NODE_ENV !== 'production' && !secondaryIsPartiallyConfigured) {
      return NextResponse.next();
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

  const credentials: LoginCredential[] = [
    {
      username: primaryUsername as string,
      password: primaryPassword as string,
    },
  ];

  if (secondaryUsername && secondaryPassword) {
    credentials.push({
      username: secondaryUsername,
      password: secondaryPassword,
    });
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

    const suppliedUsername = decoded.slice(0, separator);
    const suppliedPassword = decoded.slice(separator + 1);

    const isAuthorized = credentials.some(
      ({ username, password }) =>
        suppliedUsername === username && suppliedPassword === password,
    );

    if (!isAuthorized) {
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
