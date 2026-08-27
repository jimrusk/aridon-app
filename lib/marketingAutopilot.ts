import OpenAI from 'openai';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getServerClient } from './supabase';

export type MarketingConnector = {
  id: string;
  name: string;
  status: 'connected' | 'ready' | 'missing';
  purpose: string;
};

export type MarketingAction = {
  channel: string;
  actionType: string;
  title: string;
  detail: string;
  risk: 'low' | 'medium' | 'high';
  approvalRequired: boolean;
  status: 'queued' | 'executed';
};

export type WebsiteSnapshot = {
  url: string;
  statusCode: number | null;
  reachable: boolean;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  h1Count: number;
  noindex: boolean;
  textCharacters: number;
  fetchedAt: string;
  error?: string;
};

export type MarketingAutopilotReport = {
  healthScore: number;
  headline: string;
  summary: string;
  priorities: string[];
  opportunities: string[];
  actions: MarketingAction[];
  connectors: MarketingConnector[];
  website: WebsiteSnapshot;
  generatedAt: string;
  persisted?: boolean;
  runId?: string | null;
};

function cleanText(value: unknown, max = 4000) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function matchContent(html: string, regex: RegExp) {
  const match = html.match(regex);
  return match?.[1] ? cleanText(match[1], 600) : null;
}

function isPrivateIp(address: string) {
  if (!address) return true;
  if (address === '::1' || address === '0.0.0.0') return true;
  if (address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) return true;
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

async function safeTarget(raw: string) {
  const target = new URL(raw);
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Only http and https websites can be scanned.');
  if (target.username || target.password) throw new Error('Website URLs cannot contain embedded credentials.');
  const hostname = target.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) throw new Error('Local network targets are not allowed.');

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error('Private network targets are not allowed.');
  } else {
    const addresses = await lookup(hostname, { all: true });
    if (!addresses.length || addresses.some((item) => isPrivateIp(item.address))) throw new Error('Private network targets are not allowed.');
  }
  return target;
}

function operatorAuthorizationForTarget(target: URL) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const username = process.env.ARIDON_APP_USERNAME || process.env.ARIDON_USERNAME;
  const password = process.env.ARIDON_APP_PASSWORD || process.env.ARIDON_PASSWORD;
  if (!configured || !username || !password) return null;
  try {
    const appUrl = new URL(configured);
    if (appUrl.hostname !== target.hostname) return null;
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  } catch {
    return null;
  }
}

