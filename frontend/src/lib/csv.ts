import type { Product, ProductInput } from '../types';

const HEADERS = ['name', 'category', 'batchNumber', 'quantity', 'manufacturingDate', 'expiryType', 'expiryValue', 'expiryDate'] as const;

function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function productsToCsv(products: Product[]): string {
  const rows = [
    ['name', 'category', 'batchNumber', 'quantity', 'manufacturingDate', 'expiryType', 'expiryValue', 'expiryDate', 'status', 'remainingDays'],
    ...products.map((p) => [p.name, p.category, p.batchNumber, p.quantity, p.manufacturingDate, p.expiryType, p.expiryValue, p.expiryDate, p.status, p.remainingDays]),
  ];
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

export function csvToProductInputs(text: string): { items: ProductInput[]; errors: string[] } {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  if (lines.length === 0) return { items: [], errors: ['File is empty'] };

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const items: ProductInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const record: Record<string, string> = {};
    header.forEach((h, idx) => {
      record[h] = (cells[idx] ?? '').trim();
    });

    if (!record.name) {
      errors.push(`Row ${i + 1}: missing name`);
      continue;
    }

    items.push({
      name: record.name,
      category: (record.category as ProductInput['category']) || 'Other',
      batchNumber: record.batchNumber || null,
      quantity: record.quantity ? Number(record.quantity) : null,
      manufacturingDate: record.manufacturingDate || null,
      expiryType: (record.expiryType as ProductInput['expiryType']) || 'exact',
      expiryValue: record.expiryValue ? Number(record.expiryValue) : null,
      expiryDate: record.expiryDate || null,
    });
  }

  return { items, errors };
}

export const CSV_TEMPLATE_HEADER = HEADERS.join(',');
