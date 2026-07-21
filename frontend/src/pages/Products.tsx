import { useMemo, useRef, useState } from 'react';
import { Plus, Search, Download, Upload, Pencil, Copy, Archive, Trash2, FileDown } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { ProductForm } from '../components/ProductForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../lib/expiry';
import type { Product, Status } from '../types';
import { downloadCsv, productsToCsv, csvToProductInputs } from '../lib/csv';
import { exportProductsToPdf } from '../lib/pdf';

const STATUS_OPTIONS: { value: Status | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'safe', label: 'Safe' },
  { value: 'expiring30', label: 'Expiring within 30 days' },
  { value: 'expiring7', label: 'Expiring within 7 days' },
  { value: 'expired', label: 'Expired' },
];

export function Products() {
  const { products, categories, deleteProduct, duplicateProduct, archiveProduct, bulkCreate } = useProducts();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Product | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const months = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.expiryDate.slice(0, 7)));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (monthFilter !== 'all' && !p.expiryDate.startsWith(monthFilter)) return false;
      if (q) {
        const haystack = [p.name, p.batchNumber, p.category, p.expiryDate, p.manufacturingDate].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, statusFilter, monthFilter]);

  async function handleImportFile(file: File) {
    const text = await file.text();
    const { items, errors } = csvToProductInputs(text);
    if (items.length === 0) {
      setImportMessage(`No valid rows found. ${errors.join('; ')}`);
      return;
    }
    const result = await bulkCreate(items);
    setImportMessage(
      `Imported ${result.created.length} product(s).` +
        (result.errors.length ? ` ${result.errors.length} row(s) failed: ${result.errors.map((e) => e.error).join('; ')}` : ''),
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Products</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} of {products.length} products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Upload size={16} /> Import CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => downloadCsv('products.csv', productsToCsv(filtered))}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={() => exportProductsToPdf('Products Report', filtered)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileDown size={16} /> Export PDF
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
          {importMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, batch, category, date..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Mfg. Date</th>
              <th className="px-4 py-3">Expiry Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.category}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.batchNumber || '—'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.quantity ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(p.manufacturingDate)}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(p.expiryDate)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      title="Edit"
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      title="Duplicate"
                      onClick={() => duplicateProduct(p.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      title="Archive"
                      onClick={() => setConfirmArchive(p)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => setConfirmDelete(p)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No products match your search/filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <ProductForm
          product={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => setFormOpen(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete product?"
          message={`This will permanently delete "${confirmDelete.name}". This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteProduct(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}

      {confirmArchive && (
        <ConfirmDialog
          title="Archive product?"
          message={`"${confirmArchive.name}" will be moved to the archive. You can restore it anytime.`}
          confirmLabel="Archive"
          onCancel={() => setConfirmArchive(null)}
          onConfirm={() => {
            archiveProduct(confirmArchive.id);
            setConfirmArchive(null);
          }}
        />
      )}
    </div>
  );
}
