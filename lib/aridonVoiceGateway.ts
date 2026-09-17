import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { loadSignalWireCredentials, markSignalWireVerified } from './signalwireCredentials';
import { voiceProvider } from './outboundCalling';

export type AridonVoiceTransport = 'signalwire' | 'twilio';

export type AridonVoiceCallRequest = {
  tenantId: string;
  db: SupabaseClient;
  to: string;
  voiceUrl: string;
  statusUrl: string;
};

export type AridonVoiceCallResult = {
  callSid: string;
  status: string;
  transport: AridonVoiceTransport;
  fromNumber: string;
};

function clean(value: string | undefined | null) {
  return String(value || '').trim();
}

export async function aridonVoiceGatewayStatus(tenantId: string, db: SupabaseClient) {
  const signalWire = await loadSignalWireCredentials(tenantId, db);
  if (signalWire) {
    return {
      configured: true,
      transport: 'signalwire' as const,
      fromNumber: signalWire.fromNumber,
      label: 'Aridon Voice Gateway',
    };
  }

  const fallback = voiceProvider();
  if (fallback === 'twilio') {
    return {
      configured: true,
      transport: 'twilio' as const,
      fromNumber: clean(process.env.TWILIO_FROM_NUMBER) || clean(process.env.TWILIO_PHONE_NUMBER),
      label: 'Aridon Voice Gateway',
    };
  }
  if (fallback === 'signalwire') {
    return {
      configured: true,
      transport: 'signalwire' as const,
      fromNumber: clean(process.env.SIGNALWIRE_FROM_NUMBER),
      label: 'Aridon Voice Gateway',
    };
  }

  return { configured: false, transport: null, fromNumber: '', label: 'Aridon Voice Gateway' };
}

export async function placeAridonVoiceCall(request: AridonVoiceCallRequest): Promise<AridonVoiceCallResult> {
  const signalWire = await loadSignalWireCredentials(request.tenantId, request.db);
  const envProvider = voiceProvider();
  const transport: AridonVoiceTransport | null = signalWire ? 'signalwire' : envProvider;
  if (!transport) throw new Error('Aridon Voice Gateway does not have a carrier connection yet.');

  const common = {
    To: request.to,
    Url: request.voiceUrl,
    Method: 'POST',
    StatusCallback: request.statusUrl,
    StatusCallbackEvent: 'initiated ringing answered completed',
    StatusCallbackMethod: 'POST',
  };

  let response: Response;
  let fromNumber = '';

  if (transport === 'signalwire') {
    const credentials = signalWire || {
      space: clean(process.env.SIGNALWIRE_SPACE).replace(/^https?:\/\//i, '').replace(/\.signalwire\.com.*$/i, ''),
      projectId: clean(process.env.SIGNALWIRE_PROJECT_ID),
      apiToken: clean(process.env.SIGNALWIRE_API_TOKEN),
      fromNumber: clean(process.env.SIGNALWIRE_FROM_NUMBER),
    };
    if (!credentials.space || !credentials.projectId || !credentials.apiToken || !credentials.fromNumber) {
      throw new Error('The carrier connection behind Aridon Voice Gateway is incomplete.');
    }
    fromNumber = credentials.fromNumber;
    const params = new URLSearchParams({ ...common, From: fromNumber });
    response = await fetch(`https://${credentials.space}.signalwire.com/api/laml/2010-04-01/Accounts/${encodeURIComponent(credentials.projectId)}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.projectId}:${credentials.apiToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      cache: 'no-store',
    });
  } else {
    const accountSid = clean(process.env.TWILIO_ACCOUNT_SID);
    const authToken = clean(process.env.TWILIO_AUTH_TOKEN);
    fromNumber = clean(process.env.TWILIO_FROM_NUMBER) || clean(process.env.TWILIO_PHONE_NUMBER);
    if (!accountSid || !authToken || !fromNumber) throw new Error('The fallback carrier connection behind Aridon Voice Gateway is incomplete.');
    const params = new URLSearchParams({ ...common, From: fromNumber });
    response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      cache: 'no-store',
    });
  }

  const call = await response.json().catch(() => ({})) as { sid?: string; status?: string; message?: string; error_message?: string };
  if (!response.ok || !call.sid) {
    throw new Error(call.message || call.error_message || `Aridon Voice Gateway carrier returned ${response.status}.`);
  }

  if (transport === 'signalwire' && signalWire) await markSignalWireVerified(request.tenantId, request.db);

  return {
    callSid: call.sid,
    status: call.status || 'initiated',
    transport,
    fromNumber,
  };
}
