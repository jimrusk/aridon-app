export type AridonChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AridonProvider = 'openai' | 'anthropic' | 'gemini' | 'xai' | 'deepseek' | 'local';
export type AridonMode = 'fast' | 'think' | 'research' | 'act';
export type AridonTask =
  | 'live_research'
  | 'social_intelligence'
  | 'coding'
  | 'multilingual'
  | 'long_context'
  | 'creative'
  | 'private_local'
  | 'general';

export type ProviderConfig = {
  provider: AridonProvider;
  label: string;
  model: string;
  enabled: boolean;
  specialty: string;
};

export type ProviderAttempt = {
  provider: AridonProvider;
  model: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
};

export type RouterSource = { title: string; url: string };
export type RouterOptions = {
  mode?: AridonMode;
  taskOverride?: AridonTask;
  maxOutputTokens?: number;
};

export type RouterResult = {
  text: string;
  sources: RouterSource[];
  routing: {
    mode: AridonMode;
    task: AridonTask;
    provider: AridonProvider;
    model: string;
    reason: string;
    fallbackUsed: boolean;
    attempts: ProviderAttempt[];
    totalLatencyMs: number;
    inputCharacters: number;
    outputCharacters: number;
  };
};

type ProviderResponse = { text: string; sources?: RouterSource[] };

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
      specialty: 'Live research, general executive work, creative planning and default fallback',
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
      model: env('ARIDON_GEMINI_MODEL') || 'gemini-2.5-flash',
      enabled: Boolean(env('GEMINI_API_KEY')),
      specialty: 'Multilingual work, localization and large-context synthesis',
    },
    {
      provider: 'xai',
      label: 'Grok',
      model: env('ARIDON_XAI_MODEL') || 'grok-4',
      enabled: Boolean(env('XAI_API_KEY')),
      specialty: 'Social/X-oriented analysis, conversational framing and trend-oriented work',
    },
    {
      provider: 'deepseek',
      label: 'DeepSeek',
      model: env('ARIDON_DEEPSEEK_MODEL') || 'deepseek-chat',
      enabled: Boolean(env('DEEPSEEK_API_KEY')),
      specialty: 'Coding, technical reasoning and cost-sensitive analytical work',
    },
    {
      provider: 'local',
      label: 'Local LLM',
      model: env('ARIDON_LOCAL_LLM_MODEL') || 'local-model',
      enabled: Boolean(env('ARIDON_LOCAL_LLM_URL')),
      specialty: 'Private or offline work through an OpenAI-compatible local endpoint such as Ollama, LM Studio or vLLM',
    },
  ];
}

function allText(messages: AridonChatMessage[]) {
  return messages.map((message) => message.content).join('\n').toLowerCase();
}

export function classifyTask(messages: AridonChatMessage[]): { task: AridonTask; reason: string } {
  const text = allText(messages);
  const size = messages.reduce((sum, message) => sum + message.content.length, 0);

  const privateLocal = /(keep (it )?local|local only|offline model|do not send.*cloud|private model|on[- ]prem|on premise|local llm|ollama|lm studio|vllm)/i;
  const liveResearch = /(https?:\/\/|www\.|latest|today|current|right now|news|breaking|funding|grant|regulation|competitor|website|look up|research|search the web|recent|market price|who is|contact info)/i;
  const coding = /(code|coding|debug|bug|typescript|javascript|python|sql|api route|repository|github|vercel|build error|compile|function|developer|programming)/i;
  const multilingual = /(translate|translation|multilingual|localize|localization|spanish|español|french|français|german|deutsch|portuguese|japanese|korean|hindi|arabic|language version)/i;
  const social = /(twitter|\bx\b|social media|viral|sentiment|influencer|post performance|social trend|threads|reddit reaction)/i;
  const creative = /(image|visual|logo|mockup|creative|campaign concept|ad concept|brand concept|storyboard|illustration|design direction|presentation|pitch deck|slides)/i;
  const longForm = /(contract|proposal|report|newsletter|white paper|whitepaper|policy|document|rewrite|edit this|summarize this|due diligence|memorandum|business plan)/i;

  if (privateLocal.test(text)) return { task: 'private_local', reason: 'The user explicitly requested local or private processing.' };
  if (liveResearch.test(text)) return { task: 'live_research', reason: 'The request depends on current or public information.' };
  if (social.test(text)) return { task: 'social_intelligence', reason: 'The request is centered on social-platform language, sentiment or trends.' };
  if (coding.test(text)) return { task: 'coding', reason: 'The request is primarily technical, coding or debugging work.' };
  if (multilingual.test(text)) return { task: 'multilingual', reason: 'The request is primarily translation, localization or multilingual work.' };
  if (size > 12_000 || longForm.test(text)) return { task: 'long_context', reason: 'The request is document-heavy or benefits from long-context synthesis.' };
  if (creative.test(text)) return { task: 'creative', reason: 'The request is primarily creative, visual, presentation or campaign work.' };
  return { task: 'general', reason: 'The request is broad executive work without a stronger specialist signal.' };
}

