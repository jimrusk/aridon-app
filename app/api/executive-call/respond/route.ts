import { NextRequest } from 'next/server';
import { executives } from '../../../../lib/executives';
import { getServerClient } from '../../../../lib/supabase';
import { escapeXml, executiveByName, publicOrigin, verifyPhoneToken, voiceFor } from '../../../../lib/executivePhone';

export const runtime = 'nodejs';
export const maxDuration = 60;

function text(value: FormDataEntryValue | null, max = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function routeExecutive(requested: string, speech: string) {
  if (requested !== 'Eva') return executiveByName(requested);
  const latest = speech.toLowerCase();
  const find = (name: string) => executives.find((item) => item.name === name) || executiveByName('Eva');
  if (/\b(farm|ranch|crop|livestock|cattle|agriculture|agriwebb|producer|acre|harvest|irrigation|tractor|equipment|buyer|usda|nrcs)\b/.test(latest)) return find('Sierra Bennett');
  if (/\b(awg|water|well|drought|energy|power|microgrid|battery|solar|iron grid|resilience|kilowatt|kwh)\b/.test(latest)) return find('Maya Torres');
  if (/\b(research|investigate|company|contact|verify|source|compare|diligence|background|intelligence|find out|what changed)\b/.test(latest)) return find('Claire Morgan');
  if (/\b(cash|budget|forecast|finance|funding|loan|debt|capital|margin|profit|cost|expense|valuation)\b/.test(latest)) return find('Nova');
  if (/\b(contract|legal|compliance|risk|liability|agreement|governance|attorney)\b/.test(latest)) return find('Ethos');
  if (/\b(code|api|integration|deployment|database|engineering|software|website|app|technology|technical)\b/.test(latest)) return find('Atlas');
  if (/\b(marketing|campaign|brand|advertising|seo|content|press|communications|social media)\b/.test(latest)) return find('Oracle');
  if (/\b(revenue|sales|pipeline|pricing|lead|customer|conversion|close|deal|prospect|follow[- ]?up)\b/.test(latest)) return find('Ledger');
  if (/\b(strategy|market|competitor|partnership|positioning|growth|acquisition|expand)\b/.test(latest)) return find('Scout');
  if (/\b(operations|project|task|deadline|workflow|process|priority|execution|team|schedule|blocker)\b/.test(latest)) return find('Heather');
  return find('Eva');
}

function extractReply(data: any) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data?.output || []).flatMap((item: any) => item.content || []).filter((item: any) => item.type === 'output_text').map((item: any) => item.text || '').join('\n').trim();
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const session = verifyPhoneToken(token);
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const form = await request.formData();
    const speech = text(form.get('SpeechResult'));
    const origin = publicOrigin(request.nextUrl.origin);
    const action = `${origin}/api/executive-call/respond?token=${encodeURIComponent(token)}`;
    const executive = routeExecutive(session.executive, speech);
    const voice = voiceFor(executive.name);

    if (!speech) {
      const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech" action="${escapeXml(action)}" method="POST" speechTimeout="auto" language="en-US" actionOnEmptyResult="true"><Say voice="${escapeXml(voice.voice)}" language="${escapeXml(voice.language)}">I’m still here. What would you like me to help with?</Say></Gather><Redirect method="POST">${escapeXml(action)}</Redirect></Response>`;
      return new Response(xml, { headers: { 'Content-Type': 'text/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
    }

    const db = getServerClient();
    const [tenantResult, recentResult] = await Promise.all([
      db.from('customer_tenants').select('business_name,industry,plan').eq('id', session.tenantId).maybeSingle(),
      db.from('customer_assistant_messages').select('role,content,created_at').eq('tenant_id', session.tenantId).order('created_at', { ascending: false }).limit(12),
    ]);
    const recent = (recentResult.data || []).reverse().map((item: any) => `${String(item.role).toUpperCase()}: ${String(item.content).slice(0, 1800)}`).join('\n');
    const company = tenantResult.data?.business_name || 'the customer company';

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error('OpenAI service is not configured.');
    const system = `You are ${executive.name}, ${executive.role}, speaking live on a telephone call for ${company}. Your focus is ${executive.focus}. Your tone is ${executive.tone}. ${executive.voice}\n\nPHONE RULES: Sound natural and conversational. Keep most replies under 120 spoken words. Do not read markdown, URLs, citations, long lists, or tables aloud. The caller may interrupt or change topics. If another Aridon executive owns the topic, you may say you are bringing that lane into the answer, but keep one continuous conversation. Never claim an external action was completed unless the system actually performed it. Research and analysis are fine; spending, signatures, external sends, commitments and other consequential actions require explicit owner approval.\n\nRECENT ARIDON CONTEXT:\n${recent}\n\nCALLER: ${speech}`;

    const ai = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6', input: system, max_output_tokens: 500, store: false }),
      cache: 'no-store',
    });
    const data = await ai.json();
    if (!ai.ok) throw new Error(data?.error?.message || `AI service returned ${ai.status}.`);
    const reply = extractReply(data) || 'I did not get a complete answer that time. Please say that again.';

    await db.from('customer_assistant_messages').insert([
      { tenant_id: session.tenantId, user_id: session.userId, role: 'user', content: `[Phone] ${speech}`, web_research: false },
      { tenant_id: session.tenantId, user_id: session.userId, role: 'assistant', content: `[Phone · ${executive.name}] ${reply}`, web_research: false },
    ]);

    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech" action="${escapeXml(action)}" method="POST" speechTimeout="auto" language="en-US" actionOnEmptyResult="true"><Say voice="${escapeXml(voice.voice)}" language="${escapeXml(voice.language)}">${escapeXml(reply)}</Say></Gather><Redirect method="POST">${escapeXml(action)}</Redirect></Response>`;
    return new Response(xml, { headers: { 'Content-Type': 'text/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Executive phone response error', error);
    const executive = executiveByName(session.executive);
    const voice = voiceFor(executive.name);
    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="${escapeXml(voice.voice)}" language="${escapeXml(voice.language)}">I hit a connection problem. Please try the call again in a moment.</Say></Response>`;
    return new Response(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}
