export type SLAResult = "Faster" | "On Time" | "Delay"

export const SLA_PERCENTAGES: Record<SLAResult, number> = {
  Faster: 120,
  "On Time": 100,
  Delay: 80,
}

export type Milestone = {
  name: string
  weight: number
  result: SLAResult
  realAchieve: number
  targetPercentage: number // Best case target (usually 120 for Faster, but can be 100 for some milestones)
}

export function calculateSLAPercentage(milestones: Milestone[]): number {
  // Best Achieve = sum of (weight × targetPercentage) for each milestone
  const bestAchieve = milestones.reduce(
    (sum, m) => sum + m.weight * m.targetPercentage,
    0,
  )

  // Real Achieve = sum of all milestone achievements
  const realAchieve = milestones.reduce((sum, m) => sum + m.realAchieve, 0)

  // Avoid division by zero
  if (bestAchieve === 0) return 0

  // Final percentage = (Real / Best) × 100
  return (realAchieve / bestAchieve) * 100
}

export function mapPercentageToScore(percentage: number): number {
  if (percentage >= 100) return 5
  if (percentage >= 92) return 4
  if (percentage >= 84) return 3
  if (percentage >= 76) return 2
  return 1
}

export function getScoreLabel(score: number): string {
  const labels: Record<number, string> = {
    5: "Outstanding",
    4: "Exceeds Expectation",
    3: "Meets Expectation",
    2: "Below Expectation",
    1: "Needs Improvement",
  }
  return labels[score] || "Unknown"
}

export function getScoreColor(score: number): string {
  // Semantic tints, matching the Badge success/info/warning/destructive variants.
  const colors: Record<number, string> = {
    5: "bg-success/15 text-success",
    4: "bg-info/15 text-info",
    3: "bg-foreground/[0.07] text-muted-foreground",
    2: "bg-warning/15 text-warning",
    1: "bg-destructive/15 text-destructive",
  }
  return colors[score] || colors[3]
}

export function calculateWorkQualityPercentage(
  competencies: { isAchieved: boolean }[],
): number {
  if (competencies.length === 0) return 0
  const achievedCount = competencies.filter((c) => c.isAchieved).length
  return (achievedCount / competencies.length) * 100
}
