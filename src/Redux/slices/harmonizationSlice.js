import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

export function mapMatchToUI(m) {
  return {
    id: m.id,
    sourceAId:   m.source_a_id,
    sourceAType: m.source_a_type,
    sourceBId:   m.source_b_id,
    sourceBType: m.source_b_type,
    geometryIou:       m.geometry_iou,
    centroidDistanceM: m.centroid_distance_m,
    matchScore:  m.match_score,
    matchedAt:   m.matched_at,
  };
}

export const runMatching = createAsyncThunk(
  'harmonization/run',
  async (wardId, { rejectWithValue }) => {
    try {
      const params = wardId ? { ward_id: wardId } : {};
      const { data } = await api.post('/api/harmonization/run', {}, { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

export const fetchMatches = createAsyncThunk(
  'harmonization/fetchMatches',
  async ({ wardId, minScore } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (wardId)   params.ward_id   = wardId;
      if (minScore) params.min_score = minScore;
      const { data } = await api.get('/api/harmonization/matches', { params });
      return (data.matches ?? []).map(mapMatchToUI);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const harmonizationSlice = createSlice({
  name: 'harmonization',
  initialState: {
    matches: [],
    matchesStatus: 'idle',
    matchesError: null,
    runStatus: 'idle',
    runError: null,
    lastRunResult: null,
  },
  reducers: {
    resetRunStatus(state) {
      state.runStatus = 'idle';
      state.runError  = null;
    },
    clearErrors(state) {
      state.matchesError = null;
      state.runError     = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending,   (state) => { state.matchesStatus = 'loading'; state.matches = []; })
      .addCase(fetchMatches.fulfilled, (state, action) => { state.matchesStatus = 'succeeded'; state.matches = action.payload; })
      .addCase(fetchMatches.rejected,  (state, action) => { state.matchesStatus = 'failed'; state.matchesError = action.payload; })
      .addCase(runMatching.pending,    (state) => { state.runStatus = 'loading'; state.runError = null; })
      .addCase(runMatching.fulfilled,  (state, action) => { state.runStatus = 'succeeded'; state.lastRunResult = action.payload; })
      .addCase(runMatching.rejected,   (state, action) => { state.runStatus = 'failed'; state.runError = action.payload; });
  },
});

export const { resetRunStatus, clearErrors } = harmonizationSlice.actions;

export const selectMatches        = (state) => state.harmonization.matches;
export const selectMatchesStatus  = (state) => state.harmonization.matchesStatus;
export const selectRunStatus      = (state) => state.harmonization.runStatus;
export const selectRunError       = (state) => state.harmonization.runError;
export const selectLastRunResult  = (state) => state.harmonization.lastRunResult;

export default harmonizationSlice.reducer;
