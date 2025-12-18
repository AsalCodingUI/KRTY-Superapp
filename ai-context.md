# AI Context: Tremor Raw Dashboard

## Architecture
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + `tailwind-variants` (tv)
- **Component System**: Tremor Raw (Copy-paste components in `@/components`)
- **Icons**: Remix Icons (`@remixicon/react`)

## Critical Rules for AI
1. **NEVER install `@tremor/react`**. Always use local components from `@/components`.
2. **Styling Pattern**:
   - Use `tv({ base: "...", variants: { ... } })` for complex components.
   - Use `cx(...)` from `@/lib/utils` for conditional classes.
   - Use `focusInput`, `focusRing`, `hasErrorInput` from `@/lib/utils` for form states.
   - Colors: Primary is `indigo`, Neutral is `gray`. Always support `dark:` mode.

## Available Components (Do not recreate these!)
- **Inputs**: `Input.tsx`, `Select.tsx`, `Switch.tsx`, `Checkbox.tsx`, `RadioCard.tsx`, `DatePicker.tsx`
- **Feedback**: `Badge.tsx`, `ProgressBar.tsx`, `ProgressCircle.tsx`
- **Layout**: `Card.tsx`, `Divider.tsx`, `Dialog.tsx`, `Drawer.tsx`, `Popover.tsx`
- **Data**: `Table.tsx` (TanStack Table wrapper), `LineChart.tsx` (Recharts wrapper)

## Example: How to create a Button
import { tv } from "tailwind-variants"
import { cx, focusRing } from "@/lib/utils"
// ... (Pattern: Use `tv` for variants, `forwardRef`, and `cx` for merging classes)