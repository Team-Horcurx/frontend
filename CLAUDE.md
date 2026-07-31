# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm start                              # Dev server at http://localhost:5173
npm run build                          # Production build → dist/
npm run preview                        # Preview production build locally
npm run test                           # Run tests once (vitest)
npm run test:watch                     # Run tests in watch mode
npm run test -- ComponentName          # Run a single test file by name pattern
```

Build tool is **Vite 6**. Test runner is **Vitest** (globals auto-imported — no import needed). No linting scripts configured yet.

## Vite-Specific Rules

- **Environment variables:** Use `import.meta.env.VITE_*` exclusively. Never use `process.env`.
- **JSX in `.js` files:** A custom plugin in `vite.config.js` handles JSX in `.js` files. Do not rename `.js` → `.jsx` to fix Vite warnings.
- **Named exports are strict:** Unlike Webpack, Vite enforces ES module named exports at runtime. Always verify an export exists before importing — a missing export blanks the entire app.
- **Build output:** `dist/` (not `build/`). Amplify `baseDirectory` is set to `dist`.

## Architecture

### Routing Structure

Flat, role-based routing — no nested layouts:

```
/ (HomePage)              — 4 role buttons
/officer                  — FieldOfficerView (map + list + verify + AI explainer + chatbot)
/supervisor               — SupervisorView (ward stats + AI alerts)
/commissioner             — CommissionerView (all-wards choropleth + AI daily brief)
/admin                    — AdminPanel (CSV upload + DB config + pipeline trigger)
```

A `Navbar` appears on every page for instant role switching. There is **no authentication** — all routes and API endpoints are fully open (demo mode).

### Component Structure

```
src/
├── App.jsx                     ← React Router root
├── components/                 ← Shared reusable components
│   ├── MapView.jsx             ← Leaflet choropleth + polygons
│   ├── WardSelector.jsx        ← Ward dropdown
│   ├── PropertyList.jsx        ← Sortable flagged property table
│   ├── AlertPanel.jsx          ← AI-generated alerts
│   ├── StatsBar.jsx            ← Summary: new builds | underassessed | revenue estimate
│   ├── VerifyPanel.jsx         ← Status chips (Verified / False Positive / etc.)
│   ├── ConfidenceCard.jsx      ← Per-signal breakdown (NDBI, area, NDVI, OSM, DB match)
│   ├── DemoModeBadge.jsx       ← Yellow banner when using mock data
│   └── AdminPanel.jsx          ← CSV upload, threshold slider, pipeline trigger
├── views/
│   ├── HomePage.jsx
│   ├── FieldOfficerView.jsx
│   ├── SupervisorView.jsx
│   └── CommissionerView.jsx
├── api/
│   └── client.js               ← Axios instance pointing to VITE_API_URL
└── Redux/
    ├── slices/                 ← RTK slices, one per feature
    └── Store.jsx               ← Root reducer
```

### API Client

The axios instance in `src/api/client.js` reads `import.meta.env.VITE_API_URL` as the base URL. No auth headers are added (all endpoints are public). Never import raw `axios` in components — always import from `src/api/client.js`.

### Redux Pattern

All state management uses **RTK slices only** — there is no legacy nSpace/Actions pattern in this project.

- Place slices in `src/Redux/slices/` named `{feature}Slice.js`
- Every slice exports `mapAPIToUI`, `mapUIToAPI`, named selectors, and reset actions
- Status values: `'idle' | 'loading' | 'succeeded' | 'failed'`
- Never access Redux state directly in components — always use exported selectors
- RTK v2: use builder pattern in `createReducer`; `redux-thunk` is bundled in RTK

### Map Layer (Google Maps)

The `MapView` component uses `@vis.gl/react-google-maps` (official Google React library).

- API key from `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
- Wrap the entire app in `<APIProvider apiKey={...}>` inside `App.jsx`
- GeoJSON polygons rendered via `google.maps.Data` layer (`map.data.addGeoJson(...)`)
- Ward bounds fitting: `new google.maps.LatLngBounds(sw, ne)` → `map.fitBounds(bounds)`
- Default center: `{ lat: 17.6869, lng: 83.2185 }` (Visakhapatnam), zoom 12
- No built-in before/after slider — implemented as a toggle overlay (show/hide detection layer)
- GeoJSON polygons are fetched from S3 via presigned URL from `GET /api/wards/{id}/changes`

Enable in Google Cloud Console: **Maps JavaScript API** (+ Geocoding API if address search is added).

### AI Features (Bedrock)

- **Property explainer**: triggered by `GET /api/properties/{id}` — rendered in `ConfidenceCard`
- **Commissioner brief**: fetched from `GET /api/stats/all-wards`
- **AI alerts**: fetched per ward and shown in `AlertPanel`
- **Chatbot**: `POST /api/chat` — renders conversation in the chat UI panel; calls Bedrock Agent

### Verification Status

The `VerifyPanel` sends `POST /api/properties/{id}/verify` with status enum:
`'pending' | 'verified' | 'underassessed' | 'false_positive' | 'already_assessed'`

### Demo Mode

`DemoModeBadge` shows a yellow site-wide banner when `admin_config.data_mode === 'demo'`. It disappears once a real CSV is uploaded via the Admin panel.

## Key Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite config — custom JSX plugin, `envPrefix: 'VITE_'`, vitest setup |
| `src/api/client.js` | Axios instance — reads `VITE_API_URL`, no auth |
| `.env` | Local env vars (`VITE_API_URL=https://...`) |

## Environment Variables

```
VITE_API_URL    → Base URL for all API calls (set in .env locally; Amplify console for prod)
```

## Amplify Deployment

Deployed automatically on push to `main`. Amplify SPA rewrite rule required:
all non-asset paths → `/index.html` with status 200.

```yaml
# amplify.yml
frontend:
  phases:
    preBuild:
      commands:
        - nvm use 18
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
```

## CSS Rules

- Never hardcode colors, font sizes, or spacing — use CSS variables from `src/styles/variables.css`
- Status indicators use variables from `src/styles/statusBadge.css`
- BEM naming: `.property-list__header`, `.property-list__row--selected`
- Co-locate component CSS with JSX in the same folder
- Never use `!important` in component CSS

## Project Tooling

Claude Code rules (auto-applied) live in `.claude/rules/`:
- `api-integration.md` — axios usage, URL construction, data mapping
- `components.md` — component checklist, naming, state rules
- `css.md` — CSS variables, BEM, status colors
- `redux.md` — RTK slice structure, thunks, selectors
- `routing.md` — route registration, no-auth pattern

Skills (invoke via `/skill-name`):
`component-and-function`, `redux-and-api-integration`, `layout-and-workflow`,
`ui-and-theme`, `writing-test-cases`, `map-and-geo`
