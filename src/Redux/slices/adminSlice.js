import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

export const fetchAdminConfig = createAsyncThunk(
  'admin/fetchConfig',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/stats');
      return {
        dataMode: data.data_mode ?? 'demo',
        pipelineStatus: data.pipeline_status ?? 'idle',
        lastRefresh: data.last_refresh ?? null,
        ndbiThreshold: data.ndbi_threshold ?? 0.15,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const uploadCSV = createAsyncThunk(
  'admin/uploadCSV',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/admin/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const saveDbConfig = createAsyncThunk(
  'admin/saveDbConfig',
  async (config, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/admin/db-config', config);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const triggerRefresh = createAsyncThunk(
  'admin/triggerRefresh',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/admin/refresh');
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    dataMode: 'demo',
    pipelineStatus: 'idle',
    lastRefresh: null,
    ndbiThreshold: 0.15,
    uploadStatus: 'idle',
    uploadError: null,
    configStatus: 'idle',
    error: null,
  },
  reducers: {
    setDataMode(state, action) {
      state.dataMode = action.payload;
    },
    resetUploadStatus(state) {
      state.uploadStatus = 'idle';
      state.uploadError = null;
    },
    clearErrors(state) {
      state.error = null;
      state.uploadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminConfig.fulfilled, (state, action) => {
        state.dataMode = action.payload.dataMode;
        state.pipelineStatus = action.payload.pipelineStatus;
        state.lastRefresh = action.payload.lastRefresh;
        state.ndbiThreshold = action.payload.ndbiThreshold;
      })
      .addCase(uploadCSV.pending, (state) => { state.uploadStatus = 'loading'; })
      .addCase(uploadCSV.fulfilled, (state) => {
        state.uploadStatus = 'succeeded';
        state.dataMode = 'live';
      })
      .addCase(uploadCSV.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.uploadError = action.payload;
      })
      .addCase(triggerRefresh.pending, (state) => { state.pipelineStatus = 'running'; })
      .addCase(triggerRefresh.fulfilled, (state) => { state.pipelineStatus = 'completed'; })
      .addCase(triggerRefresh.rejected, (state, action) => {
        state.pipelineStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setDataMode, resetUploadStatus, clearErrors } = adminSlice.actions;

export const selectDataMode = (state) => state.admin.dataMode;
export const selectPipelineStatus = (state) => state.admin.pipelineStatus;
export const selectLastRefresh = (state) => state.admin.lastRefresh;
export const selectNdbiThreshold = (state) => state.admin.ndbiThreshold;
export const selectUploadStatus = (state) => state.admin.uploadStatus;
export const selectUploadError = (state) => state.admin.uploadError;
export const selectAdminError = (state) => state.admin.error;

export default adminSlice.reducer;
