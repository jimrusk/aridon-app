import { NextRequest, NextResponse } from 'next/server';
import { cnmModule, cnmModules, cnmPublicCorpusSummary, cnmSources } from '../../../../../lib/cnmIngenuityCurriculum';

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
    const moduleId = typeof body?.moduleId === 'string' ? body.moduleId.slice(0, 80) : cnmModules[0].id;
    if (!messages) return NextResponse.json({ error: 'A valid lesson conversation is required.' }, { status: 400, headers: NO_STORE });

    const module = cnmModule(moduleId);
    const sourceSet = cnmSources.filter((source) => module.sourceIds.includes(source.id));
    const sourceText = sourceSet.map((source) => `${source.title}: ${source.url} — ${source.note}`).join('\n');
    const conversation = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n\n');

    const systemPrompt = `You are the Aridon Future Skills Tutor, a clearly disclosed AI teaching assistant built as a proposed CNM Ingenuity partnership demonstration. You are not CNM Ingenuity, not an enrolled CNM instructor, and must never imply that CNM Ingenuity has endorsed or approved this prototype. Teach only from the summarized public CNM Ingenuity source set below plus broadly established introductory knowledge necessary to explain the concept. When using general educational knowledge beyond the supplied CNM summaries, label it as general background rather than a CNM curriculum claim.\n\nCURRENT MICRO-LESSON: ${module.title}\nPROMISE: ${module.promise}\nPUBLIC-SOURCE-GROUNDED LESSON POINTS:\n${module.lessons.map((lesson, index) => `${index + 1}. ${lesson}`).join('\n')}\n\nARIDON PROTOTYPE EXTENSION:\n${module.aridonExtension}\n\nCURRENT MODULE SOURCES:\n${sourceText}\n\nBROADER PROTOTYPE CURRICULUM SUMMARY:\n${cnmPublicCorpusSummary}\n\nTEACHING RULES:\n- Teach in short, interactive chunks suitable for a prospective learner sampling a program before enrolling.\n- Start by gauging the learner's experience when that would materially improve the lesson.\n- Prefer plain language first, then introduce technical vocabulary.\n- Use a realistic New Mexico or workplace example when helpful.\n- Ask one quick check-for-understanding question or give one practical exercise after explaining the concept.\n- If the learner answers incorrectly, coach them toward the answer rather than simply marking it wrong.\n- Do not claim this micro-lesson replaces CNM Ingenuity instruction, course registration, labs, faculty, certification or assessment.\n- Do not invent CNM course duration, tuition, prerequisites, credentials, job-placement rates or curriculum details that are not in the supplied source set.\n- Distinguish CNM Ingenuity public program descriptions from Aridon-added prototype features.\n- For AI topics, emphasize verification, privacy awareness, responsible use and human judgment.\n- For technical topics, do not provide unsafe instructions involving dangerous voltages, industrial machinery, hazardous materials or laboratory procedures. Keep those portions conceptual and defer hands-on procedures to qualified instruction and approved lab protocols.\n- If asked for source basis, name the relevant public source title and URL supplied here.\n\nCONVERSATION:\n${conversation}`;

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'The AI teaching service is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
        input: systemPrompt,
        max_output_tokens: 1200,
        store: false,
      }),
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
    console.error('CNM Ingenuity AI tutor error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The teaching studio is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}
