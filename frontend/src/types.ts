export type Category = 'Medicine' | 'Food' | 'Cosmetics' | 'Laboratory' | 'Chemicals' | 'Other';
export type ExpiryType = 'days' | 'weeks' | 'months' | 'years' | 'exact';
export type Status = 'safe' | 'expiring30' | 'expiring7' | 'expired';

export interface Product {
  id: number;
  name: string;
  category: Category;
  batchNumber: string | null;
  quantity: number | null;
  manufacturingDate: string | null;
  expiryType: ExpiryType;
  expiryValue: number | null;
  expiryDate: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  status: Status;
  remainingDays: number;
}

export interface ProductInput {
  name: string;
  category: Category;
  batchNumber?: string | null;
  quantity?: number | null;
  manufacturingDate?: string | null;
  expiryType: ExpiryType;
  expiryValue?: number | null;
  expiryDate?: string | null;
}

export const STATUS_LABELS: Record<Status, string> = {
  safe: 'Safe',
  expiring30: 'Expiring within 30 days',
  expiring7: 'Expiring within 7 days',
  expired: 'Expired',
};
