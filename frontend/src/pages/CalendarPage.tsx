import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { StatusBadge } from '../components/StatusBadge';
import { STATUS_DOT } from '../lib/expiry';
import { formatDate } from '../lib/expiry';
import type { Product } from '../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function CalendarPage() {
  const { products } = useProducts();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Product[]>();
    products.forEach((p) => {
      const list = map.get(p.expiryDate) ?? [];
      list.push(p);
      map.set(p.expiryDate, list);
    });
    return map;
  }, [products]);

  const { year, month } = cursor;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  const selectedProducts = selectedDay ? byDate.get(selectedDay) ?? [] : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <ChevronLeft size={16} />
          </button>
          <span className="w-40 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="h-24 border-b border-r border-slate-100 dark:border-slate-800 sm:h-28" />;
            const iso = toIso(year, month, day);
            const items = byDate.get(iso) ?? [];
            const isToday = iso === todayIso;
            return (
              <button
                key={idx}
                onClick={() => items.length > 0 && setSelectedDay(iso)}
                className={`flex h-24 flex-col items-start gap-1 overflow-hidden border-b border-r border-slate-100 p-2 text-left align-top hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 sm:h-28 ${
                  items.length === 0 ? 'cursor-default' : ''
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? 'bg-indigo-600 font-semibold text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                  {day}
                </span>
                <div className="flex w-full flex-col gap-0.5 overflow-hidden">
                  {items.slice(0, 2).map((p) => (
                    <span key={p.id} className="flex items-center gap-1 truncate rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status]}`} />
                      <span className="truncate">{p.name}</span>
                    </span>
                  ))}
                  {items.length > 2 && <span className="text-[11px] text-slate-400">+{items.length - 2} more</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{formatDate(selectedDay)}</h2>
              <button onClick={() => setSelectedDay(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {selectedProducts.map((p) => (
                <div key={p.id} className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Category: {p.category}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manufactured: {formatDate(p.manufacturingDate)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Expiry: {formatDate(p.expiryDate)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Remaining: {p.remainingDays >= 0 ? `${p.remainingDays} day(s)` : `Expired ${Math.abs(p.remainingDays)} day(s) ago`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
