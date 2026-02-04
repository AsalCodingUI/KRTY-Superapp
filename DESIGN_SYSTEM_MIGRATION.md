# Design System Migration Plan: "Solid Foundations"

## 1. Overview

We are migrating from a "Tremor Raw" based system (opacity-based colors like `bg-primary/10`) to a "Solid Semantic" system defined in the new Design System JSON.
This improves contrast, consistency, and removes reliance on alpha blending for surface colors.

## 2. Architecture Changes

### A. Primitive Tokens (`src/app/globals.css`)

- **Neutral (Chinese Black)**: Updated values. `neutral-0` is White, `neutral-50` is `#f7f7f8`.
- **Primary (Blue)**: Mapped to 50-900 scale.
- **Success, Warning, Danger**: Mapped to new scales.

### B. Semantic Tokens (`src/app/globals.css`)

We introduced a structured semantic layer:

- **Surface**: Backgrounds for components.
  - `surface-brand-light` (e.g. Blue 50)
  - `surface-success` (e.g. Green 500)
  - `surface-neutral-secondary` (e.g. Gray 100)
- **Foreground**: Text and Icons.
  - `fg-brand-dark` (e.g. Blue 700)
  - `fg-on-color` (White)

### C. Tailwind Configuration (`tailwind.config.ts`)

New colors are available under `surface` and `foreground` namespaces:

- `bg-surface-brand-light`
- `text-foreground-brand-dark`

## 3. Implementation Status

### ✅ Foundation (Complete)

- `src/app/globals.css`: Primitives and Semantics implemented.
- `tailwind.config.ts`: Configured.

### ✅ Pilot Component (Complete)

- `src/shared/ui/information/Badge.tsx`: Migrated to new system.
  - Old: `border-primary/20 bg-muted text-primary`
  - New: `bg-surface-brand-light text-foreground-brand-dark border-transparent`

## 4. Migration Guide (Next Steps)

### A. Component Refactor List

The following components need to be updated to use the new tokens:

1.  **Avatar** (`src/shared/ui/misc/Avatar.tsx`)
    - Current: `bg-chart-1/15`
    - Target: `bg-surface-neutral-secondary` or specific semantic colors.

2.  **Callout** (`src/shared/ui/information/Callout.tsx`)
    - Check for opacity usage. Map to `surface-*-light` variants.

3.  **Button** (`src/shared/ui/action/Button.tsx`)
    - "Light" variant likely uses opacity.
    - Map `variant="light"` to `bg-surface-neutral-secondary hover:bg-surface-neutral-tertiary`.

### B. Tailwind Utility Mapping

| Old Pattern               | New Semantic Token          | Class Name                     |
| ------------------------- | --------------------------- | ------------------------------ |
| `bg-primary/10`           | `surface.brand.light`       | `bg-surface-brand-light`       |
| `text-primary` (on light) | `foreground.brand.dark`     | `text-foreground-brand-dark`   |
| `bg-success/20`           | `surface.success.light`     | `bg-surface-success-light`     |
| `text-success` (on light) | `foreground.success.dark`   | `text-foreground-success-dark` |
| `bg-muted`                | `surface.neutral.secondary` | `bg-surface-neutral-secondary` |

## 5. Notes

- **Chart Colors**: Preserved as-is for data visualization consistency.
- **Dark Mode**: Basic inversion applied. Further refinement might be needed for specific "light" surfaces in dark mode (currently using opacity fallback).
