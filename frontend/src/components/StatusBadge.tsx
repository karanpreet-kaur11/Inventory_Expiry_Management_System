import type { Status } from '../types';
import { STATUS_LABELS } from '../types';
import { STATUS_COLORS } from '../lib/expiry';

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === 'safe' ? 'bg-emerald-500' : status === 'expiring30' ? 'bg-yellow-500' : status === 'expiring7' ? 'bg-orange-500' : 'bg-red-500'
      }`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
