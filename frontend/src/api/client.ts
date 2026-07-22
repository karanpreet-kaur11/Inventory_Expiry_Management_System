import type { Product, ProductInput, Category, ExpiryType } from '../types';

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/products`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  meta: () => request<{ categories: Category[]; expiryTypes: ExpiryType[] }>('/meta'),
  list: (archived = false) => request<Product[]>(`?archived=${archived}`),
  get: (id: number) => request<Product>(`/${id}`),
  create: (input: ProductInput) => request<Product>('', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: ProductInput) => request<Product>(`/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  bulkCreate: (items: ProductInput[]) =>
    request<{ created: Product[]; errors: { index: number; error: string; item: unknown }[] }>('/bulk', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  duplicate: (id: number) => request<Product>(`/${id}/duplicate`, { method: 'POST' }),
  archive: (id: number) => request<Product>(`/${id}/archive`, { method: 'POST' }),
  restore: (id: number) => request<Product>(`/${id}/restore`, { method: 'POST' }),
  remove: (id: number) => request<void>(`/${id}`, { method: 'DELETE' }),
};
