/**
 * D-ID API key format: base64(email):api_secret
 *
 * Different D-ID endpoints validate auth differently. We try four formats
 * in order and use the first one that doesn't return 401/403.
 *
 * Format A — rawKey direct:          Basic amltcn…PcM3
 * Format B — base64(key:):           Basic base64("amltcn…PcM3:")
 * Format C — base64(key):            Basic base64("amltcn…PcM3")
 * Format D — standard Basic auth:    Basic base64("email@example.com:api_secret")
 *            (decodes the base64-encoded email prefix, reassembles proper credentials)
 *
 * Format D is the standard HTTP Basic auth expected by D-ID's streaming/talk endpoints.
 */
export function didAuthCandidates(rawKey: string): string[] {
  const candidates: string[] = [
    `Basic ${rawKey}`,                                          // A: direct
    `Basic ${Buffer.from(rawKey + ':').toString('base64')}`,   // B: base64(key:)
    `Basic ${Buffer.from(rawKey).toString('base64')}`,         // C: base64(key)
  ];

  // Format D: D-ID keys encode the email as base64 before the colon.
  // Decode that prefix to get the real email, then build standard Basic auth.
  const colonIdx = rawKey.indexOf(':');
  if (colonIdx > 0) {
    try {
      const emailB64 = rawKey.slice(0, colonIdx);
      const secret = rawKey.slice(colonIdx + 1);
      const email = Buffer.from(emailB64, 'base64').toString('utf8');
      if (email.includes('@')) {
        // Standard HTTP Basic: base64("email:secret")
        candidates.push(`Basic ${Buffer.from(`${email}:${secret}`).toString('base64')}`);
      }
    } catch {}
  }

  return candidates;
}

/**
 * Returns true only when the 401/403 response is an *auth format* rejection
 * (wrong key encoding) — meaning we should retry with the next format.
 *
 * Returns false for business-logic 403s like "Max user sessions reached",
 * so those errors surface immediately instead of being swallowed by the retry loop.
 *
 * D-ID shapes:
 *   Auth error  → { "message": "Invalid key=value pair…" }
 *   Plan error  → { "error": { "kind": "Forbidden", "description": "Max user sessions…" } }
 */
export function isAuthRejection(status: number, body: any): boolean {
  if (status === 401) return true;
  if (status !== 403) return false;
  // Business-logic 403: has error.kind (e.g. "Forbidden") → NOT an auth rejection
  if (body?.error?.kind) return false;
  // Auth 403: has a top-level "message" string → IS an auth rejection, retry
  if (typeof body?.message === 'string') return true;
  // Unknown 403 shape → don't retry, surface the error
  return false;
}
