# Plan: AI Agent Integration — Spots 1, 2 & 3

## Context

The `gvmc-stubs` SAM stack (pipeline repo) is deployed and tested. It exposes four endpoints on its own API Gateway (`VITE_AGENT_API_URL`):

| Spot | Endpoint | Status |
|------|----------|--------|
| 4 — Officer Chatbot | `POST /api/chat` | **Already integrated** in `chatSlice.js` + `ChatPanel.jsx` |
| 1 — Property Explainer | `GET /api/explain/{property_id}` | Not yet wired — frontend calls main backend's properties endpoint instead |
| 2 — Commissioner Brief | `GET /api/brief` | Not yet wired — frontend expects `ai_brief` embedded in `stats/all-wards` |
| 3 — Ward Alert Generator | `POST /api/wards/{ward_id}/alert` | Not yet wired — frontend only fetches alerts, never triggers generation |

All three remaining endpoints live at `VITE_AGENT_API_URL` (same base URL as chat). No new env vars needed.

---

## API Response Shapes (from pipeline source)

### Spot 1 — `GET /api/explain/{property_id}`
```json
{ "property_id": "uuid", "ai_explanation": "3-sentence string" }
```
Errors: `404` if property not found, `503` if Groq unavailable.

### Spot 2 — `GET /api/brief`
```json
{ "ai_brief": "3-paragraph string" }
```
Errors: `503` if Groq unavailable.

### Spot 3 — `POST /api/wards/{ward_id}/alert` (no request body)
```json
{
  "alert_id": "uuid",
  "alert": { "text": "string", "severity": "HIGH|MEDIUM|LOW", "score": 0-100 },
  "saved": true
}
```
Errors: `404` if ward not found, `503` if Groq unavailable.

---

## Files to Change (in order)

| # | File | Change |
|---|------|--------|
| 1 | `src/Redux/slices/statsSlice.js` | Add `fetchCommissionerBrief` thunk + state fields |
| 2 | `src/Redux/slices/alertsSlice.js` | Add `generateWardAlert` thunk + state fields |
| 3 | `src/Redux/slices/propertiesSlice.js` | Add `fetchPropertyExplanation` thunk + patch into `selectedItem` |
| 4 | `src/views/CommissionerView.jsx` | Dispatch `fetchCommissionerBrief` on mount; render from new selector |
| 5 | `src/components/AlertPanel.jsx` | Add "Generate Alert" button + success feedback |
| 6 | `src/views/FieldOfficerView.jsx` | Dispatch `fetchPropertyExplanation` alongside `fetchPropertyById` |
| 7 | `src/components/ConfidenceCard.jsx` | Handle `explanationStatus` loading/error states |

---

## Step-by-Step Implementation

### Step 1 — `src/api/client.js`

No changes. `agentApi` (axios instance reading `VITE_AGENT_API_URL`) already exists and is imported by `chatSlice`. The three new thunks will import `agentApi` the same way.

---

### Step 2 — `src/Redux/slices/statsSlice.js`

Add the `fetchCommissionerBrief` async thunk. The slice already has an `aiBreif` field (typo, keep as-is to avoid refactor churn) — reuse it for the brief from this new thunk.

**Add import at top:**
```js
import { agentApi } from '../../api/client';
```

**Add thunk:**
```js
export const fetchCommissionerBrief = createAsyncThunk(
  'stats/fetchCommissionerBrief',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await agentApi.get('/api/brief');
      return data.ai_brief;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);
```

**Add state fields in `initialState`:**
```js
briefStatus: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
briefError: null,
```

**Add cases in `extraReducers`:**
```js
.addCase(fetchCommissionerBrief.pending, (state) => {
  state.briefStatus = 'loading';
  state.briefError = null;
})
.addCase(fetchCommissionerBrief.fulfilled, (state, action) => {
  state.briefStatus = 'succeeded';
  state.aiBreif = action.payload;        // reuses existing field
})
.addCase(fetchCommissionerBrief.rejected, (state, action) => {
  state.briefStatus = 'failed';
  state.briefError = action.payload;
})
```

**Add selector:**
```js
export const selectBriefStatus = (state) => state.stats.briefStatus;
```
(`selectAiBrief` already exists — keep it pointing at `state.stats.aiBreif`.)

---

### Step 3 — `src/Redux/slices/alertsSlice.js`

Add the `generateWardAlert` async thunk. After a successful generation, immediately re-fetch the alerts list so the new card appears without a manual reload.

**Add import at top:**
```js
import { agentApi } from '../../api/client';
```

**Add thunk:**
```js
export const generateWardAlert = createAsyncThunk(
  'alerts/generateWardAlert',
  async (wardId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await agentApi.post(`/api/wards/${wardId}/alert`);
      dispatch(fetchAlerts(wardId));     // refresh list so new card appears
      return data;                       // { alert_id, alert: {text, severity, score}, saved }
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);
```

