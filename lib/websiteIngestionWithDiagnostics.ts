import { ingestPublicWebsite, WebsiteIngestionResult } from './websiteIngestion';
import {
  WebsiteDiagnostics,
  addDiagnostic,
  pageLooksLikeRequestedBrand,
  samePublicSite,
} from './websiteDiagnostics';

const RETRY_ATTEMPTS = 3;
const REDIRECT_LIMIT = 3;
const PREFLIGHT_TIMEOUT_MS = 4_500;

export type DiagnosedWebsiteIngestionResult = WebsiteIngestionResult & {
  websiteDiagnostics: WebsiteDiagnostics;
};

export class WebsiteDiagnosticError extends Error {
  websiteDiagnostics: WebsiteDiagnostics;

  constructor(message: string, websiteDiagnostics: WebsiteDiagnostics) {
    super(message);
    this.name = 'WebsiteDiagnosticError';
    this.websiteDiagnostics = websiteDiagnostics;
  }
}

function normalizeWebsite(raw: string) {
  const value = raw.trim();
  if (!value) throw new Error('A website URL is required.');
  return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryable(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return [
    'fetch failed',
    'ebusy',
    'eai_again',
    'enotfound',
    'etimedout',
    'econnreset',
    'socket',
    'aborted',
    'timeout',
  ].some((term) => message.includes(term));
}

async function ingestWithRetry(url: string, diagnostics: WebsiteDiagnostics) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const result = await ingestPublicWebsite(url);
      if (attempt > 1) {
        addDiagnostic(diagnostics.diagnostics, {
          kind: 'transient-network-retry',
          severity: 'info',
          message: `The site responded after ${attempt} attempts; Aridon recovered from a transient DNS or network failure.`,
        });
      }
      return result;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Website ingestion will not follow redirects to another domain.')) throw error;
      if (!retryable(error) || attempt === RETRY_ATTEMPTS) throw error;
      await delay(120 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Website ingestion failed.');
}

async function readRedirectTarget(url: URL) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PREFLIGHT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'AridonBusinessOSBeta/0.4 (+canonical-domain-diagnostics)',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) return null;
    const location = response.headers.get('location');
    if (!location) return null;
    return new URL(location, url);
  } finally {
    clearTimeout(timer);
  }
}

function homepageIdentityText(result: WebsiteIngestionResult) {
  const page = result.pages[0];
  if (!page) return '';
  return `${page.title}\n${page.description}\n${page.headings.join(' ')}\n${page.text.slice(0, 6000)}`;
}

function finalize(
  result: WebsiteIngestionResult,
  requested: URL,
  diagnostics: WebsiteDiagnostics,
): DiagnosedWebsiteIngestionResult {
  diagnostics.canonicalUrl = result.canonicalUrl;

  if (!samePublicSite(requested, new URL(result.canonicalUrl))) {
    const identityMatches = pageLooksLikeRequestedBrand(requested, homepageIdentityText(result));
    if (!identityMatches) {
      diagnostics.safeToScore = false;
      addDiagnostic(diagnostics.diagnostics, {
        kind: 'identity-mismatch',
        severity: 'error',
        message: 'The destination page does not appear to represent the requested organization, so Aridon stopped before assigning a business score.',
        from: requested.toString(),
        to: result.canonicalUrl,
      });
    }
  }

  return {
    ...result,
    requestedUrl: requested.toString(),
    websiteDiagnostics: diagnostics,
  };
}

export async function ingestPublicWebsiteWithDiagnostics(rawWebsite: string): Promise<DiagnosedWebsiteIngestionResult> {
  const requested = normalizeWebsite(rawWebsite);
  const diagnostics: WebsiteDiagnostics = {
    requestedUrl: requested.toString(),
    redirectChain: [requested.toString()],
    diagnostics: [],
    safeToScore: true,
  };

  let current = new URL(requested.toString());

  for (let redirect = 0; redirect <= REDIRECT_LIMIT; redirect += 1) {
    try {
      const result = await ingestWithRetry(current.toString(), diagnostics);
      return finalize(result, requested, diagnostics);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('Website ingestion will not follow redirects to another domain.')) {
        const target = await readRedirectTarget(current).catch(() => null);
        if (!target || !['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
          throw new WebsiteDiagnosticError(
            'Aridon detected a cross-domain redirect but could not safely resolve its canonical destination.',
            diagnostics,
          );
        }

        addDiagnostic(diagnostics.diagnostics, {
          kind: 'canonical-domain-change',
          severity: 'warning',
          message: `The site redirects from ${current.hostname} to ${target.hostname}. Aridon will validate the destination as a public website before crawling it.`,
          from: current.toString(),
          to: target.toString(),
        });
        diagnostics.redirectChain.push(target.toString());
        current = target;
        continue;
      }

      if (current.protocol === 'https:' && retryable(error)) {
        const httpUrl = new URL(current.toString());
        httpUrl.protocol = 'http:';
        try {
          const fallback = await ingestWithRetry(httpUrl.toString(), diagnostics);
          addDiagnostic(diagnostics.diagnostics, {
            kind: 'https-downgrade',
            severity: 'warning',
            message: 'HTTPS did not respond reliably, but the site answered over plain HTTP. Aridon treats this as a domain/SSL configuration problem that should be fixed.',
            from: current.toString(),
            to: fallback.canonicalUrl,
          });
          diagnostics.redirectChain.push(fallback.canonicalUrl);
          return finalize(fallback, requested, diagnostics);
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          addDiagnostic(diagnostics.diagnostics, {
            kind: 'fetch-failure',
            severity: 'error',
            message: `HTTPS and HTTP checks both failed. Latest result: ${fallbackMessage}`,
          });
        }
      } else {
        addDiagnostic(diagnostics.diagnostics, {
          kind: 'fetch-failure',
          severity: 'error',
          message,
        });
      }

      diagnostics.safeToScore = false;
      throw new WebsiteDiagnosticError(
        'Aridon could not safely complete the website crawl. Review the domain diagnostics instead of assigning a business score.',
        diagnostics,
      );
    }
  }

  diagnostics.safeToScore = false;
  throw new WebsiteDiagnosticError(
    'The website changed domains too many times for Aridon to score safely.',
    diagnostics,
  );
}
