# Aridon Drone Grid Intelligence

## Product thesis

Keep the utility's GIS, asset registry and work-order system. Add a drone-native intelligence layer that can collect closer physical-condition evidence, score risk, recommend work and verify repairs.

**Core flow**

`Drone / Dock -> RGB + Thermal + LiDAR -> Aridon Ingestion -> Analysis -> Asset Digital Twin -> Human Approval -> GIS / CMMS -> Repair -> Verification Flight`

The MVP is deliberately approval-gated. It does not autonomously dispatch a repair crew or write to a utility GIS without an approved integration action.

## What is implemented in this branch

- `/grid-intelligence` demonstration dashboard.
- `/api/grid-intelligence/ingest` normalized drone/inspection event contract.
- `/api/grid-intelligence/analyze` deterministic first-pass risk engine.
- `/api/grid-intelligence/gis-export` approval-gated ArcGIS/ArcFM-style feature update payload.
- `grid-intelligence-schema.sql` Postgres/Supabase data model for assets, missions, evidence, findings, work orders, repair verification and sync logs.

The scoring engine is an MVP contract, not a validated utility safety model. It gives the application a stable interface while visual, thermal and LiDAR models are trained and validated.

## Pilot hardware reference configuration

### Aircraft

Enterprise multirotor or VTOL aircraft with:

- RTK/PPK positioning.
- Obstacle sensing and programmable geofencing.
- Payload support for zoom RGB, radiometric thermal and/or LiDAR.
- Encrypted storage and secure SDK/API access where available.
- Weather envelope appropriate for the pilot utility territory.
- Remote identification and operating controls required by the applicable aviation rules.

### Sensor stack

**RGB / zoom**
- High-resolution stills and video.
- Optical zoom for conductor hardware, insulators, crossarms, connectors, bushings and labels.
- Metadata must include timestamp, position, camera orientation and mission ID.

**Radiometric thermal**
- Per-pixel or spot temperature measurement, not display-only thermal video.
- Capture ambient conditions and asset baseline for comparative scoring.
- Target use cases: connectors, transformers, switches, breakers and other abnormal heat patterns.

**LiDAR / ranging**
- Vegetation distance.
- Pole and structure geometry.
- Conductor sag and clearance.
- Right-of-way encroachment.

### Dock / edge gateway

- Weatherized landing and recharge station.
- Local mission manifest and health check.
- Encrypted upload to Aridon object storage.
- Buffer data when backhaul is unavailable.
- SHA-256 evidence hashing for chain-of-custody records.

## Software modules

### 1. Mission Planner

Inputs:
- feeder / corridor geometry,
- no-fly or utility exclusion areas,
- priority assets,
- dock locations,
- weather and operating envelope,
- battery reserve rules.

Outputs:
- approval-ready flight plan,
- inspection zone list,
- expected evidence checklist,
- safe-return thresholds.

### 2. Ingestion Gateway

Stable event shape:

```json
{
  "missionId": "mission-17-north",
  "assetId": "TX-09-441",
  "assetType": "transformer",
  "droneId": "uas-01",
  "capturedAt": "2026-09-02T17:00:00Z",
  "position": { "lat": 0, "lon": 0, "altitudeM": 0 },
  "telemetry": { "batteryPct": 74, "speedMps": 4.2, "headingDeg": 182 },
  "evidence": {
    "rgbUri": "object://...",
    "thermalUri": "object://...",
    "lidarUri": "object://...",
    "sha256": "..."
  },
  "measurements": {
    "thermalC": 91.4,
    "thermalBaselineC": 67.8,
    "vegetationClearanceFt": 18,
    "poleLeanDeg": 0,
    "conductorSagFt": 2.1
  }
}
```

### 3. Vision / sensor analysis

Production model families should be separated rather than forcing one model to do everything:

- component detection and asset-ID association,
- insulator / hardware defect detection,
- corrosion and surface-condition segmentation,
- thermal anomaly detection relative to baseline,
- vegetation segmentation and distance measurement,
- structure lean and conductor geometry,
- evidence-quality scoring.

Each finding should include:
- asset ID,
- finding type,
- severity,
- risk score,
- model confidence,
- reasons / measurements,
- source evidence,
- model version,
- review state.

### 4. Asset Digital Twin

The digital twin is the long-term memory layer. For every asset it should keep:

