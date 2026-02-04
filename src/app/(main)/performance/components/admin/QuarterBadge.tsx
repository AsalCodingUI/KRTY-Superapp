import { Badge } from "@/shared/ui"

type Quarter = "Q1" | "Q2" | "Q3" | "Q4"

interface QuarterBadgeProps {
    quarter: string
}

// Using chart tokens for visual consistency
const quarterColors: Record<Quarter, string> = {
    Q1: "bg-chart-1/15 text-chart-1",
    Q2: "bg-chart-2/15 text-chart-2",
    Q3: "bg-chart-3/15 text-chart-3",
    Q4: "bg-chart-4/15 text-chart-4",
}

export function QuarterBadge({ quarter }: QuarterBadgeProps) {
    // Extract quarter suffix (e.g., "2025-Q1" -> "Q1")
    const quarterKey = quarter.includes("-") ? quarter.split("-")[1] : quarter
    const colorClass = quarterColors[quarterKey as Quarter] || quarterColors.Q1

    return (
        <Badge size="md" className={colorClass}>
            {quarter}
        </Badge>
    )
}
