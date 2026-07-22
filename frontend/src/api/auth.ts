export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
}

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/auth`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    request<AuthUser>('/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  login: (email: string, password: string) =>
    request<AuthUser>('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<void>('/logout', { method: 'POST' }),
  me: () => request<AuthUser>('/me'),
};
