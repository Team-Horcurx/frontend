# GVMC Frontend — Phased Implementation Plan

Split into 3 independent Claude sessions. Each phase has a clear start state, a clear end state, and a verification checklist so you can hand off cleanly between sessions.

---

## Before You Start — One-Time Setup

Run once before Phase 1:

```bash
cd gvmc-frontend
npm create vite@latest . -- --template react
npm install
```

> If the Vite scaffold asks about overwriting, say yes to all.

---

## Phase 1 — Foundation, Routing & Scaffolding

**Goal:** App runs at localhost:5173, all routes exist, all views render placeholder content, Redux store is wired, API client is configured.

**What you say to Claude at the start:**
> "We're scaffolding the GVMC Change-Detection Frontend. This is Phase 1 of 3. Read CLAUDE.md and plan-frontend.md first, then implement everything in the Phase 1 task list."

### Dependencies to Install

```bash
# Core
npm install react-router-dom @reduxjs/toolkit react-redux axios dayjs

# Google Maps
npm install @vis.gl/react-google-maps

# Icons
npm install react-icons

# Testing
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

### Vite Config

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // Treat .js files as JSX (existing codebase pattern)
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null;
        return { code, map: null };
      },
    },
  ],
  envPrefix: 'VITE_',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
});
```

### Environment File

```bash
# .env (create manually — never commit)
VITE_API_URL=https://your-api-gateway-url.amazonaws.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Phase 1 Task List

#### 1. Folder structure
Create all folders:
```
src/
  api/
  components/
  views/
  Redux/slices/
  styles/
  tests/
    slices/
    components/
```

#### 2. Global CSS files
- `src/styles/variables.css` — color, typography, spacing, shadow, border tokens
- `src/styles/responsive.css` — `--navbar-height: 56px`, `--page-padding-x: 20px`, fluid font scale, fluid spacing
- `src/styles/statusBadge.css` — status badge CSS variables for success/warning/danger/info/secondary/primary/orange
- Import all three in `src/main.jsx`

#### 3. API client
```js
// src/api/client.js
import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
export default api;
```

#### 4. Redux store (empty shell)
Create `src/Redux/Store.jsx` with `configureStore`. Slices added in Phase 2/3.
Register in `src/main.jsx` with `<Provider store={store}>`.

#### 5. React Router setup in `src/App.jsx`
```jsx
<BrowserRouter>
  <Navbar />
  <Routes>
    <Route path="/"             element={<HomePage />} />
    <Route path="/officer"      element={<FieldOfficerView />} />
    <Route path="/supervisor"   element={<SupervisorView />} />
    <Route path="/commissioner" element={<CommissionerView />} />
    <Route path="/admin"        element={<AdminPanel />} />
  </Routes>
</BrowserRouter>
```

#### 6. Navbar component (`src/components/Navbar.jsx`)
- Four role buttons (links to `/officer`, `/supervisor`, `/commissioner`, `/admin`)
- Active route highlighted
- GVMC branding / logo text
- Sticky top, `height: var(--navbar-height)`

#### 7. DemoModeBadge component (`src/components/DemoModeBadge.jsx`)
- Yellow sticky banner below Navbar
- Hardcoded visible for now (wired to Redux in Phase 3)
- Text: "DEMO MODE — using mock data. Upload real CSV via Admin panel to go live."

#### 8. View shells (placeholder content only — no data, no Redux)
Each view renders:
- A page title `<h1>`
- A placeholder `<p>Phase 2 will wire data here</p>`
- The correct CSS class name

Files:
- `src/views/HomePage.jsx` — 4 large role cards linking to each view
- `src/views/FieldOfficerView.jsx`
- `src/views/SupervisorView.jsx`
- `src/views/CommissionerView.jsx`
- `src/views/AdminPanel.jsx`

#### 9. Vitest setup file
```js
// src/tests/setup.js
import '@testing-library/jest-dom';
```

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### Phase 1 Verification Checklist

```
□ npm start runs without errors
□ All 5 routes render (/, /officer, /supervisor, /commissioner, /admin)
□ Navbar appears on every route
□ Active nav link is highlighted
□ DemoModeBadge visible below Navbar
□ No console errors
□ npm run test passes (even with no test files yet)
□ import.meta.env.VITE_API_URL resolves (check with console.log in client.js)
```

---

## Phase 2 — Core Dashboard (Map, Data, Verify)

**Goal:** Real data flows through all main views. Google Maps renders ward polygons. Field officer can select a ward, see properties, and submit a verification.

**What you say to Claude at the start:**
> "Phase 1 is complete. Now implement Phase 2 of the GVMC frontend. Read CLAUDE.md and plan-frontend.md Phase 2 tasks. The app scaffolding is in place — add data, maps, and interaction."

**Start state:** Phase 1 complete. All views are shells. Redux store has no slices. No API calls yet.

### Additional Dependencies

```bash
npm install react-markdown   # for rendering AI text in Phase 3 — install now
```

### Phase 2 Task List

#### 1. Google Maps wrapper setup

```jsx
// src/components/GoogleMapsProvider.jsx
import { APIProvider } from '@vis.gl/react-google-maps';

