import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

const friendlyMessage = (error, payload = {}) => {
  const raw = String(payload.message || error.message || '').trim();

  if (error.code === 'ERR_NETWORK') return 'Unable to connect to server';
  if (/cloudinary|image upload|file upload/i.test(raw)) return 'Image upload failed';
  if (/jwt|token|session expired|invalid session|log in again|login again/i.test(raw)) return 'Please login again';
  if (/email already registered|account with this email/i.test(raw)) {
    return 'An account with this email already exists. Please login.';
  }
  if (/duplicate field value|duplicate key|e11000/i.test(raw)) return 'This record already exists';
  if (error.response?.status >= 500) return 'Something went wrong. Please try again.';

  return raw || 'Something went wrong. Please try again.';
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devconnect_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data || {};
    const message = friendlyMessage(error, payload);
    return Promise.reject({ ...payload, message, status: error.response?.status, code: error.code });
  }
);

export default api;