**Add state fields in `initialState`:**
```js
generateStatus: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
generateError: null,
lastGenerated: null,       // stores { alert_id, alert } for inline feedback
```

**Add cases in `extraReducers`:**
```js
.addCase(generateWardAlert.pending, (state) => {
  state.generateStatus = 'loading';
  state.generateError = null;
  state.lastGenerated = null;
})
.addCase(generateWardAlert.fulfilled, (state, action) => {
  state.generateStatus = 'succeeded';
  state.lastGenerated = action.payload;
})
.addCase(generateWardAlert.rejected, (state, action) => {
  state.generateStatus = 'failed';
  state.generateError = action.payload;
})
```

**Add action + selectors:**
```js
export const { resetGenerateStatus } = alertsSlice.actions;
// (add resetGenerateStatus to reducers: { resetGenerateStatus: (state) => { state.generateStatus = 'idle'; state.lastGenerated = null; } })

export const selectGenerateStatus = (state) => state.alerts.generateStatus;
export const selectLastGenerated  = (state) => state.alerts.lastGenerated;
export const selectGenerateError  = (state) => state.alerts.generateError;
```

---

### Step 4 — `src/Redux/slices/propertiesSlice.js`

Add `fetchPropertyExplanation`. On success, patch `selectedItem.aiExplanation` so `ConfidenceCard` continues to read from the same prop — no component-level state needed.

**Add import at top:**
```js
import { agentApi } from '../../api/client';
```

**Add thunk:**
```js
export const fetchPropertyExplanation = createAsyncThunk(
  'properties/fetchPropertyExplanation',
  async (propertyId, { rejectWithValue }) => {
    try {
      const { data } = await agentApi.get(`/api/explain/${propertyId}`);
      return { propertyId, explanation: data.ai_explanation };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);
```

**Add state fields in `initialState`:**
```js
explanationStatus: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
explanationError: null,
```

**Add cases in `extraReducers`:**
```js
.addCase(fetchPropertyExplanation.pending, (state) => {
  state.explanationStatus = 'loading';
  state.explanationError = null;
  // clear stale explanation while loading
  if (state.selectedItem) state.selectedItem.aiExplanation = null;
})
.addCase(fetchPropertyExplanation.fulfilled, (state, action) => {
  state.explanationStatus = 'succeeded';
  if (state.selectedItem?.id === action.payload.propertyId) {
    state.selectedItem.aiExplanation = action.payload.explanation;
  }
})
.addCase(fetchPropertyExplanation.rejected, (state, action) => {
  state.explanationStatus = 'failed';
  state.explanationError = action.payload;
})
```

**Add selectors:**
```js
export const selectExplanationStatus = (state) => state.properties.explanationStatus;
export const selectExplanationError  = (state) => state.properties.explanationError;
```

---

### Step 5 — `src/views/CommissionerView.jsx`

Two changes:
1. Import and dispatch `fetchCommissionerBrief` on mount.
2. Use `selectBriefStatus` to drive the loading state in the AI Brief section.

**Current `useEffect`:**
```js
useEffect(() => {
  dispatch(fetchAllWardsStats());
}, [dispatch]);
```

**Replace with:**
```js
useEffect(() => {
  dispatch(fetchAllWardsStats());
  dispatch(fetchCommissionerBrief());
}, [dispatch]);
```

**In the AI Daily Brief render section:**
```jsx
const briefStatus = useSelector(selectBriefStatus);
const aiBreif     = useSelector(selectAiBrief);     // existing selector

// render:
{briefStatus === 'loading' && <Loader />}
{briefStatus === 'succeeded' && aiBreif && (
  <ReactMarkdown>{aiBreif}</ReactMarkdown>
)}
{briefStatus === 'failed' && (
  <p className="error-text">Could not load AI brief. Try refreshing.</p>
)}
```

The `fetchAllWardsStats` call stays as-is — it supplies the ward table and choropleth data. `fetchCommissionerBrief` is an independent call that just fills the brief text box.

---

### Step 6 — `src/components/AlertPanel.jsx`

Add a "Generate Alert" button above the alerts list. After clicking, show inline feedback (severity badge + brief text) from `lastGenerated`. Reset status on ward change.

**Add imports:**
```js
import { generateWardAlert, resetGenerateStatus, selectGenerateStatus, selectLastGenerated, selectGenerateError } from '../Redux/slices/alertsSlice';
```

**Add selectors in component:**
```js
const generateStatus = useSelector(selectGenerateStatus);
const lastGenerated  = useSelector(selectLastGenerated);
const generateError  = useSelector(selectGenerateError);
```

**Reset on ward change:**
```js
useEffect(() => {
  dispatch(resetGenerateStatus());
  dispatch(fetchAlerts(wardId));
}, [wardId, dispatch]);
```

