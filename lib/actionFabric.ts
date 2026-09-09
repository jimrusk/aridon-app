import 'server-only';

import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  base64UrlMessage,
  decryptToken,
  GMAIL_EMAIL_COOKIE,
  GMAIL_REFRESH_COOKIE,
  refreshGoogleAccessToken,
  safeHeader,
} from './gmail';
import {
  graphJson,
  microsoftAccessToken,
  MS_EMAIL_COOKIE,
} from './microsoft365';
import {
  auditExecutiveAction,
  connectedExecutiveActor,
  externalActionsEnabled,
} from './executiveOps';

export const ACTION_ADAPTER_KEYS = ['manual', 'internal_task', 'email_send', 'calendar_create'] as const;
export type ActionAdapterKey = (typeof ACTION_ADAPTER_KEYS)[number];

export type ActionFabricRecord = {
  id: string;
  tenant_id: string;
  executive: string;
  action_type: string;
  title: string;
  payload: Record<string, unknown> | null;
  rationale?: string | null;
  expected_outcome?: string | null;
  risk_level: string;
  approval_required: boolean;
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  adapter_key?: string | null;
  attempt_count?: number | null;
  result?: Record<string, unknown> | null;
  error?: string | null;
};

export type ActionAdapterDefinition = {
  key: ActionAdapterKey;
  label: string;
  category: 'internal' | 'external' | 'manual';
  requiresApproval: boolean;
  connection: 'none' | 'workspace';
  description: string;
};

export const ACTION_ADAPTERS: ActionAdapterDefinition[] = [
  {
    key: 'internal_task',
    label: 'Create internal task',
    category: 'internal',
    requiresApproval: false,
    connection: 'none',
    description: 'Creates a tenant-scoped task inside the Aridon workspace.',
  },
  {
    key: 'email_send',
    label: 'Send approved email',
    category: 'external',
    requiresApproval: true,
    connection: 'workspace',
    description: 'Sends through the connected Google Workspace or Microsoft 365 account after owner approval.',
  },
  {
    key: 'calendar_create',
    label: 'Create approved calendar event',
    category: 'external',
    requiresApproval: true,
    connection: 'workspace',
    description: 'Creates an event through the connected Google or Microsoft calendar after owner approval.',
  },
  {
    key: 'manual',
    label: 'Manual / not connected yet',
    category: 'manual',
    requiresApproval: true,
    connection: 'none',
    description: 'Keeps the action controlled until an execution adapter is available.',
  },
];

