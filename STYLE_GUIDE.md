# 🎨 Design System Style Guide

## Ringkasan Masalah

Project saat ini menggunakan **2 warna primary yang berbeda**:
- **Blue (Defined):** CSS Variables di `globals.css` mendefinisikan Blue sebagai primary
- **Indigo (Legacy):** Banyak komponen masih menggunakan hardcoded `indigo-*` classes

---

## 📋 Current Design Tokens

### globals.css (Sumber Kebenaran)

| Token | Light Mode | Dark Mode | Tailwind Equivalent |
|-------|------------|-----------|---------------------|
| `--color-primary` | `#2563eb` | `#3b82f6` | Blue-600 / Blue-500 |
| `--color-primary-hover` | `#1d4ed8` | `#60a5fa` | Blue-700 / Blue-400 |
| `--bg-background` | `#ffffff` | `#09090b` | White / Zinc-950 |
| `--bg-surface` | `#ffffff` | `#18181b` | White / Zinc-900 |
| `--bg-muted` | `#f4f4f5` | `#27272a` | Zinc-100 / Zinc-800 |
| `--text-primary` | `#09090b` | `#fafafa` | Zinc-950 / Zinc-50 |
| `--text-secondary` | `#71717a` | `#a1a1aa` | Zinc-500 / Zinc-400 |
| `--border-default` | `#e4e4e7` | `#27272a` | Zinc-200 / Zinc-800 |
| `--color-success` | `#16a34a` | - | Green-600 |
| `--color-warning` | `#ca8a04` | - | Yellow-600 |
| `--color-danger` | `#dc2626` | - | Red-600 |

---

## 🔥 Inkonsistensi Warna yang Ditemukan

### Components dengan Hardcoded Indigo (Legacy)

| File | Count | Contoh Usage |
|------|-------|--------------|
| `Sidebar.tsx` | 4 | `text-indigo-600`, `bg-indigo-600` |
| `Slider.tsx` | 4 | `bg-indigo-600`, `border-indigo-600` |
| `Switch.tsx` | 3 | `data-[state=checked]:bg-indigo-600` |
| `ProgressBar.tsx` | 2 | `bg-indigo-600`, `bg-indigo-100` |
| `ProgressCircle.tsx` | 2 | `stroke-indigo-600` |
| `Calendar.tsx` | 2 | `bg-indigo-600` |
| `RadioCard.tsx` | 2 | `border-indigo-600` |
| `Notifications.tsx` | 4 | `text-indigo-600`, `bg-indigo-600` |
| `Avatar.tsx` | 3 | `bg-indigo-100`, `text-indigo-700` |

### Page Components dengan Hardcoded Indigo

| File | Usage |
|------|-------|
| `OverviewTab.tsx` | `border-l-indigo-500` |
| `KPITab.tsx` | `group-hover:text-indigo-600` |
| `OneOnOneMeetingTab.tsx` | `border-l-indigo-500`, `bg-indigo-100` |
| `ClientPage.tsx` (Performance) | 6x `border-indigo-600` |
| `Columns.tsx` (Leave) | `text-indigo-600` |
| `AttendanceHistoryList.tsx` | `text-indigo-600` |

### Components dengan Blue (Sebagian Benar)

| File | Usage |
|------|-------|
| `Badge.tsx` | `info` variant gunakan blue (✅) |
| `FeedbackBadge.tsx` | `start` variant gunakan blue (✅) |
| `QuarterBadge.tsx` | Q1 = blue (OK for semantic) |
| `ProjectScoringClient.tsx` | quarter badge blue (OK) |
| `WorkQualityTab.tsx` | info box blue (OK) |

---

## 📐 Typography Scale

### Font Family
```
font-family: var(--font-inter), Inter, system-ui, sans-serif
```

### Text Sizes (Tailwind Default)

| Class | Size | Use Case |
|-------|------|----------|
| `text-xs` | 12px | Badges, captions |
| `text-sm` | 14px | Body text, labels |
| `text-base` | 16px | Default body |
| `text-lg` | 18px | Card titles |
| `text-xl` | 20px | Section headers |
| `text-2xl` | 24px | Page titles |
| `text-3xl` | 30px | Big numbers |

### Font Weights

| Class | Weight | Use Case |
|-------|--------|----------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, buttons |
| `font-semibold` | 600 | Headings, card titles |
| `font-bold` | 700 | Page titles |

---

## 🎯 Shadow Scale
### Shadow
Menggunakan custom "soft" shadows untuk tampilan premium.

| Class | Description | Value |
|-------|-------------|-------|
| `shadow-xs` | Subtle border-like | `0 1px 2px rgba(0,0,0,0.03)` |
| `shadow-sm` | Card default | `0 1px 3px rgba(0,0,0,0.05)` |
| `shadow-md` | Card hover | `0 4px 6px rgba(0,0,0,0.05)` |
| `shadow-lg` | Dropdown/Modal | `0 10px 15px rgba(0,0,0,0.05)` |
| `shadow-xl` | Floating elements | `0 20px 25px rgba(0,0,0,0.05)` |

### Radius
Menggunakan **CSS Variable** `--radius` di `globals.css`. Ubah satu value, semua component berubah.

| Class | Value | Computed (if radius=0.5rem) |
|-------|-------|---------------------------|
| `rounded-lg` | `var(--radius)` | `8px` |
| `rounded-md` | `calc(var(--radius) - 2px)` | `6px` |
| `rounded-sm` | `calc(var(--radius) - 4px)` | `4px` |

---

## 📦 Spacing Scale

### Padding

| Class | Value | Use Case |
|-------|-------|----------|
| `p-2` | 8px | Compact elements |
| `p-3` | 12px | Buttons inner |
| `p-4` | 16px | Card default |
| `p-6` | 24px | Large cards, sections |
| `p-8` | 32px | Empty states |

### Gap/Space

| Class | Value | Use Case |
|-------|-------|----------|
| `gap-2` | 8px | Inline elements |
| `gap-3` | 12px | Button groups |
| `gap-4` | 16px | Card content |
| `gap-6` | 24px | Section spacing |

---

## ✅ Standardization Complete

All UI components now use **Blue** as the primary accent color.

### Changes Made (34 files)

**Core Components:**
- Slider, Switch, ProgressBar, ProgressCircle
- Calendar, RadioCard, Spinner, Checkbox
- TabNavigation, DataTable, DataTableFilter

**Navigation:**
- Sidebar, MobileSidebar, SidebarWorkspacesDropdown
- Notifications

**Pages:**
- Performance (ClientPage, OverviewTab, KPITab, OneOnOneMeetingTab)
- Leave (Columns, AdminColumns, LeaveStats, LeaveRequestModal)
- Attendance (AttendanceHistoryList, AdminAttendanceHistoryList)
- Auth (update-password, not-found)

### Intentionally Kept as Multi-Color

These components use multiple colors for data differentiation:

| Component | Reason |
|-----------|--------|
| Avatar | 5 color variants for user differentiation |
| DonutChart | Color palette for data series |
| RadarChart | 3 colors for chart comparison |
| CategoryBar | Multiple bar colors |

---

## 📊 Final Color Count

| Color | Count (Before) | Count (After) |
|-------|---------------|---------------|
| `indigo-*` | ~80 | 11 (charts/avatar only) |
| `blue-*` | ~15 | ~70 |

**Primary Color: Blue-600 / Blue-500 (dark mode)** ✅
