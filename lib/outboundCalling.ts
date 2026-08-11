export type CallMode = 'human_assisted' | 'ai_opt_in';
export type ComplianceStatus = 'pending' | 'allowed_human_b2b' | 'allowed_ai_opt_in' | 'blocked';

export const outboundCallingPolicy = {
  provider: 'twilio',
  defaultMode: 'human_assisted' as CallMode,
  rules: [
    'Never dial a number on the workspace suppression list.',
    'Human-assisted cold outreach is limited to clearly public business contact numbers and must pass Ethos compliance review.',
    'AI-generated or prerecorded sales calling requires an affirmative consent/relationship basis recorded in Aridon before dialing.',
    'Never spoof caller ID. Use a verified Aridon/customer business number.',
    'Respect local calling hours, entity-specific do-not-call requests, and applicable federal/state restrictions.',
    'Record or transcribe calls only when lawful and configured for the relevant jurisdiction.',
    'No autonomous legal, pricing, contractual, payment, or other consequential commitments. Escalate to a human.',
    'Every call must produce a traceable event, disposition, and next action in Mission Control.'
  ],
  humanHandoffTriggers: [
    'pricing negotiation',
    'contract or legal question',
    'request to purchase',
    'high-value opportunity',
    'angry or distressed recipient',
    'uncertain compliance status',
    'explicit request for a person'
  ]
};

export const callTeam = {
  eva: 'Prioritizes the call queue, coordinates the team, and watches open loops.',
  ledger: 'Scores opportunity value, defines the commercial objective, and owns pipeline conversion.',
  oracle: 'Builds the prospect-specific opening, positioning, objection responses, and follow-up message.',
  ethos: 'Runs the permission/compliance gate and can block a call.',
  atlas: 'Owns telephony, media streaming, provider health, and technical observability.',
  heather: 'Owns call operations, assignments, completion status, and follow-up workflow.'
};

export const callDispositions = [
  'qualified', 'meeting_booked', 'send_information', 'callback_requested', 'not_interested',
  'wrong_contact', 'no_answer', 'voicemail', 'do_not_call', 'follow_up', 'human_handoff'
] as const;

export function twilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_FROM_NUMBER?.trim()
  );
}
