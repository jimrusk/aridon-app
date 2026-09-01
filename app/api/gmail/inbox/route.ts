import { NextRequest, NextResponse } from 'next/server';
import {
  decryptToken,
  GMAIL_REFRESH_COOKIE,
  refreshGoogleAccessToken,
} from '../../../../lib/gmail';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

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
  labelIds?: string[];
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
  return headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

async function gmailJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || 'Gmail request failed.');
  return data;
}

function messageSummary(message: GmailMessage, includeBody = false) {
  const headers = message.payload?.headers;
  const timestamp = Number(message.internalDate || 0);
  const bodies = includeBody ? collectBody(message.payload) : { plain: [] as string[], html: [] as string[] };
  const body = includeBody
    ? (bodies.plain.join('\n\n') || htmlToText(bodies.html.join('\n\n'))).replace(/\r/g, '').trim().slice(0, 50_000)
    : '';

  return {
    id: message.id || '',
    threadId: message.threadId || '',
    from: header(headers, 'From'),
    to: header(headers, 'To'),
    subject: header(headers, 'Subject') || '(No subject)',
    date: timestamp ? new Date(timestamp).toISOString() : header(headers, 'Date'),
    snippet: message.snippet || body.slice(0, 280),
    unread: Boolean(message.labelIds?.includes('UNREAD')),
    body,
  };
}

export async function GET(request: NextRequest) {
  try {
    const encryptedRefreshToken = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
    if (!encryptedRefreshToken) {
      return NextResponse.json(
        { connected: false, messages: [], error: 'Connect Google Workspace before reading email.' },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    const accessToken = await refreshGoogleAccessToken(decryptToken(encryptedRefreshToken));
    const messageId = request.nextUrl.searchParams.get('messageId')?.trim();

    if (messageId) {
      const message = await gmailJson<GmailMessage>(
        `${GMAIL_API}/messages/${encodeURIComponent(messageId)}?format=full`,
        accessToken,
      );
      return NextResponse.json(
        { connected: true, message: messageSummary(message, true) },
        { headers: NO_STORE_HEADERS },
      );
    }

    const query = (request.nextUrl.searchParams.get('q') || 'in:inbox').trim().slice(0, 500);
    const requestedMax = Number(request.nextUrl.searchParams.get('maxResults') || 20);
    const maxResults = Number.isFinite(requestedMax) ? Math.max(1, Math.min(50, requestedMax)) : 20;
    const listUrl = new URL(`${GMAIL_API}/messages`);
    listUrl.searchParams.set('q', query || 'in:inbox');
    listUrl.searchParams.set('maxResults', String(maxResults));

    const list = await gmailJson<{ messages?: Array<{ id?: string }> }>(listUrl.toString(), accessToken);
    const ids = (list.messages || []).map((item) => item.id).filter(Boolean) as string[];
    const messages = await Promise.all(
      ids.map((id) =>
        gmailJson<GmailMessage>(
          `${GMAIL_API}/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          accessToken,
        ),
      ),
    );

    return NextResponse.json(
      { connected: true, query, messages: messages.map((message) => messageSummary(message, false)) },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Aridon Gmail inbox error', error);
    return NextResponse.json(
      { connected: true, messages: [], error: error instanceof Error ? error.message : 'Unable to load Gmail.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