function preferredProviders(task: AridonTask, mode: AridonMode): AridonProvider[] {
  if (mode === 'research') return ['openai', 'xai', 'gemini', 'anthropic', 'deepseek', 'local'];
  if (mode === 'think' && task === 'general') return ['anthropic', 'openai', 'gemini', 'deepseek', 'local', 'xai'];
  if (mode === 'act' && task === 'general') return ['openai', 'anthropic', 'gemini', 'deepseek', 'local', 'xai'];

  switch (task) {
    case 'private_local': return ['local', 'openai', 'anthropic', 'gemini', 'deepseek', 'xai'];
    case 'live_research': return ['openai', 'xai', 'gemini', 'anthropic', 'deepseek', 'local'];
    case 'social_intelligence': return ['xai', 'openai', 'gemini', 'anthropic', 'deepseek', 'local'];
    case 'coding': return ['deepseek', 'openai', 'anthropic', 'local', 'gemini', 'xai'];
    case 'multilingual': return ['gemini', 'openai', 'anthropic', 'local', 'deepseek', 'xai'];
    case 'long_context': return ['anthropic', 'gemini', 'openai', 'local', 'deepseek', 'xai'];
    case 'creative': return ['openai', 'gemini', 'anthropic', 'xai', 'local', 'deepseek'];
    default: return ['openai', 'anthropic', 'gemini', 'local', 'deepseek', 'xai'];
  }
}

function orderedAvailableProviders(task: AridonTask, mode: AridonMode) {
  const catalog = getProviderCatalog();
  const byProvider = new Map(catalog.map((item) => [item.provider, item]));
  return preferredProviders(task, mode)
    .map((provider) => byProvider.get(provider))
    .filter((item): item is ProviderConfig => Boolean(item?.enabled));
}

function conversationString(messages: AridonChatMessage[]) {
  return messages.map((message) => `${message.role === 'user' ? 'USER' : 'ASSISTANT'}: ${message.content}`).join('\n\n');
}

function cleanError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 240);
  return 'Unknown provider error';
}

function outputLimit(mode: AridonMode, requested?: number) {
  if (requested && Number.isFinite(requested)) return Math.max(800, Math.min(6000, Math.round(requested)));
  if (mode === 'fast') return 1800;
  if (mode === 'think') return 4000;
  if (mode === 'research') return 3600;
  return 3000;
}

function modeDirective(mode: AridonMode) {
  if (mode === 'fast') return 'FAST MODE: Give the shortest complete useful answer. Prefer direct decisions and next steps over extensive explanation.';
  if (mode === 'think') return 'THINK MODE: Analyze alternatives, assumptions, tradeoffs and failure modes carefully. Do not reveal private chain-of-thought; provide a concise reasoning summary and a clear recommendation.';
  if (mode === 'research') return 'RESEARCH MODE: Prioritize current verifiable information. Distinguish sourced facts from inference and include source names or URLs when the provider supports live research.';
  return 'ACT MODE: Focus on the next executable business action. Never claim an external action occurred unless a connected tool actually performed it. Respect approval gates.';
}

