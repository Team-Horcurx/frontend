import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

export function mapAPIToUI(src) {
  return {
    id: src.id,
    type: src.type,
    wardId: src.ward_id,
    s3Key: src.s3_key,
    filename: src.filename,
    crs: src.crs,
    status: src.status,
    capturedAt: src.captured_at,
    createdAt: src.created_at,
    metadata: src.metadata ?? {},
    downloadUrl: src.download_url ?? null,
  };
}

export const fetchSources = createAsyncThunk(
  'sources/fetch',
  async ({ type, wardId, status } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (type)   params.type    = type;
      if (wardId) params.ward_id = wardId;
      if (status) params.status  = status;
      const { data } = await api.get('/api/sources', { params });
      return (data.sources ?? []).map(mapAPIToUI);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const uploadSource = createAsyncThunk(
  'sources/upload',
  async ({ fileContent, type, wardId, filename, crs, capturedAt }, { rejectWithValue }) => {
    try {
      const payload = { file_content: fileContent, type, filename };
      if (wardId)    payload.ward_id    = wardId;
      if (crs)       payload.crs        = crs;
      if (capturedAt) payload.captured_at = capturedAt;
      const { data } = await api.post('/api/sources/upload', payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

const sourcesSlice = createSlice({
  name: 'sources',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    uploadStatus: 'idle',
    uploadError: null,
  },
  reducers: {
    resetUploadStatus(state) {
      state.uploadStatus = 'idle';
      state.uploadError  = null;
    },
    clearErrors(state) {
      state.error       = null;
      state.uploadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSources.pending,   (state) => { state.status = 'loading'; state.items = []; })
      .addCase(fetchSources.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchSources.rejected,  (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(uploadSource.pending,   (state) => { state.uploadStatus = 'loading'; state.uploadError = null; })
      .addCase(uploadSource.fulfilled, (state) => { state.uploadStatus = 'succeeded'; })
      .addCase(uploadSource.rejected,  (state, action) => { state.uploadStatus = 'failed'; state.uploadError = action.payload; });
  },
});

export const { resetUploadStatus, clearErrors } = sourcesSlice.actions;

export const selectSources       = (state) => state.sources.items;
export const selectSourcesStatus = (state) => state.sources.status;
export const selectUploadStatus  = (state) => state.sources.uploadStatus;
export const selectUploadError   = (state) => state.sources.uploadError;
export const selectSourcesError  = (state) => state.sources.error;

export default sourcesSlice.reducer;
