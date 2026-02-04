/**
 * Quarter Utility Functions
 *
 * Provides utilities for working with fiscal quarters in format "YYYY-QN"
 */

/**
 * Get current quarter string in format "YYYY-QN"
 * @returns Current quarter (e.g., "2025-Q1")
 */
export function getCurrentQuarter(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-11
  const quarter = Math.floor(month / 3) + 1
  return `${year}-Q${quarter}`
}

/**
 * Get quarter from a date
 * @param date - Date to extract quarter from
 * @returns Quarter string (e.g., "2025-Q2")
 */
export function getQuarterFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth()
  const quarter = Math.floor(month / 3) + 1
  return `${year}-Q${quarter}`
}

/**
 * Get previous quarter
 * @param quarterStr - Current quarter string (defaults to current quarter)
 * @returns Previous quarter string
 */
export function getPreviousQuarter(quarterStr?: string): string {
  const current = quarterStr || getCurrentQuarter()
  const [yearStr, qStr] = current.split("-")
  const year = parseInt(yearStr)
  const quarter = parseInt(qStr.replace("Q", ""))

  if (quarter === 1) {
    return `${year - 1}-Q4`
  }
  return `${year}-Q${quarter - 1}`
}

/**
 * Get next quarter
 * @param quarterStr - Current quarter string (defaults to current quarter)
 * @returns Next quarter string
 */
export function getNextQuarter(quarterStr?: string): string {
  const current = quarterStr || getCurrentQuarter()
  const [yearStr, qStr] = current.split("-")
  const year = parseInt(yearStr)
  const quarter = parseInt(qStr.replace("Q", ""))

  if (quarter === 4) {
    return `${year + 1}-Q1`
  }
  return `${year}-Q${quarter + 1}`
}

/**
 * Get quarters for filter dropdown
 * @param count - Number of quarters to return (default: 4)
 * @param direction - 'past' for previous quarters, 'future' for upcoming quarters (default: 'past')
 * @returns Array of quarter strings
 */
export function getQuarterOptions(
  count: number = 4,
  direction: "past" | "future" = "past",
): string[] {
  const quarters: string[] = []
  let current = getCurrentQuarter()

  for (let i = 0; i < count; i++) {
    quarters.push(current)
    current =
      direction === "past"
        ? getPreviousQuarter(current)
        : getNextQuarter(current)
  }

  return quarters
}

/**
 * Parse quarter string into year and quarter number
 * @param quarterStr - Quarter string (e.g., "2025-Q1")
 * @returns Object with year and quarter number
 */
export function parseQuarter(quarterStr: string): {
  year: number
  quarter: number
} {
  const [yearStr, qStr] = quarterStr.split("-")
  return {
    year: parseInt(yearStr),
    quarter: parseInt(qStr.replace("Q", "")),
  }
}

/**
 * Get start and end dates for a quarter
 * @param quarterStr - Quarter string (e.g., "2025-Q1")
 * @returns Object with start and end dates
 */
export function getQuarterDateRange(quarterStr: string): {
  start: Date
  end: Date
} {
  const { year, quarter } = parseQuarter(quarterStr)
  const startMonth = (quarter - 1) * 3
  const endMonth = startMonth + 2

  const start = new Date(year, startMonth, 1)
  const end = new Date(year, endMonth + 1, 0) // Last day of the end month

  return { start, end }
}

/**
 * Check if a date falls within a quarter
 * @param date - Date to check
 * @param quarterStr - Quarter string (e.g., "2025-Q1")
 * @returns True if date is within the quarter
 */
export function isDateInQuarter(date: Date, quarterStr: string): boolean {
  const { start, end } = getQuarterDateRange(quarterStr)
  return date >= start && date <= end
}
