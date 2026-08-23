export type AridonChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AridonProvider = 'openai' | 'anthropic' | 'gemini' | 'xai' | 'deepseek';
export type AridonTask =
  | 'live_research'
  | 'social_intelligence'
  | 'coding'
  | 'multilingual'
  | 'long_context'
  | 'creative'
  | 'general';

type ProviderConfig = {
  provider: AridonProvider;
  label: string;
  model: string;
  enabled: boolean;
  specialty: string;
};

type ProviderAttempt = {
  provider: AridonProvider;
  model: string;
  ok: boolean;
  error?: string;
};

export type RouterResult = {
  text: string;
  routing: {
    task: AridonTask;
    provider: AridonProvider;
    model: string;
    reason: string;
    fallbackUsed: boolean;
    attempts: ProviderAttempt[];
  };
};

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';
const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/chat/completions';

function env(name: string) {
  return process.env[name]?.trim() || '';
}

export function getProviderCatalog(): ProviderConfig[] {
  return [
    {
      provider: 'openai',
      label: 'OpenAI',
      model: env('ARIDON_OPENAI_MODEL') || env('ARIDON_CHAT_MODEL') || env('ARIDON_ADVISOR_MODEL') || 'gpt-5-mini',
      enabled: Boolean(env('OPENAI_API_KEY')),
      specialty: 'Live research, general executive work, visual/creative planning and default fallback',
    },
    {
      provider: 'anthropic',
      label: 'Claude',
      model: env('ARIDON_ANTHROPIC_MODEL') || 'claude-sonnet-4-6',
      enabled: Boolean(env('ANTHROPIC_API_KEY')),
      specialty: 'Long-context reading, writing, document-heavy analysis and careful synthesis',
    },
    {
      provider: 'gemini',
      label: 'Gemini',
      model: env('ARIDON_GEMINI_MODEL') || 'gemini-3.7-flash',
      enabled: Boolean(env('GEMINI_API_KEY')),
      specialty: 'Multilingual work, localization and large-context synthesis',
    },
    {
      provider: 'xai',
      label: 'Grok',
      model: env('ARIDON_XAI_MODEL') || 'grok-4.6',
      enabled: Boolean(env('XAI_API_KEY')),
      specialty: 'Social/X-style analysis, conversational tone and trend-oriented framing',
    },
    {
      provider: 'deepseek',
      label: 'DeepSeek',
      model: env('ARIDON_DEEPSEEK_MODEL') || 'deepseek-v4-flash',
      enabled: Boolean(env('DEEPSEEK_API_KEY')),
      specialty: 'Coding, technical reasoning and cost-sensitive analytical work',
    },
  ];
}

function allText(messages: AridonChatMessage[]) {
  return messages.map((message) => message.content).join('\n').toLowerCase();
}

export function classifyTask(messages: AridonChatMessage[]): { task: AridonTask; reason: string } {
  const text = allText(messages);
  const size = messages.reduce((sum, message) => sum + message.content.length, 0);

  const liveResearch = /(https?:\/\/|www\.|latest|today|current|right now|news|breaking|funding|grant|regulation|competitor|website|look up|research|search the web|recent|market price|who is|contact info)/i;
  const coding = /(code|coding|debug|bug|typescript|javascript|python|sql|api route|repository|github|vercel|build error|compile|function|developer|programming)/i;
  const multilingual = /(translate|translation|multilingual|localize|localization|spanish|español|french|français|german|deutsch|portuguese|japanese|korean|hindi|arabic|language version)/i;
  const social = /(twitter|\bx\b|social media|viral|sentiment|influencer|post performance|social trend|threads|reddit reaction)/i;
  const creative = /(image|visual|logo|mockup|creative|campaign concept|ad concept|brand concept|storyboard|illustration|design direction)/i;
  const longForm = /(contract|proposal|report|newsletter|white paper|whitepaper|policy|document|rewrite|edit this|summarize this|due diligence|memorandum|business plan)/i;

  if (liveResearch.test(text)) {
    return { task: 'live_research', reason: 'The request depends on current or public information, so Aridon prioritizes a web-capable route.' };
  }
  if (social.test(text)) {
    return { task: 'social_intelligence', reason: 'The request is centered on social-platform language, sentiment or trend framing.' };
  }
  if (coding.test(text)) {
    return { task: 'coding', reason: 'The request is primarily technical, coding or debugging work.' };
  }
  if (multilingual.test(text)) {
    return { task: 'multilingual', reason: 'The request is primarily translation, localization or multilingual work.' };
  }
  if (size > 12_000 || longForm.test(text)) {
    return { task: 'long_context', reason: 'The request is document-heavy or benefits from long-context synthesis.' };
  }
  if (creative.test(text)) {
    return { task: 'creative', reason: 'The request is primarily creative, visual or campaign-oriented.' };
  }
  return { task: 'general', reason: 'The request is broad executive work without a stronger specialist signal.' };
}

function preferredProviders(task: AridonTask): AridonProvider[] {
  switch (task) {
    case 'live_research':
      return ['openai', 'xai', 'gemini', 'anthropic', 'deepseek'];
    case 'social_intelligence':
      return ['xai', 'openai', 'gemini', 'anthropic', 'deepseek'];
    case 'coding':
      return ['deepseek', 'openai', 'anthropic', 'gemini', 'xai'];
    case 'multilingual':
      return ['gemini', 'openai', 'anthropic', 'deepseek', 'xai'];
    case 'long_context':
      return ['anthropic', 'gemini', 'openai', 'deepseek', 'xai'];
    case 'creative':
      return ['openai', 'gemini', 'anthropic', 'xai', 'deepseek'];
    default:
      return ['openai', 'anthropic', 'gemini', 'deepseek', 'xai'];
  }
}

