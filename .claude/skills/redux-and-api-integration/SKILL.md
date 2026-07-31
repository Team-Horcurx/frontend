# Redux and API Integration Skill

## Skill Metadata
- **Name:** redux-and-api-integration
- **Type:** Component-to-API Integration
- **Target:** GVMC Change-Detection Dashboard
- **Objective:** Integrate UI components with the GVMC API Gateway using RTK patterns

---

## Context

- All state uses RTK `createSlice` + `createAsyncThunk` — no legacy Actions/Reducers pattern
- API base URL comes from `import.meta.env.VITE_API_URL` via `src/api/client.js`
- No authentication — no JWT, no org_id, no Cognito
- Import axios instance: `import api from '../../../api/client'`

---

## Execution Process

1. Analyze the component — identify mock data and CRUD operations
2. Map UI field names to API snake_case field names
3. Identify API endpoint (see rule file api-integration.md)
4. Create RTK slice in `src/Redux/slices/{feature}Slice.js`
5. Register in `src/Redux/Store.jsx`
6. Replace mock data with Redux selectors

---

## RTK Slice Template (GVMC)

```javascript
// src/Redux/slices/{feature}Slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

// ── Field Mappers ────────────────────────────────────────────
const mapAPIToUI = (apiItem) => ({
  id: apiItem.id,
  wardId: apiItem.ward_id,
  lat: apiItem.lat,
  lng: apiItem.lng,
  areaSqm: apiItem.area_sqm,
  detectionType: apiItem.detection_type,
  confidence: apiItem.confidence,
  confidenceBreakdown: apiItem.confidence_breakdown,
  detectedAt: apiItem.detected_at,
  s3GeoJsonKey: apiItem.s3_geojson_key,
});

const mapUIToAPI = (uiItem) => ({
  // Only include fields that the API accepts in POST/PUT
  // Do NOT include org_id — there is no multi-tenancy
  status: uiItem.status,
  notes: uiItem.notes,
  updated_by: uiItem.updatedBy,
});

// ── Async Thunks ─────────────────────────────────────────────
export const fetchProperties = createAsyncThunk(
  'properties/fetchAll',
  async ({ wardId }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/wards/${wardId}/unassessed`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch properties');
    }
  }
);

export const fetchPropertyById = createAsyncThunk(
  'properties/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/properties/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch property');
    }
  }
);

