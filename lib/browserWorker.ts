import 'server-only';

import { chromium as playwrightChromium, type Browser, type BrowserContext, type Page } from 'playwright-core';

const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const BROWSERBASE_SESSIONS_URL = 'https://api.browserbase.com/v1/sessions';

export type BrowserExplorationResult = {
  configured: boolean;
  ran: boolean;
  engine?: 'aridon' | 'browserbase';
  sessionId?: string;
  identityId?: string;
  authenticatedContext?: boolean;
  visited: Array<{ url: string; title: string }>;
  findings: string[];
  blockedActions: string[];
  finalPage?: { url: string; title: string; excerpt: string };
  error?: string;
};

type BrowserElement = {
  index: number;
  tag: string;
  text: string;
  ariaLabel: string;
  placeholder: string;
  name: string;
  type: string;
  href: string;
  role: string;
  disabled: boolean;
  download: boolean;
};

type BrowserDecision = {
  action?: 'click' | 'fill' | 'goto' | 'scroll' | 'done';
  index?: number;
  text?: string;
  url?: string;
  direction?: 'up' | 'down';
  reason?: string;
  findings?: string[];
};

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function extractText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text as string)
    .join('\n\n')
    .trim();
}

function parseDecision(raw: string): BrowserDecision {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(cleaned) as BrowserDecision; } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try { return JSON.parse(cleaned.slice(first, last + 1)) as BrowserDecision; } catch { /* no-op */ }
    }
    return { action: 'done', reason: 'Browser planner returned a non-JSON result.', findings: [cleaned.slice(0, 1200)] };
  }
}

function isPrivateIpv4(host: string) {
  return (
    /^10\./.test(host) ||
    /^127\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)
  );
}

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.endsWith('.local') ||
      isPrivateIpv4(host) ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe80:')
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function highImpactLabel(element: BrowserElement) {
  return `${element.text} ${element.ariaLabel} ${element.name} ${element.type} ${element.href}`.toLowerCase();
}

function isHighImpactClick(element: BrowserElement) {
  if (element.download) return true;
  if (element.type === 'submit') return true;
  const label = highImpactLabel(element);
  return /(submit|send|buy|purchase|checkout|place order|delete|remove|publish|post\b|apply\b|sign\b|accept|agree|confirm|save\b|pay\b|transfer|book\b|reserve|schedule|invite|upload|unsubscribe|cancel subscription|create account|new token|api token|rotate|regenerate)/i.test(label);
}

function isSafeButton(element: BrowserElement) {
  if (element.tag === 'a' || element.role === 'link') return true;
  const label = highImpactLabel(element);
  return /(search|find|filter|next|previous|more|menu|details|view|show|expand|collapse|open|close|learn|about|results|page|tab|back)/i.test(label);
}

function isSafeFill(element: BrowserElement) {
  const label = highImpactLabel(element);
  return element.tag === 'input' && ['search', 'text', ''].includes(element.type || '') && /(search|query|filter|find)/i.test(label);
}

async function snapshot(page: Page) {
  const title = await page.title().catch(() => '');
  const url = page.url();
  const body = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  const locator = page.locator('a,button,input,textarea,select,[role="button"],[role="link"]');
  const count = Math.min(await locator.count(), 120);
  const elements: BrowserElement[] = [];
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    const data = await item.evaluate((node) => {
      const el = node as HTMLElement;
      const input = node as HTMLInputElement;
      const anchor = node as HTMLAnchorElement;
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || input.value || '').trim(),
        ariaLabel: el.getAttribute('aria-label') || '',
        placeholder: input.placeholder || '',
        name: input.name || '',
        type: input.type || '',
        href: anchor.href || '',
        role: el.getAttribute('role') || '',
        disabled: Boolean((node as HTMLButtonElement).disabled),
        download: Boolean(el.getAttribute('download')),
      };
    }).catch(() => null);
    if (data) elements.push({ index, ...data });
  }
  return { title, url, body: body.slice(0, 14000), elements };
}

