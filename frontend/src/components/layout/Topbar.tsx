import { Menu, Moon, Sun, PackageSearch } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <PackageSearch className="text-indigo-600 dark:text-indigo-400" size={22} />
          <span className="hidden sm:inline">Inventory Expiry Management</span>
          <span className="sm:hidden">ExpiryMS</span>
        </div>
      </div>
      <button
        onClick={toggleTheme}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
}