export const verifyProperty = createAsyncThunk(
  'properties/verify',
  async ({ id, status, notes, updatedBy }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/api/properties/${id}/verify`, mapUIToAPI({ status, notes, updatedBy }));
      return { id, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to verify property');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────
const propertiesSlice = createSlice({
  name: 'properties',
  initialState: {
    items: [],
    selectedItem: null,
    status: 'idle',
    fetchOneStatus: 'idle',
    error: null,
    verifyStatus: 'idle',
    verifyError: null,
  },
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.verifyError = null;
    },
    resetVerifyStatus: (state) => {
      state.verifyStatus = 'idle';
      state.verifyError = null;
    },
    setSelectedProperty: (state, action) => {
      state.selectedItem = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending,   (s) => { s.status = 'loading'; })
      .addCase(fetchProperties.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.items = (a.payload.data || a.payload).map(mapAPIToUI);
        s.error = null;
      })
      .addCase(fetchProperties.rejected,  (s, a) => { s.status = 'failed'; s.error = a.payload; })

      .addCase(fetchPropertyById.pending,   (s) => { s.fetchOneStatus = 'loading'; })
      .addCase(fetchPropertyById.fulfilled, (s, a) => {
        s.fetchOneStatus = 'succeeded';
        s.selectedItem = mapAPIToUI(a.payload.data || a.payload);
      })
      .addCase(fetchPropertyById.rejected,  (s, a) => { s.fetchOneStatus = 'failed'; s.error = a.payload; })

      .addCase(verifyProperty.pending,   (s) => { s.verifyStatus = 'loading'; })
      .addCase(verifyProperty.fulfilled, (s, a) => {
        s.verifyStatus = 'succeeded';
        const idx = s.items.findIndex(i => i.id === a.payload.id);
        if (idx !== -1) s.items[idx] = { ...s.items[idx], ...mapAPIToUI(a.payload) };
        s.verifyError = null;
      })
      .addCase(verifyProperty.rejected,  (s, a) => { s.verifyStatus = 'failed'; s.verifyError = a.payload; });
  },
});

export const { clearErrors, resetVerifyStatus, setSelectedProperty } = propertiesSlice.actions;

// ── Selectors ─────────────────────────────────────────────────
export const selectProperties        = (s) => s.properties.items;
export const selectSelectedProperty  = (s) => s.properties.selectedItem;
export const selectPropertiesStatus  = (s) => s.properties.status;
export const selectPropertiesError   = (s) => s.properties.error;
export const selectVerifyStatus      = (s) => s.properties.verifyStatus;

export default propertiesSlice.reducer;
```

---

## Store Registration

```javascript
// src/Redux/Store.jsx
import propertiesReducer from './slices/propertiesSlice';
import wardsReducer from './slices/wardsSlice';
import statsReducer from './slices/statsSlice';
import chatReducer from './slices/chatSlice';

const store = configureStore({
  reducer: {
    properties: propertiesReducer,
    wards: wardsReducer,
    stats: statsReducer,
    chat: chatReducer,
    // add new slices here
  },
});
```

---

## Component Integration Pattern

```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProperties,
  verifyProperty,
  selectProperties,
  selectPropertiesStatus,
  selectVerifyStatus,
  resetVerifyStatus,
  clearErrors,
} from '../Redux/slices/propertiesSlice';

export default function PropertyList() {
  const dispatch = useDispatch();
  const items        = useSelector(selectProperties);
  const status       = useSelector(selectPropertiesStatus);
  const verifyStatus = useSelector(selectVerifyStatus);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchProperties({ wardId: selectedWardId }));
  }, [status, selectedWardId, dispatch]);

  useEffect(() => {
    if (verifyStatus === 'succeeded') {
      dispatch(resetVerifyStatus());
    }
  }, [verifyStatus, dispatch]);

  const handleVerify = (propertyId, status, notes) => {
    dispatch(verifyProperty({ id: propertyId, status, notes, updatedBy: 'officer' }));
  };

  return (/* ... */);
}
```

---

## GeoJSON + S3 Fetch Pattern

The map GeoJSON comes from S3 via a presigned URL — requires a two-step fetch:

```javascript
export const fetchWardChanges = createAsyncThunk(
  'wards/fetchChanges',
  async (wardId, { rejectWithValue }) => {
    try {
      // Step 1: Get presigned URL from API
      const { data } = await api.get(`/api/wards/${wardId}/changes`);
      // data.presigned_url or data.url
      // Step 2: Fetch actual GeoJSON from S3
      const geoRes = await fetch(data.presigned_url || data.url);
      const geoJSON = await geoRes.json();
      return { wardId, geoJSON };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch ward GeoJSON');
    }
  }
);
```

---

## Chat Slice Pattern (Bedrock Agent)

```javascript
export const sendChatMessage = createAsyncThunk(
  'chat/send',
  async (message, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/chat', { message });
      return { role: 'assistant', content: data.response };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Chat failed');
    }
  }
);

// Initial state includes message history:
// { messages: [{ role: 'user'|'assistant', content: string }], status, error }
```

---

## Slice Reference

| Slice | File | Key Actions |
|-------|------|-------------|
| Wards | `wardsSlice.js` | `fetchWards`, `fetchWardChanges`, `setSelectedWard` |
| Properties | `propertiesSlice.js` | `fetchProperties`, `fetchPropertyById`, `verifyProperty` |
| Stats | `statsSlice.js` | `fetchStats`, `fetchAllWardsStats` |
| Chat | `chatSlice.js` | `sendChatMessage`, `clearChat` |
| Admin | `adminSlice.js` | `uploadCSV`, `updateDBConfig`, `triggerRefresh` |
