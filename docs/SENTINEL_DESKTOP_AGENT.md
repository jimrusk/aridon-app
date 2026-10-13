# Sentinel Personal Defense - Desktop Agent

Sentinel Personal Defense is designed as one customer security product across Android and computers.

## Windows/macOS desktop scope
Owner-authorized telemetry should include:
- OS/security update and firewall status
- installed application inventory and newly installed software
- startup/persistence changes exposed by supported OS APIs
- browser extension inventory where the browser/user grants access
- suspicious download metadata and file hashes
- security-relevant network connection metadata
- VPN/proxy/DNS configuration changes
- account/login/security notifications
- endpoint security/antimalware status exposed by the OS
- Sentinel account/device correlation with mobile and financial events

## Guardrails
The desktop agent must not capture passwords, keystrokes, MFA secrets, authentication cookies, private document contents, or bypass OS security controls. Deep inspection requires explicit owner/admin permission and uses documented Windows/macOS security interfaces.

## Cross-device correlation
A customer account can associate approved devices. Sentinel correlates events such as:
computer anomaly -> email/account reset -> new banking session -> transaction
and
phone/SIM anomaly -> MFA/account change -> financial event.

Each device remains independently revocable.
