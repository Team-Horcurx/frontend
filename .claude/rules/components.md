# Components Rule

Always apply these rules when creating or modifying any component.

## Existing Components — Check Before Creating

Always check `src/components/` before building a new component. Available shared components:
- `MapView` — Leaflet choropleth + satellite before/after slider
- `WardSelector` — ward dropdown for switching context
- `PropertyList` — sortable table of flagged properties
- `AlertPanel` — AI-generated alerts display
- `StatsBar` — summary statistics (new builds, underassessed, revenue estimate)
- `VerifyPanel` — verification status chip selector
- `ConfidenceCard` — per-signal confidence breakdown display
- `DemoModeBadge` — yellow site-wide demo mode banner
- `AdminPanel` — CSV upload, threshold slider, pipeline trigger

## Structure Rules

- Always use PascalCase for component file names (`ConfidenceCard.jsx`, not `confidenceCard.jsx`)
- Always co-locate the CSS file with the JSX file in the same folder
- Always use `react-icons` for icons — never inline SVG or other icon libraries
- `react-icons` is v5 — verify icon names at react-icons.github.io before use

## Styling Rules

- Never write inline styles (`style={{ ... }}`). Use CSS classes and CSS variables
- Never hardcode colors, font sizes, or spacing — use CSS variables from `src/styles/`
- Never use `!important` in component-scoped CSS

## Table Rules

- Always right-align numeric columns (area_sqm, confidence %, revenue estimates)
- Always left-align text/string columns (property ID, detection type, address)
- Always center-align status badges and action button columns

## State Management

- Never use `useState` for data that belongs in Redux (property lists, ward data, verification results)
- Use `useState` for local UI state: search term, active tab, map zoom level, modal open/close
- Never call `api` (axios) directly in a component — always dispatch a Redux thunk

## GVMC-Specific Patterns

### Confidence Score Display
```jsx
// confidence_breakdown has 5 signals: ndbi_delta, area_delta, osm_status, ndvi_drop, db_match
// Each signal renders as a bar/chip — use status badge colors:
// high confidence → success, medium → warning, low → danger
```

### Verification Status Chip
```jsx
// Use the status-badge CSS classes for these ENUM values:
// 'pending'           → secondary
// 'verified'          → success
// 'underassessed'     → warning
// 'false_positive'    → danger
// 'already_assessed'  → info
```

### Map Polygon Colors (Choropleth)
```jsx
// Detection type → color:
// 'new_build'      → danger/red
// 'change_of_use'  → warning/orange
// Confidence ≥0.8  → full opacity, <0.5 → reduced opacity
```