export class ActionFabricBlockedError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 409, code = 'blocked') {
    super(message);
    this.name = 'ActionFabricBlockedError';
    this.status = status;
    this.code = code;
  }
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function payloadFor(action: ActionFabricRecord) {
  return action.payload && typeof action.payload === 'object' && !Array.isArray(action.payload)
    ? action.payload
    : {};
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function validDate(value: string) {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

export function normalizeActionAdapterKey(value: unknown, actionType?: unknown): ActionAdapterKey {
  const requested = text(value, 80).toLowerCase();
  if ((ACTION_ADAPTER_KEYS as readonly string[]).includes(requested)) return requested as ActionAdapterKey;

  const type = text(actionType, 80).toLowerCase();
  if (/^(email|email_send|gmail|outlook|send_email)$/.test(type)) return 'email_send';
  if (/^(calendar|calendar_create|meeting|schedule|create_event)$/.test(type)) return 'calendar_create';
  if (/^(task|internal_task|create_task|workflow_task)$/.test(type)) return 'internal_task';
  return 'manual';
}

export function actionAdapterDefinition(key: ActionAdapterKey) {
  return ACTION_ADAPTERS.find((adapter) => adapter.key === key) || ACTION_ADAPTERS[ACTION_ADAPTERS.length - 1];
}

async function ensureExternalExecutionAllowed(request: NextRequest) {
  const actor = connectedExecutiveActor(request);
  if (!actor.connected || !actor.provider) {
    throw new ActionFabricBlockedError(
      'Connect Google Workspace or Microsoft 365 before executing this external action.',
      409,
      'connection_required',
    );
  }
  if (!(await externalActionsEnabled(request))) {
    throw new ActionFabricBlockedError(
      'Executive Operations emergency stop is active. External actions remain blocked.',
      423,
      'emergency_stop',
    );
  }
  return actor;
}

async function createInternalTask(db: SupabaseClient, action: ActionFabricRecord) {
  const payload = payloadFor(action);
  const title = text(payload.title, 500) || action.title;
  const owner = text(payload.owner, 160) || action.executive || 'Eva';
  const requestedPriority = text(payload.priority, 30).toLowerCase();
  const priority = ['low', 'medium', 'high', 'urgent'].includes(requestedPriority) ? requestedPriority : 'medium';

  const { data, error } = await db
    .from('customer_tasks')
    .insert({
      tenant_id: action.tenant_id,
      title,
      owner,
      priority,
      status: 'open',
    })
    .select('id,title,owner,priority,status,created_at')
    .single();
  if (error) throw error;

  return {
    adapter: 'internal_task',
    created: true,
    task: data,
    completedAt: new Date().toISOString(),
  };
}

async function sendGoogleEmail(request: NextRequest, action: ActionFabricRecord) {
  const payload = payloadFor(action);
  const to = safeHeader(text(payload.to, 254), 254);
  const subject = safeHeader(text(payload.subject, 300), 300);
  const messageBody = text(payload.body, 50_000);
  if (!validEmail(to) || !subject || !messageBody) {
    throw new ActionFabricBlockedError('Email actions require a valid recipient, subject, and body.', 400, 'invalid_payload');
  }

  const encryptedRefreshToken = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
  if (!encryptedRefreshToken) {
    throw new ActionFabricBlockedError('Google Workspace is not connected for this session.', 409, 'connection_required');
  }
  const accessToken = await refreshGoogleAccessToken(decryptToken(encryptedRefreshToken));
  const connectedEmail = request.cookies.get(GMAIL_EMAIL_COOKIE)?.value || '';
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
  const headers = [
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ];
  if (connectedEmail) headers.splice(1, 0, `From: ${safeHeader(connectedEmail, 254)}`);
  const raw = `${headers.join('\r\n')}\r\n\r\n${messageBody.replace(/\r?\n/g, '\r\n')}`;

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: base64UrlMessage(raw) }),
    cache: 'no-store',
  });
  const data = await response.json() as { id?: string; threadId?: string; error?: { message?: string } };
  if (!response.ok || !data.id) throw new Error(data.error?.message || 'Gmail rejected the message.');

  const sentAt = new Date().toISOString();
  await auditExecutiveAction({
    actorEmail: connectedEmail,
    executive: action.executive,
    action: 'action_fabric_email_sent',
    channel: 'gmail',
    target: to,
    approved: true,
    metadata: { actionId: action.id, subject, messageId: data.id, threadId: data.threadId || '' },
  });
  return { adapter: 'email_send', provider: 'google', sent: true, to, subject, messageId: data.id, threadId: data.threadId || '', sentAt };
}

async function sendMicrosoftEmail(request: NextRequest, action: ActionFabricRecord) {
  const payload = payloadFor(action);
  const to = text(payload.to, 254);
  const subject = text(payload.subject, 300);
  const body = text(payload.body, 50_000);
  if (!validEmail(to) || !subject || !body) {
    throw new ActionFabricBlockedError('Email actions require a valid recipient, subject, and body.', 400, 'invalid_payload');
  }

  const accessToken = await microsoftAccessToken(request);
  await graphJson('/me/sendMail', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'Text', content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });

  const actorEmail = request.cookies.get(MS_EMAIL_COOKIE)?.value || '';
  const sentAt = new Date().toISOString();
  await auditExecutiveAction({
    actorEmail,
    executive: action.executive,
    action: 'action_fabric_email_sent',
    channel: 'outlook',
    target: to,
    approved: true,
    metadata: { actionId: action.id, subject },
  });
  return { adapter: 'email_send', provider: 'microsoft', sent: true, to, subject, sentAt };
}

async function sendEmail(request: NextRequest, action: ActionFabricRecord) {
  const actor = await ensureExternalExecutionAllowed(request);
  if (actor.provider === 'google') return sendGoogleEmail(request, action);
  if (actor.provider === 'microsoft') return sendMicrosoftEmail(request, action);
  throw new ActionFabricBlockedError('No supported email provider is connected.', 409, 'connection_required');
}

