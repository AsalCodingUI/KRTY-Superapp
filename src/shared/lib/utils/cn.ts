// Tremor Raw cx [v0.0.0]

import type { ClassValue } from "clsx"
import { cn } from "cn"

/**
 * Same merger as `cn` (@/lib/utils), so the app ships one class merger, not
 * `cn` plus tailwind-merge. The old Tremor custom groups (text-heading-*, …)
 * are no longer used anywhere.
 */
export function cx(...args: ClassValue[]) {
  return cn(...args)
}

// Tremor Raw focusInput [v0.0.1]

export const focusInput = [
  // base
  "focus:outline-none",
  // the field's own focus ring (see Input) draws the focus state
]

// Tremor Raw focusRing [v0.0.1]

export const focusRing = [
  // base
  "outline-none ring-0 focus-visible:ring-2 focus-visible:ring-offset-2",
  // ring color - explicit css var to ensure correct color
  "focus-visible:ring-[var(--ring)]",
]

// Tremor Raw hasErrorInput [v0.0.1]

export const hasErrorInput = [
  // aria-invalid rings on the field components draw the error state
  "ring-2 ring-destructive/20 dark:ring-destructive/40",
]

// Number formatter function

export const usNumberformatter = (number: number, decimals = 0) =>
  Intl.NumberFormat("us", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .format(Number(number))
    .toString()

export function percentageFormatter(value: number, decimals = 1): string {
  return `${usNumberformatter(value, decimals)}%`
}

export const millionFormatter = (number: number, decimals = 1) => {
  const formattedNumber = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)
  return `${formattedNumber}M`
}
export const formatters: Record<
  string,
  (number: number, ...args: any[]) => string
> = {
  currency: (number: number, currency: string = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(number),
  unit: (number: number) => `${usNumberformatter(number)}`,
}

/**
 * Get chart color CSS variables for data visualization
 * @param count Number of colors neededed (cycles through 8 colors)
 * @returns Array of CSS variable references
 */
export function getChartColors(count: number = 8): string[] {
  return Array.from({ length: count }, (_, i) => `var(--chart-${(i % 8) + 1})`)
}
