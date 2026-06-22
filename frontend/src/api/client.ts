import axios from 'axios';

// API base URL — configurable per environment.
// Local dev falls back to localhost; in production (GitHub Pages) this is set
// via the VITE_API_BASE_URL build-time environment variable.
const envBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const BASE = envBase || 'https://parkinglotsystem-production.up.railway.app';

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

// Keys also written by AuthContext — kept in sync here so we can fully clear a
// stale session.
const USER_KEY = 'parkflow_user';
const SUPER_KEY = 'parkflow_super';

// If the admin token is missing/expired/invalid, the backend replies 401. Rather
// than surfacing a cryptic "invalid token" error, clear the dead session and
// bounce the user to the login screen so they can simply sign in again.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const hadToken = !!localStorage.getItem(TOKEN_KEY);
    if (status === 401 && hadToken) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SUPER_KEY);
      if (!window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin?expired=1';
      } else {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  },
);
