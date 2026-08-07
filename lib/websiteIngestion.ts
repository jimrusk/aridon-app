import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const MAX_PAGES = 3;
const MAX_BYTES_PER_PAGE = 450_000;
const REQUEST_TIMEOUT_MS = 4_500;
const MAX_TEXT_PER_PAGE = 7_500;

export type WebsitePageSnapshot = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  contacts: string[];
};

export type WebsiteIngestionResult = {
  requestedUrl: string;
  canonicalUrl: string;
  pages: WebsitePageSnapshot[];
  contacts: string[];
  navigation: string[];
  knowledge: string;
};

type LinkCandidate = { url: string; label: string; score: number };

function normalizeWebsite(raw: string) {
  const value = raw.trim();
  if (!value) throw new Error('A website URL is required.');
  return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
}

function normalizedHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, '');
}

function samePublicSite(a: URL, b: URL) {
  return normalizedHost(a.hostname) === normalizedHost(b.hostname);
}

function isPrivateIpv4(address: string) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIp(address: string) {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) {
    const value = address.toLowerCase();
    return value === '::1' || value === '::' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb');
  }
  return true;
}

async function assertPublicUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only public HTTP and HTTPS websites can be analyzed.');
  if (url.username || url.password) throw new Error('Website URLs cannot contain embedded credentials.');

  const hostname = url.hostname.toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new Error('Only public internet websites can be analyzed.');
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error('Private network addresses cannot be analyzed.');
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new Error('The website does not resolve to a public internet address.');
  }
}

async function readLimitedText(response: Response, controller: AbortController) {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_BYTES_PER_PAGE) throw new Error('The website page is too large for beta ingestion.');
  if (!response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BYTES_PER_PAGE) {
      controller.abort();
      throw new Error('The website page is too large for beta ingestion.');
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8').decode(combined);
}

async function fetchHtml(startUrl: URL, siteRoot: URL) {
  let current = new URL(startUrl.toString());

  for (let redirect = 0; redirect <= 3; redirect += 1) {
    await assertPublicUrl(current);
    if (!samePublicSite(current, siteRoot)) throw new Error('Website ingestion will not follow redirects to another domain.');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'AridonBusinessOSBeta/0.2 (+website-ingestion)',
          Accept: 'text/html,application/xhtml+xml',
        },
        cache: 'no-store',
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw new Error('The website returned an invalid redirect.');
        current = new URL(location, current);
        continue;
      }

      if (!response.ok) throw new Error(`Website returned HTTP ${response.status}.`);
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('text/html') && !contentType.toLowerCase().includes('application/xhtml+xml')) {
        throw new Error('The website did not return an HTML page.');
      }

      const html = await readLimitedText(response, controller);
      return { url: current, html };
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('The website redirected too many times.');
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)));
}

function plainText(value: string) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? decodeEntities(match[1].trim()) : '';
}

function metaDescription(html: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const name = attribute(tag, 'name').toLowerCase();
    const property = attribute(tag, 'property').toLowerCase();
    if (name === 'description' || property === 'og:description') {
      const content = attribute(tag, 'content');
      if (content) return content;
    }
  }
  return '';
}

function cleanVisibleText(html: string) {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|p|div|section|article|header|footer|main|li|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(stripped)
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 3)
    .join('\n')
    .slice(0, MAX_TEXT_PER_PAGE);
}

