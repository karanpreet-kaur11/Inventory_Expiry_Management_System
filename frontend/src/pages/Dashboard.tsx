import { useMemo, useState } from 'react';
import { Boxes, CalendarClock, CalendarRange, CalendarX2, ShieldCheck, ShieldAlert, Plus } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { StatCard } from '../components/StatCard';
import { StatusPieChart } from '../components/charts/StatusPieChart';
import { MonthlyBarChart } from '../components/charts/MonthlyBarChart';
import { ProductForm } from '../components/ProductForm';
import { todayISO } from '../lib/expiry';

export function Dashboard() {
  const { products, loading, error } = useProducts();
  const [formOpen, setFormOpen] = useState(false);

  const stats = useMemo(() => {
    const today = todayISO();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().slice(0, 10);

    return {
      total: products.length,
      today: products.filter((p) => p.expiryDate === today).length,
      tomorrow: products.filter((p) => p.expiryDate === tomorrowIso).length,
      next7: products.filter((p) => p.remainingDays >= 0 && p.remainingDays <= 7).length,
      next30: products.filter((p) => p.remainingDays >= 0 && p.remainingDays <= 30).length,
      expired: products.filter((p) => p.status === 'expired').length,
      safe: products.filter((p) => p.status === 'safe').length,
    };
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your inventory expiry status</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
      {loading && <p className="text-sm text-slate-400">Loading...</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Products" value={stats.total} icon={<Boxes size={20} />} accent="indigo" />
        <StatCard label="Expiring Today" value={stats.today} icon={<CalendarClock size={20} />} accent="orange" />
        <StatCard label="Expiring Tomorrow" value={stats.tomorrow} icon={<CalendarClock size={20} />} accent="yellow" />
        <StatCard label="Next 7 Days" value={stats.next7} icon={<CalendarRange size={20} />} accent="orange" />
        <StatCard label="Next 30 Days" value={stats.next30} icon={<CalendarRange size={20} />} accent="yellow" />
        <StatCard label="Expired Products" value={stats.expired} icon={<CalendarX2 size={20} />} accent="red" />
        <StatCard label="Safe Products" value={stats.safe} icon={<ShieldCheck size={20} />} accent="emerald" />
        <StatCard label="Needs Attention" value={stats.next7 + stats.expired} icon={<ShieldAlert size={20} />} accent="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Status Distribution</h2>
          <StatusPieChart products={products} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Upcoming Monthly Expiries</h2>
          <MonthlyBarChart products={products} />
        </div>
      </div>

      {formOpen && <ProductForm onClose={() => setFormOpen(false)} />}
    </div>
  );
}
