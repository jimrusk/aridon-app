# Aridon Drone Grid Intelligence — Live Operations

## What is live

The production foundation now separates the field gateway, Aridon digital twin, human review, and utility GIS write path.

**Field flow**

`Drone / Dock / Edge Gateway -> /api/grid-intelligence/gateway -> Supabase digital twin -> finding review -> approved ArcGIS sync`

The gateway never dispatches crews and never writes to a utility GIS. It persists evidence and creates recommendations. Outbound GIS writes require a separately authenticated admin request and a human-confirmed finding.

## Persistent tables

- `grid_assets`: one digital-twin row per utility asset.
- `drone_missions`: mission lifecycle and operator approval metadata.
- `grid_gateway_clients`: scoped gateway identities; only SHA-256 hashes of keys are stored.
- `inspection_events`: normalized telemetry and measurement events with payload hashes.
- `inspection_evidence`: RGB, thermal, LiDAR, video or document evidence pointers.
- `grid_findings`: risk score, severity, evidence reasons, review status and recommended action.
- `grid_work_orders`: recommendations and approval state. No automatic dispatch.
- `repair_verifications`: before/after evidence relationship for repair verification flights.
- `grid_integrations`: ArcGIS FeatureServer layer configuration. Tokens are not stored here.
- `grid_integration_sync`: inbound/outbound integration audit trail.

All live grid tables have Row Level Security enabled. Current production access is server-side service-role only until utility-specific tenant policies are designed.

## Provision a drone gateway

Admin route:

`POST /api/grid-intelligence/gateway-clients`

Header:

`x-aridon-grid-admin: <ARIDON_GRID_ADMIN_KEY>`

Body:

```json
{
  "utilityId": "pilot-utility",
  "name": "Dock A gateway",
  "scopes": ["ingest", "twin:read"]
}
```

The response returns the raw `grid_...` key once. Store it in the drone or edge gateway secret manager. Aridon stores only its hash.

The edge gateway then sends inspection events to:

`POST /api/grid-intelligence/gateway`

Header:

`x-aridon-grid-key: <one-time-provisioned-key>`

Example body:

```json
{
  "eventId": "evt-2026-09-02-0001",
  "missionId": "mission-feeder-17-001",
  "missionName": "Feeder 17 North Corridor",
  "missionStatus": "flying",
  "assetId": "TX-09-441",
  "assetType": "transformer",
  "feederId": "17",
  "capturedAt": "2026-09-02T17:00:00Z",
  "droneId": "uas-01",
  "position": { "lat": 35.1, "lon": -106.6, "altitudeM": 42 },
  "telemetry": { "batteryPct": 72, "speedMps": 5.3, "headingDeg": 185 },
  "evidence": {
    "rgbUri": "s3://utility-evidence/example-rgb.jpg",
    "thermalUri": "s3://utility-evidence/example-thermal.tiff",
    "sha256": "optional-source-file-hash"
  },
  "measurements": {
    "thermalC": 91.4,
    "thermalBaselineC": 67.8,
    "vegetationClearanceFt": 18,
    "poleLeanDeg": 0,
    "crackConfidence": 0.03,
    "corrosionConfidence": 0.08,
    "conductorSagFt": 2.1
  }
}
```

The route is idempotent by `utilityId + eventId` and updates the asset digital twin after persistence.

## Read the digital twin

`GET /api/grid-intelligence/twin?assetId=TX-09-441`

Use a gateway key with `twin:read`, or the grid admin credential plus `utilityId`.

The response contains the asset, recent inspection events, evidence, findings, work orders and repair verifications.

## Human review

`POST /api/grid-intelligence/review`

Admin-only. Decisions are `confirmed`, `dismissed`, or `needs_field_check`. Review changes Aridon state only and does not write to the GIS.

## Configure ArcGIS / ArcFM

`POST /api/grid-intelligence/integrations`

Store the FeatureServer layer URL and field mapping in the database. Do **not** store ArcGIS access tokens in the row. Instead set an environment variable beginning with `ARIDON_ARCGIS_` and put that variable's name in `tokenEnvName`.

Example:

```json
{
  "utilityId": "pilot-utility",
  "name": "Distribution Assets",
  "featureLayerUrl": "https://utility.example.com/arcgis/rest/services/Grid/FeatureServer/0",
  "assetIdField": "ASSET_ID",
  "objectIdField": "OBJECTID",
  "tokenEnvName": "ARIDON_ARCGIS_PILOT_TOKEN",
  "enabled": true,
  "fieldMapping": {
    "risk_score": "ARIDON_RISK_SCORE",
    "severity": "ARIDON_SEVERITY",
    "finding": "ARIDON_FINDING",
    "action": "ARIDON_ACTION",
    "inspected_at": "ARIDON_INSPECTED_AT",
    "review_status": "ARIDON_REVIEW_STATUS"
  }
}
```

The cloud connector only accepts HTTPS FeatureServer layer URLs and rejects loopback/private hosts. ArcGIS tokens are sent by authorization header rather than placed in the request URL.

## Import GIS assets

`POST /api/grid-intelligence/arcgis/import`

Admin-approved import pulls up to 500 ArcGIS features per request and upserts them into `grid_assets`. Pagination uses the returned `nextOffset`.

## Write confirmed findings back to GIS

`POST /api/grid-intelligence/arcgis/sync`

Requirements:

1. Grid admin authentication.
2. `approved=true` and `approvedBy` in the request.
3. Enabled ArcGIS integration.
4. A matching Aridon asset.
5. A human-confirmed Aridon finding.
6. A unique matching feature in ArcGIS.

The connector queries the feature first, obtains its object ID, then calls ArcGIS `updateFeatures`. Every attempt gets a `grid_integration_sync` audit row. Ambiguous or missing feature matches are refused.

## Environment variables

```bash
ARIDON_GRID_ADMIN_KEY=
ARIDON_GRID_GATEWAY_KEY=
ARIDON_GRID_DEFAULT_UTILITY_ID=
ARIDON_ARCGIS_PILOT_TOKEN=
```

The bootstrap gateway key is optional. Database-backed scoped gateway credentials are preferred for real pilots.

## Remaining physical dependencies

Software is ready for a real pilot connection. The items that cannot be invented in code are the utility's actual FeatureServer layer/field names and credentials, plus the drone/dock/edge gateway that will send real inspection events.
