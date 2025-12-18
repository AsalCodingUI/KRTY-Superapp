// Tremor Raw cx [v0.0.0]

import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cx(...args: ClassValue[]) {
  return twMerge(clsx(...args))
}

// Tremor Raw focusInput [v0.0.1]

export const focusInput = [
  // base
  "focus:ring-2",
  // ring color
  "focus:ring-primary/20",
  // border color
  "focus:border-primary",
]

// Tremor Raw focusRing [v0.0.1]

export const focusRing = [
  // base
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  // outline color
  "outline-primary",
]

// Tremor Raw hasErrorInput [v0.0.1]

export const hasErrorInput = [
  // base
  "ring-2",
  // border color
  "border-danger",
  // ring color
  "ring-danger/20",
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
export const formatters: Record<string, (number: number, ...args: any[]) => string> = {
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
