# 📊 HR Management Dashboard

Sistem manajemen HR komprehensif dengan modul attendance, leave, performance review, dan team management.

## ✨ Fitur Utama

### 1. Attendance Management
- Clock In/Out dengan timestamps
- Break tracking
- Admin view untuk monitoring seluruh tim
- History per user

### 2. Leave Management
- Pengajuan cuti dengan upload bukti
- Approval workflow (Admin/Stakeholder)
- Sisa cuti tracking
- Multiple leave types

### 3. Performance Management
- **360 Review System:** Peer-to-peer feedback dengan 5 kompetensi
- **KPI Calculator:** SLA tracking per project
- **Work Quality Scoring:** Competency-based assessment
- **Performance Summary:** AI-generated feedback (via N8N integration)

### 4. Team Management
- CRUD Teams & Members
- Role assignment (Stakeholder/Employee)
- Team statistics

### 5. Calculator (Financial)
- Phase-based project costing
- Rate calculations

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.23 | React Framework (App Router) |
| React | 18.2.0 | UI Library |
| TypeScript | 5.9.3 | Type Safety |
| Tailwind CSS | 4.1.17 | Styling (v4 Compatibility Mode) |
| Supabase | 2.86.0 | Backend as a Service |
| Radix UI | Various | Headless UI Primitives |
| Recharts | 2.15.4 | Chart Library |
| TanStack Table | 8.21.3 | Data Table |
| date-fns | 3.6.0 | Date Manipulation |
| Sonner | 2.0.7 | Toast Notifications |
| Vitest | 4.0.15 | Unit Testing |


---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) atau npm

### Installation

```bash
# Clone repository
git clone <repo-url>

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# Run development server
pnpm dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📁 Struktur Project

```
src/
├── app/                          # Next.js App Router
│   ├── (fullscreen)/             # Fullscreen layouts (no sidebar)
│   ├── (main)/                   # Main app dengan sidebar
│   │   ├── attendance/           # Modul Absensi
│   │   ├── calculator/           # Kalkulator Finansial
│   │   ├── dashboard/            # Dashboard Overview
│   │   ├── leave/                # Modul Cuti
│   │   ├── payroll/              # Modul Payroll
│   │   ├── performance/          # Modul KPI & Performance
│   │   ├── settings/             # Pengaturan
│   │   └── teams/                # Manajemen Tim
│   ├── api/                      # API Routes
│   └── auth/                     # Auth Pages
├── components/                   # Reusable UI Components
├── hooks/                        # Custom React Hooks
└── lib/                          # Utilities & Configurations
```

---

## 🎨 Design System

Project ini menggunakan **Pure Tailwind Theme** dengan:
- **Neutral:** Zinc (grayscale)
- **Primary:** Blue (accent color)
- **Semantic tokens:** `bg-surface`, `text-content`, `bg-primary`, dll

Lihat [`ARCHITECTURE.md`](./ARCHITECTURE.md) untuk detail lebih lanjut.

---

## 📜 Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build production bundle
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm clean        # Clean build cache
pnpm test         # Run Unit Model Tests

```

---

## 📖 Dokumentasi Tambahan

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detail arsitektur aplikasi
- [AUDIT_REPORT.md](./.gemini/antigravity/brain/.../AUDIT_REPORT.md) - Laporan audit codebase

---

## 👥 Roles

| Role | Akses |
|------|-------|
| `employee` | View own data, submit leave, clock in/out |
| `stakeholder` | Admin access, approve/reject requests, view all data |

---

## 📄 License

Private - Internal Use Only