function orderedAvailableProviders(task: AridonTask) {
  const catalog = getProviderCatalog();
  const byProvider = new Map(catalog.map((item) => [item.provider, item]));
  return preferredProviders(task)
    .map((provider) => byProvider.get(provider))
    .filter((item): item is ProviderConfig => Boolean(item?.enabled));
}

function conversationString(messages: AridonChatMessage[]) {
  return messages
    .map((message) => `${message.role === 'user' ? 'USER' : 'ASSISTANT'}: ${message.content}`)
    .join('\n\n');
}

function cleanError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 240);
  return 'Unknown provider error';
}

async function runOpenAI(config: ProviderConfig, messages: AridonChatMessage[], system: string, task: AridonTask) {
  const apiKey = env('OPENAI_API_KEY');
  const webEnabled = task === 'live_research';
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      instructions: `${system}${webEnabled ? '\n\nLIVE RESEARCH: Use web search before answering. Prefer primary and current sources, distinguish verified facts from inference, and include readable source names or URLs when useful.' : ''}`,
      ...(webEnabled ? { tools: [{ type: 'web_search', search_context_size: 'medium' }] } : {}),
      input: conversationString(messages),
      max_output_tokens: 3_000,
    }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI returned ${response.status}`);
  const direct = typeof data?.output_text === 'string' ? data.output_text.trim() : '';
  if (direct) return direct;
  const text = (data?.output || [])
    .flatMap((item: any) => item?.content || [])
    .filter((item: any) => item?.type === 'output_text' && typeof item?.text === 'string')
    .map((item: any) => item.text)
    .join('\n\n')
    .trim();
  if (!text) throw new Error('OpenAI returned no text');
  return text;
}

async function runAnthropic(config: ProviderConfig, messages: AridonChatMessage[], system: string) {
  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'x-api-key': env('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 3_000,
      system,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `Claude returned ${response.status}`);
  const text = (data?.content || [])
    .filter((item: any) => item?.type === 'text' && typeof item?.text === 'string')
    .map((item: any) => item.text)
    .join('\n\n')
    .trim();
  if (!text) throw new Error('Claude returned no text');
  return text;
}

async function runGemini(config: ProviderConfig, messages: AridonChatMessage[], system: string) {
  const response = await fetch(`${GEMINI_API_ROOT}/${encodeURIComponent(config.model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': env('GEMINI_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      generationConfig: { maxOutputTokens: 3_000 },
    }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `Gemini returned ${response.status}`);
  const text = (data?.candidates || [])
    .flatMap((candidate: any) => candidate?.content?.parts || [])
    .filter((part: any) => typeof part?.text === 'string')
    .map((part: any) => part.text)
    .join('\n\n')
    .trim();
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

async function runOpenAICompatible(
  config: ProviderConfig,
  messages: AridonChatMessage[],
  system: string,
  url: string,
  apiKey: string,
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: 3_000,
      stream: false,
    }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `${config.label} returned ${response.status}`);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error(`${config.label} returned no text`);
  return text.trim();
}

async function runProvider(config: ProviderConfig, messages: AridonChatMessage[], system: string, task: AridonTask) {
  if (config.provider === 'openai') return runOpenAI(config, messages, system, task);
  if (config.provider === 'anthropic') return runAnthropic(config, messages, system);
  if (config.provider === 'gemini') return runGemini(config, messages, system);
  if (config.provider === 'xai') return runOpenAICompatible(config, messages, system, XAI_CHAT_URL, env('XAI_API_KEY'));
  return runOpenAICompatible(config, messages, system, DEEPSEEK_CHAT_URL, env('DEEPSEEK_API_KEY'));
}

export async function routeModel(messages: AridonChatMessage[], system: string): Promise<RouterResult> {
  const classification = classifyTask(messages);
  const candidates = orderedAvailableProviders(classification.task);
  if (!candidates.length) throw new Error('No AI provider is configured for Aridon.');

  const attempts: ProviderAttempt[] = [];
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    try {
      const text = await runProvider(candidate, messages, system, classification.task);
      attempts.push({ provider: candidate.provider, model: candidate.model, ok: true });
      return {
        text,
        routing: {
          task: classification.task,
          provider: candidate.provider,
          model: candidate.model,
          reason: classification.reason,
          fallbackUsed: index > 0,
          attempts,
        },
      };
    } catch (error) {
      const message = cleanError(error);
      console.error(`Aridon model router provider failure: ${candidate.provider}`, message);
      attempts.push({ provider: candidate.provider, model: candidate.model, ok: false, error: message });
    }
  }

  throw new Error(`Every configured provider failed: ${attempts.map((attempt) => attempt.provider).join(', ')}`);
}

export function getRouterStatus() {
  return {
    mode: 'automatic',
    providers: getProviderCatalog().map(({ provider, label, model, enabled, specialty }) => ({
      provider,
      label,
      model,
      enabled,
      specialty,
    })),
    routes: [
      { task: 'Live research', preferred: 'OpenAI', fallback: 'Next configured provider' },
      { task: 'Social intelligence', preferred: 'Grok', fallback: 'OpenAI' },
      { task: 'Coding / technical', preferred: 'DeepSeek', fallback: 'OpenAI / Claude' },
      { task: 'Multilingual', preferred: 'Gemini', fallback: 'OpenAI / Claude' },
      { task: 'Long documents', preferred: 'Claude', fallback: 'Gemini / OpenAI' },
      { task: 'Creative / visual planning', preferred: 'OpenAI', fallback: 'Gemini / Claude' },
      { task: 'General executive work', preferred: 'OpenAI', fallback: 'Claude / Gemini' },
    ],
  };
}
