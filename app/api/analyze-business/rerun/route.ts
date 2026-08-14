import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const website = request.nextUrl.searchParams.get('website')?.trim().slice(0, 500) || '';
  if (!website) {
    return NextResponse.json(
      { error: 'Add a public website with ?website=https://example.com.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const proxy = new NextRequest(new URL('/api/analyze-business', request.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ website }),
  });

  return POST(proxy);
}