function extractContacts(html: string) {
  const contacts = new Set<string>();
  const mailto = html.match(/mailto:([^"'?#\s>]+)/gi) || [];
  const tel = html.match(/tel:([^"'?\s>]+)/gi) || [];
  for (const item of mailto) contacts.add(decodeURIComponent(item.slice(7)).trim());
  for (const item of tel) contacts.add(decodeURIComponent(item.slice(4)).trim());
  return [...contacts].filter(Boolean).slice(0, 20);
}

function extractHeadings(html: string) {
  const headings: string[] = [];
  const regex = /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) && headings.length < 35) {
    const value = plainText(match[2]);
    if (value && !headings.includes(value)) headings.push(value.slice(0, 220));
  }
  return headings;
}

function linkScore(url: URL, label: string) {
  const haystack = `${url.pathname} ${label}`.toLowerCase();
  const priorities: Array<[RegExp, number]> = [
    [/services?|solutions?|products?|what-we-do/, 100],
    [/about|team|company|leadership/, 90],
    [/portfolio|work|case-stud|results|testimonials?/, 85],
    [/contact|connect/, 70],
    [/pricing|plans/, 65],
    [/industr|markets?/, 60],
    [/blog|news|insights?/, 20],
  ];
  return priorities.reduce((best, [pattern, score]) => (pattern.test(haystack) ? Math.max(best, score) : best), 10);
}

function extractLinks(html: string, pageUrl: URL, siteRoot: URL) {
  const results = new Map<string, LinkCandidate>();
  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const href = attribute(match[1], 'href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    let url: URL;
    try {
      url = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (!['http:', 'https:'].includes(url.protocol) || !samePublicSite(url, siteRoot)) continue;
    url.hash = '';
    url.search = '';
    const key = url.toString().replace(/\/$/, '');
    const label = plainText(match[2]).slice(0, 140);
    const candidate = { url: url.toString(), label, score: linkScore(url, label) };
    const existing = results.get(key);
    if (!existing || candidate.score > existing.score) results.set(key, candidate);
  }

  return [...results.values()].sort((a, b) => b.score - a.score || a.url.localeCompare(b.url));
}

function snapshot(html: string, url: URL): WebsitePageSnapshot {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return {
    url: url.toString(),
    title: titleMatch ? plainText(titleMatch[1]).slice(0, 240) : '',
    description: metaDescription(html).slice(0, 500),
    headings: extractHeadings(html),
    text: cleanVisibleText(html),
    contacts: extractContacts(html),
  };
}

function buildKnowledge(result: Omit<WebsiteIngestionResult, 'knowledge'>) {
  const lines: string[] = [
    'PUBLIC WEBSITE INGESTION',
    `Requested URL: ${result.requestedUrl}`,
    `Canonical URL: ${result.canonicalUrl}`,
    `Pages scanned: ${result.pages.length}`,
  ];

  if (result.contacts.length) lines.push(`Public contact signals: ${result.contacts.join(' | ')}`);
  if (result.navigation.length) lines.push(`High-signal navigation: ${result.navigation.join(' | ')}`);

  result.pages.forEach((page, index) => {
    lines.push('', `PAGE ${index + 1}: ${page.url}`);
    if (page.title) lines.push(`Title: ${page.title}`);
    if (page.description) lines.push(`Description: ${page.description}`);
    if (page.headings.length) lines.push(`Key headings: ${page.headings.slice(0, 18).join(' | ')}`);
    if (page.text) lines.push('Public page text:', page.text);
  });

  lines.push('', 'Use this as public-source company context. Treat claims on the website as the company’s own statements unless independently verified.');
  return lines.join('\n').slice(0, 24_000);
}

export async function ingestPublicWebsite(rawWebsite: string): Promise<WebsiteIngestionResult> {
  const requested = normalizeWebsite(rawWebsite);
  await assertPublicUrl(requested);

  const home = await fetchHtml(requested, requested);
  const homeSnapshot = snapshot(home.html, home.url);
  const links = extractLinks(home.html, home.url, home.url)
    .filter((candidate) => candidate.url.replace(/\/$/, '') !== home.url.toString().replace(/\/$/, ''));

  const selected = links.slice(0, MAX_PAGES - 1);
  const extraPages = await Promise.all(
    selected.map(async (candidate) => {
      try {
        const page = await fetchHtml(new URL(candidate.url), home.url);
        return snapshot(page.html, page.url);
      } catch {
        return null;
      }
    }),
  );

  const pages = [homeSnapshot, ...extraPages.filter((page): page is WebsitePageSnapshot => Boolean(page))].slice(0, MAX_PAGES);
  const contacts = [...new Set(pages.flatMap((page) => page.contacts))].slice(0, 25);
  const navigation = links.slice(0, 12).map((candidate) => candidate.label || new URL(candidate.url).pathname).filter(Boolean);
  const partial = {
    requestedUrl: requested.toString(),
    canonicalUrl: home.url.toString(),
    pages,
    contacts,
    navigation,
  };

  return { ...partial, knowledge: buildKnowledge(partial) };
}
