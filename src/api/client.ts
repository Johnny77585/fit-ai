import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
const AUTH_TOKEN_KEY = 'fit_ai_auth_token';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function initCsrf(): Promise<void> {
  if (getAuthToken()) return;
  // Cross-origin deploys (e.g. GitHub Pages -> Render) use token auth only;
  // CSRF cookie is only needed when frontend and backend share the same origin/root domain.
  if (import.meta.env.PROD) return;
  try {
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
  } catch {
    // Swallow: token-based login below still works even if CSRF cookie isn't reachable.
  }
}
