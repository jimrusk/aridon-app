import { NextRequest, NextResponse } from 'next/server';
import {
  decryptToken,
  GMAIL_REFRESH_COOKIE,
  refreshGmailAccessToken,
} from '../../../../../lib/gmail';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const BRIEF_QUERY = [
  'newer_than:365d',
  '{',
  'subject:"Aridon Morning Brief"',
  'subject:"Aridon Daily Briefing"',
  'subject:"AWG Funding Watch"',
  'subject:"Groundwater Opportunity Watch"',
  'subject:"Boardy Morning Brief"',
  'subject:"Funding Watch"',
  '}',
].join(' ');

type GmailHeader = { name?: string; value?: string };
type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

type GmailMessage = {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: GmailPart & { headers?: GmailHeader[] };
  error?: { message?: string };
};

function decodeBase64Url(value = ''): string {
  if (!value) return '';
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return '';
  }
}

function htmlToText(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function collectBody(part?: GmailPart): { plain: string[]; html: string[] } {
  const result = { plain: [] as string[], html: [] as string[] };
  if (!part) return result;

  const decoded = decodeBase64Url(part.body?.data);
  if (decoded && part.mimeType === 'text/plain') result.plain.push(decoded);
  if (decoded && part.mimeType === 'text/html') result.html.push(decoded);

  for (const child of part.parts || []) {
    const nested = collectBody(child);
    result.plain.push(...nested.plain);
    result.html.push(...nested.html);
  }

  return result;
}

function header(headers: GmailHeader[] | undefined, name: string): string {
  return (
    headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value || ''
  );
}

function categoryFor(subject: string): 'Morning Brief' | 'Funding Watch' | 'Opportunity' | 'Research' {
  const normalized = subject.toLowerCase();
  if (normalized.includes('funding')) return 'Funding Watch';
  if (normalized.includes('opportunity') || normalized.includes('groundwater')) return 'Opportunity';
  if (normalized.includes('morning') || normalized.includes('daily briefing')) return 'Morning Brief';
  return 'Research';
}

async function gmailJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message || 'Gmail request failed.');
  }
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const encryptedRefreshToken = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
    if (!encryptedRefreshToken) {
      return NextResponse.json(
        {
          connected: false,
          briefs: [],
          message: 'Connect Gmail to import the morning briefs and funding watches sent to your inbox.',
        },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    const accessToken = await refreshGmailAccessToken(decryptToken(encryptedRefreshToken));
    const listUrl = new URL(`${GMAIL_API}/messages`);
    listUrl.searchParams.set('q', BRIEF_QUERY);
    listUrl.searchParams.set('maxResults', '50');

    const list = await gmailJson<{ messages?: Array<{ id?: string }> }>(
      listUrl.toString(),
      accessToken,
    );

    const ids = (list.messages || []).map((message) => message.id).filter(Boolean) as string[];
    const messages = await Promise.all(
      ids.map((id) =>
        gmailJson<GmailMessage>(
          `${GMAIL_API}/messages/${encodeURIComponent(id)}?format=full`,
          accessToken,
        ),
      ),
    );

    const briefs = messages
      .map((message) => {
        const headers = message.payload?.headers;
        const subject = header(headers, 'Subject') || 'Aridon research update';
        const bodies = collectBody(message.payload);
        const body = (bodies.plain.join('\n\n') || htmlToText(bodies.html.join('\n\n')))
          .replace(/\r/g, '')
          .trim()
          .slice(0, 30000);
        const timestamp = Number(message.internalDate || 0);

        return {
          id: message.id || '',
          threadId: message.threadId || '',
          subject,
          from: header(headers, 'From'),
          date: timestamp ? new Date(timestamp).toISOString() : header(headers, 'Date'),
          snippet: message.snippet || body.slice(0, 280),
          body,
          category: categoryFor(subject),
          source: 'Gmail',
        };
      })
      .sort((a, b) => Date.parse(b.date || '') - Date.parse(a.date || ''));

    return NextResponse.json(
      { connected: true, briefs, query: BRIEF_QUERY },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Aridon Gmail intelligence error', error);
    return NextResponse.json(
      {
        connected: true,
        briefs: [],
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load the Aridon intelligence feed.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
