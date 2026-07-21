import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { CalendarPage } from './pages/CalendarPage';
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { BulkEntry } from './pages/BulkEntry';
import { ArchivePage } from './pages/ArchivePage';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 lg:block dark:border-slate-800">
          <Sidebar />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl dark:bg-slate-950">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/bulk-entry" element={<BulkEntry />} />
              <Route path="/archive" element={<ArchivePage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
