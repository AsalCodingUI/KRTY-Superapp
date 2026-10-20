"use client"

import { SegmentedControl } from "@/components/segmented-control"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4" | "All"

/** Format: "2025-Q1" or "2025-All" */
export type QuarterFilterValue = string

export interface QuarterFilterProps {
  /** Current selected value in format "YYYY-QX" or "YYYY-All" */
  value?: string
  /** Callback when selection changes */
  onChange?: (value: string) => void
  /** Show year dropdown (default: true) */
  showYear?: boolean
  /** Available years for dropdown */
  years?: number[]
  /** Hide "All Quarter" option */
  hideAll?: boolean
  className?: string
}

const QUARTERS: { label: string; value: Quarter }[] = [
  { label: "Q1", value: "Q1" },
  { label: "Q2", value: "Q2" },
  { label: "Q3", value: "Q3" },
  { label: "Q4", value: "Q4" },
  { label: "All Quarter", value: "All" },
]

/**
 * QuarterFilter - year select + quarter segmented control.
 *
 * @example
 * <QuarterFilter value="2025-Q1" onChange={setSelectedQuarter} />
 */
export function QuarterFilter({
  value = "2025-Q1",
  onChange,
  showYear = true,
  years = [2025, 2026, 2027],
  hideAll = false,
  className,
}: QuarterFilterProps) {
  const selectedYear =
    value === "All" ? years[0] : parseInt(value.split("-")[0]) || years[0]

  const selectedQuarter = value === "All" ? "All" : value.split("-")[1] || "Q1"

  const visibleQuarters = hideAll
    ? QUARTERS.filter((q) => q.value !== "All")
    : QUARTERS

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr)
    onChange?.(
      selectedQuarter === "All" ? `${year}-All` : `${year}-${selectedQuarter}`,
    )
  }

  const handleQuarterChange = (quarter: string) => {
    onChange?.(
      quarter === "All" ? `${selectedYear}-All` : `${selectedYear}-${quarter}`,
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showYear && (
        <Select
          value={selectedYear.toString()}
          onValueChange={(v) => v !== null && handleYearChange(v)}
        >
          <SelectTrigger className="w-[100px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <SegmentedControl<string>
        value={selectedQuarter}
        onChange={handleQuarterChange}
        items={visibleQuarters}
        fitContent
        size="sm"
        className="w-auto"
      />
    </div>
  )
}
