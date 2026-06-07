// In dev, VITE_API_URL is unset so requests go to /api/... (proxied by Vite to localhost:3001).
// In production on Vercel, set VITE_API_URL to your Render backend URL.
const BASE = import.meta.env.VITE_API_URL ?? '';

export function apiFetch(path, options = {}) {
  const token = localStorage.getItem('taskflow_token');
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
