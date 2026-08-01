import { NextResponse } from 'next/server';
import { didAuthCandidates } from '../../../../lib/did-auth';

const DID = 'https://api.d-id.com';

async function listStreams(k: string): Promise<{ auth: string; status: number; raw: any } | null> {
  for (const auth of didAuthCandidates(k)) {
    const res = await fetch(`${DID}/talks/streams`, {
      method: 'GET',
      headers: { Authorization: auth },
    });
    const raw = await res.json().catch(() => ({}));
    if (res.ok) return { auth, status: res.status, raw };
    if (res.status !== 401 && res.status !== 403) {
      // Non-auth error (404, 500…) — no point retrying other formats
      return { auth, status: res.status, raw };
    }
  }
  return null; // all formats rejected
}

// GET /api/did/cleanup — inspect what D-ID returns for stream list (debug)
export async function GET() {
  const k = process.env.DID_API_KEY || '';
  if (!k) return NextResponse.json({ error: 'DID_API_KEY not set' }, { status: 500 });

  const result = await listStreams(k);
  if (!result) return NextResponse.json({ error: 'all auth formats rejected for GET /talks/streams' }, { status: 403 });
  return NextResponse.json({ listStatus: result.status, raw: result.raw });
}

// DELETE /api/did/cleanup — delete all active D-ID streams
export async function DELETE() {
  const k = process.env.DID_API_KEY || '';
  if (!k) return NextResponse.json({ error: 'DID_API_KEY not set' }, { status: 500 });

  const deleted: string[] = [];
  const errors: string[] = [];
  let listRaw: any = null;

  try {
    const result = await listStreams(k);

    if (!result) {
      return NextResponse.json({ error: 'all auth formats rejected for list', deleted: 0 }, { status: 403 });
    }

    listRaw = result.raw;
    const auth = result.auth;

    // D-ID may return an array, or { streams: [...] }, or something else
    const streams: any[] = Array.isArray(result.raw)
      ? result.raw
      : (result.raw?.streams ?? result.raw?.talks ?? []);

    for (const s of streams) {
      const sid = s.id ?? s.stream_id ?? s.talk_id;
      if (!sid) continue;
      try {
        const delRes = await fetch(`${DID}/talks/streams/${sid}`, {
          method: 'DELETE',
          headers: { Authorization: auth },
        });
        if (delRes.ok || delRes.status === 404) {
          deleted.push(sid);
        } else {
          errors.push(`${sid}: HTTP ${delRes.status}`);
        }
      } catch (e: any) {
        errors.push(`${sid}: ${e.message}`);
      }
    }

    return NextResponse.json({
      deleted: deleted.length,
      ids: deleted,
      errors,
      listRaw,   // include raw list so we can see what D-ID actually returned
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, listRaw }, { status: 500 });
  }
}
