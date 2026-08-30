import { NextRequest, NextResponse } from 'next/server';
import { mariaModule, mariaModules, mariaPublicCorpusSummary, mariaSources } from '../../../../../lib/mariaWendtCurriculum';

export const runtime = 'nodejs';
export const maxDuration = 60;
const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type Message = { role: 'user' | 'assistant'; content: string };
type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

function cleanMessages(value: unknown): Message[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 16) return null;
  let total = 0;
  const messages: Message[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const role = 'role' in item ? item.role : undefined;
    const content = 'content' in item ? item.content : undefined;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const cleaned = content.trim();
    if (!cleaned || cleaned.length > 5000) return null;
    total += cleaned.length;
    if (total > 24000) return null;
    messages.push({ role, content: cleaned });
  }
  return messages;
}

function extractText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && item.text)
    .map((item) => item.text || '')
    .join('\n\n')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const messages = cleanMessages(body?.messages);
    const moduleId = typeof body?.moduleId === 'string' ? body.moduleId.slice(0, 80) : mariaModules[0].id;
    if (!messages) return NextResponse.json({ error: 'A valid lesson conversation is required.' }, { status: 400, headers: NO_STORE });

    const module = mariaModule(moduleId);
    const sourceSet = mariaSources.filter((source) => module.sourceIds.includes(source.id));
    const sourceText = sourceSet.map((source) => `${source.title}: ${source.url} — ${source.note}`).join('\n');
    const conversation = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n\n');

    const systemPrompt = `You are the Aridon Maria Wendt Curriculum Tutor, a clearly disclosed AI teaching assistant built for a proposed Maria Wendt / Aridon partnership demo. You are NOT Maria Wendt. Never claim to be her, never imply endorsement, never imitate private knowledge, and never invent a personal opinion for her. Teach from the summarized public source set below, and clearly identify Aridon-added automation, analytics and operating-system recommendations as Aridon analysis.\n\nCURRENT MODULE: ${module.title}\nPROMISE: ${module.promise}\nSOURCE-GROUNDED LESSONS:\n${module.lessons.map((lesson, index) => `${index + 1}. ${lesson}`).join('\n')}\n\nARIDON EXTENSION:\n${module.aridonExtension}\n\nCURRENT MODULE SOURCES:\n${sourceText}\n\nBROADER PUBLIC CORPUS SUMMARY:\n${mariaPublicCorpusSummary}\n\nTEACHING RULES:\n- Be practical, concise and interactive. Help the learner apply the idea to their own legitimate business or creator workflow.\n- Keep Maria-source summaries distinct from Aridon-added recommendations.\n- Do not reproduce proprietary course lessons, scripts, templates or long passages. Summarize only what is supported by public descriptions and materials.\n- Do not promise income, guaranteed sales, follower growth or business results. If public source material mentions earnings or student results, describe them only as creator claims or examples and remind the learner that results vary.\n- Do not advise deceptive marketing, fake testimonials, false scarcity, spam, platform evasion or misleading income claims.\n- If asked what Maria personally thinks about something not established by the source set, say the public sources do not establish that and answer as the Aridon tutor instead.\n- When useful, finish with a short exercise, checklist or next action.\n- If asked for source basis, name the relevant public source title and URL from the supplied source set.\n\nCONVERSATION:\n${conversation}`;

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'The AI teaching service is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6', input: systemPrompt, max_output_tokens: 1200, store: false }),
      cache: 'no-store',
    });
    const data = (await response.json()) as ResponsesPayload;
    if (!response.ok) throw new Error(data.error?.message || `AI service returned ${response.status}.`);
    const reply = extractText(data);
    if (!reply) throw new Error('The tutor returned no readable lesson.');

    return NextResponse.json({
      reply,
      module: { id: module.id, title: module.title },
      sources: sourceSet.map(({ title, url }) => ({ title, url })),
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Maria Wendt curriculum tutor error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The teaching studio is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}
