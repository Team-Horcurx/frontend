import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

export function mapAPIToUI(stats) {
  return {
    totalDetections: stats.total_detections ?? 0,
    newBuilds: stats.new_builds ?? 0,
    changeOfUse: stats.change_of_use ?? 0,
    pendingVerification: stats.pending_verification ?? 0,
    verified: stats.verified ?? 0,
    falsePositives: stats.false_positives ?? 0,
    revenueEstimate: stats.revenue_estimate ?? 0,
    wardId: stats.ward_id ?? null,
  };
}

export function mapAllWardsAPIToUI(ward) {
  return {
    wardId: ward.ward_id,
    wardName: ward.ward_name,
    unassessedCount: ward.unassessed_count ?? 0,
    totalDetections: ward.total_detections ?? 0,
    aiBrief: ward.ai_brief ?? null,
  };
}

export const fetchStats = createAsyncThunk(
  'stats/fetchByWard',
  async ({ wardId }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/stats', { params: { ward_id: wardId } });
      return mapAPIToUI(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAllWardsStats = createAsyncThunk(
  'stats/fetchAllWards',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/stats/all-wards');
      return {
        wards: data.wards?.map(mapAllWardsAPIToUI) ?? [],
        aiBreif: data.ai_brief ?? null,
        totals: mapAPIToUI(data.totals ?? {}),
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const statsSlice = createSlice({
  name: 'stats',
  initialState: {
    wardStats: null,
    allWardsStats: null,
    aiBreif: null,
    status: 'idle',
    allWardsStatus: 'idle',
    error: null,
  },
  reducers: {
    clearErrors(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => { state.status = 'loading'; state.wardStats = null; })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.wardStats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchAllWardsStats.pending, (state) => { state.allWardsStatus = 'loading'; })
      .addCase(fetchAllWardsStats.fulfilled, (state, action) => {
        state.allWardsStatus = 'succeeded';
        state.allWardsStats = action.payload.wards;
        state.aiBreif = action.payload.aiBreif;
        state.wardStats = action.payload.totals;
      })
      .addCase(fetchAllWardsStats.rejected, (state, action) => {
        state.allWardsStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearErrors } = statsSlice.actions;

export const selectWardStats = (state) => state.stats.wardStats;
export const selectAllWardsStats = (state) => state.stats.allWardsStats;
export const selectStatsStatus = (state) => state.stats.status;
export const selectAllWardsStatus = (state) => state.stats.allWardsStatus;
export const selectAiBrief = (state) => state.stats.aiBreif;
export const selectStatsError = (state) => state.stats.error;

export default statsSlice.reducer;
