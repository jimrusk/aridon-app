import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Safe readiness probe. Credentials are never returned to the browser.
// LiveAvatar sessions must be created by a separately authenticated operator endpoint.
export async function GET() {
  const configured = Boolean(process.env.LIVEAVATAR_API_KEY && process.env.LIVEAVATAR_AVATAR_ID);
  return NextResponse.json(
    {
      provider: 'heygen-liveavatar',
      configured,
      mode: 'lite',
      status: configured ? 'credentials-present-not-validated' : 'configuration-required',
      existingVoiceRoom: '/avatars',
      message: configured
        ? 'Credentials are present. Session integration and live testing are still required.'
        : 'Add LIVEAVATAR_API_KEY and LIVEAVATAR_AVATAR_ID in Vercel before live streaming can be enabled.',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