export default function GoogleMapsProvider({ children }) {
    return (
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            {children}
        </APIProvider>
    );
}
```

Wrap in `src/App.jsx` (outside Router):
```jsx
<GoogleMapsProvider>
  <BrowserRouter>…</BrowserRouter>
</GoogleMapsProvider>
```

#### 2. Redux slices (create all, register in Store.jsx)

| Slice file | Initial state fields |
|-----------|---------------------|
| `wardsSlice.js` | `items`, `selectedWardId`, `wardGeoJSON`, `status`, `geoJSONStatus`, `error` |
| `propertiesSlice.js` | `items`, `selectedItem`, `status`, `fetchOneStatus`, `error`, `verifyStatus`, `verifyError` |
| `statsSlice.js` | `wardStats`, `allWardsStats`, `status`, `error` |
| `adminSlice.js` | `dataMode`, `pipelineStatus`, `lastRefresh`, `uploadStatus`, `error` |

Each slice must have:
- `mapAPIToUI()` + `mapUIToAPI()` helpers
- Named selectors exported at bottom
- Reset actions: `resetVerifyStatus`, `clearErrors`

#### 3. MapView component (`src/components/MapView.jsx`)

Using `@vis.gl/react-google-maps`:

```jsx
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

// Default center: Visakhapatnam
const VIZAG_CENTER = { lat: 17.6869, lng: 83.2185 };
const VIZAG_ZOOM = 12;
```

**Polygon rendering from GeoJSON:**
- Use the `Data` layer (`google.maps.Data`) to add GeoJSON polygons
- Color per `detection_type`: `new_build` → red `#dc3545`, `change_of_use` → orange `#ffc107`
- Opacity scales with `confidence`: ≥0.8 → full, 0.5–0.8 → 0.6, <0.5 → 0.35
- Click on polygon → `dispatch(setSelectedProperty(propertyId))`

```jsx
// Attaching GeoJSON to Google Maps Data layer
useEffect(() => {
    if (!map || !wardGeoJSON) return;
    map.data.addGeoJson(wardGeoJSON);
    map.data.setStyle((feature) => {
        const type = feature.getProperty('detection_type');
        const conf = feature.getProperty('confidence') || 0;
        return {
            fillColor: type === 'new_build' ? '#dc3545' : '#ffc107',
            fillOpacity: conf >= 0.8 ? 0.6 : conf >= 0.5 ? 0.4 : 0.2,
            strokeColor: type === 'new_build' ? '#dc3545' : '#ffc107',
            strokeWeight: 2,
        };
    });
    return () => map.data.forEach(f => map.data.remove(f)); // cleanup on ward change
}, [map, wardGeoJSON]);
```