async function createGoogleCalendarEvent(request: NextRequest, action: ActionFabricRecord) {
  const payload = payloadFor(action);
  const summary = text(payload.summary, 500) || action.title;
  const description = text(payload.description, 10_000);
  const location = text(payload.location, 1_000);
  const start = text(payload.start, 100);
  const end = text(payload.end, 100);
  const timeZone = text(payload.timeZone, 100) || process.env.ARIDON_DEFAULT_TIMEZONE?.trim() || 'America/Denver';
  const attendees = Array.isArray(payload.attendees)
    ? payload.attendees.map((value) => text(value, 254)).filter(validEmail).slice(0, 50)
    : [];
  if (!summary || !validDate(start) || !validDate(end) || Date.parse(end) <= Date.parse(start)) {
    throw new ActionFabricBlockedError('Calendar actions require a title and valid start/end times.', 400, 'invalid_payload');
  }

  const encryptedRefreshToken = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
  if (!encryptedRefreshToken) throw new ActionFabricBlockedError('Google Workspace is not connected for this session.', 409, 'connection_required');
  const accessToken = await refreshGoogleAccessToken(decryptToken(encryptedRefreshToken));
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary,
      description: description || undefined,
      location: location || undefined,
      start: { dateTime: new Date(start).toISOString(), timeZone },
      end: { dateTime: new Date(end).toISOString(), timeZone },
      attendees: attendees.length ? attendees.map((email) => ({ email })) : undefined,
    }),
    cache: 'no-store',
  });
  const data = await response.json() as { id?: string; htmlLink?: string; error?: { message?: string } };
  if (!response.ok || !data.id) throw new Error(data.error?.message || 'Google Calendar rejected the event.');

  const actorEmail = request.cookies.get(GMAIL_EMAIL_COOKIE)?.value || '';
  const createdAt = new Date().toISOString();
  await auditExecutiveAction({
    actorEmail,
    executive: action.executive,
    action: 'action_fabric_calendar_created',
    channel: 'google_calendar',
    target: summary,
    approved: true,
    metadata: { actionId: action.id, eventId: data.id, attendees, start, end, location },
  });
  return { adapter: 'calendar_create', provider: 'google', created: true, eventId: data.id, link: data.htmlLink || '', summary, start, end, createdAt };
}

async function createMicrosoftCalendarEvent(request: NextRequest, action: ActionFabricRecord) {
  const payload = payloadFor(action);
  const summary = text(payload.summary, 500) || action.title;
  const description = text(payload.description, 10_000);
  const location = text(payload.location, 1_000);
  const start = text(payload.start, 100);
  const end = text(payload.end, 100);
  const attendees = Array.isArray(payload.attendees)
    ? payload.attendees.map((value) => text(value, 254)).filter(validEmail).slice(0, 50)
    : [];
  if (!summary || !validDate(start) || !validDate(end) || Date.parse(end) <= Date.parse(start)) {
    throw new ActionFabricBlockedError('Calendar actions require a title and valid start/end times.', 400, 'invalid_payload');
  }

  const accessToken = await microsoftAccessToken(request);
  const event = await graphJson<{ id?: string; webLink?: string }>('/me/events', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      subject: summary,
      body: { contentType: 'Text', content: description },
      start: { dateTime: new Date(start).toISOString(), timeZone: 'UTC' },
      end: { dateTime: new Date(end).toISOString(), timeZone: 'UTC' },
      location: location ? { displayName: location } : undefined,
      attendees: attendees.map((email) => ({ emailAddress: { address: email }, type: 'required' })),
    }),
  });

  const actorEmail = request.cookies.get(MS_EMAIL_COOKIE)?.value || '';
  const createdAt = new Date().toISOString();
  await auditExecutiveAction({
    actorEmail,
    executive: action.executive,
    action: 'action_fabric_calendar_created',
    channel: 'outlook_calendar',
    target: summary,
    approved: true,
    metadata: { actionId: action.id, eventId: event.id || '', attendees, start, end, location },
  });
  return { adapter: 'calendar_create', provider: 'microsoft', created: true, eventId: event.id || '', link: event.webLink || '', summary, start, end, createdAt };
}

async function createCalendarEvent(request: NextRequest, action: ActionFabricRecord) {
  const actor = await ensureExternalExecutionAllowed(request);
  if (actor.provider === 'google') return createGoogleCalendarEvent(request, action);
  if (actor.provider === 'microsoft') return createMicrosoftCalendarEvent(request, action);
  throw new ActionFabricBlockedError('No supported calendar provider is connected.', 409, 'connection_required');
}

export async function executeActionAdapter(input: {
  request: NextRequest;
  db: SupabaseClient;
  action: ActionFabricRecord;
}) {
  const adapterKey = normalizeActionAdapterKey(input.action.adapter_key, input.action.action_type);
  switch (adapterKey) {
    case 'internal_task':
      return createInternalTask(input.db, input.action);
    case 'email_send':
      return sendEmail(input.request, input.action);
    case 'calendar_create':
      return createCalendarEvent(input.request, input.action);
    default:
      throw new ActionFabricBlockedError(
        'This action is approved but still needs a connected execution adapter. Keep it in the queue or choose an executable action type.',
        409,
        'manual_required',
      );
  }
}
