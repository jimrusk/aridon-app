const BASE_URL = 'https://api.instantly.ai/api/v2';

export type InstantlyCampaign = {
  id: string;
  name: string;
  status: number;
};

async function parseResponse(response: Response) {
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : `Instantly returned ${response.status}.`;
    throw new Error(message);
  }
  return data;
}

export async function instantlyRequest(
  token: string,
  path: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  return parseResponse(response);
}

export async function listInstantlyCampaigns(token: string) {
  const data = (await instantlyRequest(token, '/campaigns?limit=100')) as {
    items?: InstantlyCampaign[];
  };
  return Array.isArray(data?.items) ? data.items : [];
}

export async function instantlyAnalytics(token: string) {
  const data = await instantlyRequest(token, '/campaigns/analytics/overview');
  return data && typeof data === 'object' ? data : {};
}

export async function addInstantlyLead(
  token: string,
  campaignId: string,
  lead: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    website?: string | null;
    jobTitle?: string | null;
    personalization?: string | null;
  },
) {
  return instantlyRequest(token, '/leads', {
    method: 'POST',
    body: JSON.stringify({
      campaign: campaignId,
      email: lead.email,
      first_name: lead.firstName || undefined,
      last_name: lead.lastName || undefined,
      company_name: lead.companyName || undefined,
      website: lead.website || undefined,
      job_title: lead.jobTitle || undefined,
      personalization: lead.personalization || undefined,
      skip_if_in_workspace: true,
      skip_if_in_campaign: true,
      skip_if_in_list: true,
    }),
  });
}
