### 1. **Badge: Penghianat Design System** 🚨

Di `globals.css`, lu udah definisiin variable semantic: `--color-success`, `--color-warning`, `--color-danger`.
Tapi di `src/components/Badge.tsx`, lu malah **hardcode** warna Tailwind default:

```typescript
// BAD: Hardcoded color scale
success: [
  "bg-green-50 text-success", // Lu pake text-success (bener), tapi bg-nya green-50 (salah)
  "dark:bg-green-500/10 dark:text-green-400", // Hardcoded green-500 & 400
],
error: [
  "bg-red-50 text-danger",
  "dark:bg-red-500/10 dark:text-red-400", // Hardcoded red
],

```

**Masalahnya:** Kalau lu ganti `--color-danger` jadi warna *pink* di `globals.css`, Badge error lu tetep bakal merah (karena `bg-red-50`), tapi teksnya pink. Belang deh.
**Solusi:** Pake opacity modifier dari variable lu.

```typescript
// GOOD: Ikut variable global
error: [
  "bg-danger/10 text-danger", // Otomatis ngikutin warna --color-danger
  "border border-danger/20",
],

```

Lihat `src/components/Badge.tsx`.

### 2. **Button: Destructive tapi Manual** 🧨

Di `src/components/Button.tsx`, varian `destructive` juga melakukan hal yang sama:

```typescript
destructive: [
  "bg-red-600 dark:bg-red-700", // Manual
  "hover:bg-red-700 dark:hover:bg-red-600",
],

```

Padahal lu punya variable `--color-danger` di `globals.css`.
**Solusi:**

```typescript
destructive: [
  "bg-danger text-white",
  "hover:bg-danger/90",
],

```

Lihat `src/components/Button.tsx`.

### 3. **AttendanceStats: "Banner Cuti" yang Bandel** 🎨

Di `src/app/(main)/attendance/components/AttendanceStats.tsx`, lu nulis *inline styles* panjang banget buat alert kuning itu:

```typescript
// SANGAT TIDAK DRY (Don't Repeat Yourself)
<div className="mb-6 rounded-md bg-yellow-50 p-4 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
   <RiAlarmWarningLine className="text-yellow-600 dark:text-yellow-400" />
   <h3 className="text-yellow-800 dark:text-yellow-300">...</h3>
</div>

```

**Masalahnya:**

1. Ini gak konsisten. Kuningnya beda sama kuning di Badge.
2. Kalau lu mau pake *Alert* di halaman lain, lu harus copy-paste class panjang ini lagi.
**Solusi:** Bikin komponen `<Alert variant="warning">` atau pake class semantic:
`bg-warning/10 border-warning/20 text-warning-foreground`.
Lihat `src/app/(main)/attendance/components/AttendanceStats.tsx`.

### 4. **Sidebar: Arbitrary Value yang Gak Perlu** 🤨

Di `src/components/navigation/Sidebar.tsx`, lu pake sintaks kurung siku `[]`:

```typescript
isActive(item.href)
  ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] ..." //

```

Padahal di `tailwind.config.ts` lu udah daftarin variable ini:

```typescript
"nav-active": {
  bg: "var(--nav-active-bg)",
  text: "var(--nav-active-text)",
}, //

```

**Solusi:** Pake class Tailwind-nya langsung biar lebih bersih.
`bg-nav-active-bg text-nav-active-text`.

### 5. **Shadows: Gak Ramah Dark Mode** 🌑

Di `tailwind.config.ts`, lu definisiin shadow pake warna hitam *hardcoded*:

```typescript
boxShadow: {
  xs: "0 1px 2px -1px rgba(0, 0, 0, 0.05)", //
  // ...
}

```

**Masalahnya:** Di Dark Mode, background lu gelap (`#0A0A0A`). Shadow warna hitam (`rgba(0,0,0,...)`) gak bakal kelihatan alias "tenggelam".
**Solusi:** Biasanya design system canggih pake variable buat warna shadow juga, atau shadow di dark mode diganti jadi *highlight* tipis (border 1px) karena shadow gak efektif di background hitam.

### 6. **Card: The Golden Child (Contoh Bener)** 🏆

Gue harus kasih pujian buat `src/components/Card.tsx`.

```typescript
className={cx(
  "bg-surface text-content", // Semantic
  "border-border",           // Semantic
  // ...
)}


### 7. **Avatar: Palet Warna Liar** 🌈

Di `src/components/Avatar.tsx`, lu bikin logic `getColorFromString` yang random pick warna dari list ini:
`indigo`, `blue`, `purple`, `pink`, `rose`, `orange`, `amber`, `emerald`, `teal`, `cyan`.

Dan parahnya, style-nya di-hardcode di varian:

```typescript
indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
// ... dan seterusnya sampe 10 warna

```

**Masalahnya:**

* Aplikasi lu temanya "Blue & Zinc" (sesuai `globals.css`). Tiba-tiba ada avatar warna **Pink** atau **Purple** muncul. Ini ngerusak *visual consistency*.
* Kalau lu mau ganti tema jadi "Dark Elegant" yang cuma boleh pake warna monochrome + gold, lu harus tulis ulang komponen ini.
**Solusi:**
Batasi varian Avatar ke warna semantic aja (`primary`, `muted`, `success`) ATAU pake varian `chart-1` s.d. `chart-5` yang udah lu definisiin di `globals.css` biar tetep sinkron sama grafik.

### 8. **TeamStats: Hardcoded Business Logic & Color** 🎨

Di `src/app/(main)/teams/components/TeamStats.tsx`, ini *offside* banget:

```typescript
// BAD: Hardcoded Colors
color: "blue", bgClass: "bg-blue-500",
color: "emerald", bgClass: "bg-emerald-500",
// BAD: Logic filtering data di dalam komponen UI
const totalDesigners = data.filter(p => p.job_title === "Designer").length

