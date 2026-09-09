import 'server-only';

import { chromium, type Page } from 'playwright-core';

const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const BROWSERBASE_SESSIONS_URL = 'https://api.browserbase.com/v1/sessions';

export type BrowserExplorationResult = {
  configured: boolean;
  ran: boolean;
  sessionId?: string;
  visited: Array<{ url: string; title: string }>;
  findings: string[];
  blockedActions: string[];
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

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
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
  return /(submit|send|buy|purchase|checkout|place order|delete|remove|publish|post\b|apply\b|sign\b|accept|agree|confirm|save\b|pay\b|transfer|book\b|reserve|schedule|invite|upload|unsubscribe|cancel subscription)/i.test(label);
}

function isSafeButton(element: BrowserElement) {
  if (element.tag === 'a' || element.role === 'link') return true;
  const label = highImpactLabel(element);
  return /(search|find|filter|next|previous|more|menu|details|view|show|expand|collapse|open|close|learn|about|results|page|tab)/i.test(label);
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

  const instructions = `You are Eva's read-safe cloud-browser navigator. Your job is to gather information and navigate public web interfaces without causing consequential external side effects.\n\nYou MAY: follow ordinary links, open menus/details, use search or filter controls, scroll, and inspect dynamic content.\nYou MUST NOT: submit contact/application/payment forms, send messages, buy anything, publish/post, upload, delete/remove, sign/accept agreements, book/reserve/schedule, change account/security settings, or perform any action that creates a commitment. Never enter passwords, payment data, secret tokens, or private credentials.\n\nReturn ONLY JSON: {"action":"click|fill|goto|scroll|done","index":0,"text":"...","url":"https://...","direction":"up|down","reason":"...","findings":["..."]}.\nUse the supplied element index for click/fill. Fill only obvious search/filter inputs. If the page already contains enough evidence, choose done. Do not invent facts.`;

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

export async function runBrowserExploration(input: {
  objective: string;
  candidateUrls?: string[];
  maxSteps?: number;
}): Promise<BrowserExplorationResult> {
  const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
  const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim();
  if (!apiKey || !projectId) {
    return { configured: false, ran: false, visited: [], findings: [], blockedActions: [] };
  }

  const explicit = extractObjectiveUrl(input.objective);
  const candidates = [explicit, ...(input.candidateUrls || [])]
    .filter((value): value is string => Boolean(value))
    .map((value) => safeHttpUrl(value))
    .filter((value): value is string => Boolean(value));
  const startUrl = candidates[0];
  if (!startUrl) {
    return { configured: true, ran: false, visited: [], findings: [], blockedActions: [], error: 'No safe public URL was available for browser exploration.' };
  }

  const sessionResponse = await fetch(BROWSERBASE_SESSIONS_URL, {
    method: 'POST',
    headers: { 'X-BB-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
    cache: 'no-store',
  });
  const session = await sessionResponse.json() as { id?: string; connectUrl?: string; message?: string };
  if (!sessionResponse.ok || !session.connectUrl) {
    throw new Error(session.message || `Browserbase session creation returned ${sessionResponse.status}.`);
  }

  const visited: Array<{ url: string; title: string }> = [];
  const findings: string[] = [];
  const blockedActions: string[] = [];
  let browser;
  try {
    browser = await chromium.connectOverCDP(session.connectUrl, { timeout: 12000 });
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(12000);
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });

    const maxSteps = Math.max(1, Math.min(3, input.maxSteps || 2));
    for (let step = 1; step <= maxSteps; step += 1) {
      const state = await snapshot(page);
      if (!visited.some((item) => item.url === state.url)) visited.push({ url: state.url, title: state.title });
      const decision = await browserDecision(input.objective, state, step);
      if (Array.isArray(decision.findings)) findings.push(...decision.findings.map((item) => text(item, 1200)).filter(Boolean));
      const action = decision.action || 'done';
      if (action === 'done') break;

      if (action === 'scroll') {
        await page.mouse.wheel(0, decision.direction === 'up' ? -700 : 700);
        await page.waitForTimeout(500);
        continue;
      }

      if (action === 'goto') {
        const target = safeHttpUrl(text(decision.url, 2000));
        if (!target) {
          blockedActions.push(`Blocked unsafe navigation request: ${text(decision.url, 300) || 'missing URL'}`);
          break;
        }
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 12000 });
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
        await page.waitForTimeout(700);
        continue;
      }
    }

    const finalState = await snapshot(page);
    if (!visited.some((item) => item.url === finalState.url)) visited.push({ url: finalState.url, title: finalState.title });
    if (!findings.length && finalState.body) {
      findings.push(`Browser reached ${finalState.title || finalState.url} and inspected the live page. The worker can use this page state in its next cycle.`);
    }
    return { configured: true, ran: true, sessionId: session.id, visited: visited.slice(0, 10), findings: findings.slice(0, 20), blockedActions: blockedActions.slice(0, 10) };
  } catch (error) {
    return {
      configured: true,
      ran: Boolean(visited.length),
      sessionId: session.id,
      visited,
      findings,
      blockedActions,
      error: error instanceof Error ? error.message : 'Cloud browser exploration failed.',
    };
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}
