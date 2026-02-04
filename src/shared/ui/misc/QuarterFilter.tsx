"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui"
import { SegmentedControl } from "@/shared/ui/interaction/SegmentedControl"
import { cx } from "@/shared/lib/utils"

// ============================================================================
// Types
// ============================================================================

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4" | "All"

// Backward compatible type alias for QuarterFilterValue
export type QuarterFilterValue = string // Format: "2025-Q1" or "2025-All"

// ============================================================================
// Props
// ============================================================================

interface QuarterFilterProps {
  /** Current selected value in format "YYYY-QX" or "YYYY-All" */
  value?: string
  /** Callback when selection changes */
  onChange?: (value: string) => void
  /** Show year dropdown (default: true for backward compatibility) */
  showYear?: boolean
  /** Available years for dropdown */
  years?: number[]
  /** Hide "All Quarter" option */
  hideAll?: boolean
  /** Additional className */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * QuarterFilter - A unified component for quarter and year filtering
 *
 * @example
 * // With year selector (default)
 * <QuarterFilter value="2025-Q1" onChange={setSelectedQuarter} />
 *
 * @example
 * // Without year selector
 * <QuarterFilter showYear={false} value="2025-Q1" onChange={setSelectedQuarter} />
 */
export function QuarterFilter({
  value = "2025-Q1",
  onChange,
  showYear = true,
  years = [2025, 2026, 2027],
  hideAll = false,
  className,
}: QuarterFilterProps) {
  // Derive year and quarter from value prop (controlled component pattern)
  const selectedYear = (() => {
    if (value === "All") return years[0]
    return parseInt(value.split("-")[0]) || years[0]
  })()

  const selectedQuarter = (() => {
    if (value === "All") return "All"
    const parts = value.split("-")
    return parts[1] || "Q1"
  })()

  const quarters = [
    { label: "Q1", value: "Q1" },
    { label: "Q2", value: "Q2" },
    { label: "Q3", value: "Q3" },
    { label: "Q4", value: "Q4" },
    { label: "All Quarter", value: "All" },
  ]

  // Filter "All" option if hideAll is true
  const visibleQuarters = hideAll
    ? quarters.filter((q) => q.value !== "All")
    : quarters

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr)
    const newValue =
      selectedQuarter === "All" ? `${year}-All` : `${year}-${selectedQuarter}`
    onChange?.(newValue)
  }

  const handleQuarterChange = (quarter: string) => {
    const newValue =
      quarter === "All" ? `${selectedYear}-All` : `${selectedYear}-${quarter}`
    onChange?.(newValue)
  }

  const segmentedItems = visibleQuarters.map((quarter) => ({
    value: quarter.value,
    label: quarter.label,
  }))

  return (
    <div className={cx("flex items-center gap-3", className)}>
      {/* Year Dropdown (optional) */}
      {showYear && (
        <Select
          value={selectedYear.toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-[100px]">
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

      {/* Quarter Buttons */}
      <SegmentedControl
        value={selectedQuarter}
        onChange={handleQuarterChange}
        items={segmentedItems}
        fitContent
        className="w-auto"
      />
    </div>
  )
}
