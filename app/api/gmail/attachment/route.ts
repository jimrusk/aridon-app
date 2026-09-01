import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { decryptToken, GMAIL_REFRESH_COOKIE, refreshGoogleAccessToken, safeHeader } from '../../../../lib/gmail';
import { auditExecutiveAction, connectedExecutiveActor, recommendExecutive } from '../../../../lib/executiveOps';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

function safe(value: string | null, max: number) {
  return (value || '').trim().slice(0, max);
}

export async function GET(request: NextRequest) {
  try {
    const messageId = safe(request.nextUrl.searchParams.get('messageId'), 200);
    const attachmentId = safe(request.nextUrl.searchParams.get('attachmentId'), 500);
    const filename = safe(request.nextUrl.searchParams.get('filename'), 500) || 'attachment';
    const mimeType = safe(request.nextUrl.searchParams.get('mimeType'), 200) || 'application/octet-stream';
    if (!messageId || !attachmentId) return NextResponse.json({ error: 'messageId and attachmentId are required.' }, { status: 400, headers: NO_STORE });

    const encrypted = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
    if (!encrypted) return NextResponse.json({ error: 'Connect Google Workspace first.' }, { status: 401, headers: NO_STORE });
    const accessToken = await refreshGoogleAccessToken(decryptToken(encrypted));
    const response = await fetch(`${GMAIL_API}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const payload = (await response.json()) as { data?: string; size?: number; error?: { message?: string } };
    if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Unable to load the attachment.');
    const buffer = Buffer.from(payload.data, 'base64url');
    if (buffer.length > 12 * 1024 * 1024) return NextResponse.json({ error: 'Attachment is larger than the 12 MB Executive Operations inspection limit.' }, { status: 413, headers: NO_STORE });

    const actor = connectedExecutiveActor(request);
    const route = recommendExecutive({ filename });

    if (request.nextUrl.searchParams.get('download') === '1') {
      await auditExecutiveAction({ actorEmail: actor.email, executive: route.executive, action: 'attachment_downloaded', channel: 'gmail', target: filename, metadata: { messageId, mimeType, size: buffer.length } });
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${safeHeader(filename.replace(/["\\]/g, '_'), 180)}"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    let text = '';
    let details: Record<string, unknown> = {};
    const lower = filename.toLowerCase();
    if (mimeType.startsWith('text/') || mimeType === 'application/json' || lower.endsWith('.csv') || lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.eml')) {
      text = buffer.toString('utf8').slice(0, 120_000);
    } else if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
      try {
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        details = { pages: pdf.getPageCount(), title: pdf.getTitle() || '', author: pdf.getAuthor() || '', subject: pdf.getSubject() || '' };
      } catch {
        details = { note: 'PDF metadata could not be read; the file remains downloadable.' };
      }
    } else {
      details = { note: 'Binary Office/image attachment detected. Aridon can route and download it; text extraction is not enabled for this file type in the current server parser.' };
    }

    await auditExecutiveAction({ actorEmail: actor.email, executive: route.executive, action: 'attachment_inspected', channel: 'gmail', target: filename, metadata: { messageId, mimeType, size: buffer.length, textExtracted: Boolean(text) } });
    return NextResponse.json({ filename, mimeType, size: buffer.length, recommendedExecutive: route, text, details, downloadUrl: `/api/gmail/attachment?messageId=${encodeURIComponent(messageId)}&attachmentId=${encodeURIComponent(attachmentId)}&filename=${encodeURIComponent(filename)}&mimeType=${encodeURIComponent(mimeType)}&download=1` }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to inspect the attachment.' }, { status: 500, headers: NO_STORE });
  }
}
