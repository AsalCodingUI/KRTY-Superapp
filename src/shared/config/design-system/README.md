# Design System Library

This directory contains utilities and data structures for the design system showcase page.

## Files

### Token Extraction

- **`token-extractor.ts`**: Utilities for parsing design tokens from `globals.css`
- **`__tests__/token-extractor.test.ts`**: Property-based tests for token extraction

### Component Registry

- **`component-registry.types.ts`**: TypeScript interfaces for the component registry system
- **`component-registry.data.tsx`**: Complete registry of all 35+ UI components organized into 7 categories
- **`component-registry.ts`**: Main export file for registry types and data

## Component Registry

The component registry organizes all UI components into the following categories:

1. **Buttons & Actions** (3 components)
   - Button, Toggle, Switch

2. **Form Inputs** (9 components)
   - TextInput, Textarea, Select, Checkbox, RadioGroup, Slider, DatePicker, DateRangePicker, Label

3. **Data Display** (10 components)
   - Table, Badge, Card, CategoryBar, BarList, Tracker, ProgressBar, ProgressCircle, Avatar, StatsCard

4. **Feedback** (8 components)
   - Dialog, Drawer, Popover, Tooltip, Callout, EmptyState, Spinner, Skeleton

5. **Navigation** (5 components)
   - Tabs, Accordion, DropdownMenu, TabNavigation, CommandBar

6. **Layout** (4 components)
   - Divider, PageHeader, TableSection, Calendar

7. **Charts** (8 components)
   - AreaChart, BarChart, LineChart, DonutChart, RadarChart, SparkAreaChart, SparkBarChart, SparkLineChart

## Usage

```typescript
import { componentRegistry } from "@/lib/design-system/component-registry"
import type {
  ComponentEntry,
  ComponentCategory,
} from "@/lib/design-system/component-registry"

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

- **id**: Unique identifier
- **name**: Display name
- **description**: Component purpose
- **importPath**: Import path for the component
- **variants**: All available variants with props and previews
- **props**: All props/properties with types and descriptions
- **examples**: Code examples with previews
- **relatedComponents**: IDs of related components

This comprehensive registry serves as the data source for the design system showcase page, enabling automatic generation of component documentation, interactive examples, and code snippets.
