import axios from 'axios';

// API base URL — configurable per environment.
// Local dev falls back to localhost; in production (GitHub Pages) this is set
// via the VITE_API_BASE_URL build-time environment variable.
const envBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const BASE = envBase || 'http://localhost:3000';

export const TOKEN_KEY = 'parkflow_token';

// A single axios instance used by all API modules. The request interceptor
// automatically attaches the admin JWT (when logged in) to every request, so
// protected endpoints (park/clear/init + admin management) just work.
export const client = axios.create({ baseURL: BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
