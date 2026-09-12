import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

export function mapAPIToUI(c) {
  return {
    id: c.id,
    wardId:              c.ward_id,
    matchId:             c.match_id,
    conflictType:        c.conflict_type,
    severity:            c.severity,
    suggestedResolution: c.suggested_resolution,
    status:              c.status,
    resolvedBy:          c.resolved_by,
    resolvedAt:          c.resolved_at,
  };
}

export const fetchConflicts = createAsyncThunk(
  'conflicts/fetch',
  async ({ wardId, status } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (wardId) params.ward_id = wardId;
      if (status) params.status  = status;
      const { data } = await api.get('/api/conflicts', { params });
      return (data.conflicts ?? []).map(mapAPIToUI);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const resolveConflict = createAsyncThunk(
  'conflicts/resolve',
  async ({ id, status, notes, resolvedBy }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/api/conflicts/${id}/resolve`, {
        status,
        notes:       notes       ?? '',
        resolved_by: resolvedBy  ?? 'officer',
      });
      return { id, status: data.status ?? status };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

const conflictsSlice = createSlice({
  name: 'conflicts',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    resolveStatus: 'idle',
    resolveError: null,
  },
  reducers: {
    resetResolveStatus(state) {
      state.resolveStatus = 'idle';
      state.resolveError  = null;
    },
    clearErrors(state) {
      state.error        = null;
      state.resolveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConflicts.pending,    (state) => { state.status = 'loading'; state.items = []; })
      .addCase(fetchConflicts.fulfilled,  (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchConflicts.rejected,   (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(resolveConflict.pending,   (state) => { state.resolveStatus = 'loading'; state.resolveError = null; })
      .addCase(resolveConflict.fulfilled, (state, action) => {
        state.resolveStatus = 'succeeded';
        const { id, status } = action.payload;
        const idx = state.items.findIndex((c) => c.id === id);
        if (idx !== -1) state.items[idx].status = status;
      })
      .addCase(resolveConflict.rejected,  (state, action) => { state.resolveStatus = 'failed'; state.resolveError = action.payload; });
  },
});

export const { resetResolveStatus, clearErrors } = conflictsSlice.actions;

export const selectConflicts      = (state) => state.conflicts.items;
export const selectConflictsStatus = (state) => state.conflicts.status;
export const selectResolveStatus  = (state) => state.conflicts.resolveStatus;
export const selectResolveError   = (state) => state.conflicts.resolveError;
export const selectConflictsError = (state) => state.conflicts.error;

export default conflictsSlice.reducer;
