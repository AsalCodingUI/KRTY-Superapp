# Design System Library

This directory contains utilities and data structures for the design system showcase page.

## Files

### Token Extraction

- **`token-extractor.ts`** - Utilities for parsing design tokens from `globals.css`

### Component Registry

- **`component-registry.types.ts`** - TypeScript interfaces for the component registry system
- **`component-registry.data.tsx`** - Complete registry of all UI components organized by category
- **`component-registry.ts`** - Main export file for registry types and data
- **`search-index.ts`** - Search indexing for component lookup

## Component Registry

The component registry organizes all UI components into the following categories:

1. **Buttons & Actions** - Button, Toggle, Switch
2. **Form Inputs** - TextInput, Textarea, Select, Checkbox, RadioGroup, Slider, DatePicker, DateRangePicker, Label
3. **Data Display** - Table, Badge, Card, CategoryBar, BarList, Tracker, ProgressBar, ProgressCircle, Avatar, StatsCard
4. **Feedback** - Dialog, Drawer, Popover, Tooltip, Callout, EmptyState, Spinner, Skeleton
5. **Navigation** - Tabs, Accordion, DropdownMenu, TabNavigation, CommandBar
6. **Layout** - Divider, PageHeader, TableSection, Calendar
7. **Charts** - AreaChart, BarChart, LineChart, DonutChart, RadarChart, SparkAreaChart, SparkBarChart, SparkLineChart

## Design Tokens

The app uses semantic design tokens defined as CSS custom properties in `globals.css`. Components should use these tokens instead of raw color values:

### Text
- `text-foreground-primary` - Primary text color
- `text-foreground-secondary` - Secondary/muted text
- `text-foreground-tertiary` - Tertiary/disabled text
- `text-foreground-brand-primary` - Brand accent text

### Backgrounds
- `bg-surface` - Base surface
- `bg-surface-neutral-primary` - Primary neutral surface (cards, sections)
- `bg-surface-neutral-secondary` - Secondary neutral surface (hover states, nested elements)

### Borders
- `border-neutral-primary` - Standard border color

### Typography Scale
- `text-display-xxs` - Display text (largest)
- `text-heading-lg` / `text-heading-md` / `text-heading-sm` - Headings
- `text-label-md` / `text-label-sm` - Labels
- `text-body-md` / `text-body-sm` / `text-body-xs` - Body text

### Status Colors
- `bg-success` / `text-success` - Success states
- `bg-warning` / `text-warning` - Warning states
- `bg-danger` / `text-danger` - Error/danger states
- `bg-info` / `text-info` - Info states

> **Important:** The app is light-mode only. Do not use `dark:` class prefixes.

## Usage

```typescript
import { componentRegistry } from "@/shared/config/design-system/component-registry"
import type {
  ComponentEntry,
  ComponentCategory,
} from "@/shared/config/design-system/component-registry"

// Access all categories
const categories = componentRegistry.categories

// Find a specific component
const buttonComponent = categories
  .find((cat) => cat.id === "buttons-actions")
  ?.components.find((comp) => comp.id === "button")

// Get all components in a category
const formInputs = categories.find(
  (cat) => cat.id === "form-inputs",
)?.components
```

## Data Structure

Each component entry includes:

- **id** - Unique identifier
- **name** - Display name
- **description** - Component purpose
- **importPath** - Import path (e.g., `@/shared/ui`)
- **variants** - All available variants with props and previews
- **props** - All props/properties with types and descriptions
- **examples** - Code examples with previews
- **relatedComponents** - IDs of related components

## Conventions

### Stat Cards
Use the consistent pattern across all pages:
```
border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3
```
With `text-label-sm` for labels and `text-heading-md` for values.

### List Cards
Use the consistent pattern:
```
border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y
```
With `hover:bg-surface-neutral-secondary` for interactive rows.

### Section Labels
Use `text-label-sm text-foreground-secondary` for section headers above cards.

### Empty States
Use the `EmptyState` component with `placement="inner"` for inline empty states within cards.