```

**Masalahnya:**

1. **Styling:** Lu pake `bg-blue-500` manual. Harusnya pake `bg-chart-1`, `bg-chart-2` biar sinkron sama Donut Chart lu.
2. **Logic:** Lu hardcode string `"Designer"`, `"Web Developer"`. Kalau besok HR ganti nama role jadi *"Product Designer"*, bar ini langsung **0**. Logic filtering ginian harusnya di *server* atau *parent component*, komponen ini cuma terima angka doang.

### 9. **ProgressBar: Penyakit Menular dari Badge** 🦠

Sama kayak Badge tadi, `src/components/ProgressBar.tsx` juga kena:

```typescript
warning: {
  background: "bg-yellow-200 dark:bg-yellow-500/30", // Hardcoded Yellow
  bar: "bg-yellow-500 dark:bg-yellow-500",
},

```

**Solusi:** Ganti jadi semantic tokens:

```typescript
warning: {
  background: "bg-warning/20",
  bar: "bg-warning",
},

```

Ini biar kalau lu ganti warna warning jadi Orange di `globals.css`, progress bar lu otomatis berubah.

### 10. **Table: Arbitrary Magic Number** 🪄

Di `src/components/Table.tsx`, coba liat `TableRow`:

```typescript
className={cx(
  "h-[42px]", // <-- KENAPA 42?
  // ...
)}

```

**Masalahnya:** Angka `42px` itu *magic number*. Kalau user punya setting font browser lebih gede, teksnya bakal kepotong atau gak vertikal-center dengan bener.
**Solusi:** Biarin `h-auto` dengan padding vertikal (`py-3`), atau kalau mau *fixed height* buat *dense mode*, pake class tailwind (`h-10`, `h-12`) jangan arbitrary value kurung siku.

### 11. **DashboardProgressBarCard: Link Biru Jadul** 🔗

Di `src/components/overview/DashboardProgressBarCard.tsx`:

```typescript
<a href={ctaLink} className="text-blue-600 dark:text-blue-400">
  {ctaText}
</a>

```

### 12. **ProgressCircle: "Rainbow" Variants Lagi** 🌈

Sama persis kasusnya kayak `ProgressBar` tadi. Di `src/components/ProgressCircle.tsx`, lu definisiin warna stroke secara manual di dalam varian.

```typescript
//
default: {
  background: "stroke-blue-200 dark:stroke-blue-500/30", // HARDCODED
  circle: "stroke-blue-600 dark:stroke-blue-500",       // HARDCODED
},
warning: {
  background: "stroke-yellow-200 dark:stroke-yellow-500/30",
  circle: "stroke-yellow-500 dark:stroke-yellow-500",
},

```

**Masalahnya:** Kalau lu ubah tema Primary jadi "Ungu" di `globals.css`, ProgressCircle lu tetep Biru. Kalau lu ubah Warning jadi "Oranye", dia tetep Kuning.
**Solusi:**
Gunakan semantic token:

```typescript
default: {
  background: "stroke-primary/20",
  circle: "stroke-primary",
},
warning: {
  background: "stroke-warning/20",
  circle: "stroke-warning",
},

```

### 13. **CategoryBar & RadarChart: The `colorMap` Trap** 🗺️

Di `src/components/CategoryBar.tsx` dan `src/components/RadarChart.tsx`, lu bikin object `colorMap` yang isinya mapping nama warna ke class Tailwind.

```typescript
//
const colorMap: Record<string, string> = {
    blue: "bg-blue-500 dark:bg-blue-500",
    orange: "bg-orange-500 dark:bg-orange-500",
    // ... list panjang warna lainnya
}

```

**Masalahnya:**

1. **Redundan:** Lu ngulang-ngulang definisi warna yang sebenernya udah ada di Tailwind.
2. **Gak Sinkron:** Kalau lu pake komponen ini, lu dipaksa ngirim props `colors={["blue", "orange"]}`. Padahal di tempat lain lu pake semantic `["chart-1", "chart-2"]`. Ini bikin data visualization lu belang-belentong.
**Solusi:**
Hapus `colorMap` manual ini. Mending mapping langsung ke CSS variables `chart-1` s.d `chart-8` yang udah lu set di `globals.css`, atau biarin komponen nerima class CSS mentah kalau butuh custom.

### 14. **LineChart: Recharts yang "Keras Kepala"** 📊

Komponen grafik biasanya paling sudah di-style karena pake SVG/Canvas. Di `src/components/LineChart.tsx`, lu nyelipin hardcoded color buat teks axis:

```typescript
//
className={cx(
  "text-xs",
  "fill-zinc-500 dark:fill-zinc-500", // <--- INI DIA PELAKUNYA
)}

```

**Masalahnya:** `zinc-500` itu warna abu-abu spesifik. Kalau di Dark Mode background lu agak coklat (Warm Dark), warna zinc ini bakal kelihatan "mati" atau gak blend.
**Solusi:**
Gunakan semantic token text:
`fill-content-subtle` (yang udah lu mapping ke var CSS).

```typescript
className="text-xs fill-content-subtle"

```

### 15. **Switch: Magic Number Opacity** 🪄

Di `src/components/Switch.tsx`, ada satu baris yang agak *sus*:

```typescript
//
"ring-black/5 dark:ring-border",

```

**Masalahnya:** `black/5` (Hitam opacity 5%) itu *magic value*. Kenapa 5%? Kenapa gak pake variable border yang udah ada?
**Solusi:** Konsisten pake border token lu.
`ring-border-subtle` atau `ring-border/50`.
