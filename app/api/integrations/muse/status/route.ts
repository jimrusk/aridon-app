import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    museSpark: {
      configured: Boolean(process.env.MODEL_API_KEY),
      model: process.env.MUSE_MODEL || 'muse-spark-1.3',
      provider: 'Meta Model API',
    },
    booneConnector: {
      configured: false,
      state: 'awaiting-meta-ai-connectors-access',
      note: 'Personal Boone access requires Meta AI Connectors developer-preview onboarding/account linking. Muse Spark API access does not itself expose Boone personal memory.',
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
