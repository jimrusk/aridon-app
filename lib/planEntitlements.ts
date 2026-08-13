export type AridonBusinessPlan = 'beta' | 'launch' | 'growth' | 'command';
export type AridonFeature = 'coreExecutiveTeam' | 'companyBrain' | 'projectsTasks' | 'liveWebResearch' | 'salesWorkspace' | 'externalSalesIntegrations' | 'advancedAutomation';

export function normalizeBusinessPlan(value: string | null | undefined): AridonBusinessPlan {
  const plan = (value || '').trim().toLowerCase();
  if (plan === 'beta' || plan === 'growth' || plan === 'command') return plan;
  return 'launch';
}

const ENTITLEMENTS: Record<AridonBusinessPlan, Record<AridonFeature, boolean>> = {
  beta: {
    coreExecutiveTeam: true,
    companyBrain: true,
    projectsTasks: true,
    liveWebResearch: true,
    salesWorkspace: true,
    externalSalesIntegrations: true,
    advancedAutomation: true,
  },
  launch: {
    coreExecutiveTeam: true,
    companyBrain: true,
    projectsTasks: true,
    liveWebResearch: false,
    salesWorkspace: false,
    externalSalesIntegrations: false,
    advancedAutomation: false,
  },
  growth: {
    coreExecutiveTeam: true,
    companyBrain: true,
    projectsTasks: true,
    liveWebResearch: true,
    salesWorkspace: true,
    externalSalesIntegrations: false,
    advancedAutomation: true,
  },
  command: {
    coreExecutiveTeam: true,
    companyBrain: true,
    projectsTasks: true,
    liveWebResearch: true,
    salesWorkspace: true,
    externalSalesIntegrations: true,
    advancedAutomation: true,
  },
};

export function businessFeatureAllowed(plan: string | null | undefined, feature: AridonFeature) {
  return ENTITLEMENTS[normalizeBusinessPlan(plan)][feature];
}

export function businessPlanLabel(plan: string | null | undefined) {
  const normalized = normalizeBusinessPlan(plan);
  if (normalized === 'launch') return 'Aridon Essentials';
  if (normalized === 'growth') return 'Aridon Growth';
  if (normalized === 'command') return 'Aridon Command';
  return 'Aridon Beta';
}

export function upgradeMessage(feature: AridonFeature) {
  const labels: Record<AridonFeature, string> = {
    coreExecutiveTeam: 'the core executive team',
    companyBrain: 'Company Brain',
    projectsTasks: 'projects and tasks',
    liveWebResearch: 'live-web executive research',
    salesWorkspace: 'automated sales prospecting and sequences',
    externalSalesIntegrations: 'external sales campaign integrations',
    advancedAutomation: 'advanced automation',
  };
  return `${labels[feature]} is not included in Aridon Essentials. Upgrade to a higher Aridon plan to enable it.`;
}
