import { NextRequest, NextResponse } from 'next/server';
import { graphJson, microsoftAccessToken } from '../../../../lib/microsoft365';
import { auditExecutiveAction, recommendExecutive } from '../../../../lib/executiveOps';
import { MS_EMAIL_COOKIE } from '../../../../lib/microsoft365';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const accessToken = await microsoftAccessToken(request);
    const messageId = (request.nextUrl.searchParams.get('messageId') || '').trim();
    const actorEmail = request.cookies.get(MS_EMAIL_COOKIE)?.value || '';
    if (messageId) {
      const item = await graphJson<any>(`/me/messages/${encodeURIComponent(messageId)}?$select=id,conversationId,subject,from,toRecipients,receivedDateTime,isRead,bodyPreview,body,hasAttachments`, accessToken);
      const from = item.from?.emailAddress?.address || '';
      const subject = item.subject || '(No subject)';
      const body = item.body?.content || item.bodyPreview || '';
      const route = recommendExecutive({ from, subject, body });
      await auditExecutiveAction({ actorEmail, executive: route.executive, action: 'email_read', channel: 'outlook', target: subject, metadata: { messageId } });
      return NextResponse.json({ connected: true, message: { ...item, recommendedExecutive: route } }, { headers: NO_STORE });
    }

    const top = Math.max(1, Math.min(50, Number(request.nextUrl.searchParams.get('maxResults') || 20) || 20));
    const data = await graphJson<{ value?: any[] }>(`/me/mailFolders/inbox/messages?$top=${top}&$orderby=receivedDateTime desc&$select=id,conversationId,subject,from,toRecipients,receivedDateTime,isRead,bodyPreview,hasAttachments`, accessToken);
    const messages = (data.value || []).map((item) => {
      const from = item.from?.emailAddress?.address || '';
      const route = recommendExecutive({ from, subject: item.subject || '', body: item.bodyPreview || '' });
      return { ...item, recommendedExecutive: route };
    });
    await auditExecutiveAction({ actorEmail, action: 'inbox_read', channel: 'outlook', metadata: { count: messages.length } });
    return NextResponse.json({ connected: true, messages }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ connected: false, messages: [], error: error instanceof Error ? error.message : 'Unable to load Outlook inbox.' }, { status: 500, headers: NO_STORE });
  }
}
