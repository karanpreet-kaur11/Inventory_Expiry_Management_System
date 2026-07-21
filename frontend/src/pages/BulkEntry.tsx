import { useState } from 'react';
import { Plus, Trash2, Save, Download } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import type { Category, ExpiryType } from '../types';
import { todayISO } from '../lib/expiry';
import { CSV_TEMPLATE_HEADER, downloadCsv } from '../lib/csv';

interface Row {
  id: number;
  name: string;
  category: Category;
  batchNumber: string;
  quantity: string;
  manufacturingDate: string;
  expiryType: ExpiryType;
  expiryValue: string;
  expiryDate: string;
}

let rowSeq = 1;
function emptyRow(): Row {
  return {
    id: rowSeq++,
    name: '',
    category: 'Other',
    batchNumber: '',
    quantity: '',
    manufacturingDate: todayISO(),
    expiryType: 'months',
    expiryValue: '6',
    expiryDate: '',
  };
}

export function BulkEntry() {
  const { categories, bulkCreate } = useProducts();
  const [rows, setRows] = useState<Row[]>(() => [emptyRow(), emptyRow(), emptyRow()]);
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSaveAll() {
    setResult(null);
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      setResult('Add at least one product name.');
      return;
    }
    setSaving(true);
    try {
      const items = validRows.map((r) => ({
        name: r.name.trim(),
        category: r.category,
        batchNumber: r.batchNumber || null,
        quantity: r.quantity ? Number(r.quantity) : null,
        manufacturingDate: r.expiryType === 'exact' ? r.manufacturingDate || null : r.manufacturingDate,
        expiryType: r.expiryType,
        expiryValue: r.expiryType === 'exact' ? null : Number(r.expiryValue),
        expiryDate: r.expiryType === 'exact' ? r.expiryDate : null,
      }));
      const res = await bulkCreate(items);
      setResult(
        `Saved ${res.created.length} product(s).` +
          (res.errors.length ? ` ${res.errors.length} row(s) failed: ${res.errors.map((e) => e.error).join('; ')}` : ''),
      );
      if (res.errors.length === 0) {
        setRows([emptyRow(), emptyRow(), emptyRow()]);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Bulk Entry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Add multiple products quickly, like an Excel sheet</p>
        </div>
        <button
          onClick={() => downloadCsv('import_template.csv', CSV_TEMPLATE_HEADER)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Download size={16} /> CSV Template
        </button>
      </div>

      {result && <div className="rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">{result}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Batch</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Expiry Type</th>
              <th className="px-3 py-2">Mfg. Date</th>
              <th className="px-3 py-2">Duration / Exact Date</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-1.5">
                  <input
                    value={r.name}
                    onChange={(e) => updateRow(r.id, { name: e.target.value })}
                    placeholder="Product name"
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </td>
                <td className="p-1.5">
                  <select
                    value={r.category}
                    onChange={(e) => updateRow(r.id, { category: e.target.value as Category })}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1.5">
                  <input
                    value={r.batchNumber}
                    onChange={(e) => updateRow(r.id, { batchNumber: e.target.value })}
                    className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="number"
                    value={r.quantity}
                    onChange={(e) => updateRow(r.id, { quantity: e.target.value })}
                    className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </td>
                <td className="p-1.5">
                  <select
                    value={r.expiryType}
                    onChange={(e) => updateRow(r.id, { expiryType: e.target.value as ExpiryType })}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                    <option value="exact">Exact Date</option>
                  </select>
                </td>
                <td className="p-1.5">
                  <input
                    type="date"
                    value={r.manufacturingDate}
                    onChange={(e) => updateRow(r.id, { manufacturingDate: e.target.value })}
                    disabled={r.expiryType === 'exact'}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </td>
                <td className="p-1.5">
                  {r.expiryType === 'exact' ? (
                    <input
                      type="date"
                      value={r.expiryDate}
                      onChange={(e) => updateRow(r.id, { expiryDate: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={r.expiryValue}
                      onChange={(e) => updateRow(r.id, { expiryValue: e.target.value })}
                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  )}
                </td>
                <td className="p-1.5">
                  <button onClick={() => removeRow(r.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          onClick={addRow}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Plus size={16} /> Add Row
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>
    </div>
  );
}
