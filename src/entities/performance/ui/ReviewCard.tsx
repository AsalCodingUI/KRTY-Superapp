"use client"

import { RiStarFill } from "@/shared/ui/lucide-icons"
import { Badge, Card } from "@/shared/ui"

interface ReviewCardProps {
  title: string
  score: number | null
  ratingLevel?: string
  weighted?: number
  description?: string
  showStars?: boolean
}

/**
 * ReviewCard - Displays 360 review scores and ratings
 *
 * Shows review score with optional star rating visualization and
 * performance level badge.
 */
export function ReviewCard({
  title,
  score,
  ratingLevel,
  weighted,
  description,
  showStars = true,
}: ReviewCardProps) {
  const getRatingBadgeVariant = (
    level: string,
  ): "success" | "default" | "warning" | "error" => {
    const lowerLevel = level.toLowerCase()
    if (lowerLevel.includes("outstanding") || lowerLevel.includes("above"))
      return "success"
    if (lowerLevel.includes("meets")) return "default"
    if (lowerLevel.includes("below")) return "warning"
    return "error"
  }

  const getStarCount = (score: number): number => {
    return Math.round(score / 20) // Convert 0-100 to 0-5 stars
  }

  return (
    <Card>
      <h3 className="text-content mb-4 font-semibold">{title}</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-display-xxs text-content">
            {score !== null ? `${score}%` : "—"}
          </span>
          {score !== null && showStars && (
            <div className="text-warning flex">
              {[...Array(5)].map((_, i) => (
                <RiStarFill
                  key={i}
                  className={`size-4 ${
                    i < getStarCount(score) ? "" : "opacity-30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        {ratingLevel && score !== null && (
          <Badge variant={getRatingBadgeVariant(ratingLevel)}>
            {ratingLevel}
          </Badge>
        )}
        {description && (
          <p className="text-body-xs text-content-subtle">{description}</p>
        )}
        {weighted !== undefined && (
          <p className="text-body-xs text-content-subtle">
            Weight: {weighted}% of total score
          </p>
        )}
      </div>
    </Card>
  )
}
