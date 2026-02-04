export type SLAResult = "Faster" | "On Time" | "Delay"

export const SLA_PERCENTAGES: Record<SLAResult, number> = {
    "Faster": 120,
    "On Time": 100,
    "Delay": 80,
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
    const bestAchieve = milestones.reduce((sum, m) => sum + (m.weight * m.targetPercentage), 0)

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
    const colors: Record<number, string> = {
        5: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        4: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        3: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        2: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        1: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    }
    return colors[score] || colors[3]
}

export function calculateWorkQualityPercentage(competencies: { isAchieved: boolean }[]): number {
    if (competencies.length === 0) return 0
    const achievedCount = competencies.filter((c) => c.isAchieved).length
    return (achievedCount / competencies.length) * 100
}
