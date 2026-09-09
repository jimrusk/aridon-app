import 'server-only';

import { chromium } from 'playwright-core';

const API = 'https://api.browserbase.com/v1';

function credentials() {
  const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
  const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim();
  if (!apiKey || !projectId) throw new Error('Browserbase is not configured. Add BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID in Vercel.');
  return { apiKey, projectId };
}

export function browserIdentityConfigured() {
  return Boolean(process.env.BROWSERBASE_API_KEY?.trim() && process.env.BROWSERBASE_PROJECT_ID?.trim());
}

export function safeBrowserUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    const host = url.hostname.toLowerCase();
    if (
      host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1' ||
      host === '169.254.169.254' || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) return '';
    return url.toString();
  } catch {
    return '';
  }
}

async function bb(path: string, init: RequestInit = {}) {
  const { apiKey } = credentials();
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'X-BB-API-Key': apiKey,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : `Browserbase returned ${response.status}.`;
    throw new Error(message);
  }
  return data;
}

export async function createBrowserContext() {
  const { projectId } = credentials();
  const data = await bb('/contexts', { method: 'POST', body: JSON.stringify({ projectId }) });
  if (!data?.id) throw new Error('Browserbase did not return a Context ID.');
  return { contextId: String(data.id) };
}

export async function deleteBrowserContext(contextId: string) {
  if (!contextId) return;
  await bb(`/contexts/${encodeURIComponent(contextId)}`, { method: 'DELETE' });
}

export async function startIdentityLoginSession(input: {
  contextId: string;
  loginUrl?: string;
  tenantId: string;
  identityId: string;
}) {
  const { projectId } = credentials();
  const session = await bb('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      projectId,
      keepAlive: true,
      browserSettings: {
        timeout: 1800,
        context: { id: input.contextId, persist: true },
      },
      userMetadata: {
        aridonPurpose: 'identity-login',
        tenantId: input.tenantId,
        identityId: input.identityId,
      },
    }),
  });
  if (!session?.id || !session?.connectUrl) throw new Error('Browserbase did not create a usable login session.');

  const loginUrl = safeBrowserUrl(input.loginUrl);
  if (loginUrl) {
    let browser;
    try {
      browser = await chromium.connectOverCDP(String(session.connectUrl), { timeout: 12000 });
      const context = browser.contexts()[0] || await browser.newContext();
      const page = context.pages()[0] || await context.newPage();
      await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => undefined);
    } finally {
      if (browser) await browser.close().catch(() => undefined);
    }
  }

  const live = await bb(`/sessions/${encodeURIComponent(String(session.id))}/debug`, { method: 'GET' });
  const liveViewUrl = String(live?.debuggerFullscreenUrl || live?.debuggerUrl || '');
  if (!liveViewUrl) throw new Error('Browserbase did not return a Live View URL.');

  return {
    sessionId: String(session.id),
    connectUrl: String(session.connectUrl),
    liveViewUrl,
    loginUrl,
  };
}

export async function releaseBrowserSession(sessionId: string) {
  if (!sessionId) return;
  const { projectId } = credentials();
  await bb(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'POST',
    body: JSON.stringify({ status: 'REQUEST_RELEASE', projectId }),
  });
}

export async function getBrowserSession(sessionId: string) {
  if (!sessionId) return null;
  return bb(`/sessions/${encodeURIComponent(sessionId)}`, { method: 'GET' });
}
