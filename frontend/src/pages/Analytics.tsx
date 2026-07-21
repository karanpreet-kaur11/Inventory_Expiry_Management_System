import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useProducts } from '../context/ProductsContext';
import { StatCard } from '../components/StatCard';
import { CalendarClock, Layers, Tag } from 'lucide-react';

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7'];

export function Analytics() {
  const { products } = useProducts();

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
  }, [products]);

  const yearlyTrend = useMemo(() => {
    const now = new Date();
    const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
    return years.map((year) => ({
      year: String(year),
      count: products.filter((p) => p.expiryDate.startsWith(String(year))).length,
    }));
  }, [products]);

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), i, 1);
      const key = `${d.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
      return {
        month: d.toLocaleDateString(undefined, { month: 'short' }),
        count: products.filter((p) => p.expiryDate.startsWith(key)).length,
      };
    });
  }, [products]);

  const avgShelfLifeDays = useMemo(() => {
    const withDates = products.filter((p) => p.manufacturingDate);
    if (withDates.length === 0) return null;
    const total = withDates.reduce((sum, p) => {
      const mfg = new Date(p.manufacturingDate + 'T00:00:00');
      const exp = new Date(p.expiryDate + 'T00:00:00');
      return sum + (exp.getTime() - mfg.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(total / withDates.length);
  }, [products]);

  const mostFrequentCategory = useMemo(() => {
    if (categoryData.length === 0) return '—';
    return categoryData.reduce((max, cur) => (cur.count > max.count ? cur : max)).category;
  }, [categoryData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Trends and insights across your inventory</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Average Shelf Life"
          value={avgShelfLifeDays !== null ? `${avgShelfLifeDays} days` : '—'}
          icon={<CalendarClock size={20} />}
          accent="indigo"
        />
        <StatCard label="Most Frequent Category" value={mostFrequentCategory} icon={<Tag size={20} />} accent="emerald" />
        <StatCard label="Categories Tracked" value={categoryData.length} icon={<Layers size={20} />} accent="slate" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Expiry Trend (This Year)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Yearly Expiry Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yearlyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Category-wise Product Count</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryData.map((entry, idx) => (
                  <Cell key={entry.category} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
