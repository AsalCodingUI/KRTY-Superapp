// Tremor Raw cx [v0.0.0]

import clsx, { type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-lg",
            "display-md",
            "display-sm",
            "display-xs",
            "display-xxs",
            "heading-lg",
            "heading-md",
            "heading-sm",
            "label-lg",
            "label-md",
            "label-sm",
            "label-xs",
            "body-lg",
            "body-md",
            "body-sm",
            "body-xs",
          ],
        },
      ],
      "border-color": [
        {
          border: [
            "neutral-primary",
            "neutral-secondary",
            "neutral-tertiary",
            "neutral-disable",
            "neutral-white",
            "neutral-strong",
            "brand",
            "brand-light",
            "brand-dark",
            "success",
            "success-subtle",
            "danger",
            "danger-subtle",
            "warning",
            "warning-subtle",
            "input",
            "border",
          ],
        },
      ],
      "text-color": [
        {
          text: [
            "foreground-primary",
            "foreground-secondary",
            "foreground-tertiary",
            "foreground-disable",
            "foreground-on-color",
            "brand",
            "brand-light",
            "brand-dark",
          ],
        },
      ],
    },
  },
})

export function cx(...args: ClassValue[]) {
  return customTwMerge(clsx(...args))
}

// Tremor Raw focusInput [v0.0.1]

export const focusInput = [
  // base
  "focus:outline-none",
  // shadow color
  "focus:shadow-input-focus",
]

// Tremor Raw focusRing [v0.0.1]

export const focusRing = [
  // base
  "outline-none ring-0 focus-visible:ring-2 focus-visible:ring-offset-2",
  // ring color - explicit css var to ensure correct color
  "focus-visible:ring-[var(--border-brand-light)]",
]

// Tremor Raw hasErrorInput [v0.0.1]

export const hasErrorInput = [
  // base
  "shadow-input-error",
  "focus:shadow-input-error",
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
