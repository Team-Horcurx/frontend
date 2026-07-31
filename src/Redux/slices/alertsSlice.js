import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

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
    error: null,
  },
  reducers: {
    resetExportStatus(state) {
      state.exportStatus = 'idle';
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
      });
  },
});

export const { resetExportStatus, clearErrors } = alertsSlice.actions;

export const selectAlerts = (state) => state.alerts.items;
export const selectAlertsStatus = (state) => state.alerts.status;
export const selectExportStatus = (state) => state.alerts.exportStatus;
export const selectAlertsError = (state) => state.alerts.error;

export default alertsSlice.reducer;
