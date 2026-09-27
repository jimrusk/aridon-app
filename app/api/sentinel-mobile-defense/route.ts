import { NextRequest, NextResponse } from 'next/server';
import { analyzeMobileDefense } from '@/lib/sentinel-mobile-defense';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control':'no-store, max-age=0' };

export async function POST(req:NextRequest) {
  try {
    const body = await req.json();
    if (!body?.ownerApproved) return NextResponse.json({error:'Explicit device-owner approval is required.'},{status:403,headers});
    if (!body?.deviceId || !Array.isArray(body?.signals)) return NextResponse.json({error:'deviceId and signals[] are required.'},{status:400,headers});
    const assessment = analyzeMobileDefense(body);
    return NextResponse.json({assessment, protocolVersion:'sentinel-mobile-defense/0.1', generatedAt:new Date().toISOString()},{headers});
  } catch {
    return NextResponse.json({error:'Invalid Sentinel Mobile Defense request.'},{status:400,headers});
  }
}
