# Color Usage Guide

This document explains the color usage patterns in this codebase and when hardcoded colors are intentional.

## Semantic Tokens (Use These)

For UI elements and theming, use semantic tokens that respect light/dark mode:

| Token | Usage |
|-------|-------|
| `bg-surface` | Card backgrounds |
| `bg-muted` | Subtle backgrounds |
| `text-content` | Primary text |
| `text-content-subtle` | Secondary text |
| `text-content-placeholder` | Placeholder text |
| `border` / `border-border` | Default borders |
| `text-primary` / `bg-primary` | Primary accent color |

## Intentional Hardcoded Colors

### Status Indicators (Keep Hardcoded)
These colors have semantic meaning and should NOT be migrated:

```tsx
// ✅ Correct - Status colors convey meaning
<Badge variant="success">Approved</Badge>     // green
<Badge variant="warning">Pending</Badge>      // amber
<Badge variant="error">Rejected</Badge>       // red
```

### Data Visualization (Keep Hardcoded)
Quarter and categorical colors for charts:

```tsx
// ✅ Correct - Categorical colors for data visualization
const quarterColors = {
    Q1: "bg-blue-100 text-blue-700",    // Winter
    Q2: "bg-emerald-100 text-emerald-700",  // Spring
    Q3: "bg-amber-100 text-amber-700",      // Summer
    Q4: "bg-purple-100 text-purple-700",    // Fall
}
```

### Score Colors (Keep Hardcoded)
KPI and performance score colors:

```tsx
// ✅ Correct - Score colors have fixed meaning
const scoreColors = {
    5: "bg-purple-100 text-purple-700",  // Outstanding
    4: "bg-blue-100 text-blue-700",      // Exceeds
    3: "bg-green-100 text-green-700",    // Meets
    2: "bg-yellow-100 text-yellow-700",  // Below
    1: "bg-red-100 text-red-700",        // Needs Improvement
}
```

## When to Migrate to Semantic Tokens

Migrate hardcoded colors when:
- Using blue as a UI accent (use `primary` instead)
- Using gray shades for text (use `content` tokens)
- Using gray shades for backgrounds (use `surface`/`muted`)
- Using borders that should match theme (use `border`)

## Files with Intentional Colors

| File | Reason |
|------|--------|
| `QuarterBadge.tsx` | Quarter categorical colors |
| `kpi-calculations.ts` | Score level colors |
| `Badge.tsx` | Semantic status variants |
| `AttendanceStats.tsx` | Status indicators |
| `AdminColumns.tsx` | Status indicators |
