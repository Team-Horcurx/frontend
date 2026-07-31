import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { agentApi } from '../../api/client.js';

export function mapAPIToUI(alert) {
  return {
    id: alert.id,
    severity: alert.severity ?? 'info',
    text: alert.text ?? alert.message ?? '',
    wardId: alert.ward_id,
    createdAt: alert.created_at,
  };
}

export const fetchAlerts = createAsyncThunk(
  'alerts/fetchByWard',
  async (wardId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/wards/${wardId}/alerts`);
      return (data ?? []).map(mapAPIToUI);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const generateWardAlert = createAsyncThunk(
  'alerts/generate',
  async (wardId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await agentApi.post(`/api/wards/${wardId}/alert`);
      dispatch(fetchAlerts(wardId));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

export const exportAlerts = createAsyncThunk(
  'alerts/export',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/alerts/export');
      return data.presigned_url ?? data.url ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const alertsSlice = createSlice({
  name: 'alerts',
  initialState: {
    items: [],
    status: 'idle',
    exportStatus: 'idle',
    generateStatus: 'idle',
    generateError: null,
    lastGenerated: null,
    error: null,
  },
  reducers: {
    resetExportStatus(state) {
      state.exportStatus = 'idle';
    },
    resetGenerateStatus(state) {
      state.generateStatus = 'idle';
      state.generateError = null;
      state.lastGenerated = null;
    },
    clearErrors(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.status = 'loading';
        state.items = [];
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(exportAlerts.pending, (state) => { state.exportStatus = 'loading'; })
      .addCase(exportAlerts.fulfilled, (state) => { state.exportStatus = 'succeeded'; })
      .addCase(exportAlerts.rejected, (state, action) => {
        state.exportStatus = 'failed';
        state.error = action.payload;
      })
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
      });
  },
});

export const { resetExportStatus, resetGenerateStatus, clearErrors } = alertsSlice.actions;

export const selectAlerts = (state) => state.alerts.items;
export const selectAlertsStatus = (state) => state.alerts.status;
export const selectExportStatus = (state) => state.alerts.exportStatus;
export const selectGenerateStatus = (state) => state.alerts.generateStatus;
export const selectGenerateError = (state) => state.alerts.generateError;
export const selectLastGenerated = (state) => state.alerts.lastGenerated;
export const selectAlertsError = (state) => state.alerts.error;

export default alertsSlice.reducer;
