# 🏗️ Arsitektur Aplikasi

## Overview

Aplikasi ini dibangun menggunakan **Next.js 14** dengan **App Router**, diintegrasikan dengan **Supabase** sebagai Backend-as-a-Service.

---

## 📊 Layer Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                     │
│  (React Components, Pages, Layouts)                        │
├────────────────────────────────────────────────────────────┤
│                      APPLICATION LAYER                      │
│  (Server Actions, Route Handlers, Client State)            │
├────────────────────────────────────────────────────────────┤
│                      DATA ACCESS LAYER                      │
│  (Supabase Client, Database Types)                         │
├────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE                         │
│  (Supabase PostgreSQL, Auth, Storage)                      │
└────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Directory Structure

### `/src/app` - Pages & Routing

```
app/
├── (fullscreen)/           # Layout tanpa sidebar
│   └── performance-review/ # Form 360 review
├── (main)/                 # Layout dengan sidebar
│   ├── attendance/         # Absensi module
│   ├── calculator/         # Financial calculator
│   ├── dashboard/          # Overview dashboard
│   ├── leave/              # Cuti module
│   ├── payroll/            # Payroll placeholder
│   ├── performance/        # KPI & reviews
│   │   ├── components/     # Feature-specific components
│   │   │   ├── 360-review/ # 360 Review components
│   │   │   ├── admin/      # Admin-only components
│   │   │   ├── kpi/        # KPI scoring
│   │   │   ├── meeting/    # 1-on-1 meetings
│   │   │   └── overview/   # Performance overview
│   │   └── employee/       # Employee detail pages
│   ├── settings/           # User settings
│   └── teams/              # Team management
├── api/                    # API routes
├── auth/                   # Auth pages
└── login/                  # Login page
```

### `/src/components` - Reusable Components

```
components/
├── data-table/         # TanStack Table wrappers
│   ├── DataTable.tsx
│   ├── DataTableColumnHeader.tsx
│   ├── DataTablePagination.tsx
│   └── DataTableRowActions.tsx
├── navigation/         # App navigation
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── UserProfileDropdown.tsx
├── overview/           # Dashboard widgets
├── icons/              # Custom icons
│
│ # UI Primitives (Tremor-inspired)
├── Accordion.tsx
├── Avatar.tsx
├── Badge.tsx
├── Button.tsx
├── Card.tsx
├── Calendar.tsx
├── Checkbox.tsx
├── DatePicker.tsx
├── Dialog.tsx
├── Dropdown.tsx
├── Input.tsx
├── Popover.tsx
├── ProgressBar.tsx
├── Select.tsx
├── Slider.tsx
├── Spinner.tsx
├── Switch.tsx
├── TabNavigation.tsx
├── Table.tsx
├── Textarea.tsx
├── Tooltip.tsx
│
│ # Charts (Recharts-based)
├── BarChart.tsx
├── DonutChart.tsx
├── LineChart.tsx
└── RadarChart.tsx
```

### `/src/lib` - Utilities

```
lib/
├── supabase/
│   ├── client.ts       # Browser Supabase client
│   └── server.ts       # Server Supabase client
├── database.types.ts   # Auto-generated Supabase types
├── utils.ts            # General utilities (cx, focusRing, etc)
├── chartUtils.ts       # Chart color mappings
├── dateUtils.ts        # Date formatting
├── kpi-calculations.ts # KPI scoring logic
├── kpi-utils.ts        # KPI helpers
└── performanceUtils.ts # Performance calculation helpers
```

---

## 🗄️ Database Schema

### Entity Relationship

