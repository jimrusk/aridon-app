export type DidPublicConfig = {
  configured: boolean;
  provider: 'D-ID';
  mode: 'agents-sdk';
  agentId: string | null;
  clientKey: string | null;
};

function configured(agentId: string, clientKey: string): DidPublicConfig {
  return {
    configured: Boolean(agentId && clientKey),
    provider: 'D-ID',
    mode: 'agents-sdk',
    agentId: agentId || null,
    clientKey: clientKey || null,
  };
}

export function didPublicConfig(): DidPublicConfig {
  const agentId = process.env.DID_AGENT_ID?.trim() || '';
  const clientKey = process.env.DID_CLIENT_KEY?.trim() || '';
  return configured(agentId, clientKey);
}

export function didCreatorPublicConfig(creatorSlug: string): DidPublicConfig {
  const slug = creatorSlug.trim().toLowerCase();
  let agentId = '';
  let clientKey = '';

  if (slug === 'codie-sanchez') {
    agentId = process.env.DID_CODIE_AGENT_ID?.trim() || '';
    clientKey = process.env.DID_CODIE_CLIENT_KEY?.trim() || '';
  } else if (slug === 'maria-wendt') {
    agentId = process.env.DID_MARIA_AGENT_ID?.trim() || '';
    clientKey = process.env.DID_MARIA_CLIENT_KEY?.trim() || '';
  } else if (slug === 'cnm-ingenuity') {
    agentId = process.env.DID_CNM_AGENT_ID?.trim() || '';
    clientKey = process.env.DID_CNM_CLIENT_KEY?.trim() || '';
  }

  if (agentId && clientKey) return configured(agentId, clientKey);
  return didPublicConfig();
}

export function didServerStatus() {
  const publicConfig = didPublicConfig();
  return {
    ...publicConfig,
    apiKeyConfigured: Boolean(process.env.DID_API_KEY?.trim()),
  };
}

export const didUseCases = [
  {
    id: 'executive-avatar',
    name: 'Live Executive Avatar',
    description: 'Give Eva, Heather, Atlas and the executive team real-time visual presence inside the Executive OS.',
  },
  {
    id: 'creator-teacher',
    name: 'Creator Teaching Avatar',
    description: 'Turn approved creator knowledge into an interactive teacher that can listen, answer, explain and speak through a live digital human.',
  },
  {
    id: 'sales-agent',
    name: 'Interactive Sales Agent',
    description: 'Deploy an action-capable visual agent on customer sites to qualify leads, answer questions, and hand off to a human.',
  },
  {
    id: 'customer-success',
    name: 'Customer Success Agent',
    description: 'Provide 24/7 guided onboarding, support, training, and product education with company knowledge.',
  },
  {
    id: 'video-campaigns',
    name: 'Personalized Video Campaigns',
    description: 'Turn approved sales, marketing and training scripts into localized avatar-led videos at scale.',
  },
  {
    id: 'multilingual',
    name: 'Multilingual Digital Humans',
    description: 'Localize sales and support experiences across languages without rebuilding the operating workflow.',
  },
];
