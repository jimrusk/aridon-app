import { NextRequest, NextResponse } from 'next/server';
import { didAuthCandidates, isAuthRejection } from '../../../lib/did-auth';

const DID = 'https://api.d-id.com';

// POST /api/did — create a new D-ID streaming session
export async function POST(req: NextRequest) {
  const k = process.env.DID_API_KEY || '';
  try {
    const { source_url } = await req.json();
    const bodyStr = JSON.stringify({ source_url });
    for (const auth of didAuthCandidates(k)) {
      const res = await fetch(`${DID}/talks/streams`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: bodyStr,
      });
      const data = await res.json().catch(() => ({}));
      if (!isAuthRejection(res.status, data)) {
        // Not an auth format error — return success or the real error (e.g. max sessions)
        if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });
        return NextResponse.json(data);
      }
      // Auth rejection → try next format
    }
    return NextResponse.json({ error: 'all auth formats rejected for stream create' }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
