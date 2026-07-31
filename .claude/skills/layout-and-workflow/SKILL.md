# Layout and Workflow Skill

## Skill Metadata
- **Name:** layout-and-workflow
- **Type:** View Architecture & GVMC Workflow Reference
- **Target:** GVMC Change-Detection Dashboard
- **Objective:** Build correctly structured role views and understand the GVMC data flow

---

## 1. The 4 Role Views

### FieldOfficerView (`/officer`)
**Purpose:** Primary field tool — locate, inspect, and verify flagged properties.

```
Navbar (role switcher)
──────────────────────────────────────────────────────
WardSelector (dropdown — 98 wards)
StatsBar (new builds | underassessed | high-confidence count)
──────────────────────────────────────────────────────
MapView (60%)                 | PropertyList (40%)
  - Leaflet choropleth         |   - sortable table
  - Property markers           |   - filter by type/status
  - Click → select property    |   - click row → select property
──────────────────────────────────────────────────────
SelectedPropertyPanel (visible when property selected):
  ConfidenceCard (5-signal breakdown + AI plain-English explanation)
  VerifyPanel (status chip selector → POST /api/properties/{id}/verify)
  ChatPanel (Bedrock chatbot — natural language queries)
  BeforeAfterSlider (leaflet-side-by-side: 2022 vs 2024 satellite)
```

### SupervisorView (`/supervisor`)
**Purpose:** Ward-level oversight and alert monitoring.

```
Navbar
──────────────────────────────────────────────────────
WardSelector
StatsBar (ward totals: pending | verified | false positive)
──────────────────────────────────────────────────────
AlertPanel (AI-generated contextual alerts per ward)
PropertyList (condensed, status-filtered)
ExportButton (POST /api/alerts/export → CSV download)
```

### CommissionerView (`/commissioner`)
**Purpose:** City-wide budget and staff prioritization.

```
Navbar
──────────────────────────────────────────────────────
StatsBar (all-wards totals: total detections | verified | revenue estimate)
──────────────────────────────────────────────────────
MapView (choropleth heatmap — wards colored by unassessed count)
──────────────────────────────────────────────────────
Top10WardsTable (sorted by unassessed count)
AIBriefPanel (Bedrock daily brief — markdown rendered)
```

### AdminPanel (`/admin`)
**Purpose:** Plug in real GVMC data and manage pipeline.

```
Navbar
DemoModeBadge (yellow banner — visible when data_mode = 'demo')
──────────────────────────────────────────────────────
CSVUploadSection    → POST /api/admin/upload-csv
DBConfigForm        → POST /api/admin/db-config
──────────────────────────────────────────────────────
ThresholdSlider (NDBI threshold: default 0.15)
PipelineSection:
  Last refresh timestamp
  [Trigger Refresh] button → POST /api/admin/refresh
  Pipeline status indicator
```

---

## 2. GVMC Data Flow

```
Ward selected
      ↓
fetchWards() → ward list in Redux
      ↓
fetchWardChanges(wardId) → presigned URL → GeoJSON polygons → MapView renders
fetchProperties({ wardId }) → property rows → PropertyList renders
fetchStats({ wardId }) → StatsBar updates
      ↓
Property selected (click map marker or list row)
      ↓
fetchPropertyById(id) → property detail + AI explanation → ConfidenceCard renders
      ↓
Officer takes action
  → verifyProperty({ id, status, notes }) → POST /api/properties/{id}/verify
  → PropertyList row updates status badge
      ↓
Chat query typed
  → sendChatMessage(text) → POST /api/chat → ChatPanel appends response
```

---

## 3. Page Composition Rules

Every view must follow this outer structure:

```jsx
<div className="officer-view">
  <WardSelector … />
  <StatsBar … />
  <div className="officer-view__content">
    <MapView className="officer-view__map" />
    <PropertyList className="officer-view__list" />
  </div>
  {selectedProperty && (
    <div className="officer-view__detail">
      <ConfidenceCard property={selectedProperty} />
      <VerifyPanel propertyId={selectedProperty.id} />
    </div>
  )}
</div>
```

```css
/* OfficerView.css */
.officer-view {
    padding: var(--space-4) var(--page-padding-x);
}
.officer-view__content {
    display: grid;
    grid-template-columns: 60% 40%;
    gap: var(--space-4);
    height: calc(100vh - var(--navbar-height) - 120px);
}
.officer-view__map,
.officer-view__list {
    overflow: hidden;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
}
```

---

## 4. Verification Status Machine

```
pending → verified           (officer confirmed: unassessed, no issues)
pending → underassessed      (officer confirmed: construction exists but underreported)
pending → false_positive     (officer checked: no actual construction found)
pending → already_assessed   (officer confirmed: already in GVMC database)
```

Build a `getAvailableActions()` helper for the VerifyPanel:
```jsx
const VERIFY_ACTIONS = ['verified', 'underassessed', 'false_positive', 'already_assessed'];
// All actions available from 'pending' status
```

### Status → CSS Map
```jsx
const VERIFY_STATUS_MAP = {
  pending:          'secondary',
  verified:         'success',
  underassessed:    'warning',
  false_positive:   'danger',
  already_assessed: 'info',
};
```

---

## 5. Detection Type → Display Map

```jsx
const DETECTION_TYPE_MAP = {
  new_build:     { label: 'New Build',      color: 'danger',  icon: FiHome },
  change_of_use: { label: 'Change of Use',  color: 'orange',  icon: FiRefreshCw },
};
```

---

## 6. Confidence Score Display

`confidence_breakdown` has 5 signals — render each as a bar/chip:

```jsx
const SIGNAL_LABELS = {
  ndbi_delta:  'Satellite NDBI',
  area_delta:  'Area Expansion',
  osm_status:  'OSM Status',
  ndvi_drop:   'Vegetation Drop',
  db_match:    'DB Match',
};

const getConfidenceColor = (value) => {
  if (value >= 0.7) return 'success';
  if (value >= 0.4) return 'warning';
  return 'danger';
};
```

---

## 7. StatsBar Data Shapes

### Officer / Supervisor (ward-level)
```js
// GET /api/stats → { ward_id, new_builds, underassessed, verified, false_positives, total, revenue_estimate }
```

### Commissioner (all-wards)
```js
// GET /api/stats/all-wards → { total_detections, total_verified, total_revenue_estimate, wards: [...] }
```

---

## 8. DemoModeBadge Behavior

```jsx
// Always rendered in App.jsx or layout shell
// Visibility controlled by Redux admin slice
// admin_config.data_mode = 'demo' → show banner
// admin_config.data_mode = 'live' → hide banner
```

---

## 9. Chat UI Panel Pattern

```jsx
// Conversation history: [{ role: 'user' | 'assistant', content: string }]
// User types → dispatch(sendChatMessage(text)) → append to history
// Bedrock response → append as { role: 'assistant', content }
// Auto-scroll to bottom on new message
// Show typing indicator while verifyStatus === 'loading'
```

---

## 10. Module Scaffold Checklist

When adding a new feature:

```
□ Route added in src/App.jsx
□ View file created in src/views/
□ RTK slice created in src/Redux/slices/
□ Slice registered in src/Redux/Store.jsx
□ Redux state used for all data; useState only for local UI
□ Loading state handled (spinner or skeleton)
□ Error state handled (error message shown)
□ Empty state handled (no properties found message)
```
