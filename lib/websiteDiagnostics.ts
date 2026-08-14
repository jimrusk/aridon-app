export type WebsiteDiagnosticKind =
  | 'canonical-domain-change'
  | 'utility-redirect'
  | 'identity-mismatch'
  | 'https-downgrade'
  | 'transient-network-retry'
  | 'fetch-failure';

export type WebsiteDiagnostic = {
  kind: WebsiteDiagnosticKind;
  severity: 'info' | 'warning' | 'error';
  message: string;
  from?: string;
  to?: string;
};

export type WebsiteDiagnostics = {
  requestedUrl: string;
  canonicalUrl?: string;
  redirectChain: string[];
  diagnostics: WebsiteDiagnostic[];
  safeToScore: boolean;
};

export function normalizedHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, '');
}

export function samePublicSite(a: URL, b: URL) {
  return normalizedHost(a.hostname) === normalizedHost(b.hostname);
}

export function brandFingerprint(url: URL) {
  const label = normalizedHost(url.hostname).split('.')[0] || '';
  return label.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function pageLooksLikeRequestedBrand(requested: URL, pageText: string) {
  const fingerprint = brandFingerprint(requested);
  if (fingerprint.length < 5) return true;
  const collapsed = pageText.toLowerCase().replace(/[^a-z0-9]/g, '');
  return collapsed.includes(fingerprint);
}

export function addDiagnostic(
  list: WebsiteDiagnostic[],
  item: WebsiteDiagnostic,
) {
  if (!list.some((existing) => existing.kind === item.kind && existing.message === item.message)) {
    list.push(item);
  }
}
