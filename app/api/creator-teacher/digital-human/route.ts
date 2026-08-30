import { NextRequest, NextResponse } from 'next/server';
import { didCreatorPublicConfig } from '../../../../lib/didProvider';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  const creator = (request.nextUrl.searchParams.get('creator') || '').trim().toLowerCase().slice(0, 80);
  if (!creator) {
    return NextResponse.json({ error: 'Creator is required.' }, { status: 400, headers: NO_STORE });
  }

  const config = didCreatorPublicConfig(creator);
  return NextResponse.json(config, { headers: NO_STORE });
}
