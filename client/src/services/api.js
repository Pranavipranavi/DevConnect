import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devconnect_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data || {};
    const message = payload.message || (error.code === 'ERR_NETWORK'
      ? 'API server is not reachable. Start the backend and check environment variables.'
      : error.message || 'Request failed');
    return Promise.reject({ ...payload, message, status: error.response?.status, code: error.code });
  }
);

export default api;
