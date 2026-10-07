import { NextRequest, NextResponse } from 'next/server';
import { constantTimeSecretMatch, evaMuseRoundtable } from '../../../../../lib/communicationsHub';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!constantTimeSecretMatch(request.headers.get('x-aridon-internal-secret'), process.env.ARIDON_INTERNAL_API_SECRET)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const objective = typeof body?.objective === 'string' ? body.objective.trim().slice(0, 8000) : '';
  if (!objective) return NextResponse.json({ error: 'objective is required' }, { status: 400 });
  const rounds = Number.isFinite(body?.rounds) ? Number(body.rounds) : 2;
  return NextResponse.json(await evaMuseRoundtable(objective, rounds));
}
