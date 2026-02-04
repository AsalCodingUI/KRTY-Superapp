import { Card, ProgressBar } from "@/shared/ui";
"use client"

interface KPICardProps {
    title: string
    score: number | null
    target?: number
    weighted?: number
    variant?: "success" | "default" | "warning" | "error"
    description?: string
}

/**
 * KPICard - Displays KPI metrics with progress visualization
 * 
 * Shows KPI score, target, weight, and progress bar with appropriate styling
 * based on achievement level.
 */
export function KPICard({
    title,
    score,
    target,
    weighted,
    variant: _variant = "default",
    description
}: KPICardProps) {
    const getProgressVariant = (score: number | null): "success" | "default" | "warning" => {
        if (score === null) return "default"
        if (score >= 90) return "success"
        if (score >= 75) return "default"
        return "warning"
    }

    return (
        <Card>
            <h3 className="font-semibold text-content mb-4">{title}</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-content-subtle">Achievement</span>
                        <span className="font-medium">
                            {score !== null ? `${score}%` : "—"}
                        </span>
                    </div>
                    <ProgressBar
                        value={score || 0}
                        variant={getProgressVariant(score)}
                    />
                </div>
                {target && (
                    <p className="text-xs text-content-subtle">
                        Target: {target}% {description || "achievement"}
                    </p>
                )}
                {weighted !== undefined && (
                    <p className="text-xs text-content-subtle">
                        Weight: {weighted}% of total score
                    </p>
                )}
            </div>
        </Card>
    )
}
