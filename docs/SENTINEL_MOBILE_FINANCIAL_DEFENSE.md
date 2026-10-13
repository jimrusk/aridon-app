# Sentinel Mobile + Financial Defense v0.1

Defensive, owner-authorized incident reconstruction for Android and financial-account compromise.

## Full Owner Scan

"Full Owner Scan" means **maximum visibility the owner can legitimately grant**. It does not bypass Android sandboxing, exploit the device, root the phone, read another app's private storage, capture credentials, or silently enable restricted permissions.

The collector should request capabilities individually, explain why each is needed, and record one of:
- granted
- denied
- restricted_by_android
- not_supported

A denial never triggers a bypass attempt.

## Signals

The correlation engine accepts owner-authorized observations for app installs, permission changes, accessibility services, device-admin changes, VPNs, unknown-source installs, login alerts, password resets, MFA events, SIM changes, transactions and wallet changes.

The engine correlates events in a 45-minute window to identify potential:
device event -> account event -> financial event
chains.

A correlation is an investigative lead, **not attribution to a person**.

## Evidence

Preserve original records. Export copies with timestamps and cryptographic hashes in the native Android collector. Never collect passwords, PINs, MFA secrets, CVVs or full payment-card numbers. Account references should be tokenized or last-four only.

## Android deployment tiers

1. Standard owner-installed app: user-granted runtime/special permissions and user-selected files.
2. Managed-device / Device Policy Controller: stronger enterprise telemetry where Android Enterprise permits it.
3. ADB-assisted owner diagnostics: explicit local owner action for diagnostic exports only.

None of these modes defeat Android security boundaries.

## Financial integrations

Use institution-approved APIs/open-banking providers or owner-imported statements/alerts. Do not scrape banking credentials.

## Response

Sentinel preserves evidence, reconstructs the timeline, recommends account containment and prepares an investigator-ready packet. It never hacks back and never names a suspect solely from circumstantial telemetry.