```
                    ┌──────────────┐
                    │    teams     │
                    └──────┬───────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                        profiles                           │
│  (id, email, full_name, role, team_id, leave_balance)    │
└────────────┬─────────────┬─────────────┬─────────────────┘
             │             │             │
             ▼             ▼             ▼
     ┌───────────┐  ┌─────────────┐  ┌─────────────────────┐
     │attendance │  │   leave_    │  │    project_         │
     │   _logs   │  │  requests   │  │   assignments       │
     └───────────┘  └─────────────┘  └─────────┬───────────┘
                                               │
                    ┌──────────────────────────┼──────────────┐
                    ▼                          ▼              ▼
          ┌─────────────────┐        ┌────────────────┐  ┌────────────┐
          │project_sla_scores│        │work_quality_   │  │  projects  │
          └─────────────────┘        │    scores      │  └────────────┘
                                     └────────┬───────┘
                                              │
                                              ▼
                                     ┌────────────────┐
                                     │  competency_   │
                                     │    library     │
                                     └────────────────┘
```

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User data (extends Supabase auth.users) |
| `teams` | Department/team groupings |
| `attendance_logs` | Clock in/out records |
| `leave_requests` | Cuti submissions |
| `review_cycles` | Performance review periods |
| `performance_reviews` | 360 feedback entries |
| `performance_summaries` | AI-generated summaries per cycle |
| `projects` | Project master data |
| `project_assignments` | User ↔ Project mapping |
| `project_sla_scores` | Milestone delivery scores |
| `project_work_quality_scores` | Competency achievements |
| `competency_library` | Role-based competency definitions |
| `notifications` | In-app notifications |

---

## 🎨 Design System

### Color Tokens

```css
/* Backgrounds */
--bg-background: #ffffff;  /* Page bg */
--bg-surface: #ffffff;     /* Card surface */
--bg-muted: #f4f4f5;       /* Subtle bg (zinc-100) */

/* Text */
--text-primary: #09090b;   /* Primary text (zinc-950) */
--text-secondary: #71717a; /* Secondary text (zinc-500) */

/* Primary (Blue) */
--color-primary: #2563eb;  /* Blue-600 */
--color-primary-hover: #1d4ed8;

/* Status */
--color-success: #16a34a;  /* Green-600 */
--color-warning: #ca8a04;  /* Yellow-600 */
--color-danger: #dc2626;   /* Red-600 */
```

### Component Variants

Menggunakan `tailwind-variants` untuk konsistensi:

```tsx
const buttonVariants = tv({
  base: "...",
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-surface text-content border-border",
      ghost: "bg-transparent hover:bg-muted",
    },
    size: {
      default: "px-3 py-2",
      sm: "px-2.5 py-1.5",
    },
  },
})
```

---

## 🔐 Authentication & Authorization

### Auth Flow

1. User login via `/login` (email/password)
2. Supabase creates session
3. Middleware checks session on protected routes
4. Profile data fetched from `profiles` table

### Roles

| Role | Description |
|------|-------------|
| `employee` | Standard user access |
| `stakeholder` | Admin/manager access |

### Route Protection

```tsx
// middleware.ts
// Protected routes: /dashboard, /attendance, /leave, etc
// Auth routes: /login, /auth/*
```

---

## 🔄 Data Flow Patterns

### Server Components (Recommended)

```tsx
// page.tsx (Server Component)
export default async function Page() {
  const supabase = createClient() // Server client
  const { data } = await supabase.from('table').select()
  return <ClientComponent data={data} />
}
```

### Client Components (When Needed)

```tsx
// ClientPage.tsx
"use client"
// Use for interactivity, forms, real-time subscriptions
// Prefer Server Actions for mutations
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `@supabase/ssr` | Supabase SSR helpers |
| `@radix-ui/*` | Headless UI primitives |
| `tailwind-variants` | Component variant styling |
| `tailwind-merge` | Class deduplication |
| `recharts` | Chart rendering |
| `@tanstack/react-table` | Data table logic |
| `date-fns` | Date utilities |
| `sonner` | Toast notifications |
| `@atlaskit/pragmatic-drag-and-drop` | Drag & drop functionality |

---

## 🚀 Deployment

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Build

```bash
pnpm build
```

---

## 📝 Coding Conventions

1. **File Naming:**
   - Pages: `page.tsx`
   - Client Components: `ClientPage.tsx` atau `[Feature]Client.tsx`
   - Server Components: Default (no suffix)

2. **Imports:**
   - Use path aliases: `@/components`, `@/lib`, `@/hooks`

3. **Styling:**
   - Use semantic tokens: `bg-surface`, `text-content`, `bg-primary`
   - Avoid hardcoded colors

4. **Types:**
   - Use proper TypeScript types
   - Import from `@/lib/database.types`
   - Avoid `any`
