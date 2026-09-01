export type PublicSafetyAssetClass =
  | 'standard'
  | 'protected'
  | 'mission-critical';

export type PublicSafetyAction =
  | 'collect_evidence'
  | 'revoke_sessions'
  | 'block_destination'
  | 'isolate_endpoint'
  | 'disable_account'
  | 'stop_service'
  | 'disconnect_network';

export type PolicyRequest = {
  assetClass: PublicSafetyAssetClass;
  action: PublicSafetyAction;
  confidence: number;
  approvals?: number;
  breakGlass?: boolean;
  privilegedAuth?: boolean;
  reason?: string;
};

export type PolicyDecision = {
  allowed: boolean;
  mode: 'automatic' | 'approval-required' | 'break-glass' | 'blocked';
  requiredApprovals: number;
  reason: string;
  continuityControls: string[];
};

const disruptiveActions = new Set<PublicSafetyAction>([
  'isolate_endpoint',
  'disable_account',
  'stop_service',
  'disconnect_network',
]);

const reversibleLowImpactActions = new Set<PublicSafetyAction>([
  'collect_evidence',
  'revoke_sessions',
  'block_destination',
]);

export function evaluatePublicSafetyAction(request: PolicyRequest): PolicyDecision {
  const confidence = Math.max(0, Math.min(1, request.confidence));
  const approvals = Math.max(0, request.approvals ?? 0);
  const protectedAsset = request.assetClass !== 'standard';
  const missionCritical = request.assetClass === 'mission-critical';
  const disruptive = disruptiveActions.has(request.action);

  const continuityControls = protectedAsset
    ? [
        'preserve mission service availability',
        'preserve incident evidence before containment',
        'record operator identity and decision',
        'prefer scoped/reversible containment',
      ]
    : ['preserve evidence before containment', 'record response decision'];

  if (request.action === 'collect_evidence') {
    return {
      allowed: true,
      mode: 'automatic',
      requiredApprovals: 0,
      reason: 'Evidence collection is non-disruptive and may proceed automatically.',
      continuityControls,
    };
  }

  if (missionCritical && disruptive) {
    if (
      request.breakGlass &&
      request.privilegedAuth &&
      (request.reason?.trim().length ?? 0) >= 12
    ) {
      return {
        allowed: true,
        mode: 'break-glass',
        requiredApprovals: 0,
        reason:
          'Emergency override accepted with privileged authentication and documented reason.',
        continuityControls: [
          ...continuityControls,
          'activate continuity runbook before disruptive action',
          'notify incident commander immediately',
          'require post-action review',
        ],
      };
    }

    if (approvals >= 2 && confidence >= 0.8) {
      return {
        allowed: true,
        mode: 'approval-required',
        requiredApprovals: 2,
        reason:
          'Mission-critical disruptive containment requires two authorized approvals and high-confidence evidence.',
        continuityControls: [
          ...continuityControls,
          'confirm alternate service path before isolation',
        ],
      };
    }

    return {
      allowed: false,
      mode: 'blocked',
      requiredApprovals: 2,
      reason:
        'Disruptive action blocked for a mission-critical asset until two approvals and a high-confidence threshold are satisfied, or an authenticated break-glass override is used.',
      continuityControls,
    };
  }

  if (protectedAsset && disruptive) {
    if (approvals >= 2 && confidence >= 0.75) {
      return {
        allowed: true,
        mode: 'approval-required',
        requiredApprovals: 2,
        reason:
          'Protected-asset disruptive containment is permitted after two authorized approvals.',
        continuityControls,
      };
    }

    return {
      allowed: false,
      mode: 'approval-required',
      requiredApprovals: 2,
      reason:
        'Protected assets require two authorized approvals for disruptive containment.',
      continuityControls,
    };
  }

  if (reversibleLowImpactActions.has(request.action) && confidence >= 0.75) {
    return {
      allowed: true,
      mode: 'automatic',
      requiredApprovals: 0,
      reason:
        'High-confidence, reversible containment may proceed automatically on a standard asset.',
      continuityControls,
    };
  }

  if (disruptive) {
    if (approvals >= 1 && confidence >= 0.65) {
      return {
        allowed: true,
        mode: 'approval-required',
        requiredApprovals: 1,
        reason:
          'Disruptive containment on a standard asset requires at least one authorized approval.',
        continuityControls,
      };
    }

    return {
      allowed: false,
      mode: 'approval-required',
      requiredApprovals: 1,
      reason:
        'Disruptive containment requires an authorized approval and sufficient confidence.',
      continuityControls,
    };
  }

  return {
    allowed: false,
    mode: 'blocked',
    requiredApprovals: 1,
    reason: 'Action did not satisfy the configured safety policy.',
    continuityControls,
  };
}
