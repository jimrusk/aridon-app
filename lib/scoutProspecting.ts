type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string; annotations?: Array<{ type?: string; url?: string }> }> }>;
  error?: { message?: string };
};

export type ScoutProspect = {
  company_name: string;
  website: string;
  location: string;
  fit_score: number;
  fit_reason: string;
  priority_tier: 'A' | 'B' | 'C';
  score_breakdown: {
    icp_fit: number;
    timing_signal: number;
    strategic_value: number;
    evidence_quality: number;
  };
  trigger_event: string;
  buying_signals: string[];
  recommended_buyer_role: string;
  research_notes: string;
  personalization: string;
  source_urls: string[];
};

export type ScoutResearchInput = {
  sellerName: string;
  industry?: string | null;
  sellerProfile: Record<string, unknown>;
  count: number;
  focus?: string;
  intent?: string;
  qualificationThreshold?: number;
  requiredSignals?: string[];
  exclusions?: string[];
};

const DEFAULT_BUYING_SIGNALS = [
  'recent funding, financing, grant award, budget approval, or capital raise',
  'new facility, expansion, construction, infrastructure project, or site selection',
  'new executive, decision-maker change, promotion, or leadership transition',
  'active hiring that reveals a strategic initiative or operational need',
  'public procurement, RFP, RFI, RFQ, bid, pilot, demonstration, or vendor search',
  'regulatory, drought, resilience, energy, water, security, compliance, or capacity pressure',
  'new product, partnership, acquisition, data-center, manufacturing, utility, agriculture, or technology initiative',
  'credible public post, interview, conference appearance, announcement, or trade-news statement showing current intent',
];

export const SECURITY_AI_OS_SIGNALS = [
  'cybersecurity incident, security incident, disclosed cyberattack, or attempted intrusion',
  'data breach, privacy breach, breach notification, unauthorized access, or exposed records',
  'ransomware, cyber extortion, malware, phishing, credential compromise, or account takeover',
  'system intrusion, network compromise, leaked credentials, or suspicious access investigation',
  'security-related outage, disrupted operations, recovery effort, forensic investigation, or incident response',
  'new CISO, CIO, CTO, SOC leader, security engineer, incident-response team, or cyber hiring push',
  'SOC modernization, SIEM, XDR, SOAR, zero-trust, identity, endpoint, or cloud-security modernization',
  'NIST, CMMC, SOC 2, HIPAA, PCI DSS, SEC cyber disclosure, cyber-insurance, audit, or compliance pressure',
  'AI operations, enterprise AI transformation, agentic automation, AI governance, or AI platform initiative',
  'security-operations automation, autonomous monitoring, decision support, orchestration, or response automation',
  'business operating system, digital command center, workflow consolidation, operational intelligence, or platform replacement',
  'security vendor review, managed-security search, technology consolidation, replacement project, procurement, RFP, or pilot',
];

const SECURITY_AI_OS_KEYWORDS = [
  'cybersecurity', 'cyber security', 'security incident', 'security breach', 'data breach', 'breach notification',
  'hacked', 'hacking incident', 'cyberattack', 'cyber attack', 'ransomware', 'malware', 'phishing', 'credential compromise',
  'unauthorized access', 'account takeover', 'network intrusion', 'incident response', 'digital forensics', 'SOC', 'security operations center',
  'SIEM', 'XDR', 'SOAR', 'zero trust', 'identity security', 'CISO', 'CIO', 'CTO', 'security engineer',
  'NIST', 'CMMC', 'SOC 2', 'HIPAA security', 'PCI DSS', 'SEC cyber disclosure', 'cyber insurance',
  'AI operations', 'AIOps', 'AI transformation', 'agentic AI', 'agentic automation', 'AI governance', 'enterprise AI platform',
  'AI operating system', 'AI OS', 'business operating system', 'digital command center', 'workflow automation', 'operations orchestration',
];

const SECURITY_SIGNAL_PATTERN = /cyber|security|hack|breach|ransom|malware|phish|credential|unauthorized access|account takeover|intrusion|incident response|ciso|\bsoc\b|siem|xdr|soar|zero[\s-]?trust|cmmc|nist|ai[\s-]?(os|operating system)|agentic|aiops|security operations|automation/i;

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function stringArray(value: unknown, limit = 12) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, limit)
    : [];
}

