import 'server-only';
import type { NextRequest } from 'next/server';
import { decryptToken, GMAIL_REFRESH_COOKIE, refreshGoogleAccessToken } from './gmail';

export async function googleWorkspaceAccessToken(request: NextRequest) {
  const encrypted = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
  if (!encrypted) throw new Error('Connect Google Workspace first.');
  return refreshGoogleAccessToken(decryptToken(encrypted));
}

export async function googleJson<T>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `Google request failed (${response.status}).`);
  return data;
}

function firstString(values: Array<{ value?: string }> | undefined) {
  return values?.find((item) => item.value)?.value || '';
}

export type WorkspaceContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  title: string;
};

export async function listGoogleContacts(accessToken: string, query = ''): Promise<WorkspaceContact[]> {
  const url = new URL('https://people.googleapis.com/v1/people/me/connections');
  url.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers,organizations');
  url.searchParams.set('pageSize', '500');
  url.searchParams.set('sortOrder', 'LAST_MODIFIED_DESCENDING');
  const data = await googleJson<{
    connections?: Array<{
      resourceName?: string;
      names?: Array<{ displayName?: string }>;
      emailAddresses?: Array<{ value?: string }>;
      phoneNumbers?: Array<{ value?: string }>;
      organizations?: Array<{ name?: string; title?: string }>;
    }>;
  }>(url.toString(), accessToken);

  const normalized = (data.connections || []).map((person) => ({
    id: person.resourceName || '',
    name: person.names?.[0]?.displayName || firstString(person.emailAddresses) || 'Unnamed contact',
    email: firstString(person.emailAddresses),
    phone: firstString(person.phoneNumbers),
    organization: person.organizations?.[0]?.name || '',
    title: person.organizations?.[0]?.title || '',
  }));
  const needle = query.trim().toLowerCase();
  if (!needle) return normalized.slice(0, 200);
  return normalized.filter((item) => [item.name, item.email, item.phone, item.organization, item.title].join(' ').toLowerCase().includes(needle)).slice(0, 100);
}

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  createdTime: string;
  webViewLink: string;
  size: string;
};

export async function listDriveFiles(accessToken: string, query = '', maxResults = 50): Promise<DriveFile[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  const escaped = query.trim().replace(/'/g, "\\'");
  const q = escaped ? `trashed = false and name contains '${escaped}'` : 'trashed = false';
  url.searchParams.set('q', q);
  url.searchParams.set('pageSize', String(Math.max(1, Math.min(100, maxResults))));
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,createdTime,webViewLink,size)');
  const data = await googleJson<{ files?: DriveFile[] }>(url.toString(), accessToken);
  return data.files || [];
}

function collectDocText(node: any): string[] {
  const out: string[] = [];
  if (!node) return out;
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) {
    for (const item of node) out.push(...collectDocText(item));
    return out;
  }
  if (node.textRun?.content) out.push(String(node.textRun.content));
  if (node.autoText?.content) out.push(String(node.autoText.content));
  if (node.paragraph?.elements) out.push(...collectDocText(node.paragraph.elements));
  if (node.table?.tableRows) out.push(...collectDocText(node.table.tableRows));
  if (node.tableCells) out.push(...collectDocText(node.tableCells));
  if (node.content) out.push(...collectDocText(node.content));
  return out;
}

export async function readWorkspaceFile(accessToken: string, file: DriveFile) {
  const mime = file.mimeType;
  if (mime === 'application/vnd.google-apps.document') {
    const doc = await googleJson<any>(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(file.id)}`, accessToken);
    return { ...file, kind: 'Google Doc', text: collectDocText(doc.body?.content).join('').trim().slice(0, 120_000) };
  }

  if (mime === 'application/vnd.google-apps.spreadsheet') {
    const meta = await googleJson<any>(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(file.id)}?fields=properties.title,sheets.properties.title`, accessToken);
    const titles = (meta.sheets || []).map((sheet: any) => sheet.properties?.title).filter(Boolean).slice(0, 12);
    const sheets: Array<{ title: string; values: unknown[][] }> = [];
    for (const title of titles) {
      const range = encodeURIComponent(`'${String(title).replace(/'/g, "''")}'!A1:Z200`);
      const values = await googleJson<any>(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(file.id)}/values/${range}`, accessToken);
      sheets.push({ title, values: (values.values || []).slice(0, 200) });
    }
    return { ...file, kind: 'Google Sheet', sheets };
  }

  if (mime === 'application/vnd.google-apps.presentation') {
    const deck = await googleJson<any>(`https://slides.googleapis.com/v1/presentations/${encodeURIComponent(file.id)}`, accessToken);
    const slides = (deck.slides || []).map((slide: any, index: number) => ({
      number: index + 1,
      text: (slide.pageElements || []).flatMap((element: any) => element.shape?.text?.textElements || []).map((item: any) => item.textRun?.content || '').join('').trim(),
    }));
    return { ...file, kind: 'Google Slides', slides };
  }

  if (mime.startsWith('text/') || mime === 'application/json' || mime === 'text/csv') {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Unable to read ${file.name}.`);
    return { ...file, kind: 'Drive text file', text: (await response.text()).slice(0, 120_000) };
  }

  return { ...file, kind: 'Drive file', text: '', note: 'Binary file is available in Drive but is not converted to text by this route.' };
}

export async function upcomingCalendarEvents(accessToken: string, hours = 72) {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  const now = new Date();
  const end = new Date(now.getTime() + Math.max(1, Math.min(24 * 30, hours)) * 60 * 60 * 1000);
  url.searchParams.set('timeMin', now.toISOString());
  url.searchParams.set('timeMax', end.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');
  const data = await googleJson<{ items?: any[] }>(url.toString(), accessToken);
  return data.items || [];
}

export async function recentMeetingArtifacts(accessToken: string) {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', "trashed = false and mimeType = 'application/vnd.google-apps.document'");
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,createdTime,webViewLink,size)');
  const data = await googleJson<{ files?: DriveFile[] }>(url.toString(), accessToken);
  const signals = ['transcript', 'meeting notes', 'meeting', 'meet notes', 'call notes', 'notes'];
  return (data.files || []).filter((file) => signals.some((term) => file.name.toLowerCase().includes(term))).slice(0, 30);
}
