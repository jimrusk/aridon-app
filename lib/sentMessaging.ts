import crypto from 'crypto';

export type SentChannel = 'sent' | 'sms' | 'whatsapp' | 'rcs';

export type SendSentMessageInput = {
  to: string[];
  text: string;
  channels?: SentChannel[];
  sandbox?: boolean;
  idempotencyKey?: string;
};

type SentApiResponse = {
  success?: boolean;
  data?: unknown;
  error?: { message?: string; code?: string } | null;
  meta?: unknown;
};

const SENT_API_URL = 'https://api.sent.dm/v3/messages';
const E164 = /^\+[1-9]\d{7,14}$/;
const ALLOWED_CHANNELS = new Set<SentChannel>(['sent', 'sms', 'whatsapp', 'rcs']);

function sentApiKey() {
  return (process.env.SENT_API_KEY || process.env.SENT_DM_API_KEY || '').trim();
}

export function sentMessagingConfigured() {
  return Boolean(sentApiKey());
}

export async function sendSentMessage(input: SendSentMessageInput) {
  const apiKey = sentApiKey();
  if (!apiKey) throw new Error('Sent messaging is not connected yet. Add SENT_API_KEY in the server environment.');

  const recipients = [...new Set(input.to.map((value) => value.trim()))];
  if (!recipients.length || recipients.length > 25 || recipients.some((value) => !E164.test(value))) {
    throw new Error('Recipients must contain 1 to 25 valid E.164 phone numbers.');
  }

  const text = input.text.trim();
  if (!text || text.length > 1600) throw new Error('Message text must be between 1 and 1600 characters.');

  const channels = input.channels?.length ? [...new Set(input.channels)] : undefined;
  if (channels?.some((channel) => !ALLOWED_CHANNELS.has(channel))) throw new Error('Unsupported Sent messaging channel.');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'Idempotency-Key': input.idempotencyKey || crypto.randomUUID(),
  };

  const profileId = process.env.SENT_PROFILE_ID?.trim();
  if (profileId) headers['x-profile-id'] = profileId;

  const response = await fetch(SENT_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      to: recipients,
      text,
      ...(channels ? { channel: channels } : {}),
      sandbox: Boolean(input.sandbox),
    }),
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => ({}))) as SentApiResponse;
  if (!response.ok || payload.success === false) {
    const message = payload.error?.message || `Sent returned HTTP ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}
