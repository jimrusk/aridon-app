export type MobileSignal = {
  id?: string;
  observedAt: string;
  type: 'app_install'|'permission_change'|'accessibility_service'|'device_admin'|'vpn'|'unknown_source'|'security_setting'|'login_alert'|'password_reset'|'mfa_event'|'sim_change'|'transaction'|'wallet_change'|'other';
  source: 'android'|'notification'|'email'|'bank'|'card'|'user'|'provider';
  summary: string;
  severity?: 0|1|2|3|4|5;
  packageName?: string;
  accountRef?: string;
  amount?: number;
  merchant?: string;
  deviceId?: string;
  ip?: string;
  metadata?: Record<string, string|number|boolean|null>;
};

export type OwnerPermission = {
  capability: string;
  status: 'granted'|'denied'|'restricted_by_android'|'not_supported'|'unknown';
  grantedAt?: string;
  rationale?: string;
};

export type MobileDefenseInput = {
  deviceId: string;
  ownerApproved: boolean;
  ownerApprovalAt?: string;
  permissions?: OwnerPermission[];
  signals: MobileSignal[];
};

export type CorrelatedFinding = {
  title: string;
  score: number;
  confidence: number;
  evidence: MobileSignal[];
  explanation: string;
  nextStep: string;
};

const WEIGHTS: Record<MobileSignal['type'], number> = {
  app_install: 10, permission_change: 14, accessibility_service: 24, device_admin: 22,
  vpn: 12, unknown_source: 18, security_setting: 16, login_alert: 20,
  password_reset: 22, mfa_event: 16, sim_change: 28, transaction: 20,
  wallet_change: 24, other: 5,
};

function clamp(n:number){ return Math.max(0, Math.min(100, Math.round(n))); }
function ts(s:MobileSignal){ return new Date(s.observedAt).getTime(); }

export function analyzeMobileDefense(input: MobileDefenseInput) {
  if (!input.ownerApproved) {
    return { score: 0, disposition: 'owner_approval_required' as const, findings: [], permissionCoverage: permissionCoverage(input.permissions || []) };
  }

  const signals = (input.signals || []).filter(s => Number.isFinite(ts(s))).sort((a,b)=>ts(a)-ts(b)).slice(-1000);
  const findings: CorrelatedFinding[] = [];

  for (let i=0;i<signals.length;i++) {
    const anchor = signals[i];
    const window = signals.filter(s => Math.abs(ts(s)-ts(anchor)) <= 45*60*1000);
    const types = new Set(window.map(s=>s.type));
    const hasAccountEvent = ['login_alert','password_reset','mfa_event','wallet_change'].some(t=>types.has(t as MobileSignal['type']));
    const hasDeviceEvent = ['app_install','permission_change','accessibility_service','device_admin','vpn','unknown_source','sim_change'].some(t=>types.has(t as MobileSignal['type']));
    const hasMoney = types.has('transaction');

    if ((hasAccountEvent && hasMoney) || (hasDeviceEvent && hasAccountEvent) || (hasDeviceEvent && hasMoney)) {
      const unique = [...new Map(window.map(s=>[(s.id || s.observedAt+s.type+s.summary),s])).values()];
      const raw = unique.reduce((sum,s)=>sum+(WEIGHTS[s.type]||5)+(s.severity||0)*2,0);
      const score = clamp(raw + (hasDeviceEvent&&hasAccountEvent&&hasMoney ? 18 : 0));
      const confidence = clamp(45 + Math.min(unique.length,8)*6 + (hasDeviceEvent?5:0)+(hasAccountEvent?5:0)+(hasMoney?5:0));
      findings.push({
        title: hasDeviceEvent&&hasAccountEvent&&hasMoney ? 'Possible device-to-account-to-financial compromise chain' : 'Correlated security activity',
        score, confidence, evidence: unique,
        explanation: 'Multiple independently meaningful events occurred within a 45-minute correlation window. This is an investigative lead, not attribution to a person.',
        nextStep: 'Preserve original evidence, contact affected financial institutions, secure accounts from a trusted device, and provide the timeline to authorized investigators.'
      });
    }
  }

  const dedup = [...new Map(findings.sort((a,b)=>b.score-a.score).map(f=>[f.evidence.map(e=>e.id||e.observedAt+e.type).join('|'),f])).values()].slice(0,20);
  const base = signals.reduce((sum,s)=>sum+(WEIGHTS[s.type]||5),0);
  return {
    score: clamp(base/Math.max(1,Math.sqrt(signals.length))),
    disposition: dedup.some(f=>f.score>=75) ? 'urgent_review' as const : dedup.length ? 'review' as const : 'monitor' as const,
    findings: dedup,
    permissionCoverage: permissionCoverage(input.permissions || []),
    evidencePolicy: {
      attribution: 'Do not identify a person from circumstantial indicators alone.',
      preserveOriginals: true,
      hashExports: true,
      noHackBack: true,
      noCredentialCollection: true,
    }
  };
}

function permissionCoverage(p:OwnerPermission[]) {
  const granted=p.filter(x=>x.status==='granted').length;
  const blocked=p.filter(x=>x.status==='restricted_by_android'||x.status==='not_supported').length;
  return { requested:p.length, granted, blocked, denied:p.filter(x=>x.status==='denied').length,
    note:'Owner approval never overrides Android sandboxing. Sentinel records restricted capabilities rather than attempting to bypass them.' };
}

export const OWNER_SCAN_CAPABILITIES = [
  'installed_app_inventory','package_install_source','runtime_permission_inventory','notification_listener',
  'usage_access','accessibility_service_inventory','device_admin_inventory','vpn_configuration_visibility',
  'unknown_app_install_sources','security_patch_level','play_protect_status','screen_lock_status',
  'developer_options_status','usb_debugging_status','user_selected_files','user_selected_statement_import',
  'owner_forwarded_security_emails','owner_forwarded_bank_alerts'
] as const;
