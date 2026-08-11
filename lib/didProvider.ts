export type DidPublicConfig = {
  configured: boolean;
  provider: 'D-ID';
  mode: 'agents-sdk';
  agentId: string | null;
  clientKey: string | null;
};

export function didPublicConfig(): DidPublicConfig {
  const agentId = process.env.DID_AGENT_ID?.trim() || '';
  const clientKey = process.env.DID_CLIENT_KEY?.trim() || '';
  return {
    configured: Boolean(agentId && clientKey),
    provider: 'D-ID',
    mode: 'agents-sdk',
    agentId: agentId || null,
    clientKey: clientKey || null,
  };
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
