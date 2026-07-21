import { useMemo, useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, todayISO } from '../lib/expiry';
import { downloadCsv, productsToCsv } from '../lib/csv';
import { exportProductsToPdf } from '../lib/pdf';

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function Reports() {
  const { products } = useProducts();
  const [mode, setMode] = useState<'monthly' | 'daily'>('monthly');
  const [month, setMonth] = useState(currentMonthValue());
  const [date, setDate] = useState(todayISO());

  const monthlyResults = useMemo(
    () => products.filter((p) => p.expiryDate.startsWith(month)).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
    [products, month],
  );
  const dailyResults = useMemo(() => products.filter((p) => p.expiryDate === date), [products, date]);

  const results = mode === 'monthly' ? monthlyResults : dailyResults;
  const title = mode === 'monthly' ? `Monthly Expiry Report - ${month}` : `Daily Expiry Report - ${date}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Expiry Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Generate monthly or daily expiry reports</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex rounded-lg border border-slate-300 p-1 dark:border-slate-700">
          <button
            onClick={() => setMode('monthly')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setMode('daily')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'daily' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Daily
          </button>
        </div>

        {mode === 'monthly' ? (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        ) : (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        )}

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => downloadCsv(`${title}.csv`, productsToCsv(results))}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Download size={16} /> CSV
          </button>
          <button
            onClick={() => exportProductsToPdf(title, results)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileDown size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">Total expiring: {results.length}</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {results.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {p.category} · Expires {formatDate(p.expiryDate)}
                  {p.batchNumber ? ` · Batch ${p.batchNumber}` : ''}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
          {results.length === 0 && <p className="py-10 text-center text-slate-400">No products expiring in this period.</p>}
        </div>
      </div>
    </div>
  );
}
