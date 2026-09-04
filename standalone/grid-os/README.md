# Aridon GridOS Utility Edition

This is the standalone customer application for electric utilities. It is intentionally separate from the general Aridon business OS.

## Customer deployment model

1. One utility gets one dedicated GridOS deployment.
2. Each deployment has its own customer identity, URL and installable PWA.
3. Utility data is isolated by deployment and preferably by a dedicated database project for critical-infrastructure customers.
4. SCADA / AMI / GIS / DERMS / SIEM credentials are unique to that utility.
5. Control actions are disabled by default. Start read-only.
6. Protective relays, deterministic control logic and human operators retain safety authority.

## Install

After deployment, open the utility's GridOS URL in a supported browser and choose Install App / Add to Home Screen. GridOS then launches as its own application window.

## Configure a customer build

Copy `.env.example` to `.env.local` and set the utility name, utility ID, region and customer-specific backend values. Keep `GRIDOS_ALLOW_CONTROL_ACTIONS=false` through discovery and recommendation phases.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm install
npm run build
npm start
```

## Vendor / customer separation

Aridon may operate a separate vendor control plane for licensing, health telemetry and support. It must not be able to issue OT switching commands by default. The customer's operational environment remains the authority for live grid actions.
