"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { RiStarFill } from "@/shared/ui/lucide-icons"

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
  ): "success" | "secondary" | "warning" | "destructive" => {
    const lowerLevel = level.toLowerCase()
    if (lowerLevel.includes("outstanding") || lowerLevel.includes("above"))
      return "success"
    if (lowerLevel.includes("meets")) return "secondary"
    if (lowerLevel.includes("below")) return "warning"
    return "destructive"
  }

  const getStarCount = (score: number): number => {
    return Math.round(score / 20) // Convert 0-100 to 0-5 stars
  }

  return (
    <Card className="gap-0 p-4">
      <h3 className="text-foreground mb-4 font-semibold">{title}</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-foreground text-2xl font-semibold">
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
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
        {weighted !== undefined && (
          <p className="text-muted-foreground text-xs">
            Weight: {weighted}% of total score
          </p>
        )}
      </div>
    </Card>
  )
}
