import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import type { Category, ExpiryType, Product, ProductInput } from '../types';
import { formatDate, todayISO } from '../lib/expiry';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSaved?: () => void;
}

const EXPIRY_TYPE_LABELS: Record<ExpiryType, string> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
  years: 'Years',
  exact: 'Exact Expiry Date',
};

function computeExpiryPreview(manufacturingDate: string, expiryType: ExpiryType, expiryValue: number, exactDate: string): string | null {
  if (expiryType === 'exact') return exactDate || null;
  if (!manufacturingDate || !expiryValue || expiryValue <= 0) return null;

  const d = new Date(manufacturingDate + 'T00:00:00');
  switch (expiryType) {
    case 'days':
      d.setDate(d.getDate() + expiryValue);
      break;
    case 'weeks':
      d.setDate(d.getDate() + expiryValue * 7);
      break;
    case 'months':
      d.setMonth(d.getMonth() + expiryValue);
      break;
    case 'years':
      d.setFullYear(d.getFullYear() + expiryValue);
      break;
  }
  return d.toISOString().slice(0, 10);
}

export function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
  const { categories, createProduct, updateProduct } = useProducts();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState<Category>(product?.category ?? 'Other');
  const [batchNumber, setBatchNumber] = useState(product?.batchNumber ?? '');
  const [quantity, setQuantity] = useState(product?.quantity != null ? String(product.quantity) : '');
  const [manufacturingDate, setManufacturingDate] = useState(product?.manufacturingDate ?? todayISO());
  const [expiryType, setExpiryType] = useState<ExpiryType>(product?.expiryType ?? 'months');
  const [expiryValue, setExpiryValue] = useState(product?.expiryValue != null ? String(product.expiryValue) : '6');
  const [exactDate, setExactDate] = useState(product?.expiryType === 'exact' ? product?.expiryDate ?? '' : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const preview = useMemo(
    () => computeExpiryPreview(manufacturingDate, expiryType, Number(expiryValue), exactDate),
    [manufacturingDate, expiryType, expiryValue, exactDate],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (expiryType === 'exact' && !exactDate) {
      setError('Please pick an expiry date');
      return;
    }
    if (expiryType !== 'exact' && (!manufacturingDate || !expiryValue || Number(expiryValue) <= 0)) {
      setError('Please provide a manufacturing date and a positive duration');
      return;
    }

    const input: ProductInput = {
      name: name.trim(),
      category,
      batchNumber: batchNumber.trim() || null,
      quantity: quantity ? Number(quantity) : null,
      manufacturingDate: expiryType === 'exact' ? manufacturingDate || null : manufacturingDate,
      expiryType,
      expiryValue: expiryType === 'exact' ? null : Number(expiryValue),
      expiryDate: expiryType === 'exact' ? exactDate : null,
    };

    setSaving(true);
    try {
      if (isEdit && product) {
        await updateProduct(product.id, input);
      } else {
        await createProduct(input);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Product Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="e.g. Amoxicillin 500mg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Batch Number</label>
              <input
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Optional"
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Smart Expiry Calculator</p>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Expiry Type</label>
              <select
                value={expiryType}
                onChange={(e) => setExpiryType(e.target.value as ExpiryType)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {(Object.keys(EXPIRY_TYPE_LABELS) as ExpiryType[]).map((t) => (
                  <option key={t} value={t}>
                    {EXPIRY_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {expiryType !== 'exact' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Manufacturing Date</label>
                  <input
                    type="date"
                    value={manufacturingDate}
                    onChange={(e) => setManufacturingDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Duration ({EXPIRY_TYPE_LABELS[expiryType]})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={expiryValue}
                    onChange={(e) => setExpiryValue(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Exact Expiry Date</label>
                <input
                  type="date"
                  value={exactDate}
                  onChange={(e) => setExactDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}

            {preview && (
              <div className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
                Calculated Expiry: <span className="font-semibold">{formatDate(preview)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
