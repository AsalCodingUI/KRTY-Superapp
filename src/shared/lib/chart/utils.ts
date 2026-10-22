// Tremor Raw chartColors [v0.0.0]

export type ColorUtility = "bg" | "stroke" | "fill" | "text"

export const chartColors = {
  blue: {
    bg: "bg-primary",
    stroke: "stroke-primary",
    fill: "fill-primary",
    text: "text-primary",
  },
  emerald: {
    bg: "bg-green-9",
    stroke: "stroke-green-9",
    fill: "fill-green-9",
    text: "text-green-9",
  },
  violet: {
    bg: "bg-purple-9",
    stroke: "stroke-purple-9",
    fill: "fill-purple-9",
    text: "text-purple-9",
  },
  amber: {
    bg: "bg-amber-9",
    stroke: "stroke-amber-9",
    fill: "fill-amber-9",
    text: "text-amber-9",
  },
  gray: {
    bg: "bg-muted-foreground dark:bg-muted-foreground/60",
    stroke: "stroke-muted-foreground dark:stroke-muted-foreground/60",
    fill: "fill-muted-foreground dark:fill-muted-foreground/60",
    text: "text-muted-foreground dark:text-muted-foreground/60",
  },
  cyan: {
    bg: "bg-cyan-9",
    stroke: "stroke-cyan-9",
    fill: "fill-cyan-9",
    text: "text-cyan-9",
  },
  indigo: {
    bg: "bg-info",
    stroke: "stroke-info",
    fill: "fill-info",
    text: "text-info",
  },
  pink: {
    bg: "bg-pink-9",
    stroke: "stroke-pink-9",
    fill: "fill-pink-9",
    text: "text-pink-9",
  },
} as const satisfies {
  [color: string]: {
    [key in ColorUtility]: string
  }
}

export type AvailableChartColorsKeys = keyof typeof chartColors

export const AvailableChartColors: AvailableChartColorsKeys[] = Object.keys(
  chartColors,
) as Array<AvailableChartColorsKeys>

export const constructCategoryColors = (
  categories: string[],
  colors: AvailableChartColorsKeys[],
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>()
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length])
  })
  return categoryColors
}

export const getColorClassName = (
  color: AvailableChartColorsKeys,
  type: ColorUtility,
): string => {
  const fallbackColor = {
    bg: "bg-muted-foreground",
    stroke: "stroke-muted-foreground",
    fill: "fill-muted-foreground",
    text: "text-muted-foreground",
  }
  return chartColors[color]?.[type] ?? fallbackColor[type]
}

// Tremor Raw getYAxisDomain [v0.0.0]

export const getYAxisDomain = (
  autoMinValue: boolean,
  minValue: number | undefined,
  maxValue: number | undefined,
) => {
  const minDomain = autoMinValue ? "auto" : (minValue ?? 0)
  const maxDomain = maxValue ?? "auto"
  return [minDomain, maxDomain]
}

export interface ChartPayload {
  value: number
  name: string
  color: string
  payload: Record<string, any>
  dataKey: string
  type?: string
}

// Tremor Raw hasOnlyOneValueForKey [v0.1.0]

export function hasOnlyOneValueForKey(
  array: Record<string, unknown>[],
  keyToCheck: string,
): boolean {
  const val: unknown[] = []

  for (const obj of array) {
    if (Object.prototype.hasOwnProperty.call(obj, keyToCheck)) {
      val.push(obj[keyToCheck])
      if (val.length > 1) {
        return false
      }
    }
  }

  return true
}
