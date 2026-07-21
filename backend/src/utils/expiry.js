const DAY_MS = 24 * 60 * 60 * 1000;

export const CATEGORIES = ['Medicine', 'Food', 'Cosmetics', 'Laboratory', 'Chemicals', 'Other'];
export const EXPIRY_TYPES = ['days', 'weeks', 'months', 'years', 'exact'];

function parseDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d;
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

export function computeExpiryDate({ manufacturingDate, expiryType, expiryValue, expiryDate }) {
  if (expiryType === 'exact') {
    if (!expiryDate) throw new Error('expiryDate is required when expiryType is "exact"');
    return expiryDate;
  }

  if (!manufacturingDate) throw new Error('manufacturingDate is required for duration-based expiry');
  const value = Number(expiryValue);
  if (!Number.isFinite(value) || value <= 0) throw new Error('expiryValue must be a positive number');

  const base = parseDate(manufacturingDate);
  const result = new Date(base.getTime());

  switch (expiryType) {
    case 'days':
      result.setDate(result.getDate() + value);
      break;
    case 'weeks':
      result.setDate(result.getDate() + value * 7);
      break;
    case 'months':
      result.setMonth(result.getMonth() + value);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + value);
      break;
    default:
      throw new Error(`Unknown expiryType: ${expiryType}`);
  }

  return formatDate(result);
}

export function daysRemaining(expiryDate, today = new Date()) {
  const t = new Date(today.toISOString().slice(0, 10) + 'T00:00:00');
  const e = parseDate(expiryDate);
  return Math.round((e.getTime() - t.getTime()) / DAY_MS);
}

// safe | expiring30 | expiring7 | expired
export function computeStatus(expiryDate, today = new Date()) {
  const remaining = daysRemaining(expiryDate, today);
  if (remaining < 0) return 'expired';
  if (remaining <= 7) return 'expiring7';
  if (remaining <= 30) return 'expiring30';
  return 'safe';
}
