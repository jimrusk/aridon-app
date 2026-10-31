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

export type ProviderConfig = { provider: AridonProvider; label: string; model: string; enabled: boolean; specialty: string };
export type ProviderAttempt = { provider: AridonProvider; model: string; ok: boolean; latencyMs: number; error?: string };
export type RouterSource = { title: string; url: string };
export type RouterOptions = { mode?: AridonMode; taskOverride?: AridonTask; maxOutputTokens?: number };
export type RouterResult = {
  text: string;
  sources: RouterSource[];
  routing: { mode: AridonMode; task: AridonTask; provider: AridonProvider; model: string; reason: string; fallbackUsed: boolean; attempts: ProviderAttempt[]; totalLatencyMs: number; inputCharacters: number; outputCharacters: number };
};
type ProviderResponse = { text: string; sources?: RouterSource[] };

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';
const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/chat/completions';
const env = (name: string) => process.env[name]?.trim() || '';

export function getProviderCatalog(): ProviderConfig[] {
  return [
    { provider: 'openai', label: 'OpenAI', model: env('ARIDON_OPENAI_MODEL') || env('ARIDON_CHAT_MODEL') || env('ARIDON_ADVISOR_MODEL') || 'gpt-5-mini', enabled: Boolean(env('OPENAI_API_KEY')), specialty: 'Live research, general executive work, creative planning and default fallback' },
    { provider: 'anthropic', label: 'Claude', model: env('ARIDON_ANTHROPIC_MODEL') || 'claude-sonnet-4-6', enabled: Boolean(env('ANTHROPIC_API_KEY')), specialty: 'Long-context reading, writing, document-heavy analysis and careful synthesis' },
    { provider: 'gemini', label: 'Gemini', model: env('ARIDON_GEMINI_MODEL') || 'gemini-2.5-flash', enabled: Boolean(env('GEMINI_API_KEY')), specialty: 'Multilingual work, localization and large-context synthesis' },
    { provider: 'xai', label: 'Grok', model: env('ARIDON_XAI_MODEL') || 'grok-4', enabled: Boolean(env('XAI_API_KEY')), specialty: 'Social/X-oriented analysis, conversational framing and trend-oriented work' },
    { provider: 'deepseek', label: 'DeepSeek', model: env('ARIDON_DEEPSEEK_MODEL') || 'deepseek-chat', enabled: Boolean(env('DEEPSEEK_API_KEY')), specialty: 'Coding, technical reasoning and cost-sensitive analytical work' },
    { provider: 'local', label: 'Local LLM', model: env('ARIDON_LOCAL_LLM_MODEL') || 'local-model', enabled: Boolean(env('ARIDON_LOCAL_LLM_URL')), specialty: 'Private or offline work' },
  ];
}

const allText = (messages: AridonChatMessage[]) => messages.map(m => m.content).join('\n').toLowerCase();
export function classifyTask(messages: AridonChatMessage[]): { task: AridonTask; reason: string } {
  const text = allText(messages); const size = messages.reduce((s,m)=>s+m.content.length,0);
  if (/(keep (it )?local|local only|offline model|do not send.*cloud|private model|on[- ]prem|local llm|ollama|lm studio|vllm)/i.test(text)) return { task:'private_local', reason:'The user explicitly requested local or private processing.' };
  if (/(https?:\/\/|www\.|latest|today|current|right now|news|breaking|funding|grant|regulation|competitor|website|look up|research|search|find|verify|recent|market price|who is|contact info)/i.test(text)) return { task:'live_research', reason:'The request may benefit from current or public information.' };
  if (/(twitter|\bx\b|social media|viral|sentiment|influencer|reddit)/i.test(text)) return { task:'social_intelligence', reason:'Social intelligence request.' };
  if (/(code|coding|debug|bug|typescript|javascript|python|sql|api route|repository|github|vercel|build error|function|programming)/i.test(text)) return { task:'coding', reason:'Technical work.' };
  if (/(translate|translation|multilingual|spanish|french|german|japanese|korean|hindi|arabic)/i.test(text)) return { task:'multilingual', reason:'Multilingual work.' };
  if (size > 12000 || /(contract|proposal|report|newsletter|white paper|policy|document|due diligence|memorandum|business plan)/i.test(text)) return { task:'long_context', reason:'Document-heavy work.' };
  if (/(image|visual|logo|mockup|campaign concept|storyboard|illustration|presentation|pitch deck|slides)/i.test(text)) return { task:'creative', reason:'Creative work.' };
  return { task:'general', reason:'Broad executive work.' };
}

