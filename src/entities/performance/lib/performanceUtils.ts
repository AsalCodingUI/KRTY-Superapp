/**
 * Performance Review Utility Functions
 *
 * Shared utilities for calculating ratings, percentages, and badge variants
 * across performance review components.
 */

/**
 * Calculate rating level based on percentage score
 *
 * @param percentage - Score percentage (0-100)
 * @returns Rating level string
 *
 * @example
 * getRatingLevel(96) // "Outstanding"
 * getRatingLevel(82) // "Meet Expectation"
 */
export function getRatingLevel(percentage: number): string {
  if (percentage >= 95) return "Outstanding"
  if (percentage >= 85) return "Above Expectation"
  if (percentage >= 75) return "Meet Expectation"
  if (percentage >= 60) return "Below"
  return "Needs Improvement"
}

/**
 * Get badge variant based on rating string
 *
 * @param rating - Rating level string
 * @returns Badge variant type
 *
 * @example
 * getRatingBadgeVariant("Outstanding") // "success"
 * getRatingBadgeVariant("Below") // "warning"
 */
export function getRatingBadgeVariant(
  rating: string,
): "success" | "default" | "warning" | "error" {
  const lowerRating = rating.toLowerCase()
  if (lowerRating.includes("outstanding")) return "success"
  if (lowerRating.includes("above")) return "default"
  if (lowerRating.includes("meet")) return "default"
  if (lowerRating.includes("below")) return "warning"
  return "error"
}

/**
 * Calculate skill percentage from score
 *
 * Formula: (score / 5) * 100
 *
 * @param score - Skill score (typically 0-5)
 * @param totalUser - Total number of reviewers (default: 1)
 * @returns Percentage value (0-100)
 *
 * @example
 * calculateSkillPercentage(4.5) // 90
 * calculateSkillPercentage(3.75) // 75
 */
export function calculateSkillPercentage(
  score: number,
  totalUser: number = 1,
): number {
  if (totalUser === 0) return 0
  return Math.round((score / 5) * 100)
}

/**
 * Get skill rating from percentage
 *
 * Wrapper around getRatingLevel for semantic clarity
 *
 * @param percentage - Skill percentage (0-100)
 * @returns Rating level string
 */
export function getSkillRating(percentage: number): string {
  return getRatingLevel(percentage)
}

/**
 * Get quarter month range in Indonesian
 *
 * @param quarter - Quarter string (Q1, Q2, Q3, Q4)
 * @returns Month range in Indonesian
 *
 * @example
 * getQuarterMonths("Q1") // "Januari - Maret"
 * getQuarterMonths("Q3") // "Juli - September"
 */
export function getQuarterMonths(quarter: string): string {
  // Extract quarter part (e.g., "2025-Q1" -> "Q1" or "Q1" -> "Q1")
  const quarterPart = quarter.includes("-") ? quarter.split("-")[1] : quarter

  const quarterMap: Record<string, string> = {
    Q1: "Januari - Maret",
    Q2: "April - Juni",
    Q3: "Juli - September",
    Q4: "Oktober - Desember",
  }
  return quarterMap[quarterPart] || "N/A"
}
