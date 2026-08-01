import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

export function mapAPIToUI(ticket) {
  return {
    id: ticket.id,
    wardId: ticket.ward_id,
    wardName: ticket.ward_name ?? null,
    propertyId: ticket.property_id ?? null,
    houseNumber: ticket.house_number,
    description: ticket.description,
    taxPending: ticket.tax_pending ?? null,
    photoS3Key: ticket.photo_s3_key ?? null,
    photoUrl: ticket.photo_url ?? null,
    status: ticket.status ?? 'open',
    supervisorNotes: ticket.supervisor_notes ?? null,
    reviewedBy: ticket.reviewed_by ?? null,
    reviewedAt: ticket.reviewed_at ?? null,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  };
}

export function mapUIToAPI(ticket) {
  return {
    ward_id: ticket.wardId,
    property_id: ticket.propertyId ?? undefined,
    house_number: ticket.houseNumber,
    description: ticket.description,
    tax_pending: ticket.taxPending ?? undefined,
    photo_s3_key: ticket.photoS3Key ?? undefined,
  };
}

export const fetchTickets = createAsyncThunk(
  'tickets/fetchAll',
  async ({ wardId, status } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (wardId) params.ward_id = wardId;
      if (status) params.status = status;
      const { data } = await api.get('/api/tickets', { params });
      return (data.tickets ?? []).map(mapAPIToUI);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/tickets', mapUIToAPI(payload));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

export const getPhotoUploadUrl = createAsyncThunk(
  'tickets/getPhotoUploadUrl',
  async (filename, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/tickets/photo-upload', { filename });
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const reviewTicket = createAsyncThunk(
  'tickets/review',
  async ({ ticketId, status, supervisorNotes, reviewedBy = 'supervisor' }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/api/tickets/${ticketId}/review`, {
        status,
        supervisor_notes: supervisorNotes ?? '',
        reviewed_by: reviewedBy,
      });
      return { ticketId, status: data.status ?? status, supervisorNotes, reviewedBy };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    createStatus: 'idle',
    createError: null,
    reviewStatus: 'idle',
    reviewError: null,
  },
  reducers: {
    resetCreateStatus(state) {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetReviewStatus(state) {
      state.reviewStatus = 'idle';
      state.reviewError = null;
    },
    clearErrors(state) {
      state.error = null;
      state.createError = null;
      state.reviewError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createTicket.pending, (state) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createTicket.fulfilled, (state) => {
        state.createStatus = 'succeeded';
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload;
      })
      .addCase(reviewTicket.pending, (state) => {
        state.reviewStatus = 'loading';
        state.reviewError = null;
      })
      .addCase(reviewTicket.fulfilled, (state, action) => {
        state.reviewStatus = 'succeeded';
        const { ticketId, status, supervisorNotes, reviewedBy } = action.payload;
        const idx = state.items.findIndex((t) => t.id === ticketId);
        if (idx !== -1) {
          state.items[idx].status = status;
          state.items[idx].supervisorNotes = supervisorNotes;
          state.items[idx].reviewedBy = reviewedBy;
        }
      })
      .addCase(reviewTicket.rejected, (state, action) => {
        state.reviewStatus = 'failed';
        state.reviewError = action.payload;
      });
  },
});

export const { resetCreateStatus, resetReviewStatus, clearErrors } = ticketsSlice.actions;

export const selectTickets = (state) => state.tickets.items;
export const selectTicketsStatus = (state) => state.tickets.status;
export const selectTicketsError = (state) => state.tickets.error;
export const selectCreateStatus = (state) => state.tickets.createStatus;
export const selectCreateError = (state) => state.tickets.createError;
export const selectReviewStatus = (state) => state.tickets.reviewStatus;
export const selectReviewError = (state) => state.tickets.reviewError;

export default ticketsSlice.reducer;