function extractText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text as string)
    .join('\n')
    .trim();
}

function extractSources(data: ResponsesPayload) {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      for (const annotation of content.annotations || []) {
        if (annotation.type === 'url_citation' && annotation.url && !seen.has(annotation.url)) {
          seen.add(annotation.url);
          urls.push(annotation.url);
        }
      }
    }
  }
  return urls.slice(0, 40);
}

function parseJson(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error('Scout returned an unreadable prospect analysis.');
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
}

function clampScore(value: unknown) {
  return Math.max(0, Math.min(25, Number(value) || 0));
}

function normalizeTier(value: unknown, score: number): 'A' | 'B' | 'C' {
  const tier = text(value, 1).toUpperCase();
  if (tier === 'A' || tier === 'B' || tier === 'C') return tier;
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  return 'C';
}

export function websiteDomain(value: string | null | undefined) {
  if (!value) return '';
  try {
    const raw = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(raw).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return value.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

export async function researchScoutProspects(input: ScoutResearchInput) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('The AI service is not configured on this deployment.');

  const count = Math.max(3, Math.min(20, Number(input.count) || 10));
  const threshold = Math.max(50, Math.min(95, Number(input.qualificationThreshold) || 75));
  const intent = text(input.intent, 40) || 'customer';
  const focus = text(input.focus, 3000);
  const requestedSignals = (input.requiredSignals || []).map((item) => text(item, 240)).filter(Boolean).slice(0, 12);
  const securityMode = SECURITY_SIGNAL_PATTERN.test([focus, ...requestedSignals].join(' '));
  const requiredSignals = requestedSignals.length ? requestedSignals : securityMode ? SECURITY_AI_OS_SIGNALS : DEFAULT_BUYING_SIGNALS;
  const exclusions = (input.exclusions || []).map((item) => text(item, 300)).filter(Boolean).slice(0, 16);
  const searchVocabulary = securityMode ? SECURITY_AI_OS_KEYWORDS : [];

  const prompt = `You are Scout, Aridon's signal-first B2B Prospect Radar.

Your job is not to build a giant contact list. Find real organizations that fit the seller AND have credible evidence that now may be a good time to approach them.

Use current public web research. Do not invent organizations, people, email addresses, phone numbers, funding events, acquisition history, revenue, or business facts. Prefer first-party and high-quality sources. Reject weak matches rather than filling the quota.

SOURCE PRIORITY:
1. Official company, government, utility, university, investor-relations, procurement, regulatory, grant, or project pages.
2. SEC/regulatory filings and official public records.
3. Reputable recent news and trade publications.
4. Publicly accessible professional-network posts, conference pages, interviews, podcasts, and announcements when they provide a concrete timing signal.
5. Aggregators only as discovery aids; verify important facts with stronger sources whenever possible.

SIGNAL RULES:
- Favor evidence from the last 180 days when possible.
- A signal must indicate a real change, need, initiative, budget, project, pressure, or decision window.
- Do not count generic evergreen marketing copy as a timing signal.
- If a public professional-network post or engagement is visible in web results, you may use it as supporting evidence, but never claim access to private LinkedIn data, private profiles, DMs, or non-public engagement.
- For each prospect, identify the strongest single "why now" trigger and 1-5 supporting signals.
- If no credible timing signal exists, heavily reduce timing_signal and do not return the company unless the total still clears the threshold on strong evidence.
${securityMode ? `- SECURITY / AI-OS MODE: Look specifically for public defensive cybersecurity need signals and enterprise AI/operations modernization signals. Search broadly across vocabulary such as: ${searchVocabulary.join(', ')}.
- Treat breach, ransomware, hacking, intrusion, phishing, malware, and compromise reports only as public commercial/defensive need signals. Do not seek credentials, private-system details, exploit instructions, vulnerability weaponization, or anything that could facilitate intrusion.
- Never frame an organization as a target because it was breached. Frame it as an organization with a documented defensive, recovery, compliance, automation, or modernization need.` : ''}

SELLER: ${input.sellerName}
SELLER INDUSTRY: ${input.industry || 'not specified'}
SELLER PROFILE: ${JSON.stringify(input.sellerProfile).slice(0, 18000)}
PROSPECTING INTENT: ${intent}
ADDITIONAL FOCUS: ${focus || 'Use the saved ideal-customer profile and buying triggers.'}
SIGNALS TO HUNT: ${requiredSignals.join(' | ')}
EXCLUSIONS: ${exclusions.length ? exclusions.join(' | ') : 'No extra exclusions.'}
MINIMUM QUALIFICATION SCORE: ${threshold}/100
TARGET RESULT COUNT: up to ${count}

For every company, score four dimensions from 0 to 25:
1. icp_fit: how closely the organization matches the target profile.
2. timing_signal: strength, specificity, and recency of evidence that now is a sensible time to approach.
3. strategic_value: likely value of a relationship for the stated intent.
4. evidence_quality: strength, recency, and source quality of the public evidence.

fit_score must equal the four dimensions added together.
Priority tier A = 85-100, B = 70-84, C = below 70.
Only return organizations with fit_score >= ${threshold}.
The trigger_event must explain "why now" using a concrete current signal when one exists.
buying_signals should list 1-5 concise evidence-backed signals, with dates or time references when known.
recommended_buyer_role should identify a decision-making role, not an invented person.
personalization should be a truthful one-sentence opening angle that references public evidence without pretending there is an existing relationship.
source_urls must contain URLs that directly support the company fit or timing signal.

Return JSON only:
{
  "prospects": [
    {
      "company_name": "",
      "website": "",
      "location": "",
      "fit_score": 0,
      "priority_tier": "A",
      "score_breakdown": {
        "icp_fit": 0,
        "timing_signal": 0,
        "strategic_value": 0,
        "evidence_quality": 0
      },
      "fit_reason": "",
      "trigger_event": "",
      "buying_signals": [""],
      "recommended_buyer_role": "",
      "research_notes": "",
      "personalization": "",
      "source_urls": [""]
    }
  ]
}`;

  const payload: Record<string, unknown> = {
    model: process.env.CUSTOMER_SALES_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
    input: prompt,
    max_output_tokens: 6500,
    tools: [{ type: 'web_search', search_context_size: 'medium' }],
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const data = (await response.json()) as ResponsesPayload;
  if (!response.ok) throw new Error(data.error?.message || `AI service returned ${response.status}.`);

  const raw = extractText(data);
  if (!raw) throw new Error('Scout returned no readable prospect result.');
  const parsed = parseJson(raw);
  const rawProspects = Array.isArray(parsed.prospects) ? parsed.prospects.slice(0, count) : [];
  const prospects: ScoutProspect[] = [];

  for (const rawProspect of rawProspects) {
    if (!rawProspect || typeof rawProspect !== 'object') continue;
    const item = rawProspect as Record<string, unknown>;
    const companyName = text(item.company_name, 180);
    if (!companyName) continue;

    const scoreRaw = item.score_breakdown && typeof item.score_breakdown === 'object'
      ? item.score_breakdown as Record<string, unknown>
      : {};
    const scoreBreakdown = {
      icp_fit: clampScore(scoreRaw.icp_fit),
      timing_signal: clampScore(scoreRaw.timing_signal),
      strategic_value: clampScore(scoreRaw.strategic_value),
      evidence_quality: clampScore(scoreRaw.evidence_quality),
    };
    const calculated = scoreBreakdown.icp_fit + scoreBreakdown.timing_signal + scoreBreakdown.strategic_value + scoreBreakdown.evidence_quality;
    const fitScore = calculated > 0 ? calculated : Math.max(0, Math.min(100, Number(item.fit_score) || 0));
    if (fitScore < threshold) continue;

    const sourceUrls = stringArray(item.source_urls, 12).filter((url) => /^https?:\/\//i.test(url));
    prospects.push({
      company_name: companyName,
      website: text(item.website, 500),
      location: text(item.location, 180),
      fit_score: fitScore,
      priority_tier: normalizeTier(item.priority_tier, fitScore),
      score_breakdown: scoreBreakdown,
      fit_reason: text(item.fit_reason, 2500),
      trigger_event: text(item.trigger_event, 2000),
      buying_signals: stringArray(item.buying_signals, 8),
      recommended_buyer_role: text(item.recommended_buyer_role, 180),
      research_notes: text(item.research_notes, 4000),
      personalization: text(item.personalization, 2000),
      source_urls: sourceUrls,
    });
  }

  return { prospects, source_urls: extractSources(data), threshold, intent, security_mode: securityMode };
}
