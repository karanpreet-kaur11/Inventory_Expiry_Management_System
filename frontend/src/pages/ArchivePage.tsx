import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDate } from '../lib/expiry';
import type { Product } from '../types';

export function ArchivePage() {
  const { archivedProducts, restoreProduct, deleteProduct } = useProducts();
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Archive</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{archivedProducts.length} archived product(s)</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Expiry Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {archivedProducts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.category}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(p.expiryDate)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      title="Restore"
                      onClick={() => restoreProduct(p.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <RotateCcw size={16} />
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
            {archivedProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No archived products.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
