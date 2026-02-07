# KretyaAPP - HR Management Dashboard

Sistem manajemen HR komprehensif untuk attendance, leave, performance, dan kolaborasi tim. Dibangun dengan Next.js App Router, Supabase, dan Tailwind CSS.

## Fitur Utama
- Attendance management: clock in/out, break tracking, dan histori per user.
- Leave management: pengajuan cuti, approval workflow, dan tracking sisa cuti.
- Performance management: 360 review, KPI/SLA tracking, serta ringkasan feedback (opsional via n8n).
- Team management: CRUD tim, role assignment, dan statistik.
- Calendar & one-on-one: sinkronisasi dan booking berbasis Google Calendar.
- Payroll & SLA generator: perhitungan dan ringkasan SLA untuk proyek.
- Financial calculator: perhitungan biaya proyek berbasis fase.
- Messaging & notifications: notifikasi dan komunikasi internal.

## Tech Stack

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 15.5.12 | App Router |
| React | 18.2.0 | UI Library |
| TypeScript | 5.9.3 | Type Safety |
| Tailwind CSS | 4.1.17 | Styling |
| Supabase JS | 2.86.0 | Auth + Database |
| Radix UI | Various | UI primitives |
| TanStack Query | 5.90.20 | Server state |
| TanStack Table | 8.21.3 | Data tables |
| Recharts | 2.15.4 | Charts |
| Storybook | 10.2.1 | UI development |
| Vitest | 4.0.18 | Unit testing |

## Prasyarat
- Node.js 18+ (ikuti requirement Next.js 15)
- pnpm (recommended) atau npm

## Setup Lokal

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Akses aplikasi di `http://localhost:3000`.

## Variabel Lingkungan

Gunakan `.env.local` untuk konfigurasi lokal.

| Key | Required | Keterangan |
|-----|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Anon key Supabase |
| `N8N_WEBHOOK_URL` | Tidak | Webhook untuk auto-summary performance review |
| `GOOGLE_CLIENT_ID` | Tidak | OAuth client ID (Google Calendar) |
| `GOOGLE_CLIENT_SECRET` | Tidak | OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Tidak | Refresh token Google |
| `GOOGLE_CALENDAR_ID` | Tidak | Default `primary` |
| `UPSTASH_REDIS_REST_URL` | Tidak | Upstash Redis URL untuk rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Tidak | Upstash Redis token |

## Database & Supabase
- Buat project Supabase baru dan isi env vars di atas.
- Jalankan file SQL pada folder `migrations/` melalui Supabase SQL Editor.
- Role pengguna dibaca dari `app_metadata.role`, fallback ke tabel `profiles.role`.

## Scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Build production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm clean            # Clean cache (.next, tsbuildinfo, dll)
pnpm test             # Run Vitest (watch)
pnpm test:coverage    # Run coverage report
pnpm storybook        # Run Storybook at :6006
pnpm build-storybook  # Build Storybook static
```

## Struktur Project

```
src/
├── app/                 # Next.js App Router
│   ├── (fullscreen)/    # Halaman tanpa sidebar
│   ├── (main)/          # Halaman utama dengan sidebar
│   └── api/             # Route handlers (calendar, one-on-one, n8n)
├── entities/            # Domain entities (attendance, leave, team, dsb)
├── features/            # Feature-specific logic
├── page-slices/         # Page composition per module
├── widgets/             # UI widgets besar (sidebar, calendar, notifications)
├── shared/              # Reusable UI, lib, config, api
└── data/                # Static data & constants
```

## Storybook
Jalankan `pnpm storybook` lalu buka `http://localhost:6006`.

## Testing
Gunakan `pnpm test` untuk menjalankan unit test. Coverage bisa dengan `pnpm test:coverage`.

## Deployment
- Jalankan `pnpm build`.
- Jalankan `pnpm start` pada server production.
- Pastikan env vars production sudah di-set.

## License
MIT. Lihat `LICENSE.md`.
