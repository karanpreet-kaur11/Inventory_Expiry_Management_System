import type { Status } from '../types';

export const STATUS_COLORS: Record<Status, string> = {
  safe: 'status-safe',
  expiring30: 'status-expiring30',
  expiring7: 'status-expiring7',
  expired: 'status-expired',
};

export const STATUS_DOT: Record<Status, string> = {
  safe: 'dot-safe',
  expiring30: 'dot-expiring30',
  expiring7: 'dot-expiring7',
  expired: 'dot-expired',
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isSameMonth(iso: string, year: number, month: number): boolean {
  const d = new Date(iso + 'T00:00:00');
  return d.getFullYear() === year && d.getMonth() === month;
}
