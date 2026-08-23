import { NextResponse } from 'next/server';
import { getRouterStatus } from '../../../../lib/modelRouter';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getRouterStatus(), { headers: { 'Cache-Control': 'no-store' } });
}