export async function scanMarketingWebsite(rawUrl: string): Promise<WebsiteSnapshot> {
  const fetchedAt = new Date().toISOString();
  try {
    const target = await safeTarget(rawUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const authorization = operatorAuthorizationForTarget(target);
    const response = await fetch(target, {
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Aridon-Marketing-Autopilot/1.0',
        ...(authorization ? { Authorization: authorization } : {}),
      },
    });
    clearTimeout(timer);
    const html = (await response.text()).slice(0, 1_500_000);
    const title = matchContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDescription = matchContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || matchContent(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
    const canonical = matchContent(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
      || matchContent(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
    const robots = matchContent(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i) || '';
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    const textCharacters = cleanText(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '), 200_000).length;
    return {
      url: target.toString(),
      statusCode: response.status,
      reachable: response.ok,
      title,
      metaDescription,
      canonical,
      h1Count,
      noindex: /noindex/i.test(robots),
      textCharacters,
      fetchedAt,
      ...(response.ok ? {} : { error: `Website returned HTTP ${response.status}.` }),
    };
  } catch (error) {
    return {
      url: cleanText(rawUrl, 1000),
      statusCode: null,
      reachable: false,
      title: null,
      metaDescription: null,
      canonical: null,
      h1Count: 0,
      noindex: false,
      textCharacters: 0,
      fetchedAt,
      error: error instanceof Error ? error.message : 'Website scan failed.',
    };
  }
}

export function marketingConnectors(): MarketingConnector[] {
  return [
    { id: 'website', name: 'Website + SEO', status: 'connected', purpose: 'Technical SEO, landing pages and conversion checks.' },
    { id: 'openai', name: 'Aridon AI', status: process.env.OPENAI_API_KEY ? 'connected' : 'missing', purpose: 'Analysis, strategy, content and campaign generation.' },
    { id: 'analytics', name: 'Google Analytics', status: process.env.GOOGLE_ANALYTICS_PROPERTY_ID ? 'connected' : 'ready', purpose: 'Traffic, conversion and audience performance.' },
    { id: 'search-console', name: 'Google Search Console', status: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ? 'connected' : 'ready', purpose: 'Queries, ranking, indexing and click-through performance.' },
    { id: 'google-ads', name: 'Google Ads', status: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? 'connected' : 'ready', purpose: 'Paid search monitoring and budget recommendations.' },
    { id: 'meta', name: 'Meta Ads', status: process.env.META_ACCESS_TOKEN ? 'connected' : 'ready', purpose: 'Facebook and Instagram paid campaign monitoring.' },
    { id: 'email', name: 'Email Outreach', status: process.env.INSTANTLY_API_KEY || process.env.GOOGLE_CLIENT_ID ? 'connected' : 'ready', purpose: 'Lead nurturing, campaign drafts and follow-up.' },
  ];
}

function deterministicReport(businessName: string, website: WebsiteSnapshot): Omit<MarketingAutopilotReport, 'connectors' | 'website' | 'generatedAt'> {
  const issues: string[] = [];
  let score = website.reachable ? 72 : 30;
  if (!website.title) { issues.push('Add a clear search-focused page title.'); score -= 10; }
  if (!website.metaDescription) { issues.push('Add a persuasive meta description tied to buyer intent.'); score -= 8; }
  if (!website.canonical) { issues.push('Add canonical metadata to strengthen indexing signals.'); score -= 4; }
  if (website.h1Count !== 1) { issues.push(`Use one clear H1 on the scanned page; Aridon found ${website.h1Count}.`); score -= 6; }
  if (website.noindex) { issues.push('Remove the noindex directive if this page should be discoverable.'); score -= 20; }
  if (website.textCharacters < 600) { issues.push('Strengthen the page with useful, specific buyer-facing content.'); score -= 7; }
  if (!issues.length) issues.push('Expand the strongest landing page into channel-specific campaigns and test conversion lift.');

  const actions: MarketingAction[] = [
    {
      channel: 'SEO', actionType: 'website_optimization', title: issues[0],
      detail: 'Autopilot can diagnose and prepare the website change. Material production edits remain approval-gated.',
      risk: 'low', approvalRequired: false, status: 'queued',
    },
    {
      channel: 'Content', actionType: 'content_generation', title: 'Create one buyer-intent content asset from the highest-priority market problem.',
      detail: 'Draft the landing page/article plus reusable social and outreach variants. Draft creation is automatic; external publishing is approval-gated.',
      risk: 'low', approvalRequired: false, status: 'queued',
    },
    {
      channel: 'Conversion', actionType: 'conversion_test', title: 'Test the primary call-to-action against a clearer outcome-based offer.',
      detail: 'Measure qualified leads, meetings and proposals rather than vanity traffic.',
      risk: 'low', approvalRequired: false, status: 'queued',
    },
    {
      channel: 'Paid Media', actionType: 'paid_media_review', title: 'Review paid campaigns for waste, buyer intent and next-budget recommendation.',
      detail: 'Autopilot may analyze and recommend changes. Pausing ads or changing spend requires explicit approval.',
      risk: 'high', approvalRequired: true, status: 'queued',
    },
    {
      channel: 'Distribution', actionType: 'publish_campaign', title: 'Prepare approved content for website, email and social distribution.',
      detail: 'External publishing and outbound messages stay in the approval queue until an authorized operator approves them.',
      risk: 'medium', approvalRequired: true, status: 'queued',
    },
  ];

  return {
    healthScore: Math.max(0, Math.min(100, score)),
    headline: `${businessName} marketing autopilot run complete.`,
    summary: website.reachable
      ? `Aridon scanned the live page, found ${issues.length} immediate optimization lane${issues.length === 1 ? '' : 's'}, and built an execution queue with approval gates for external actions.`
      : 'Aridon could not fully reach the website, so the run shifted to recovery and data-connection priorities instead of inventing performance claims.',
    priorities: issues.slice(0, 3),
    opportunities: [
      'Turn one market problem into a dedicated landing page and campaign.',
      'Connect analytics and search data so future runs optimize from measured outcomes.',
      'Reuse winning content across website, social, email and sales follow-up.',
    ],
    actions,
  };
}

async function aiReport(businessName: string, website: WebsiteSnapshot, connectors: MarketingConnector[]) {
  if (!process.env.OPENAI_API_KEY) return deterministicReport(businessName, website);
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1600,
      messages: [
        {
          role: 'system',
          content: 'You are Aridon Marketing Autopilot. Analyze only supplied evidence. Never invent traffic, rankings, revenue, ad performance or conversions. Return JSON with healthScore 0-100, headline, summary, priorities (3), opportunities (3), actions (5). Each action must contain channel, actionType, title, detail, risk low|medium|high, approvalRequired boolean, status queued. External messages, publishing, ad spend changes, legal commitments and material production website changes MUST require approval. Research, analysis and draft creation may be automatic.',
        },
        {
          role: 'user',
          content: JSON.stringify({ businessName, website, connectors }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(raw);
    const fallback = deterministicReport(businessName, website);
    return {
      healthScore: Number.isFinite(parsed.healthScore) ? Math.max(0, Math.min(100, Math.round(parsed.healthScore))) : fallback.healthScore,
      headline: cleanText(parsed.headline, 300) || fallback.headline,
      summary: cleanText(parsed.summary, 1200) || fallback.summary,
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities.map((x: unknown) => cleanText(x, 400)).filter(Boolean).slice(0, 3) : fallback.priorities,
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.map((x: unknown) => cleanText(x, 400)).filter(Boolean).slice(0, 3) : fallback.opportunities,
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 5).map((item: any) => {
        const highImpact = /publish|send|message|ad spend|budget|pause ad|production website|contract|legal/i.test(`${item?.actionType || ''} ${item?.title || ''} ${item?.detail || ''}`);
        const approvalRequired = Boolean(item?.approvalRequired) || highImpact;
        return {
          channel: cleanText(item?.channel, 100) || 'Marketing',
          actionType: cleanText(item?.actionType, 120) || 'optimization',
          title: cleanText(item?.title, 400) || 'Review marketing opportunity',
          detail: cleanText(item?.detail, 1000) || 'Review the supplied evidence and prepare the next measurable action.',
          risk: item?.risk === 'high' || item?.risk === 'medium' ? item.risk : 'low',
          approvalRequired,
          status: 'queued' as const,
        } satisfies MarketingAction;
      }) : fallback.actions,
    };
  } catch (error) {
    console.error('Marketing Autopilot AI analysis failed; using deterministic fallback.', error);
    return deterministicReport(businessName, website);
  }
}

export async function persistMarketingAutopilotRun(report: MarketingAutopilotReport, options: { trigger: 'manual' | 'daily' | 'connector'; businessName: string; userId?: string | null; tenantId?: string | null }) {
  try {
    const db = getServerClient();
    const { data: run, error } = await db.from('marketing_autopilot_runs').insert({
      trigger: options.trigger,
      business_name: options.businessName,
      status: 'completed',
      health_score: report.healthScore,
      snapshot: report.website,
      report: { headline: report.headline, summary: report.summary, priorities: report.priorities, opportunities: report.opportunities, connectors: report.connectors },
      user_id: options.userId || null,
      tenant_id: options.tenantId || null,
    }).select('id').single();
    if (error) throw error;

    if (report.actions.length) {
      const { error: actionError } = await db.from('marketing_autopilot_actions').insert(report.actions.map((action) => ({
        run_id: run.id,
        channel: action.channel,
        action_type: action.actionType,
        title: action.title,
        detail: action.detail,
        risk: action.risk,
        approval_required: action.approvalRequired,
        status: action.status,
        payload: {},
      })));
      if (actionError) throw actionError;
    }
    return run.id as string;
  } catch (error) {
    console.error('Marketing Autopilot persistence failed.', error);
    return null;
  }
}

export async function runMarketingAutopilot(options: { businessName?: string; website: string; trigger?: 'manual' | 'daily' | 'connector'; persist?: boolean; userId?: string | null; tenantId?: string | null }) {
  const businessName = cleanText(options.businessName, 160) || 'Aridon';
  const website = await scanMarketingWebsite(options.website);
  const connectors = marketingConnectors();
  const generated = await aiReport(businessName, website, connectors);
  const report: MarketingAutopilotReport = {
    ...generated,
    connectors,
    website,
    generatedAt: new Date().toISOString(),
  };
  if (options.persist) {
    const runId = await persistMarketingAutopilotRun(report, {
      trigger: options.trigger || 'manual',
      businessName,
      userId: options.userId,
      tenantId: options.tenantId,
    });
    report.persisted = Boolean(runId);
    report.runId = runId;
  }
  return report;
}
