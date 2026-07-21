import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Category, ExpiryType, Product, ProductInput } from '../types';

interface ProductsContextValue {
  products: Product[];
  archivedProducts: Product[];
  loading: boolean;
  error: string | null;
  categories: Category[];
  expiryTypes: ExpiryType[];
  refresh: () => Promise<void>;
  createProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (id: number, input: ProductInput) => Promise<Product>;
  bulkCreate: (items: ProductInput[]) => Promise<{ created: Product[]; errors: { index: number; error: string }[] }>;
  duplicateProduct: (id: number) => Promise<void>;
  archiveProduct: (id: number) => Promise<void>;
  restoreProduct: (id: number) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = ['Medicine', 'Food', 'Cosmetics', 'Laboratory', 'Chemicals', 'Other'];
const DEFAULT_EXPIRY_TYPES: ExpiryType[] = ['days', 'weeks', 'months', 'years', 'exact'];

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [expiryTypes, setExpiryTypes] = useState<ExpiryType[]>(DEFAULT_EXPIRY_TYPES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [active, archived, meta] = await Promise.all([api.list(false), api.list(true), api.meta()]);
      setProducts(active);
      setArchivedProducts(archived);
      setCategories(meta.categories);
      setExpiryTypes(meta.expiryTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProduct = useCallback(
    async (input: ProductInput) => {
      const created = await api.create(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const updateProduct = useCallback(
    async (id: number, input: ProductInput) => {
      const updated = await api.update(id, input);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const bulkCreate = useCallback(
    async (items: ProductInput[]) => {
      const result = await api.bulkCreate(items);
      await refresh();
      return result;
    },
    [refresh],
  );

  const duplicateProduct = useCallback(
    async (id: number) => {
      await api.duplicate(id);
      await refresh();
    },
    [refresh],
  );

  const archiveProduct = useCallback(
    async (id: number) => {
      await api.archive(id);
      await refresh();
    },
    [refresh],
  );

  const restoreProduct = useCallback(
    async (id: number) => {
      await api.restore(id);
      await refresh();
    },
    [refresh],
  );

  const deleteProduct = useCallback(
    async (id: number) => {
      await api.remove(id);
      await refresh();
    },
    [refresh],
  );

  return (
    <ProductsContext.Provider
      value={{
        products,
        archivedProducts,
        loading,
        error,
        categories,
        expiryTypes,
        refresh,
        createProduct,
        updateProduct,
        bulkCreate,
        duplicateProduct,
        archiveProduct,
        restoreProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
