import { NextResponse } from 'next/server';
import { clearGmailCookies } from '../../../../lib/gmail';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json(
    { disconnected: true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
  clearGmailCookies(response);
  return response;
}
