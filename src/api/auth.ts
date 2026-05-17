import { api, clearAuthToken, initCsrf, setAuthToken } from './client';
import type { ApiUser } from './types';

export async function register(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string
): Promise<ApiUser> {
  clearAuthToken();
  await initCsrf();
  const { data } = await api.post<{ user: ApiUser }>('/register', {
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
  });
  return data.user;
}

export async function login(email: string, password: string): Promise<ApiUser> {
  clearAuthToken();
  await initCsrf();
  const { data } = await api.post<{ user: ApiUser }>('/login', { email, password });
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/logout');
  } finally {
    clearAuthToken();
  }
}

export function saveTokenFromOAuth(token: string): void {
  setAuthToken(token);
}

export async function fetchUser(): Promise<ApiUser | null> {
  try {
    const { data } = await api.get<{ user: ApiUser }>('/user');
    return data.user;
  } catch {
    return null;
  }
}

export async function isGoogleLoginEnabled(): Promise<boolean> {
  try {
    const { data } = await api.get<{ google_enabled: boolean }>('/auth/google/config');
    return data.google_enabled;
  } catch {
    return false;
  }
}

/** OAuth goes directly to Laravel (port 8000) so redirect_uri matches Google Console. */
export function googleLogin(): void {
  const oauthBase =
    import.meta.env.VITE_OAUTH_URL ||
    import.meta.env.VITE_API_BACKEND_URL ||
    'http://localhost:8000/api';
  window.location.href = `${oauthBase.replace(/\/$/, '')}/auth/google/redirect`;
}