function preferredProviders(task: AridonTask, mode: AridonMode): AridonProvider[] {
  if (mode === 'research') return ['openai','xai','gemini','anthropic','deepseek','local'];
  if (mode === 'think' && task === 'general') return ['anthropic','openai','gemini','deepseek','local','xai'];
  if (mode === 'act' && task === 'general') return ['openai','anthropic','gemini','deepseek','local','xai'];
  const map: Record<AridonTask,AridonProvider[]> = {
    private_local:['local','openai','anthropic','gemini','deepseek','xai'], live_research:['openai','xai','gemini','anthropic','deepseek','local'], social_intelligence:['xai','openai','gemini','anthropic','deepseek','local'], coding:['deepseek','openai','anthropic','local','gemini','xai'], multilingual:['gemini','openai','anthropic','local','deepseek','xai'], long_context:['anthropic','gemini','openai','local','deepseek','xai'], creative:['openai','gemini','anthropic','xai','local','deepseek'], general:['openai','anthropic','gemini','local','deepseek','xai'] };
  return map[task];
}
function orderedAvailableProviders(task: AridonTask, mode: AridonMode) { const c=getProviderCatalog(); const m=new Map(c.map(i=>[i.provider,i])); return preferredProviders(task,mode).map(p=>m.get(p)).filter((i):i is ProviderConfig=>Boolean(i?.enabled)); }
const conversationString=(messages:AridonChatMessage[])=>messages.map(m=>`${m.role==='user'?'USER':'ASSISTANT'}: ${m.content}`).join('\n\n');
const cleanError=(e:unknown)=>e instanceof Error?e.message.slice(0,240):'Unknown provider error';
function outputLimit(mode:AridonMode, requested?:number){ if(requested&&Number.isFinite(requested))return Math.max(800,Math.min(6000,Math.round(requested))); return mode==='fast'?1800:mode==='think'?4000:mode==='research'?3600:3000; }
function modeDirective(mode:AridonMode){
  const core='EXECUTION RULE: Do not use the phrase "I can’t do that in this chat" or a cosmetic equivalent as a substitute for work. Before declaring a task unavailable, search/research when public information can advance it, use every connected capability available to you, complete every part that can be completed, and return concrete results. If one external action truly requires a missing connection or owner approval, state only that specific blocker after completing the rest and give the exact next action. Never falsely claim an external action occurred.';
  if(mode==='fast')return `FAST MODE: Give the shortest complete useful answer. ${core}`;
  if(mode==='think')return `THINK MODE: Analyze alternatives and failure modes, then recommend and execute the useful next steps. ${core}`;
  if(mode==='research')return `RESEARCH MODE: Search current public information first, verify with sources, synthesize findings, and complete the assignment. ${core}`;
  return `ACT MODE: Focus on executable business action and carry work through using connected tools. ${core}`;
}
function extractOpenAISources(data:any):RouterSource[]{const sources:RouterSource[]=[];const seen=new Set<string>();for(const output of data?.output||[])for(const content of output?.content||[])for(const a of content?.annotations||[]){if(a?.type==='url_citation'&&a?.url&&!seen.has(a.url)){seen.add(a.url);sources.push({title:a.title||a.url,url:a.url});}}return sources.slice(0,12);}
async function runOpenAI(config:ProviderConfig,messages:AridonChatMessage[],system:string,task:AridonTask,mode:AridonMode,maxTokens:number):Promise<ProviderResponse>{
 const apiKey=env('OPENAI_API_KEY'); const webEnabled=task!=='private_local';
 const response=await fetch(OPENAI_RESPONSES_URL,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:config.model,instructions:`${system}\n\n${modeDirective(mode)}\n\nWEB-FIRST RULE: You have web search available. Use it whenever current facts, companies, people, contacts, products, opportunities, prices, regulations, news, technical documentation, or other public information would improve completion. Do not tell the owner to search for information you can research yourself.`,...(webEnabled?{tools:[{type:'web_search',search_context_size:mode==='research'?'high':'medium'}]}:{}),input:conversationString(messages),max_output_tokens:maxTokens,store:false}),cache:'no-store'});
 const data=await response.json() as any;if(!response.ok)throw new Error(data?.error?.message||`OpenAI returned ${response.status}`);const direct=typeof data?.output_text==='string'?data.output_text.trim():'';const text=direct||(data?.output||[]).flatMap((i:any)=>i?.content||[]).filter((i:any)=>i?.type==='output_text'&&typeof i?.text==='string').map((i:any)=>i.text).join('\n\n').trim();if(!text)throw new Error('OpenAI returned no text');return{text,sources:extractOpenAISources(data)};
}
async function runAnthropic(config:ProviderConfig,messages:AridonChatMessage[],system:string,mode:AridonMode,maxTokens:number):Promise<ProviderResponse>{const r=await fetch(ANTHROPIC_MESSAGES_URL,{method:'POST',headers:{'x-api-key':env('ANTHROPIC_API_KEY'),'anthropic-version':'2023-06-01','Content-Type':'application/json'},body:JSON.stringify({model:config.model,max_tokens:maxTokens,system:`${system}\n\n${modeDirective(mode)}`,messages:messages.map(m=>({role:m.role,content:m.content}))}),cache:'no-store'});const d=await r.json() as any;if(!r.ok)throw new Error(d?.error?.message||`Claude returned ${r.status}`);const text=(d?.content||[]).filter((i:any)=>i?.type==='text').map((i:any)=>i.text).join('\n\n').trim();if(!text)throw new Error('Claude returned no text');return{text};}
async function runGemini(config:ProviderConfig,messages:AridonChatMessage[],system:string,mode:AridonMode,maxTokens:number):Promise<ProviderResponse>{const r=await fetch(`${GEMINI_API_ROOT}/${encodeURIComponent(config.model)}:generateContent`,{method:'POST',headers:{'x-goog-api-key':env('GEMINI_API_KEY'),'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:`${system}\n\n${modeDirective(mode)}`}]},contents:messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:maxTokens}}),cache:'no-store'});const d=await r.json() as any;if(!r.ok)throw new Error(d?.error?.message||`Gemini returned ${r.status}`);const text=(d?.candidates||[]).flatMap((c:any)=>c?.content?.parts||[]).filter((p:any)=>typeof p?.text==='string').map((p:any)=>p.text).join('\n\n').trim();if(!text)throw new Error('Gemini returned no text');return{text};}
async function runOpenAICompatible(config:ProviderConfig,messages:AridonChatMessage[],system:string,url:string,apiKey:string,mode:AridonMode,maxTokens:number):Promise<ProviderResponse>{const headers:Record<string,string>={'Content-Type':'application/json'};if(apiKey)headers.Authorization=`Bearer ${apiKey}`;const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({model:config.model,messages:[{role:'system',content:`${system}\n\n${modeDirective(mode)}`},...messages],max_tokens:maxTokens,temperature:0.2}),cache:'no-store'});const d=await r.json() as any;if(!r.ok)throw new Error(d?.error?.message||`${config.label} returned ${r.status}`);const text=d?.choices?.[0]?.message?.content?.trim?.()||'';if(!text)throw new Error(`${config.label} returned no text`);return{text};}
async function callProvider(config:ProviderConfig,messages:AridonChatMessage[],system:string,task:AridonTask,mode:AridonMode,maxTokens:number){if(config.provider==='openai')return runOpenAI(config,messages,system,task,mode,maxTokens);if(config.provider==='anthropic')return runAnthropic(config,messages,system,mode,maxTokens);if(config.provider==='gemini')return runGemini(config,messages,system,mode,maxTokens);if(config.provider==='xai')return runOpenAICompatible(config,messages,system,XAI_CHAT_URL,env('XAI_API_KEY'),mode,maxTokens);if(config.provider==='deepseek')return runOpenAICompatible(config,messages,system,DEEPSEEK_CHAT_URL,env('DEEPSEEK_API_KEY'),mode,maxTokens);return runOpenAICompatible(config,messages,system,env('ARIDON_LOCAL_LLM_URL'),'',mode,maxTokens);}
export function getRouterStatus(){const providers=getProviderCatalog();return{providers,userModes:['fast','think','research','act'] as AridonMode[],enabledCount:providers.filter(p=>p.enabled).length};}
export async function routeModel(messages:AridonChatMessage[],system:string,options:RouterOptions={}):Promise<RouterResult>{const started=Date.now();const mode=options.mode||'fast';const classified=options.taskOverride?{task:options.taskOverride,reason:'Task was explicitly routed by Aridon.'}:classifyTask(messages);const providers=orderedAvailableProviders(classified.task,mode);if(!providers.length)throw new Error('No AI provider is configured.');const attempts:ProviderAttempt[]=[];const maxTokens=outputLimit(mode,options.maxOutputTokens);for(let index=0;index<providers.length;index++){const config=providers[index];const at=Date.now();try{const result=await callProvider(config,messages,system,classified.task,mode,maxTokens);attempts.push({provider:config.provider,model:config.model,ok:true,latencyMs:Date.now()-at});return{text:result.text,sources:result.sources||[],routing:{mode,task:classified.task,provider:config.provider,model:config.model,reason:classified.reason,fallbackUsed:index>0,attempts,totalLatencyMs:Date.now()-started,inputCharacters:messages.reduce((s,m)=>s+m.content.length,0),outputCharacters:result.text.length}};}catch(error){attempts.push({provider:config.provider,model:config.model,ok:false,latencyMs:Date.now()-at,error:cleanError(error)});}}throw new Error(`Every configured provider failed: ${attempts.map(a=>a.provider).join(', ')}`);}