function extractOpenAISources(data: any): RouterSource[] {
  const sources: RouterSource[] = [];
  const seen = new Set<string>();
  for (const output of data?.output || []) {
    for (const content of output?.content || []) {
      for (const annotation of content?.annotations || []) {
        if (annotation?.type !== 'url_citation' || !annotation?.url || seen.has(annotation.url)) continue;
        seen.add(annotation.url);
        sources.push({ title: annotation.title || annotation.url, url: annotation.url });
      }
    }
  }
  return sources.slice(0, 12);
}

async function runOpenAI(config: ProviderConfig, messages: AridonChatMessage[], system: string, task: AridonTask, mode: AridonMode, maxTokens: number): Promise<ProviderResponse> {
  const apiKey = env('OPENAI_API_KEY');
  const webEnabled = task === 'live_research' || mode === 'research';
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      instructions: `${system}\n\n${modeDirective(mode)}${webEnabled ? '\n\nLIVE RESEARCH: Use web search before answering. Prefer primary and current sources. Do not fill missing current facts from memory.' : ''}`,
      ...(webEnabled ? { tools: [{ type: 'web_search', search_context_size: mode === 'research' ? 'high' : 'medium' }] } : {}),
      input: conversationString(messages),
      max_output_tokens: maxTokens,
      store: false,
    }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI returned ${response.status}`);
  const direct = typeof data?.output_text === 'string' ? data.output_text.trim() : '';
  const text = direct || (data?.output || [])
    .flatMap((item: any) => item?.content || [])
    .filter((item: any) => item?.type === 'output_text' && typeof item?.text === 'string')
    .map((item: any) => item.text)
    .join('\n\n')
    .trim();
  if (!text) throw new Error('OpenAI returned no text');
  return { text, sources: extractOpenAISources(data) };
}

async function runAnthropic(config: ProviderConfig, messages: AridonChatMessage[], system: string, mode: AridonMode, maxTokens: number): Promise<ProviderResponse> {
  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: 'POST',
    headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      system: `${system}\n\n${modeDirective(mode)}`,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `Claude returned ${response.status}`);
  const text = (data?.content || []).filter((item: any) => item?.type === 'text' && typeof item?.text === 'string').map((item: any) => item.text).join('\n\n').trim();
  if (!text) throw new Error('Claude returned no text');
  return { text };
}

async function runGemini(config: ProviderConfig, messages: AridonChatMessage[], system: string, mode: AridonMode, maxTokens: number): Promise<ProviderResponse> {
  const response = await fetch(`${GEMINI_API_ROOT}/${encodeURIComponent(config.model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': env('GEMINI_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `${system}\n\n${modeDirective(mode)}` }] },
      contents: messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })),
      generationConfig: { maxOutputTokens: maxTokens },
    }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `Gemini returned ${response.status}`);
  const text = (data?.candidates || []).flatMap((candidate: any) => candidate?.content?.parts || []).filter((part: any) => typeof part?.text === 'string').map((part: any) => part.text).join('\n\n').trim();
  if (!text) throw new Error('Gemini returned no text');
  return { text };
}

async function runOpenAICompatible(config: ProviderConfig, messages: AridonChatMessage[], system: string, url: string, apiKey: string, mode: AridonMode, maxTokens: number): Promise<ProviderResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'system', content: `${system}\n\n${modeDirective(mode)}` }, ...messages],
      max_tokens: maxTokens,
      stream: false,
    }),
    cache: 'no-store',
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `${config.label} returned ${response.status}`);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error(`${config.label} returned no text`);
  return { text: text.trim() };
}