- GIS identifiers and geometry,
- asset type / manufacturer / age where available,
- inspection history,
- thermal trend,
- visual condition trend,
- vegetation trend,
- open and closed work orders,
- before/after repair evidence,
- current condition score.

### 5. Human approval gate

No external work order or GIS mutation should occur solely from an unreviewed model output. The utility can configure thresholds, for example:

- Critical: immediate operator review.
- High: priority review queue.
- Medium: maintenance planning queue.
- Low: trend and compare.

### 6. GIS / ArcFM adapter

Preferred integration pattern:

1. Read GIS feature IDs / geometry into Aridon.
2. Associate evidence and findings with the same external asset ID.
3. Human confirms a finding.
4. Aridon generates a provider-specific update payload.
5. Server-side integration service writes approved fields / attachments to the utility feature service.
6. Sync log stores outcome and external object ID.

Suggested outbound attributes:

- `ARIDON_RISK_SCORE`
- `ARIDON_SEVERITY`
- `ARIDON_FINDING`
- `ARIDON_ACTION`
- `ARIDON_INSPECTED_AT`
- `ARIDON_REVIEW_STATUS`

### 7. Work order / CMMS adapter

After approval, create a recommended maintenance action with:

- utility asset ID,
- priority,
- finding summary,
- location,
- evidence links,
- recommended response window,
- inspection history.

The target adapter can be selected per utility rather than coupling the product to one vendor.

### 8. Repair verification

Once a work order is marked complete:

1. Schedule a verification capture.
2. Reproduce the relevant camera angle / thermal condition where practical.
3. Compare before and after evidence.
4. Return `passed`, `failed` or `manual_review`.
5. Close the audit loop only after the configured approval step.

## First utility pilot

Keep the first test narrow enough to prove value quickly.

**Recommended pilot shape**

- One distribution feeder or a 10-20 mile corridor.
- 100-250 mapped utility assets.
- One enterprise aircraft and one trained operating crew.
- RGB + radiometric thermal on every target asset.
- LiDAR on a subset where clearance / geometry adds value.
- One GIS asset export from the utility.
- One controlled maintenance workflow.
- Repeat inspection after selected repairs.

### Pilot success metrics

- Percent of mapped assets captured with usable evidence.
- Findings per 100 assets, by severity.
- Human-confirmed precision for each defect category.
- Time from capture to reviewed finding.
- Field inspections avoided or better prioritized.
- Repair verification turnaround.
- GIS association accuracy.
- Cost per inspected mile / asset compared with the utility's current method.

## Validation gates before live production

1. **Aviation:** obtain all required operating approvals, pilot/operator qualifications and utility permissions for the intended flight profile, including any beyond-visual-line-of-sight operation.
2. **Electrical safety:** utility operating procedures control stand-off distances, energized-equipment access and emergency response.
3. **Model validation:** establish per-defect precision/recall targets using utility-reviewed labeled data.
4. **Cybersecurity:** private object storage, encryption in transit/at rest, least-privilege service accounts, audit logs and tenant isolation.
5. **Privacy:** route planning and capture policies must avoid unnecessary imagery of people or private property.
6. **Fail-safe behavior:** battery reserve, lost-link, weather, geofence and return-to-home rules are controlled by the approved flight system, not a generative model.
7. **Human authority:** utility personnel retain approval for consequential GIS/work-order actions.

## Commercial packaging

### Aridon Grid Intelligence Pilot

A simple first commercial offer can include:

- corridor digitization / GIS import,
- mission design,
- inspection capture,
- AI-assisted findings,
- operator review dashboard,
- GIS-ready export,
- pilot results report,
- optional verification re-flight.

Then move to recurring service by inspected mile, asset count, managed feeder or utility territory.

## Next engineering increments

1. Persist ingestion events/evidence in Supabase + object storage.
2. Add tenant-aware RLS aligned to Aridon's customer model.
3. Add signed direct-upload URLs for large imagery / LiDAR objects.
4. Add background analysis queue.
5. Add geospatial map UI and real feeder geometry.
6. Add vendor-specific drone gateway adapter.
7. Add real ArcGIS Feature Service adapter with utility-supplied test credentials.
8. Add CMMS adapter.
9. Add model registry and validation metrics.
10. Add verification-flight scheduling and before/after comparison.
