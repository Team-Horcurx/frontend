import { configureStore } from '@reduxjs/toolkit';
import wardsReducer from './slices/wardsSlice.js';
import propertiesReducer from './slices/propertiesSlice.js';
import statsReducer from './slices/statsSlice.js';
import adminReducer from './slices/adminSlice.js';
import chatReducer from './slices/chatSlice.js';
import alertsReducer from './slices/alertsSlice.js';
import assessmentsReducer from './slices/assessmentsSlice.js';
import ticketsReducer from './slices/ticketsSlice.js';

const store = configureStore({
  reducer: {
    wards: wardsReducer,
    properties: propertiesReducer,
    stats: statsReducer,
    admin: adminReducer,
    chat: chatReducer,
    alerts: alertsReducer,
    assessments: assessmentsReducer,
    tickets: ticketsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
