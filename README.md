# Inventory Expiry Management System

A full-stack web app for tracking product expiry dates — built for pharmacies, hospitals, labs, restaurants, cosmetics, and general inventory use. Enter a manufacturing date plus a duration (days/weeks/months/years) or an exact expiry date, and the app calculates and tracks expiry automatically across a dashboard, calendar, and reports.

## Tech Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router, Recharts, lucide-react icons
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`)
- **Export:** CSV (Excel-compatible) and PDF (`jspdf`)

## Features

- Add/edit products with a smart expiry calculator (days, weeks, months, years, or an exact date)
- Dashboard with live stat cards (total, expiring today/tomorrow/7d/30d, expired, safe) plus a status pie chart and a 12-month upcoming-expiry bar chart
- Monthly calendar view — click any day to see every product expiring that day with full details
- Monthly & daily expiry reports with CSV/PDF export
- Product table with search (name, batch, category, dates), filters (category, status, month), and color-coded status badges (safe / expiring in 30 days / expiring in 7 days / expired)
- Edit, duplicate, archive/restore, and delete products
- Bulk entry screen for adding many products at once (spreadsheet-style rows)
- CSV import/export, with a downloadable import template
- Analytics: monthly/yearly expiry trend, category breakdown, average shelf life, most frequently expiring category
- Responsive layout with light/dark mode

### A note on Excel support

"Excel import/export" is implemented via CSV, which opens natively in Excel/Google Sheets. The popular `xlsx`/SheetJS npm packages ship with known, currently-unpatched high-severity vulnerabilities (prototype pollution, ReDoS — see [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6)), and SheetJS's own fixed builds are only distributed off-registry. CSV avoids that dependency entirely while covering the same workflow.

## Getting Started

### Backend

```bash
cd backend
npm install
npm start        # http://localhost:4000
```

Data is stored in `backend/data/inventory.db` (SQLite, created automatically on first run).

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173, proxies /api to http://localhost:4000
```

Open the printed local URL in your browser. Make sure the backend is running first.

### Production build

```bash
cd frontend && npm run build   # outputs frontend/dist
cd backend && npm start        # serve the API; put dist behind any static host/reverse proxy
```

## Deploying (public URL, works on any device including mobile)

The backend and frontend deploy as two separate services.

### 1. Backend → Render

1. Sign in to [render.com](https://render.com) with GitHub and grant it access to this repo.
2. **New +** → **Web Service** → select this repo.
3. Set **Root Directory** to `backend`.
4. **Build Command:** `npm install`. **Start Command:** `npm start`.
5. Deploy. Note the resulting URL, e.g. `https://your-backend.onrender.com`.
6. Verify it's up: open `https://your-backend.onrender.com/api/health` — should return `{"status":"ok"}`.

   > Free-tier Render services use an ephemeral filesystem, so the SQLite file resets on every restart/redeploy. For data that persists, use a paid instance with a mounted Persistent Disk (mount path `/opt/render/project/src/backend/data`), or switch to Railway/Fly.io with a volume.

### 2. Frontend → Vercel (or Netlify)

1. Sign in to [vercel.com](https://vercel.com) with GitHub and import this repo.
2. Set **Root Directory** to `frontend`. Framework preset (Vite) is auto-detected.
3. Add an environment variable: `VITE_API_BASE_URL` = `https://your-backend.onrender.com` (the URL from step 1, no trailing slash).
4. Deploy. You'll get a URL like `https://your-app.vercel.app`.

Open that URL from any browser — desktop or phone. On mobile, use "Add to Home Screen" from the browser's share menu for an app-like icon; this is not a full installable PWA (see Roadmap) but works well as a bookmarked web app.

## Project Structure

```
backend/
  src/
    db.js              SQLite schema/connection
    index.js           Express app entrypoint
    routes/products.js  CRUD + bulk + archive/restore endpoints
    utils/expiry.js     Expiry date calculation & status logic
frontend/
  src/
    api/client.ts       Typed fetch wrapper for the API
    components/         Reusable UI (forms, tables, charts, layout)
    context/            Theme + Products React contexts
    lib/                CSV/PDF export helpers, date/status utilities
    pages/              Dashboard, Products, Calendar, Reports, Analytics, Bulk Entry, Archive
```

## Roadmap / Not Implemented

The original spec included a number of larger subsystems intentionally left out of this build so the core expiry-management workflow could be delivered as a solid, working app. These are natural follow-ups:

- Barcode/QR scanning and OCR label scanning
- Natural-language AI assistant ("which products expire next week?")
- Email / push / WhatsApp notifications (currently status is visual-only in the UI)
- Multi-user accounts with role-based permissions (Admin/Staff/Viewer) and an audit log
- Offline mode with background sync, and PWA installability
- Native mobile/desktop packaging
