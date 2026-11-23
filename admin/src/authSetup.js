/**
 * Attach the admin token to every request this panel sends to our backend.
 *
 * Admin-only API routes require a `token` header (backend/middleware/adminAuth.js). The panel
 * makes requests three ways: the shared axios instance, its own axios.create() instances, and
 * plain fetch(). Rather than threading the token through every call site, this module (imported
 * first in main.jsx) adds it centrally, and only for URLs on VITE_BACKEND_URL, so the token is
 * never sent to third parties such as Cloudinary.
 */
import axios from 'axios';

const BACKEND = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const isBackendUrl = (url) => {
  if (!BACKEND || !url) return false;
  const u = typeof url === 'string' ? url : url.url || String(url);
  return u.startsWith(BACKEND);
};

// --- fetch -----------------------------------------------------------------------------------
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const token = getToken();
  if (token && isBackendUrl(input)) {
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('token')) headers.set('token', token);
    init = { ...init, headers };
  }
  return originalFetch(input, init).then((response) => {
    // Same behaviour as the axios interceptor in AuthContext: expired session -> back to login
    if (response.status === 401 && token && isBackendUrl(input)) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch { /* ignore */ }
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return response;
  });
};

// --- axios -----------------------------------------------------------------------------------
const addToken = (config) => {
  const token = getToken();
  const url = config.baseURL && !/^https?:/.test(config.url || '')
    ? `${config.baseURL.replace(/\/$/, '')}/${(config.url || '').replace(/^\//, '')}`
    : config.url;
  if (token && isBackendUrl(url)) {
    config.headers = config.headers || {};
    if (typeof config.headers.set === 'function') {
      if (!config.headers.has?.('token')) config.headers.set('token', token);
    } else if (!config.headers.token) {
      config.headers.token = token;
    }
  }
  return config;
};

axios.interceptors.request.use(addToken);

// Instances created with axios.create() don't share the default instance's interceptors.
const originalCreate = axios.create.bind(axios);
axios.create = (...args) => {
  const instance = originalCreate(...args);
  instance.interceptors.request.use(addToken);
  return instance;
};