async function browserDecision(objective: string, state: Awaited<ReturnType<typeof snapshot>>, step: number) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.');

  const instructions = `You are Eva's read-safe Aridon Browser navigator. Your job is to gather information and navigate public or already-authenticated web interfaces without causing consequential external side effects.\n\nYou MAY: follow ordinary links, open menus/details, use search or filter controls, scroll, and inspect dynamic content that the assigned browser session is already authorized to view.\nYou MUST NOT: submit contact/application/payment forms, send messages, buy anything, publish/post, upload, delete/remove, sign/accept agreements, book/reserve/schedule, create accounts, create/rotate API tokens, change account/security settings, or perform any action that creates a commitment. Never enter passwords, payment data, secret tokens, recovery codes, or private credentials. If login, CAPTCHA, MFA, or re-authentication is required, stop and report it.\n\nReturn ONLY JSON: {"action":"click|fill|goto|scroll|done","index":0,"text":"...","url":"https://...","direction":"up|down","reason":"...","findings":["..."]}.\nUse the supplied element index for click/fill. Fill only obvious search/filter inputs. If the page already contains enough evidence, choose done. Do not invent facts.`;

  const response = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ARIDON_WORKER_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
      instructions,
      input: `OBJECTIVE\n${objective}\n\nBROWSER STEP ${step}\nURL: ${state.url}\nTITLE: ${state.title}\n\nVISIBLE PAGE TEXT\n${state.body}\n\nINTERACTIVE ELEMENTS\n${JSON.stringify(state.elements, null, 2).slice(0, 18000)}`,
      max_output_tokens: 1200,
      store: false,
    }),
    cache: 'no-store',
  });
  const raw = (await response.json()) as ResponsesPayload;
  if (!response.ok) throw new Error(raw.error?.message || `Browser planner returned ${response.status}.`);
  const output = extractText(raw);
  if (!output) throw new Error('Browser planner returned no result.');
  return parseDecision(output);
}