**Before/After satellite toggle** (Google Maps doesn't have a side-by-side slider):

Implement as a toggle overlay panel:
```
[ 2022 Baseline ] [ 2024 Current ] toggle buttons
```
- 2022/2024 GeoJSON polygon overlays are the visual comparison
- Add a floating "Show Change Polygons" toggle that shows/hides the detection layer
- If S3 has stored PNG tiles from the pipeline, render as `GroundOverlay`

**Ward bounds fitting:**
```jsx
// When selected ward changes, fit map to ward bbox
useEffect(() => {
    if (!map || !selectedWardBbox) return;
    const bounds = new google.maps.LatLngBounds(
        { lat: selectedWardBbox.south, lng: selectedWardBbox.west },
        { lat: selectedWardBbox.north, lng: selectedWardBbox.east }
    );
    map.fitBounds(bounds);
}, [map, selectedWardBbox]);
```

#### 4. WardSelector component (`src/components/WardSelector.jsx`)

- Dropdown of all 98 wards (from `fetchWards()`)
- On change: dispatch `setSelectedWard(wardId)` + trigger `fetchWardChanges(wardId)` + `fetchProperties({ wardId })` + `fetchStats({ wardId })`
- Shows ward name + number of detections

#### 5. PropertyList component (`src/components/PropertyList.jsx`)

- Table: columns: ID (short), Detection Type (badge), Area (sqm, right-aligned), Confidence (%, right-aligned), Status (badge), Actions
- Click row → `dispatch(setSelectedProperty(id))` + `fetchPropertyById(id)`
- Filter by detection type (new_build / change_of_use / all)
- Filter by verification status (pending / verified / etc.)
- Highlight row when `selectedItem.id === row.id`

#### 6. StatsBar component (`src/components/StatsBar.jsx`)

- 4 stat cards: Total Detections | New Builds | Change of Use | Pending Verification
- Data from `fetchStats({ wardId })`
- Each card has a colored left border (CSS var `--accent-color` passed inline)

#### 7. VerifyPanel component (`src/components/VerifyPanel.jsx`)

- Visible only when a property is selected
- 4 action buttons (Verified / Underassessed / False Positive / Already Assessed)
- Current status shown as a status badge
- On click: `dispatch(verifyProperty({ id, status, notes, updatedBy: 'officer' }))`
- Shows loading spinner on `verifyStatus === 'loading'`
- Success: button resets, status badge updates

#### 8. ConfidenceCard component (signals only — no AI text yet) (`src/components/ConfidenceCard.jsx`)

- Shows 5 signal rows: NDBI Delta, Area Expansion, OSM Status, Vegetation Drop, DB Match
- Each row: label + horizontal bar (width = signal value * 100%) + percentage text
- Bar color: ≥70% → success, 40–70% → warning, <40% → danger
- Overall confidence score shown large at the top

#### 9. Wire FieldOfficerView

```
WardSelector (top bar)
StatsBar
──────────────────────────────
MapView (left 60%) | PropertyList (right 40%)
──────────────────────────────
[when property selected]
ConfidenceCard + VerifyPanel (bottom panel or right panel)
```

#### 10. Wire SupervisorView

```
WardSelector
StatsBar (pending | verified | false positive counts)
PropertyList (compact — no map)
```

#### 11. Wire CommissionerView (map only — no AI yet)

```
StatsBar (all-wards totals from fetchAllWardsStats)
MapView (choropleth — wards colored by unassessed count from allWardsStats)
Top 10 wards table (sorted by unassessed count)
[AI brief placeholder — "Phase 3 will add AI brief here"]
```

**Choropleth for Commissioner:**
- Ward boundary GeoJSON (one polygon per ward from `GET /api/wards`)
- Color intensity based on unassessed count → white to red gradient
- Use Google Maps `Data` layer same as FieldOfficerView

### Phase 2 Verification Checklist

```
□ WardSelector loads ward list from API
□ Selecting a ward loads property list and stats
□ MapView renders Google Maps centered on Vizag
□ Property polygons appear on map (colored by detection_type)
□ Clicking a polygon selects the property in Redux
□ PropertyList renders flagged properties
□ Clicking a row selects the property (ConfidenceCard shows)
□ ConfidenceCard shows 5 signal bars
□ VerifyPanel submits verification → status badge updates in list
□ StatsBar shows correct counts
□ CommissionerView shows choropleth + top 10 wards table
□ No console errors
□ npm run test passes
```

---

## Phase 3 — AI Features, Chat, Admin & Polish

**Goal:** All AI features wired. Chatbot works. Admin panel functional. Demo mode fully controlled. App is demo-ready.

**What you say to Claude at the start:**
> "Phases 1 and 2 are complete. Now implement Phase 3 of the GVMC frontend — AI features, chatbot, admin panel, and final polish. Read CLAUDE.md and plan-frontend.md Phase 3 tasks."

**Start state:** Core data flows work. Map + PropertyList + VerifyPanel + StatsBar all functional. AI text is placeholder text.

### Phase 3 Task List

#### 1. Wire AI explanation in ConfidenceCard

`fetchPropertyById(id)` returns `ai_explanation` from Bedrock Llama.
- Add `aiExplanation` field to `propertiesSlice` `selectedItem`
- Render as a section below the 5 signal bars
- Show loading skeleton while `fetchOneStatus === 'loading'`
- Use `react-markdown` for formatted rendering (Bedrock may return markdown)

#### 2. AlertPanel component (`src/components/AlertPanel.jsx`)

- Fetches from `GET /api/wards/{id}/alerts` (or the `AlertPanel` data may come from `fetchStats`)
- Renders a scrollable list of AI-generated alert cards
- Each card: severity badge (info/warning/danger) + alert text + timestamp
- Wire into SupervisorView below StatsBar

#### 3. Commissioner AI Brief

- Data from `GET /api/stats/all-wards` — field `ai_brief`
- Render as `<ReactMarkdown>` in a collapsible card panel
- Show "Generating brief…" loading state while fetching

#### 4. Chat slice + ChatPanel component

Slice: `src/Redux/slices/chatSlice.js`
```js
// State: { messages: [{ role: 'user'|'assistant', content: string }], status, error }
// Action: sendChatMessage(text) → POST /api/chat → { response: string }
```

`src/components/ChatPanel.jsx`:
- Fixed-height scrollable message history
- `role: 'user'` → right-aligned bubble
- `role: 'assistant'` → left-aligned bubble, `react-markdown` rendered
- Input + send button at bottom
- Typing indicator dots while `status === 'loading'`
- Auto-scroll to bottom on new message
- Wire into FieldOfficerView (collapsible panel, toggled by a button)

#### 5. AdminPanel view — full implementation

`src/views/AdminPanel.jsx`:

**CSV Upload section:**
```
<h2>Upload GVMC Property Data</h2>
File input (CSV only) + Upload button
Progress indicator → POST /api/admin/upload-csv (multipart/form-data)
Success: shows "Data loaded — X properties imported"
```

**DB Config section:**
```
<h2>Database Configuration</h2>
Host, Port, Database name, Username, Password fields
[Save Config] button → POST /api/admin/db-config
```

**Pipeline control section:**
```
<h2>Detection Pipeline</h2>
Last refresh: {admin_config.last_refresh timestamp}
Pipeline status badge (idle / running / completed / failed)
[Trigger Refresh] button → POST /api/admin/refresh
Polling: after trigger, poll GET /api/stats every 10s until status changes
```

**NDBI Threshold section:**
```
<h2>Detection Sensitivity</h2>
Slider: 0.05 → 0.30, default 0.15
Current value label: "Threshold: 0.15"
[Save] button → POST /api/admin/db-config with { ndbi_threshold: value }
```

#### 6. Wire DemoModeBadge to Redux

- AdminSlice fetches `admin_config.data_mode` from stats or admin endpoint on app load
- `DemoModeBadge` reads `selectDataMode` selector
- Hides when `data_mode === 'live'`
- After successful CSV upload: dispatch to set `data_mode = 'live'`

#### 7. Export button (SupervisorView)

- [Export CSV] button → `POST /api/alerts/export`
- Response contains `presigned_url` → `window.open(url)` to trigger browser download

#### 8. HomePage polish

Replace placeholder with 4 role cards:
```
┌─────────────┐ ┌─────────────┐ ┌────────────────┐ ┌──────────┐
│ Field        │ │ Supervisor  │ │ Commissioner   │ │ Admin    │
│ Officer      │ │             │ │                │ │ Panel    │
│ Verify       │ │ Ward stats  │ │ City heatmap   │ │ Data     │
│ properties   │ │ + alerts    │ │ + AI brief     │ │ config   │
└─────────────┘ └─────────────┘ └────────────────┘ └──────────┘
```
Each card: icon, title, description, [Enter] button linking to the route.

#### 9. Error handling

- Global axios response interceptor in `src/api/client.js`: log errors, return `rejectWithValue`
- Each view: show an error banner when `status === 'failed'`
- VerifyPanel: show inline error message on `verifyStatus === 'failed'`

#### 10. Loading states

- MapView: show centered spinner while `geoJSONStatus === 'loading'`
- PropertyList: show skeleton rows while `status === 'loading'`
- StatsBar: show `—` placeholder while `status === 'loading'`
- CommissionerView AI brief: show "Generating AI brief…" with animated dots

#### 11. Final CSS polish pass

- Ensure Navbar is sticky and doesn't overlap content
- DemoModeBadge is sticky below Navbar
- MapView has correct height (`calc(100vh - var(--navbar-height) - StatsBar height)`)
- PropertyList scrollable with fixed height
- ChatPanel doesn't overflow viewport
- Mobile: stack map + list vertically at <1024px

### Phase 3 Verification Checklist

```
□ ConfidenceCard shows AI explanation text for selected property
□ AlertPanel shows AI alerts in SupervisorView
□ CommissionerView shows AI daily brief (markdown rendered)
□ ChatPanel opens/closes with toggle button
□ Typing a question in chat returns an AI response
□ Chat shows typing indicator while waiting
□ AdminPanel CSV upload triggers demo→live mode transition
□ DemoModeBadge disappears after successful CSV upload
□ Pipeline refresh button shows status feedback
□ Export button triggers CSV download
□ HomePage has 4 role cards with navigation
□ Error states show user-friendly messages
□ Loading states don't leave users staring at blank panels
□ No console errors in any view
□ All routes work correctly
□ npm run build succeeds (no TS/lint errors)
□ App is ready for 5-minute demo walkthrough
```

---

## Demo Walkthrough Script (5 minutes)

Use this to verify the complete app is demo-ready after Phase 3:

1. **Home** (`/`) → Click "Commissioner" role card
2. **Commissioner** (`/commissioner`) → Point to choropleth heatmap, top 10 wards, AI daily brief
3. **Officer** (`/officer`) → Select Ward 12 → Show property markers on map
4. Click a high-confidence property → Show ConfidenceCard signal breakdown + AI explanation
5. Show VerifyPanel → Click "Underassessed" → Status badge updates
6. Show before/after overlay toggle on map
7. Type in chatbot: "Which properties in Ward 12 need immediate inspection?"
8. **Admin** (`/admin`) → Show CSV upload section → DemoModeBadge visible
9. Upload a CSV → DemoModeBadge disappears → "Now running on live GVMC data"

---

## Dependency Summary

```bash
# Install all at once before Phase 1
npm install react-router-dom @reduxjs/toolkit react-redux axios dayjs \
    @vis.gl/react-google-maps react-icons react-markdown

npm install -D vitest @testing-library/react @testing-library/user-event \
    @testing-library/jest-dom jsdom
```

## Google Maps Notes

- Use `@vis.gl/react-google-maps` — the official modern React library maintained by Google
- API key goes in `.env` as `VITE_GOOGLE_MAPS_API_KEY`
- Required Maps APIs to enable in Google Cloud Console:
  - Maps JavaScript API
  - (Optional) Geocoding API — if you add address search
- GeoJSON polygons use the `google.maps.Data` layer (`map.data.addGeoJson(...)`)
- No built-in before/after slider → implement as a show/hide toggle for the detection polygon layer
- Ward boundary fitting uses `google.maps.LatLngBounds` + `map.fitBounds()`
- Default center: `{ lat: 17.6869, lng: 83.2185 }` (Visakhapatnam), zoom: 12
