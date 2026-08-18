import { NextRequest, NextResponse } from 'next/server';
import { runEnterpriseScan } from '../../../../lib/enterpriseEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body?.companyName || !body?.annualRevenue) {
      return NextResponse.json(
        { error: 'Company name and annual revenue are required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const scan = runEnterpriseScan(body);
    return NextResponse.json(scan, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('enterprise scan failed', error);
    return NextResponse.json(
      { error: 'Aridon Enterprise could not complete the scan.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
