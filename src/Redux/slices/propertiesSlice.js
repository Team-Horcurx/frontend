import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { agentApi } from '../../api/client.js';

export function mapAPIToUI(prop) {
  return {
    id: prop.id,
    wardId: prop.ward_id,
    lat: prop.lat,
    lng: prop.lng,
    areaSqm: prop.area_sqm,
    detectionType: prop.detection_type,
    confidence: prop.confidence,
    ndbiDelta: prop.ndbi_delta ?? prop.confidence_breakdown?.ndbi_delta ?? 0,
    confidenceBreakdown: prop.confidence_breakdown ?? {},
    detectedAt: prop.detected_at,
    s3GeojsonKey: prop.s3_geojson_key,
    status: prop.status ?? 'pending',
    comparisonYear: prop.comparison_year ?? null,
    baselineYear: prop.baseline_year ?? null,
    aiExplanation: prop.ai_explanation ?? null,
  };
}

export function mapUIToAPI(prop) {
  return {
    id: prop.id,
    ward_id: prop.wardId,
    area_sqm: prop.areaSqm,
    detection_type: prop.detectionType,
    confidence: prop.confidence,
  };
}

export const fetchProperties = createAsyncThunk(
  'properties/fetchByWard',
  async ({ wardId, type, status, compareYear }, { rejectWithValue }) => {
    try {
      const params = {};
      if (type) params.type = type;
      if (status) params.status = status;
      if (compareYear) params.comparison_year = compareYear;
      const { data } = await api.get(`/api/wards/${wardId}/unassessed`, { params });
      return data.map(mapAPIToUI);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchPropertyById = createAsyncThunk(
  'properties/fetchOne',
  async (propertyId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/properties/${propertyId}`);
      return mapAPIToUI(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchPropertyExplanation = createAsyncThunk(
  'properties/fetchExplanation',
  async (propertyId, { rejectWithValue }) => {
    try {
      const { data } = await agentApi.get(`/api/explain/${propertyId}`);
      return { propertyId, explanation: data.ai_explanation };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

export const verifyProperty = createAsyncThunk(
  'properties/verify',
  async ({ id, status, notes, updatedBy }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/api/properties/${id}/verify`, {
        status,
        notes: notes ?? '',
        updated_by: updatedBy ?? 'officer',
      });
      return { id, status: data.status ?? status };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState: {
    items: [],
    selectedItem: null,
    status: 'idle',
    fetchOneStatus: 'idle',
    explanationStatus: 'idle',
    explanationError: null,
    error: null,
    verifyStatus: 'idle',
    verifyError: null,
  },
  reducers: {
    setSelectedProperty(state, action) {
      const id = action.payload;
      state.selectedItem = state.items.find((p) => p.id === id) ?? null;
      state.fetchOneStatus = 'idle';
      state.explanationStatus = 'idle';
      state.explanationError = null;
      state.verifyStatus = 'idle';
      state.verifyError = null;
    },
    clearSelectedProperty(state) {
      state.selectedItem = null;
    },
    resetVerifyStatus(state) {
      state.verifyStatus = 'idle';
      state.verifyError = null;
    },
    clearErrors(state) {
      state.error = null;
      state.verifyError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.status = 'loading';
        state.items = [];
        state.selectedItem = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchPropertyById.pending, (state) => { state.fetchOneStatus = 'loading'; })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.fetchOneStatus = 'succeeded';
        state.selectedItem = action.payload;
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.fetchOneStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchPropertyExplanation.pending, (state) => {
        state.explanationStatus = 'loading';
        state.explanationError = null;
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
      .addCase(verifyProperty.pending, (state) => { state.verifyStatus = 'loading'; })
      .addCase(verifyProperty.fulfilled, (state, action) => {
        state.verifyStatus = 'succeeded';
        const { id, status } = action.payload;
        const idx = state.items.findIndex((p) => p.id === id);
        if (idx !== -1) state.items[idx].status = status;
        if (state.selectedItem?.id === id) state.selectedItem.status = status;
      })
      .addCase(verifyProperty.rejected, (state, action) => {
        state.verifyStatus = 'failed';
        state.verifyError = action.payload;
      });
  },
});

export const {
  setSelectedProperty,
  clearSelectedProperty,
  resetVerifyStatus,
  clearErrors,
} = propertiesSlice.actions;

export const selectProperties = (state) => state.properties.items;
export const selectSelectedProperty = (state) => state.properties.selectedItem;
export const selectPropertiesStatus = (state) => state.properties.status;
export const selectFetchOneStatus = (state) => state.properties.fetchOneStatus;
export const selectExplanationStatus = (state) => state.properties.explanationStatus;
export const selectExplanationError = (state) => state.properties.explanationError;
export const selectVerifyStatus = (state) => state.properties.verifyStatus;
export const selectVerifyError = (state) => state.properties.verifyError;
export const selectPropertiesError = (state) => state.properties.error;

export default propertiesSlice.reducer;
