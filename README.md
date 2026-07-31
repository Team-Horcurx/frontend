# GVMC Change-Detection Dashboard — Frontend

React + Vite dashboard for the GVMC (Greater Visakhapatnam Municipal Corporation) satellite-powered property tax assessment system. Detects new/expanded building footprints across 98 wards using Sentinel-2 imagery and surfaces flagged properties for field verification.

## What It Does

1. **Field Officer View** — Interactive Leaflet map of flagged properties per ward, verification status chips, AI-powered plain-English explanation of why each property was flagged, and a natural-language chatbot (Bedrock Agent)
2. **Supervisor View** — Ward-level stats and AI-generated contextual alerts for staff prioritization
3. **Commissioner View** — City-wide choropleth heatmap, top 10 wards by unassessed count, AI daily brief with deployment suggestions
4. **Admin Panel** — Upload real GVMC CSV data, adjust NDBI detection threshold, trigger EC2 pipeline refresh

## Getting Started

```bash
npm install

# Create .env in project root:
echo "VITE_API_URL=https://your-api-gateway-url.amazonaws.com" > .env

npm start   # http://localhost:5173
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 6 |
| Routing | React Router v6 |
| Maps | Leaflet 1.9 + react-leaflet + leaflet-side-by-side |
| State | Redux Toolkit v2 (RTK slices) |
| API | Axios (via `src/api/client.js`) |
| Testing | Vitest |
| Dates | dayjs |
| Icons | react-icons v5 |
| Deployment | AWS Amplify (auto-deploys on push to `main`) |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API Gateway base URL (set once in Amplify console after backend deploy) |

## Routes

| Path | View | Purpose |
|------|------|---------|
| `/` | HomePage | Role selection |
| `/officer` | FieldOfficerView | Map + property list + verification + AI |
| `/supervisor` | SupervisorView | Ward stats + AI alerts |
| `/commissioner` | CommissionerView | City heatmap + AI brief |
| `/admin` | AdminPanel | CSV upload + config + pipeline |

No authentication — all routes are fully open (demo mode for hackathon judges).

## Confidence Score Signals

Each flagged property has a `confidence_breakdown` with 5 signals:

| Signal | What it means |
|--------|--------------|
| `ndbi_delta` | NDBI change 2022→2024 (satellite built-up index) |
| `area_delta` | Building footprint expansion in sq.m |
| `osm_status` | Known in OpenStreetMap or newly detected |
| `ndvi_drop` | Vegetation decrease (land cleared for construction) |
| `db_match` | Whether property is in GVMC tax database |

## Verification Statuses

Field officers can mark a property as:
`pending` | `verified` | `underassessed` | `false_positive` | `already_assessed`

## Demo Mode

A yellow `DemoModeBadge` banner appears site-wide when the system is running on mock seed data (`admin_config.data_mode = 'demo'`). It disappears once a real GVMC CSV is uploaded via the Admin panel.

## Build & Deploy

```bash
npm run build   # outputs to dist/
```

Deployed automatically by AWS Amplify on every push to `main`. Requires a SPA rewrite rule in Amplify (all non-asset paths → `/index.html`, status 200).