function extractObjectiveUrl(objective: string) {
  const match = objective.match(/https?:\/\/[^\s<>()\[\]{}"']+/i);
  return match ? safeHttpUrl(match[0].replace(/[.,;!?]+$/, '')) : null;
}

function chooseStartUrl(input: { objective: string; candidateUrls?: string[]; browserIdentity?: { homeUrl?: string | null } | null }) {
  const explicit = extractObjectiveUrl(input.objective);
  const identityHome = input.browserIdentity?.homeUrl ? safeHttpUrl(input.browserIdentity.homeUrl) : null;
  return [explicit, ...(input.candidateUrls || []), identityHome]
    .filter((value): value is string => Boolean(value))
    .map((value) => safeHttpUrl(value))
    .find((value): value is string => Boolean(value)) || null;
}

async function hardenContext(context: BrowserContext) {
  context.setDefaultTimeout?.(8000);
  await context.route('**/*', async (route) => {
    const requestUrl = route.request().url();
    if (!/^https?:/i.test(requestUrl)) return route.continue();
    if (!safeHttpUrl(requestUrl)) return route.abort('blockedbyclient');
    return route.continue();
  });
}

async function exploreWithBrowser(args: {
  browser: Browser;
  engine: 'aridon' | 'browserbase';
  objective: string;
  startUrl: string;
  maxSteps: number;
  sessionId?: string;
  identityId?: string;
  authenticatedContext?: boolean;
}) : Promise<BrowserExplorationResult> {
  const visited: Array<{ url: string; title: string }> = [];
  const findings: string[] = [];
  const blockedActions: string[] = [];

  let context: BrowserContext | null = null;
  try {
    context = args.browser.contexts()[0] || await args.browser.newContext({
      acceptDownloads: false,
      viewport: { width: 1365, height: 900 },
      locale: 'en-US',
    });
    await hardenContext(context);
    const page = context.pages()[0] || await context.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(15000);
    page.on('dialog', (dialog) => void dialog.dismiss().catch(() => undefined));
    page.on('download', (download) => void download.cancel().catch(() => undefined));
    await page.goto(args.startUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    for (let step = 1; step <= args.maxSteps; step += 1) {
      const state = await snapshot(page);
      if (!visited.some((item) => item.url === state.url)) visited.push({ url: state.url, title: state.title });
      const decision = await browserDecision(args.objective, state, step);
      if (Array.isArray(decision.findings)) findings.push(...decision.findings.map((item) => text(item, 1200)).filter(Boolean));
      const action = decision.action || 'done';
      if (action === 'done') break;

      if (action === 'scroll') {
        await page.mouse.wheel(0, decision.direction === 'up' ? -750 : 750);
        await page.waitForTimeout(450);
        continue;
      }

      if (action === 'goto') {
        const target = safeHttpUrl(text(decision.url, 2000));
        if (!target) {
          blockedActions.push(`Blocked unsafe navigation request: ${text(decision.url, 300) || 'missing URL'}`);
          break;
        }
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
        continue;
      }

      const index = Number(decision.index);
      const element = Number.isInteger(index) ? state.elements.find((item) => item.index === index) : undefined;
      if (!element || element.disabled) {
        blockedActions.push(`Browser planner selected an unavailable element at step ${step}.`);
        break;
      }

      if (action === 'fill') {
        if (!isSafeFill(element)) {
          blockedActions.push(`Blocked form entry outside a search/filter field: ${highImpactLabel(element).slice(0, 220)}`);
          break;
        }
        const value = text(decision.text, 500);
        if (!value) break;
        await page.locator('a,button,input,textarea,select,[role="button"],[role="link"]').nth(element.index).fill(value);
        continue;
      }

      if (action === 'click') {
        if (isHighImpactClick(element) || !isSafeButton(element)) {
          blockedActions.push(`Owner control preserved before browser action: ${highImpactLabel(element).slice(0, 220)}`);
          break;
        }
        await page.locator('a,button,input,textarea,select,[role="button"],[role="link"]').nth(element.index).click({ timeout: 8000 });
        await page.waitForTimeout(650);
      }
    }

    const finalState = await snapshot(page);
    if (!visited.some((item) => item.url === finalState.url)) visited.push({ url: finalState.url, title: finalState.title });
    if (!findings.length && finalState.body) {
      findings.push(`Aridon Browser reached ${finalState.title || finalState.url} and inspected the live page.`);
    }
    const loginText = `${finalState.title} ${finalState.body.slice(0, 4000)}`.toLowerCase();
    if (/(captcha|verify you are human|two-factor|two factor|multi-factor|mfa|enter your password|sign in|log in)/i.test(loginText)) {
      findings.push('This site appears to require login, CAPTCHA, or MFA. Aridon Browser stopped without entering credentials.');
    }

    return {
      configured: true,
      ran: true,
      engine: args.engine,
      sessionId: args.sessionId,
      identityId: args.identityId,
      authenticatedContext: Boolean(args.authenticatedContext),
      visited: visited.slice(0, 10),
      findings: findings.slice(0, 20),
      blockedActions: blockedActions.slice(0, 10),
      finalPage: {
        url: finalState.url,
        title: finalState.title,
        excerpt: finalState.body.slice(0, 5000),
      },
    };
  } catch (error) {
    return {
      configured: true,
      ran: Boolean(visited.length),
      engine: args.engine,
      sessionId: args.sessionId,
      identityId: args.identityId,
      authenticatedContext: Boolean(args.authenticatedContext),
      visited,
      findings,
      blockedActions,
      error: error instanceof Error ? error.message : 'Aridon Browser exploration failed.',
    };
  }
}

async function launchAridonChromium() {
  const module = await import('@sparticuz/chromium');
  const serverChromium = module.default;
  serverChromium.setGraphicsMode = false;
  const executablePath = await serverChromium.executablePath();
  return playwrightChromium.launch({
    executablePath,
    args: serverChromium.args,
    headless: true,
  });
}

async function runAridonBrowser(input: {
  objective: string;
  startUrl: string;
  maxSteps: number;
  browserIdentity?: { id: string; contextId: string; homeUrl?: string | null } | null;
}) {
  let browser: Browser | undefined;
  try {
    browser = await launchAridonChromium();
    const result = await exploreWithBrowser({
      browser,
      engine: 'aridon',
      objective: input.objective,
      startUrl: input.startUrl,
      maxSteps: input.maxSteps,
      identityId: input.browserIdentity?.id,
      authenticatedContext: false,
    });
    if (input.browserIdentity) {
      result.blockedActions.unshift('Aridon Browser is running on Aridon-owned Chromium. Saved third-party browser contexts are not imported into the local engine.');
    }
    return result;
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}

async function runBrowserbaseFallback(input: {
  objective: string;
  startUrl: string;
  maxSteps: number;
  browserIdentity?: { id: string; contextId: string; homeUrl?: string | null } | null;
}): Promise<BrowserExplorationResult | null> {
  const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
  const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim();
  if (!apiKey || !projectId) return null;

  const browserSettings: Record<string, unknown> = { timeout: 180 };
  if (input.browserIdentity?.contextId) {
    browserSettings.context = { id: input.browserIdentity.contextId, persist: true };
  }
  const sessionResponse = await fetch(BROWSERBASE_SESSIONS_URL, {
    method: 'POST',
    headers: { 'X-BB-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      browserSettings,
      userMetadata: {
        aridonPurpose: 'cloud-worker-fallback',
        identityId: input.browserIdentity?.id || '',
      },
    }),
    cache: 'no-store',
  });
  const session = await sessionResponse.json() as { id?: string; connectUrl?: string; message?: string };
  if (!sessionResponse.ok || !session.connectUrl) {
    throw new Error(session.message || `Browserbase session creation returned ${sessionResponse.status}.`);
  }

  let browser: Browser | undefined;
  try {
    browser = await playwrightChromium.connectOverCDP(session.connectUrl, { timeout: 12000 });
    return await exploreWithBrowser({
      browser,
      engine: 'browserbase',
      objective: input.objective,
      startUrl: input.startUrl,
      maxSteps: input.maxSteps,
      sessionId: session.id,
      identityId: input.browserIdentity?.id,
      authenticatedContext: Boolean(input.browserIdentity?.contextId),
    });
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}

export async function runBrowserExploration(input: {
  objective: string;
  candidateUrls?: string[];
  maxSteps?: number;
  browserIdentity?: { id: string; contextId: string; homeUrl?: string | null } | null;
}): Promise<BrowserExplorationResult> {
  const startUrl = chooseStartUrl(input);
  if (!startUrl) {
    return {
      configured: true,
      ran: false,
      engine: 'aridon',
      identityId: input.browserIdentity?.id,
      authenticatedContext: false,
      visited: [],
      findings: [],
      blockedActions: [],
      error: 'No safe URL was available for browser exploration.',
    };
  }

  const maxSteps = Math.max(1, Math.min(5, input.maxSteps || 2));
  const enginePreference = process.env.ARIDON_BROWSER_ENGINE?.trim().toLowerCase() || 'local';

  if (enginePreference !== 'browserbase') {
    try {
      return await runAridonBrowser({
        objective: input.objective,
        startUrl,
        maxSteps,
        browserIdentity: input.browserIdentity,
      });
    } catch (error) {
      console.error('Aridon Browser local Chromium failed', error);
      const fallback = await runBrowserbaseFallback({
        objective: input.objective,
        startUrl,
        maxSteps,
        browserIdentity: input.browserIdentity,
      }).catch((fallbackError) => {
        console.error('Aridon Browser fallback failed', fallbackError);
        return null;
      });
      if (fallback) return fallback;
      return {
        configured: true,
        ran: false,
        engine: 'aridon',
        identityId: input.browserIdentity?.id,
        authenticatedContext: false,
        visited: [],
        findings: [],
        blockedActions: [],
        error: error instanceof Error ? error.message : 'Aridon-owned Chromium could not start.',
      };
    }
  }

  const browserbase = await runBrowserbaseFallback({
    objective: input.objective,
    startUrl,
    maxSteps,
    browserIdentity: input.browserIdentity,
  });
  if (browserbase) return browserbase;
  return runAridonBrowser({
    objective: input.objective,
    startUrl,
    maxSteps,
    browserIdentity: input.browserIdentity,
  });
}
