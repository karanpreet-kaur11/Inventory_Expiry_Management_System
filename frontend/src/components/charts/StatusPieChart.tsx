import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Product } from '../../types';

const COLORS: Record<string, string> = {
  Safe: '#10b981',
  'Expiring in 30 Days': '#eab308',
  'Expiring in 7 Days': '#f97316',
  Expired: '#ef4444',
};

export function StatusPieChart({ products }: { products: Product[] }) {
  const data = [
    { name: 'Safe', value: products.filter((p) => p.status === 'safe').length },
    { name: 'Expiring in 30 Days', value: products.filter((p) => p.status === 'expiring30').length },
    { name: 'Expiring in 7 Days', value: products.filter((p) => p.status === 'expiring7').length },
    { name: 'Expired', value: products.filter((p) => p.status === 'expired').length },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="flex h-64 items-center justify-center text-sm text-slate-400">No data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
