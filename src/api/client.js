import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

export const agentApi = axios.create({
  baseURL: import.meta.env.VITE_AGENT_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

agentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Agent API Error]', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

export default api;
