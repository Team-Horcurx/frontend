import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

export function mapAPIToUI(ward) {
  return {
    id: ward.id,
    name: ward.name,
    bbox: ward.bbox,
    geojsonS3: ward.geojson_s3,
    detectionCount: ward.detection_count ?? 0,
  };
}

export function mapUIToAPI(ward) {
  return {
    id: ward.id,
    name: ward.name,
    bbox: ward.bbox,
    geojson_s3: ward.geojsonS3,
  };
}

export const fetchWards = createAsyncThunk(
  'wards/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/wards');
      return data.map(mapAPIToUI);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchWardGeoJSON = createAsyncThunk(
  'wards/fetchGeoJSON',
  async (wardId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/wards/${wardId}/changes`);
      const geoRes = await fetch(data.presigned_url);
      return await geoRes.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const wardsSlice = createSlice({
  name: 'wards',
  initialState: {
    items: [],
    selectedWardId: null,
    wardGeoJSON: null,
    status: 'idle',
    geoJSONStatus: 'idle',
    error: null,
  },
  reducers: {
    setSelectedWard(state, action) {
      state.selectedWardId = action.payload;
      state.wardGeoJSON = null;
      state.geoJSONStatus = 'idle';
    },
    clearErrors(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWards.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchWards.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchWards.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchWardGeoJSON.pending, (state) => { state.geoJSONStatus = 'loading'; })
      .addCase(fetchWardGeoJSON.fulfilled, (state, action) => {
        state.geoJSONStatus = 'succeeded';
        state.wardGeoJSON = action.payload;
      })
      .addCase(fetchWardGeoJSON.rejected, (state, action) => {
        state.geoJSONStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setSelectedWard, clearErrors } = wardsSlice.actions;

export const selectWards = (state) => state.wards.items;
export const selectSelectedWardId = (state) => state.wards.selectedWardId;
export const selectSelectedWard = (state) =>
  state.wards.items.find((w) => w.id === state.wards.selectedWardId) ?? null;
export const selectWardGeoJSON = (state) => state.wards.wardGeoJSON;
export const selectWardsStatus = (state) => state.wards.status;
export const selectGeoJSONStatus = (state) => state.wards.geoJSONStatus;
export const selectWardsError = (state) => state.wards.error;

export default wardsSlice.reducer;
