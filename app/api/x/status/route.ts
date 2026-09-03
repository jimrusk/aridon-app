import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { xConfiguration } from '../../../../lib/x';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const configuration = xConfiguration();
    const db = getServerClient();
    const { data } = await db
      .from('executive_integration_tokens')
      .select('account_label,metadata,updated_at')
      .eq('provider', 'x')
      .maybeSingle();
    return NextResponse.json({
      configured: configuration.configured,
      missing: configuration.missing,
      connected: Boolean(data),
      account: data?.account_label || null,
      metadata: data?.metadata || null,
      updatedAt: data?.updated_at || null,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('X status error', error);
    return NextResponse.json({ configured: false, connected: false, error: error instanceof Error ? error.message : 'Unable to read X connector status.' }, { headers: NO_STORE });
  }
}
