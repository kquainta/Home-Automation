import axios from 'axios';

// Determine API base URL dynamically:
// 1. If VITE_API_URL is set and doesn't contain a local IP, use it
// 2. Otherwise use same origin as frontend (works for both localhost and external domains)
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '');
  
  // If VITE_API_URL is set and it's not a local IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x, localhost, 127.x.x.x)
  // then use it (for production builds with specific domain)
  if (envURL && !envURL.match(/^(https?:\/\/)?(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/i)) {
    return `${envURL}/api/v1`;
  }
  
  // Use same origin - works for both localhost and external domains
  // This allows the frontend to call the backend on the same hostname/port
  return '/api/v1';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export default api;
