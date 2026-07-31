import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

export const sendChatMessage = createAsyncThunk(
  'chat/send',
  async (message, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/chat', { message });
      return data.response ?? data.message ?? '';
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearChat(state) {
      state.messages = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state, action) => {
        state.status = 'loading';
        state.messages.push({ role: 'user', content: action.meta.arg });
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages.push({ role: 'assistant', content: action.payload });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.messages.push({ role: 'assistant', content: `Error: ${action.payload}` });
      });
  },
});

export const { clearChat } = chatSlice.actions;

export const selectChatMessages = (state) => state.chat.messages;
export const selectChatStatus = (state) => state.chat.status;
export const selectChatError = (state) => state.chat.error;

export default chatSlice.reducer;
