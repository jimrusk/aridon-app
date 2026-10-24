# Sentinel Personal Defense - Product & Security Boundary

Copyright (c) 2026 Aridon. All rights reserved.

## Separate product
Sentinel Personal Defense is packaged independently from Aridon Business OS. The Android client lives under `android-sentinel/`; the server-side defensive correlation service is `/api/sentinel-mobile-defense`.

## Customer promise
Owner-authorized mobile security and financial-fraud incident reconstruction:
- inspect Android-exposed app/install-source/security configuration signals
- correlate device, identity/account and financial events
- preserve evidence and produce investigator-ready timelines
- never hack back, steal credentials, bypass Android sandboxing, or attribute a crime without supporting evidence

## Protection requirements before commercial release
- Production signing key must be stored outside source control and injected only by protected CI/release secrets.
- No API keys, signing passwords, banking credentials, tokens, PINs, CVVs, MFA secrets or full card numbers in source or telemetry.
- TLS only.
- Server must authenticate customer/device submissions before accepting production telemetry.
- Per-customer tenant isolation and least-privilege access.
- Encrypt sensitive stored evidence at rest and use retention/deletion controls.
- Evidence exports should include SHA-256 hashes and timestamps.
- Release builds should enable shrinking/obfuscation and disable debugging.
- Maintain SBOM/dependency scanning, secret scanning, code review and signed release artifacts.
- Financial data must use approved APIs or customer-selected imports, never credential scraping.
- Consent must be explicit, revocable and capability-specific.

## Commercial packaging
Product name: Sentinel Personal Defense
Optional descriptor: Mobile + Financial Defense
Licensing model can support individual, family, small-business and enterprise tiers without requiring the Aridon Business OS UI.
