import { NextResponse } from 'next/server';

const DID = 'https://api.d-id.com';

// GET /api/did/debug — test D-ID connectivity, show all auth format results
// Tests BOTH stream creation AND (if a stream is created) the talk endpoint,
// so we can see which format works for each independently.
export async function GET() {
  const rawKey = process.env.DID_API_KEY || '';

  const results: Record<string, any> = {
    keyPresent: !!rawKey,
    keyLength: rawKey.length,
    keyPreview: rawKey ? rawKey.slice(0, 6) + '...' + rawKey.slice(-4) : '(not set)',
  };

  if (!rawKey) {
    return NextResponse.json({ error: 'DID_API_KEY is not set in environment variables', ...results });
  }

  const formats = [
    { label: 'format_A_direct',       auth: `Basic ${rawKey}` },
    { label: 'format_B_base64_colon', auth: `Basic ${Buffer.from(rawKey + ':').toString('base64')}` },
    { label: 'format_C_base64_plain', auth: `Basic ${Buffer.from(rawKey).toString('base64')}` },
  ];

  const createUrl  = `${DID}/talks/streams`;
  const createBody = JSON.stringify({ source_url: 'https://d-id-public-bucket.s3.amazonaws.com/alice.jpg' });

  // ── Test 1: stream creation with each format ──────────────────────────────
  const streamResults: Record<string, any> = {};
  let workingCreateFormat: string | null = null;
  let workingStreamId: string | null = null;
  let workingAuth: string | null = null;

  for (const { label, auth } of formats) {
    try {
      const res = await fetch(createUrl, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: createBody,
      });
      const text = await res.text();
      let body: any;
      try { body = JSON.parse(text); } catch { body = text; }
      streamResults[label] = { status: res.status, ok: res.ok, body };

      if (res.ok && !workingCreateFormat) {
        workingCreateFormat = label;
        workingStreamId = body?.id ?? null;
        workingAuth = auth;
      }
    } catch (e: any) {
      streamResults[label] = { error: e.message };
    }
  }

  results.streamCreate = { workingFormat: workingCreateFormat, details: streamResults };

  // ── Test 2: talk endpoint (using the first successfully created stream) ───
  if (workingStreamId) {
    const talkUrl  = `${DID}/talks/streams/${workingStreamId}/talk`;
    const talkBody = JSON.stringify({
      script: { type: 'text', input: 'Hello', provider: { type: 'microsoft', voice_id: 'en-US-AriaNeural' } },
      session_id: workingStreamId, // approximate — real session_id comes from SDP exchange; this tests auth only
    });

    const talkResults: Record<string, any> = {};
    let workingTalkFormat: string | null = null;

    for (const { label, auth } of formats) {
      try {
        const res = await fetch(talkUrl, {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: talkBody,
        });
        const text = await res.text();
        let body: any;
        try { body = JSON.parse(text); } catch { body = text; }
        talkResults[label] = { status: res.status, ok: res.ok, body };

        if (res.ok && !workingTalkFormat) workingTalkFormat = label;
      } catch (e: any) {
        talkResults[label] = { error: e.message };
      }
    }

    results.talkEndpoint = { workingFormat: workingTalkFormat, details: talkResults };

    // Clean up the test stream
    if (workingAuth) {
      await fetch(`${DID}/talks/streams/${workingStreamId}`, {
        method: 'DELETE',
        headers: { Authorization: workingAuth },
      }).catch(() => {});
    }
  } else {
    results.talkEndpoint = { skipped: 'no stream was created (all stream-create formats failed)' };
  }

  return NextResponse.json(results);
}