async function runProvider(config: ProviderConfig, messages: AridonChatMessage[], system: string, task: AridonTask, mode: AridonMode, maxTokens: number) {
  if (config.provider === 'openai') return runOpenAI(config, messages, system, task, mode, maxTokens);
  if (config.provider === 'anthropic') return runAnthropic(config, messages, system, mode, maxTokens);
  if (config.provider === 'gemini') return runGemini(config, messages, system, mode, maxTokens);
  if (config.provider === 'xai') return runOpenAICompatible(config, messages, system, XAI_CHAT_URL, env('XAI_API_KEY'), mode, maxTokens);
  if (config.provider === 'deepseek') return runOpenAICompatible(config, messages, system, DEEPSEEK_CHAT_URL, env('DEEPSEEK_API_KEY'), mode, maxTokens);
  return runOpenAICompatible(config, messages, system, env('ARIDON_LOCAL_LLM_URL'), env('ARIDON_LOCAL_LLM_API_KEY'), mode, maxTokens);
}

export async function routeModel(messages: AridonChatMessage[], system: string, options: RouterOptions = {}): Promise<RouterResult> {
  const routeStarted = Date.now();
  const mode = options.mode || 'fast';
  const classified = classifyTask(messages);
  const classification = options.taskOverride
    ? { task: options.taskOverride, reason: `Task route explicitly set to ${options.taskOverride}.` }
    : mode === 'research'
      ? { task: 'live_research' as AridonTask, reason: 'Research mode explicitly requires current public information.' }
      : classified;
  const candidates = orderedAvailableProviders(classification.task, mode);
  if (!candidates.length) throw new Error('No AI provider is configured for Aridon.');

  const attempts: ProviderAttempt[] = [];
  const inputCharacters = messages.reduce((sum, message) => sum + message.content.length, 0);
  const maxTokens = outputLimit(mode, options.maxOutputTokens);

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const attemptStarted = Date.now();
    try {
      const result = await runProvider(candidate, messages, system, classification.task, mode, maxTokens);
      attempts.push({ provider: candidate.provider, model: candidate.model, ok: true, latencyMs: Date.now() - attemptStarted });
      return {
        text: result.text,
        sources: result.sources || [],
        routing: {
          mode,
          task: classification.task,
          provider: candidate.provider,
          model: candidate.model,
          reason: classification.reason,
          fallbackUsed: index > 0,
          attempts,
          totalLatencyMs: Date.now() - routeStarted,
          inputCharacters,
          outputCharacters: result.text.length,
        },
      };
    } catch (error) {
      const message = cleanError(error);
      console.error(`Aridon model router provider failure: ${candidate.provider}`, message);
      attempts.push({ provider: candidate.provider, model: candidate.model, ok: false, latencyMs: Date.now() - attemptStarted, error: message });
    }
  }

  throw new Error(`Every configured provider failed: ${attempts.map((attempt) => attempt.provider).join(', ')}`);
}

export function getRouterStatus() {
  return {
    mode: 'automatic',
    userModes: [
      { id: 'fast', label: 'Fast', description: 'Shortest useful route for everyday work.' },
      { id: 'think', label: 'Think', description: 'Deeper analysis, tradeoffs and careful synthesis.' },
      { id: 'research', label: 'Research', description: 'Current web-backed work with source capture when available.' },
      { id: 'act', label: 'Act', description: 'Turn a decision into a controlled Action Fabric proposal.' },
    ],
    providers: getProviderCatalog().map(({ provider, label, model, enabled, specialty }) => ({ provider, label, model, enabled, specialty })),
    routes: [
      { task: 'Private / local-only work', preferred: 'Local LLM', fallback: 'Cloud only if the local route is unavailable' },
      { task: 'Live research', preferred: 'OpenAI web route', fallback: 'Next configured provider with a current-data warning' },
      { task: 'Social intelligence', preferred: 'Grok', fallback: 'OpenAI' },
      { task: 'Coding / technical', preferred: 'DeepSeek', fallback: 'OpenAI / Claude / Local' },
      { task: 'Multilingual', preferred: 'Gemini', fallback: 'OpenAI / Claude' },
      { task: 'Long documents', preferred: 'Claude', fallback: 'Gemini / OpenAI / Local' },
      { task: 'Creative / presentations', preferred: 'OpenAI', fallback: 'Gemini / Claude' },
      { task: 'General executive work', preferred: 'OpenAI', fallback: 'Claude / Gemini / Local' },
    ],
  };
}