**Add button + feedback UI:**
```jsx
<div className="alert-panel__header">
  <h3>AI Alerts</h3>
  <button
    className="btn btn-primary btn-sm"
    onClick={() => dispatch(generateWardAlert(wardId))}
    disabled={generateStatus === 'loading' || !wardId}
  >
    {generateStatus === 'loading' ? 'Generating…' : '+ Generate Alert'}
  </button>
</div>

{generateStatus === 'succeeded' && lastGenerated && (
  <div className={`alert-feedback severity-${lastGenerated.alert.severity.toLowerCase()}`}>
    <span className="badge">{lastGenerated.alert.severity}</span>
    <p>{lastGenerated.alert.text}</p>
  </div>
)}
{generateStatus === 'failed' && generateError && (
  <p className="error-text">Failed to generate: {generateError}</p>
)}
```

Severity badge styling uses existing `statusBadge.css` tokens. Map severity:
- `HIGH` → `danger` badge class
- `MEDIUM` → `warning` badge class  
- `LOW` → `info` badge class

---

### Step 7 — `src/views/FieldOfficerView.jsx`

Dispatch `fetchPropertyExplanation` alongside `fetchPropertyById` whenever a property is selected.

**Add import:**
```js
import { fetchPropertyExplanation } from '../Redux/slices/propertiesSlice';
```

**Find the property selection handler** (currently dispatches `setSelectedProperty` + `fetchPropertyById`):
```js
// before
dispatch(setSelectedProperty(propertyId));
dispatch(fetchPropertyById(propertyId));

// after — add one line
dispatch(setSelectedProperty(propertyId));
dispatch(fetchPropertyById(propertyId));
dispatch(fetchPropertyExplanation(propertyId));
```

---

### Step 8 — `src/components/ConfidenceCard.jsx`

The component already renders `property.aiExplanation` via `react-markdown`. Add `explanationStatus` awareness so loading and error states are surfaced correctly.

**Add import:**
```js
import { selectExplanationStatus, selectExplanationError } from '../Redux/slices/propertiesSlice';
```

**Add selectors:**
```js
const explanationStatus = useSelector(selectExplanationStatus);
const explanationError  = useSelector(selectExplanationError);
```

**Replace the AI Analysis section:**
```jsx
<div className="confidence-card__ai">
  <h4>AI Analysis</h4>
  {explanationStatus === 'loading' && (
    <div className="ai-loading">
      <Loader size="sm" />
      <span>Loading AI explanation…</span>
    </div>
  )}
  {explanationStatus === 'succeeded' && property.aiExplanation && (
    <ReactMarkdown>{property.aiExplanation}</ReactMarkdown>
  )}
  {explanationStatus === 'failed' && (
    <p className="error-text">AI explanation unavailable.</p>
  )}
</div>
```

The existing loading spinner + "Loading AI explanation…" text likely already exists — this step just binds it to `explanationStatus` from the new thunk instead of `fetchOneStatus`.

---

## Behaviour After Integration

| User Action | Agent Called | Where Result Appears |
|-------------|-------------|----------------------|
| Commissioner view mounts | `GET /api/brief` | AI Daily Brief card (markdown-rendered 3-paragraph text) |
| Supervisor clicks "Generate Alert" for ward | `POST /api/wards/{id}/alert` | Inline feedback + new alert card auto-appears in list |
| Field officer clicks a property | `GET /api/explain/{id}` | AI Analysis section in ConfidenceCard |

## Error Handling Strategy

All three thunks fail gracefully:
- `503` from Groq → show "unavailable" message, don't block the rest of the view
- `404` (property/ward not found) → show error inline, not a page-level crash
- Network error → Redux `rejected` state → inline error text

---

## MSW Mocks (for dev without `VITE_AGENT_API_URL` set)

Add three handlers to `src/mocks/handlers.js`:

```js
// Spot 1
rest.get(`${AGENT_BASE}/api/explain/:propertyId`, (req, res, ctx) =>
  res(ctx.json({ property_id: req.params.propertyId, ai_explanation: 'Mock AI explanation for this property.' }))
),

// Spot 2
rest.get(`${AGENT_BASE}/api/brief`, (req, res, ctx) =>
  res(ctx.json({ ai_brief: 'Mock commissioner brief. Ward 14 leads detections. Deploy 2 officers.' }))
),

// Spot 3
rest.post(`${AGENT_BASE}/api/wards/:wardId/alert`, (req, res, ctx) =>
  res(ctx.json({
    alert_id: 'mock-alert-001',
    alert: { text: 'Ward shows 200% spike in new builds.', severity: 'HIGH', score: 82 },
    saved: true
  }))
),
```

Where `AGENT_BASE = import.meta.env.VITE_AGENT_API_URL`.
