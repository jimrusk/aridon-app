import { NextRequest } from 'next/server';
import { escapeXml, executiveByName, publicOrigin, verifyPhoneToken, voiceFor } from '../../../../../lib/executivePhone';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const session = verifyPhoneToken(token);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const executive = executiveByName(session.executive);
  const profile = voiceFor(executive.name);
  const origin = publicOrigin(request.nextUrl.origin);
  const action = `${origin}/api/executive-call/respond?token=${encodeURIComponent(token)}`;
  const greeting = executive.name === 'Eva'
    ? `Hi, this is Eva from Aridon. I’m here. Tell me what you need and I’ll work with the right executive.`
    : `Hi, this is ${executive.name}, ${executive.role} at Aridon. What would you like to work on?`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${escapeXml(action)}" method="POST" speechTimeout="auto" language="en-US" actionOnEmptyResult="true">
    <Say voice="${escapeXml(profile.voice)}" language="${escapeXml(profile.language)}">${escapeXml(greeting)}</Say>
  </Gather>
  <Redirect method="POST">${escapeXml(action)}</Redirect>
</Response>`;

  return new Response(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
}
